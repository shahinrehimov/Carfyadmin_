import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useUpdateTranslation, useTranslationFilters } from "@/lib/queries/translations";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Textarea } from "@/components/ui/textarea";

interface Language {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
}

interface Translation {
  key: string;
  group: string;
  [key: string]: string; // For dynamic language fields like lang_en, lang_fr, etc.
}

// Validation schema using Zod
const schema = z.object({
  key: z.string().min(1, "Key is required"),
  group: z.string().min(1, "Group is required"),
  translations: z.array(
    z.object({
      language_id: z.number().min(1, "Language ID is required"),
      group: z.string().min(1, "Group is required"),
      key: z.string().min(1, "Key is required"),
      text: z.string().min(1, "Translation text is required"),
    }),
  ),
});

type UpdateTranslationData = z.infer<typeof schema>;

interface EditProps {
  languages: Array<Language>;
  defaultData?: Translation;
  onClose: () => void;
}

const EditTranslation: React.FC<EditProps> = ({
  languages,
  defaultData,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateTranslationMutation = useUpdateTranslation();
  const { data: filtersData } = useTranslationFilters();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTranslationData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: defaultData?.key || "",
      group: defaultData?.group || "",
      translations: languages.map((lang) => ({
        language_id: lang.id,
        group: defaultData?.group || "",
        key: defaultData?.key || "",
        text: defaultData?.[`lang_${lang.key}`] || "",
      })),
    },
  });

  useEffect(() => {
    if (defaultData) {
      reset({
        key: defaultData.key,
        group: defaultData.group,
        translations: languages.map((lang) => ({
          language_id: lang.id,
          group: defaultData.group,
          key: defaultData.key,
          text: defaultData[`lang_${lang.key}`] || "",
        })),
      });
    }
  }, [defaultData, languages, reset]);

  const onSubmit = async (data: UpdateTranslationData) => {
    if (!defaultData) return;

    try {
      const formattedData = {
        translations: data.translations.map((translation) => ({
          language_id: translation.language_id,
          group: data.group,
          key: data.key.toLowerCase(),
          text: translation.text,
        })),
      };

      await updateTranslationMutation.mutateAsync({
        group: defaultData.group,
        key: defaultData.key,
        data: formattedData,
      });

      toast.success("Translation updated successfully");

      // Navigate to updated translation (scroll to hash)
      if (typeof window !== "undefined") {
        window.location.hash = data.key;
      }

      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update translation",
      );
    }
  };

  const groupOptions = (filtersData?.data.groups ?? []).map((g) => ({
    value: g.id,
    label: g.title,
  }));

  return (
    <div className="space-y-6 ">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Key field - disabled for editing */}
        <div className="space-y-2">
          <Label htmlFor="key">{t("key")}</Label>
          <Controller
            name="key"
            control={control}
            render={({ field }) => (
              <Input
                id="key"
                {...field}
                placeholder="Translation key"
                disabled
                className="bg-gray-50"
              />
            )}
          />
          {errors.key && (
            <p className="text-sm text-red-500">{errors.key.message}</p>
          )}
        </div>

        {/* Group Select field - disabled for editing */}
        <div className="space-y-2">
          <Label htmlFor="group">{t("group")}</Label>
          <Controller
            name="group"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                options={groupOptions}
                placeholder="Select group"
                disabled
                className="bg-gray-50"
              />
            )}
          />
          {errors.group && (
            <p className="text-sm text-red-500">{errors.group.message}</p>
          )}
        </div>

        {/* Translations Fields */}
        <div className="space-y-4">
          <Label>{t("translations")}</Label>
          <div className="space-y-3">
            {languages.map((lang, index) => (
              <div key={lang.id} className="space-y-2">
                <Label htmlFor={`translation-${lang.id}`}>
                  {t("translation")} ({lang.key})
                </Label>
                <Controller
                  name={`translations.${index}.text`}
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id={`translation-${lang.id}`}
                      {...field}
                      rows={3}
                      placeholder={`Enter translation in ${lang.key}`}
                      className={
                        errors.translations && errors.translations[index]?.text
                          ? "border-red-500"
                          : ""
                      }
                    />
                  )}
                />
                {errors.translations && errors.translations[index]?.text && (
                  <p className="text-sm text-red-500">
                    {errors.translations[index].text.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={updateTranslationMutation.isPending}>
            {updateTranslationMutation.isPending ? "Updating..." : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTranslation;
