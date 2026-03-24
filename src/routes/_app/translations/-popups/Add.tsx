import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCreateTranslation, useTranslationFilters } from "@/lib/queries/translations";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Textarea } from "@/components/ui/textarea";

interface Language {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
}

// Validation schema using Zod
const schema = z.object({
  key: z.string().min(1, "Key is required"),
  group: z.string().min(1, "Group is required"),
  translations: z.array(
    z.object({
      language_id: z.number().min(1, "Language ID is required"),
      text: z.string().min(1, "Translation text is required"),
    }),
  ),
});

type AddTranslationData = z.infer<typeof schema>;

interface AddProps {
  languages: Array<Language>;
  onClose: () => void;
}

const Add: React.FC<AddProps> = ({ languages, onClose }) => {
  const { t } = useTranslation();
  const createTranslationMutation = useCreateTranslation();
  const { data: filtersData } = useTranslationFilters();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTranslationData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: "",
      group: "",
      translations: languages.map((lang) => ({
        language_id: lang.id,
        text: "",
      })),
    },
  });

  const onSubmit = async (data: AddTranslationData) => {
    try {
      // Convert key to lowercase
      data.key = data.key.toLowerCase();

      await createTranslationMutation.mutateAsync(data);
      toast.success("Translation added successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add translation");
    }
  };

  const groupOptions = (filtersData?.data.groups ?? []).map((g) => ({
    value: g.id,
    label: g.title,
  }));

  return (
    <div className="space-y-6 ">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Key field */}
        <div className="space-y-2">
          <Label htmlFor="key">{t("key")}</Label>
          <Controller
            name="key"
            control={control}
            render={({ field }) => (
              <Input
                id="key"
                {...field}
                placeholder="Enter translation key"
                className={errors.key ? "border-red-500" : ""}
              />
            )}
          />
          {errors.key && (
            <p className="text-sm text-red-500">{errors.key.message}</p>
          )}
        </div>

        {/* Group Select field */}
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
                className={errors.group ? "border-red-500" : ""}
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
                      placeholder={`${lang.key}`}
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
          <Button type="submit" disabled={createTranslationMutation.isPending}>
            {createTranslationMutation.isPending ? "Adding..." : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Add;
