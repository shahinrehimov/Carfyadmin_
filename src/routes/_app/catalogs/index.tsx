import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit as EditIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import DeleteModal from "@/components/ui/delete-modal";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";
import { createCatalogTypeHooks, type CatalogTypeHooks } from "@/lib/queries/catalog-types";

export const Route = createFileRoute("/_app/catalogs/")({
  component: RouteComponent,
});

const fuelTypeHooks = createCatalogTypeHooks("fuel-types", "fuelTypes");
const transmissionTypeHooks = createCatalogTypeHooks("transmission-types", "transmissionTypes");
const carTypeHooks = createCatalogTypeHooks("car-types", "carTypes");
const engineVolumeHooks = createCatalogTypeHooks("engine-volumes", "engineVolumes");
const addressTypeHooks = createCatalogTypeHooks("address-types", "addressTypesCatalog");

// ─── Form Schema ─────────────────────────────────────────────────────────────

const CatalogFormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    })
  ),
});

type CatalogFormData = z.infer<typeof CatalogFormSchema>;

// ─── Add Modal Content ────────────────────────────────────────────────────────

function AddForm({
  hooks,
  onClose,
}: {
  hooks: CatalogTypeHooks;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const createMutation = hooks.useCreate();

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(CatalogFormSchema),
    defaultValues: { translations: [] },
  });

  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        translations: langs.map((lang: any) => ({ language_id: lang.id, title: "" })),
      });
    }
  }, [langs, form]);

  const onSubmit = async (data: CatalogFormData) => {
    try {
      const response = await createMutation.mutateAsync(data);
      toast.success(response.message || t("created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[550px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("titles")}</h3>
            {langs.map((lang: any, index: number) => (
              <FormField
                key={lang.id}
                control={form.control}
                name={`translations.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("title")} {langs.length > 1 ? `- ${lang.key}` : ""}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// ─── Edit Modal Content ───────────────────────────────────────────────────────

function EditForm({
  hooks,
  itemId,
  onClose,
}: {
  hooks: CatalogTypeHooks;
  itemId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: item, isLoading } = hooks.useItem(itemId);
  const updateMutation = hooks.useUpdate();

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(CatalogFormSchema),
    defaultValues: { translations: [] },
  });

  useEffect(() => {
    if (item && langs.length > 0) {
      const itemData = item as any;
      form.reset({
        translations:
          itemData.translations?.map((tr: any) => ({
            language_id: tr.language_id,
            title: tr.title,
          })) ||
          langs.map((lang: any) => ({ language_id: lang.id, title: "" })),
      });
    }
  }, [item, langs, form]);

  const onSubmit = async (data: CatalogFormData) => {
    try {
      const response = await updateMutation.mutateAsync({ id: itemId, data });
      toast.success(response.message || t("updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-w-[300px] items-center justify-center py-12 md:min-w-[550px]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[550px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("titles")}</h3>
            {langs.map((lang: any, index: number) => (
              <FormField
                key={lang.id}
                control={form.control}
                name={`translations.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("title")} {langs.length > 1 ? `- ${lang.key}` : ""}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// ─── Catalog Tab ──────────────────────────────────────────────────────────────

interface CatalogTabLabels {
  addButton: string;
  addTitle: string;
  editTitle: string;
  deleteTitle: string;
}

function CatalogTab({
  hooks,
  labels,
}: {
  hooks: CatalogTypeHooks;
  labels: CatalogTabLabels;
}) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ page: 1 });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: any;
  }>({ type: null });

  const { data, isLoading } = hooks.useItems(filters);
  const deleteMutation = hooks.useDelete();
  const toggleStatusMutation = hooks.useToggleStatus();

  const items = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleToggleStatus = async (item: any) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: item.id, isActive: item.is_active });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteMutation.mutateAsync(modalState.data.id);
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {labels.addButton}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("created_by")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(6)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length > 0 ? (
            items.map((item: any, index: number) => (
              <TableRow key={item.id}>
                <TableCell>{(filters.page - 1) * perPage + index + 1}</TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleStatus(item)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </TableCell>
                <TableCell>{item.created_user}</TableCell>
                <TableCell>{item.created_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "edit", data: item })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "delete", data: item })}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                {t("no_data_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters({ page })}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      {/* Add Modal */}
      <Modal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null })}
        title={labels.addTitle}
        size="lg"
      >
        <AddForm hooks={hooks} onClose={() => setModalState({ type: null })} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null })}
        title={labels.editTitle}
        size="lg"
      >
        {modalState.data && (
          <EditForm
            hooks={hooks}
            itemId={modalState.data.id}
            onClose={() => setModalState({ type: null })}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={labels.deleteTitle}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>
    </div>
  );
}

// ─── Route Component ──────────────────────────────────────────────────────────

function RouteComponent() {
  const { t } = useTranslation();

  const tabs = [
    {
      value: "address-types",
      label: t("address_types"),
      hooks: addressTypeHooks,
      labels: {
        addButton: t("new_address_type"),
        addTitle: t("new_address_type"),
        editTitle: t("edit_address_type"),
        deleteTitle: t("delete_address_type"),
      },
    },
    {
      value: "fuel-types",
      label: t("fuel_types"),
      hooks: fuelTypeHooks,
      labels: {
        addButton: t("new_fuel_type"),
        addTitle: t("new_fuel_type"),
        editTitle: t("edit_fuel_type"),
        deleteTitle: t("delete_fuel_type"),
      },
    },
    {
      value: "transmission-types",
      label: t("transmission_types"),
      hooks: transmissionTypeHooks,
      labels: {
        addButton: t("new_transmission_type"),
        addTitle: t("new_transmission_type"),
        editTitle: t("edit_transmission_type"),
        deleteTitle: t("delete_transmission_type"),
      },
    },
    {
      value: "car-types",
      label: t("car_types"),
      hooks: carTypeHooks,
      labels: {
        addButton: t("new_car_type"),
        addTitle: t("new_car_type"),
        editTitle: t("edit_car_type"),
        deleteTitle: t("delete_car_type"),
      },
    },
    {
      value: "engine-volumes",
      label: t("engine_volumes"),
      hooks: engineVolumeHooks,
      labels: {
        addButton: t("new_engine_volume"),
        addTitle: t("new_engine_volume"),
        editTitle: t("edit_engine_volume"),
        deleteTitle: t("delete_engine_volume"),
      },
    },
  ];

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-semibold">{t("catalogs")}</h1>

      <Tabs defaultValue="address-types">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <CatalogTab hooks={tab.hooks} labels={tab.labels} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
