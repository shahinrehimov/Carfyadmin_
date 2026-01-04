import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/utils/translationLoader";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useCompany, useUpdateCompany } from "@/lib/queries/companies";
import { useLangs } from "@/lib/queries/langs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationPickerModal from "@/components/ui/location-picker-modal";

export const Route = createFileRoute("/_app/companies/$id/edit")({
  component: EditCompanyComponent,
});

function EditCompanyComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const { data: langs = [] } = useLangs();
  const [activeTab, setActiveTab] = useState("0");
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Zod validation schema
  const schema = z.object({
    voen: z.string().min(1, t("required_field")),
    phone: z.string().min(1, t("required_field")),
    email: z.string().email(t("invalid_email")).min(1, t("required_field")),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    website: z.string().url(t("invalid_url")).min(1, t("required_field")),
    is_active: z.boolean(),
    translations: z.array(
      z.object({
        language_id: z.number(),
        title: z.string().nullable(),
        info: z.string().nullable(),
        address: z.string().nullable(),
      }),
    ),
  });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      voen: "",
      phone: "",
      email: "",
      latitude: 40.4093,
      longitude: 49.8671,
      website: "",
      is_active: true,
      translations: [],
    },
  });

  // Fetch company data
  const {
    data: company,
    isLoading: companyLoading,
    error: companyError,
  } = useCompany(Number(id));

  // Update company mutation
  const updateCompanyMutation = useUpdateCompany();

  // Reset form when company data is loaded
  useEffect(() => {
    if (company && langs.length > 0) {
      // Match translations with langs
      const translations = langs.map((lang: any) => {
        const existingTranslation = company.translations.find(
          (t) => t.language_id === lang.id,
        );
        return {
          language_id: lang.id,
          title: existingTranslation?.title || null,
          info: existingTranslation?.info || null,
          address: existingTranslation?.address || null,
        };
      });

      reset({
        voen: company.voen,
        phone: company.phone,
        email: company.email,
        latitude: parseFloat(company.latitude),
        longitude: parseFloat(company.longitude),
        website: company.website,
        is_active: company.is_active,
        translations,
      });
    }
  }, [company, langs, reset]);

  useEffect(() => {
    if (companyError) {
      toast.error(t("failed_to_load_company_data"));
      router.navigate({ to: "/companies" });
    }
  }, [companyError, router, t]);

  const onSubmit = async (data: FormData) => {
    // Validate that at least the first translation has a title
    if (!data.translations[0]?.title) {
      toast.error(t("first_language_title_required"));
      setActiveTab("0");
      return;
    }

    try {
      const response = await updateCompanyMutation.mutateAsync({
        id: Number(id),
        data,
      });
      toast.success(response.message || t("company_updated_successfully"));
      router.navigate({ to: "/companies" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (companyLoading) {
    return (
      <div className="w-full flex flex-col gap-5 pt-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/companies" })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t("edit_company")}</h1>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 pt-5">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/companies" })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("edit_company")}</h1>
      </div>

      <div className="max-w-4xl mt-5 w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4 border rounded-lg p-6">
            <h2 className="text-xl font-semibold">
              {t("company_information")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voen">{t("voen")}</Label>
                <Controller
                  name="voen"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="voen"
                      {...field}
                      placeholder={t("voen")}
                      className={errors.voen ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.voen && (
                  <p className="text-red-500 text-sm">{errors.voen.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="email"
                      type="email"
                      {...field}
                      placeholder={t("email")}
                      className={errors.email ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="phone"
                      {...field}
                      placeholder="+994501234567"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t("website")}</Label>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="website"
                      type="url"
                      {...field}
                      placeholder="https://example.com"
                      className={errors.website ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.website && (
                  <p className="text-red-500 text-sm">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>{t("location")}</Label>
                <div className="flex gap-2 items-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    {t("select_location_on_map")}
                  </Button>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t("latitude")}:{" "}
                      {watch("latitude")?.toFixed(6) || "40.409300"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("longitude")}:{" "}
                      {watch("longitude")?.toFixed(6) || "49.867100"}
                    </p>
                  </div>
                </div>
                {(errors.latitude || errors.longitude) && (
                  <p className="text-red-500 text-sm">
                    {errors.latitude?.message || errors.longitude?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_active">{t("is_active")}</Label>
            </div>
          </div>

          {/* Translations */}
          <div className="space-y-4 border rounded-lg p-6">
            <h2 className="text-xl font-semibold">{t("translations")}</h2>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList
                className="grid w-full"
                style={{ gridTemplateColumns: `repeat(${langs.length}, 1fr)` }}
              >
                {langs.map((lang: any, index: number) => (
                  <TabsTrigger key={lang.id} value={String(index)}>
                    {lang.key}
                    {index === 0 && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {langs.map((lang: any, index: number) => (
                <TabsContent
                  key={lang.id}
                  value={String(index)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`title-${index}`}>
                      {t("title")}
                      {index === 0 && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>
                    <Controller
                      name={`translations.${index}.title`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`title-${index}`}
                          {...field}
                          value={field.value || ""}
                          placeholder={t("title")}
                          className={
                            errors.translations?.[index]?.title
                              ? "border-red-500"
                              : ""
                          }
                        />
                      )}
                    />
                    {errors.translations?.[index]?.title && (
                      <p className="text-red-500 text-sm">
                        {errors.translations[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`info-${index}`}>{t("info")}</Label>
                    <Controller
                      name={`translations.${index}.info`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          id={`info-${index}`}
                          {...field}
                          value={field.value || ""}
                          placeholder={t("info")}
                          rows={4}
                          className={
                            errors.translations?.[index]?.info
                              ? "border-red-500"
                              : ""
                          }
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`address-${index}`}>{t("address")}</Label>
                    <Controller
                      name={`translations.${index}.address`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`address-${index}`}
                          {...field}
                          value={field.value || ""}
                          placeholder={t("address")}
                          className={
                            errors.translations?.[index]?.address
                              ? "border-red-500"
                              : ""
                          }
                        />
                      )}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={updateCompanyMutation.isPending}
              className="min-w-[200px]"
            >
              {updateCompanyMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("saving")}
                </div>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(lat, lng) => {
          reset({
            ...watch(),
            latitude: lat,
            longitude: lng,
          });
        }}
        initialLat={watch("latitude") || 40.4093}
        initialLng={watch("longitude") || 49.8671}
        title={t("select_company_location")}
      />
    </div>
  );
}
