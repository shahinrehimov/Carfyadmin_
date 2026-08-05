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
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/lib/utils/translationLoader";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useCreateCompany } from "@/lib/queries/companies";
import { useLangs } from "@/lib/queries/langs";
import { useCountries, useCities } from "@/lib/queries/countries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationPickerModal from "@/components/ui/location-picker-modal";
import {
  CommissionTiersEditor,
  rowsToTiers,
  validateCommissionTiers,
  type CommissionTierRow,
} from "@/components/ui/commission-tiers-editor";

export const Route = createFileRoute("/_app/companies/add/")({
  component: AddCompanyComponent,
});

function AddCompanyComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: langs = [] } = useLangs();
  const [activeTab, setActiveTab] = useState("0");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const { data: countries = [] } = useCountries();
  const { data: cities = [] } = useCities(selectedCountryId);

  const [commissionTiers, setCommissionTiers] = useState<CommissionTierRow[]>([]);
  const [commissionTiersError, setCommissionTiersError] = useState<string | null>(null);

  // Zod validation schema
  const schema = z.object({
    voen: z.string().min(1, t("required_field")),
    phone: z.string().min(1, t("required_field")),
    email: z.string().email(t("invalid_email")).min(1, t("required_field")),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    website: z.string().url(t("invalid_url")).min(1, t("required_field")),
    is_active: z.boolean(),
    // Empty string = inherit the category / platform rate
    commission_percent: z
      .string()
      .refine(
        (val) =>
          val === "" ||
          (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
        { message: t("invalid_value") },
      ),
    city_id: z.number({ required_error: t("required_field") }).min(1, t("required_field")),
    translations: z.array(
      z.object({
        language_id: z.number(),
        title: z.string().nullable(),
        info: z.string().nullable(),
        address: z.string().nullable(),
      }),
    ),
    root_admin_username: z.string().min(1, t("required_field")),
    root_admin_email: z
      .string()
      .email(t("invalid_email"))
      .min(1, t("required_field")),
    root_admin_name: z.string().min(1, t("required_field")),
    root_admin_surname: z.string().min(1, t("required_field")),
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
      commission_percent: "",
      city_id: undefined as unknown as number,
      translations: [],
      root_admin_username: "",
      root_admin_email: "",
      root_admin_name: "",
      root_admin_surname: "",
    },
  });

  // Initialize translations when langs are loaded
  useEffect(() => {
    if (langs.length > 0) {
      reset({
        voen: "",
        phone: "",
        email: "",
        latitude: 40.4093,
        longitude: 49.8671,
        website: "",
        is_active: true,
        commission_percent: "",
        city_id: undefined as unknown as number,
        translations: langs.map((lang: any) => ({
          language_id: lang.id,
          title: null,
          info: null,
          address: null,
        })),
        root_admin_username: "",
        root_admin_email: "",
        root_admin_name: "",
        root_admin_surname: "",
      });
    }
  }, [langs, reset]);

  // Create company mutation
  const createCompanyMutation = useCreateCompany();

  const onSubmit = async (data: FormData) => {
    // Validate that at least the first translation has a title
    if (!data.translations[0]?.title) {
      toast.error(t("first_language_title_required"));
      setActiveTab("0");
      return;
    }

    const tiersError = validateCommissionTiers(commissionTiers);

    if (tiersError) {
      setCommissionTiersError(tiersError);
      toast.error(t(tiersError));
      return;
    }

    setCommissionTiersError(null);

    try {
      const response = await createCompanyMutation.mutateAsync({
        ...data,
        // Empty means "no seller override" — the category / platform rate applies
        commission_percent:
          data.commission_percent === ""
            ? null
            : Number(data.commission_percent),
        commission_tiers: rowsToTiers(commissionTiers),
      });
      toast.success(response.message || t("company_created_successfully"));
      router.navigate({ to: "/companies" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

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
        <h1 className="text-2xl font-bold">{t("new_company")}</h1>
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
                    <div
                      className={`flex h-9 w-full rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 ${errors.phone ? "border-destructive ring-destructive/20" : "border-input"}`}
                    >
                      <span className="flex items-center pl-3 pr-2 text-sm text-muted-foreground select-none border-r border-input">
                        +994
                      </span>
                      <input
                        id="phone"
                        type="text"
                        inputMode="numeric"
                        value={field.value.replace(/^\+994/, "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          field.onChange(digits ? `+994${digits}` : "");
                        }}
                        placeholder="501234567"
                        className="flex-1 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
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

              <div className="space-y-2">
                <Label htmlFor="commission_percent">
                  {t("commission_percent")}
                </Label>
                <Controller
                  name="commission_percent"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="commission_percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...field}
                      placeholder="—"
                      className={
                        errors.commission_percent ? "border-red-500" : ""
                      }
                    />
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  {t("commission_percent_hint")}
                </p>
                {errors.commission_percent && (
                  <p className="text-red-500 text-sm">
                    {errors.commission_percent.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("country")}</Label>
                <Select
                  value={selectedCountryId ? String(selectedCountryId) : ""}
                  onValueChange={(val) => {
                    setSelectedCountryId(Number(val));
                    reset({ ...watch(), city_id: undefined as unknown as number });
                  }}
                  placeholder={t("select_country")}
                  options={countries.map((c) => ({ value: String(c.id), label: c.title }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("city")} <span className="text-red-500">*</span></Label>
                <Controller
                  name="city_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                      placeholder={t("select_city")}
                      options={cities.map((c) => ({ value: String(c.id), label: c.title }))}
                      disabled={!selectedCountryId}
                    />
                  )}
                />
                {errors.city_id && (
                  <p className="text-red-500 text-sm">{errors.city_id.message}</p>
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

          {/* Commission tiers */}
          <div className="space-y-4 border rounded-lg p-6">
            <CommissionTiersEditor
              value={commissionTiers}
              onChange={(rows) => {
                setCommissionTiers(rows);
                setCommissionTiersError(null);
              }}
              error={commissionTiersError}
            />
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

          {/* Root Admin Information */}
          <div className="space-y-4 border rounded-lg p-6">
            <h2 className="text-xl font-semibold">
              {t("root_admin_information")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="root_admin_username">{t("username")}</Label>
                <Controller
                  name="root_admin_username"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="root_admin_username"
                      {...field}
                      placeholder={t("username")}
                      className={
                        errors.root_admin_username ? "border-red-500" : ""
                      }
                    />
                  )}
                />
                {errors.root_admin_username && (
                  <p className="text-red-500 text-sm">
                    {errors.root_admin_username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="root_admin_email">{t("email")}</Label>
                <Controller
                  name="root_admin_email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="root_admin_email"
                      type="email"
                      {...field}
                      placeholder={t("email")}
                      className={
                        errors.root_admin_email ? "border-red-500" : ""
                      }
                    />
                  )}
                />
                {errors.root_admin_email && (
                  <p className="text-red-500 text-sm">
                    {errors.root_admin_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="root_admin_name">{t("name")}</Label>
                <Controller
                  name="root_admin_name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="root_admin_name"
                      {...field}
                      placeholder={t("name")}
                      className={errors.root_admin_name ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.root_admin_name && (
                  <p className="text-red-500 text-sm">
                    {errors.root_admin_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="root_admin_surname">{t("surname")}</Label>
                <Controller
                  name="root_admin_surname"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="root_admin_surname"
                      {...field}
                      placeholder={t("surname")}
                      className={
                        errors.root_admin_surname ? "border-red-500" : ""
                      }
                    />
                  )}
                />
                {errors.root_admin_surname && (
                  <p className="text-red-500 text-sm">
                    {errors.root_admin_surname.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={createCompanyMutation.isPending}
              className="min-w-[200px]"
            >
              {createCompanyMutation.isPending ? (
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
