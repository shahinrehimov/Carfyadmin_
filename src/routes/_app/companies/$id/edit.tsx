import { useState, useEffect, useMemo } from "react";
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
import { ArrowLeft, Loader2, MapPin, Trash2, Clock } from "lucide-react";
import {
  useCompany,
  useUpdateCompany,
  useDeleteCompanyLogo,
  useDeleteCompanyBanner,
  useUpdateWorkingHours,
  type WorkingHour,
} from "@/lib/queries/companies";
import { useLangs } from "@/lib/queries/langs";
import { useCountries, useCities } from "@/lib/queries/countries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocationPickerModal from "@/components/ui/location-picker-modal";
import {
  CommissionTiersEditor,
  rowsToTiers,
  tiersToRows,
  validateCommissionTiers,
  type CommissionTierRow,
} from "@/components/ui/commission-tiers-editor";

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
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const { data: countries = [] } = useCountries();
  const { data: cities = [] } = useCities(selectedCountryId);

  // Zod validation schema
  const schema = z.object({
    voen: z.string().min(1, t("required_field")),
    phone: z.string().min(1, t("required_field")),
    email: z.string().email(t("invalid_email")).min(1, t("required_field")),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    website: z
      .string()
      .refine((val) => val === "" || z.string().url().safeParse(val).success, {
        message: t("invalid_url"),
      }),
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
  });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
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
    },
  });

  // Fetch company data
  const {
    data: company,
    isLoading: companyLoading,
    error: companyError,
  } = useCompany(Number(id));

  // Mutations
  const updateCompanyMutation = useUpdateCompany();
  const deleteLogoMutation = useDeleteCompanyLogo();
  const deleteBannerMutation = useDeleteCompanyBanner();
  const updateWorkingHoursMutation = useUpdateWorkingHours();

  const defaultWorkingHours: WorkingHour[] = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
    day_of_week: day,
    is_closed: false,
    open_time: "09:00",
    close_time: "18:00",
  }));

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(defaultWorkingHours);
  const [isFormReady, setIsFormReady] = useState(false);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTierRow[]>([]);
  const [commissionTiersError, setCommissionTiersError] = useState<string | null>(null);

  const cityOptions = useMemo(() => {
    const options = cities.map((c) => ({ value: String(c.id), label: c.title }));
    if (company?.city) {
      const cityValue = String(company.city.id);
      if (!options.some((option) => option.value === cityValue)) {
        options.unshift({ value: cityValue, label: company.city.title });
      }
    }
    return options;
  }, [cities, company?.city]);

  useEffect(() => {
    setIsFormReady(false);
    setSelectedCountryId(null);
  }, [id]);

  // Reset form when company data is loaded
  useEffect(() => {
    if (!company || langs.length === 0) return;

    const translations = langs.map((lang: any) => {
      const existingTranslation = company.translations.find(
        (translation) => translation.language_id === lang.id,
      );
      return {
        language_id: lang.id,
        title: existingTranslation?.title || null,
        info: existingTranslation?.info || null,
        address: existingTranslation?.address || null,
      };
    });

    if (company.city?.country_id) {
      setSelectedCountryId(company.city.country_id);
    }

    reset({
      voen: company.voen,
      phone: company.phone,
      email: company.email,
      latitude: parseFloat(company.latitude),
      longitude: parseFloat(company.longitude),
      website: company.website || "",
      is_active: company.is_active,
      commission_percent:
        company.commission_percent === null ||
        company.commission_percent === undefined
          ? ""
          : String(company.commission_percent),
      city_id: company.city_id,
      translations,
    });

    if (company.working_hours.length > 0) {
      setWorkingHours(company.working_hours);
    } else {
      setWorkingHours(defaultWorkingHours);
    }

    setCommissionTiers(tiersToRows(company.commission_tiers));
    setCommissionTiersError(null);

    setIsFormReady(true);
  }, [company, langs, reset]);

  useEffect(() => {
    if (companyError) {
      toast.error(t("failed_to_load_company_data"));
      router.navigate({ to: "/companies" });
    }
  }, [companyError, router, t]);

  const handleDeleteLogo = async () => {
    try {
      await deleteLogoMutation.mutateAsync(Number(id));
      toast.success(t("logo_deleted_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_logo"));
    }
  };

  const handleDeleteBanner = async () => {
    try {
      await deleteBannerMutation.mutateAsync(Number(id));
      toast.success(t("banner_deleted_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_banner"));
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      await updateWorkingHoursMutation.mutateAsync({
        id: Number(id),
        hours: workingHours,
      });
      toast.success(t("working_hours_saved_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_save_working_hours"));
    }
  };

  const updateWorkingHour = (dayIndex: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours((prev) =>
      prev.map((wh, i) => {
        if (i !== dayIndex) return wh;
        const updated = { ...wh, [field]: value };
        if (field === "is_closed" && value === true) {
          updated.open_time = null;
          updated.close_time = null;
        }
        return updated;
      }),
    );
  };

  const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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
      const response = await updateCompanyMutation.mutateAsync({
        id: Number(id),
        data: {
          ...data,
          // Empty means "no seller override" — send null so the API clears it
          commission_percent:
            data.commission_percent === ""
              ? null
              : Number(data.commission_percent),
          commission_tiers: rowsToTiers(commissionTiers),
        },
      });
      toast.success(response.message || t("company_updated_successfully"));
      router.navigate({ to: "/companies" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (companyLoading || !isFormReady) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-5 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/companies" })}
            className="flex shrink-0 items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="min-w-0 text-xl font-bold sm:text-2xl">{t("edit_company")}</h1>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 pt-5 pb-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/companies" })}
          className="flex shrink-0 items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="min-w-0 text-xl font-bold sm:text-2xl">{t("edit_company")}</h1>
      </div>

      <div className="mt-2 w-full min-w-0 max-w-4xl sm:mt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Company Information */}
          <div className="space-y-4 rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold sm:text-xl">
              {t("company_information")}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
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
                      options={cityOptions}
                      disabled={!selectedCountryId}
                    />
                  )}
                />
                {errors.city_id && (
                  <p className="text-red-500 text-sm">{errors.city_id.message}</p>
                )}
              </div>

              <div className="col-span-1 space-y-2 md:col-span-2">
                <Label>{t("location")}</Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMapOpen(true)}
                    className="flex h-auto min-h-9 w-full items-center justify-center gap-2 whitespace-normal sm:w-auto"
                  >
                    <MapPin className="h-4 w-4" />
                    {t("select_location_on_map")}
                  </Button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="break-all text-sm text-muted-foreground">
                      {t("latitude")}: {watch("latitude").toFixed(6)}
                    </p>
                    <p className="break-all text-sm text-muted-foreground">
                      {t("longitude")}: {watch("longitude").toFixed(6)}
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
          <div className="space-y-4 rounded-lg border p-4 sm:p-6">
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
          <div className="space-y-4 rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold sm:text-xl">{t("translations")}</h2>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
              <TabsList className="flex w-full min-w-0 overflow-x-auto">
                {langs.map((lang: any, index: number) => (
                  <TabsTrigger
                    key={lang.id}
                    value={String(index)}
                    className="shrink-0 px-3 sm:px-4"
                  >
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

          {/* Media (Logo & Banner) */}
          {(company?.logo || company?.banner) && (
            <div className="space-y-4 rounded-lg border p-4 sm:p-6">
              <h2 className="text-lg font-semibold sm:text-xl">{t("media")}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {company?.logo && (
                  <div className="space-y-3">
                    <Label>{t("logo")}</Label>
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <img
                        src={company.logo}
                        alt="logo"
                        className="h-20 w-20 shrink-0 rounded-lg border object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteLogoMutation.isPending}
                        onClick={handleDeleteLogo}
                        className="flex h-auto min-h-8 items-center gap-2 whitespace-normal"
                      >
                        {deleteLogoMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {t("delete_logo")}
                      </Button>
                    </div>
                  </div>
                )}
                {company?.banner && (
                  <div className="space-y-3">
                    <Label>{t("banner")}</Label>
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <img
                        src={company.banner}
                        alt="banner"
                        className="h-20 w-full max-w-40 shrink-0 rounded-lg border object-cover sm:w-32"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteBannerMutation.isPending}
                        onClick={handleDeleteBanner}
                        className="flex h-auto min-h-8 items-center gap-2 whitespace-normal"
                      >
                        {deleteBannerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {t("delete_banner")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Working Hours */}
          <div className="space-y-4 rounded-lg border p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                <Clock className="h-5 w-5 shrink-0" />
                {t("working_hours")}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={updateWorkingHoursMutation.isPending}
                onClick={handleSaveWorkingHours}
                className="flex h-auto min-h-8 w-full items-center justify-center gap-2 whitespace-normal sm:w-auto"
              >
                {updateWorkingHoursMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {t("save_working_hours")}
              </Button>
            </div>

            <div className="space-y-1">
              {workingHours.map((wh, index) => (
                <div
                  key={wh.day_of_week}
                  className="flex flex-col gap-3 border-b py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,130px)_minmax(0,100px)_1fr_1fr] sm:items-center sm:gap-3 sm:py-2.5"
                >
                  <div className="flex items-center justify-between gap-3 sm:contents">
                    <span className="text-sm font-medium">
                      {t(DAY_NAMES[index] ?? `day_${wh.day_of_week}`)}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={!wh.is_closed}
                        onCheckedChange={(open) =>
                          updateWorkingHour(index, "is_closed", !open)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {wh.is_closed ? t("closed") : t("open")}
                      </span>
                    </div>
                  </div>
                  {!wh.is_closed ? (
                    <div className="grid grid-cols-2 gap-3 sm:contents">
                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t("open_time")}
                        </span>
                        <Input
                          type="time"
                          value={wh.open_time ?? ""}
                          onChange={(e) =>
                            updateWorkingHour(index, "open_time", e.target.value)
                          }
                          className="w-full min-w-0 sm:w-32"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t("close_time")}
                        </span>
                        <Input
                          type="time"
                          value={wh.close_time ?? ""}
                          onChange={(e) =>
                            updateWorkingHour(index, "close_time", e.target.value)
                          }
                          className="w-full min-w-0 sm:w-32"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="hidden sm:col-span-2 sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-2 sm:pt-4">
            <Button
              type="submit"
              disabled={updateCompanyMutation.isPending}
              className="w-full sm:w-auto sm:min-w-[200px]"
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
          setValue("latitude", lat);
          setValue("longitude", lng);
        }}
        initialLat={watch("latitude")}
        initialLng={watch("longitude")}
        title={t("select_company_location")}
      />
    </div>
  );
}
