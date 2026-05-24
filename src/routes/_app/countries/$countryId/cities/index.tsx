import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  Edit as EditIcon,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCitiesAdmin,
  useDeleteCity,
  useToggleCityStatus,
  useChangeCitySorting,
  type CityListItem,
} from "@/lib/queries/cities";
import { useCountry } from "@/lib/queries/countries";
import { useLangs } from "@/lib/queries/langs";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useTranslationStore } from "@/store/translations";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/countries/$countryId/cities/")({
  component: RouteComponent,
});

function countryHeadingTitle(
  country:
    | {
        title?: string;
        translations?: Array<{ language_id: number; title: string }>;
      }
    | undefined,
  currentLangKey: string,
  langs: Array<{ id: number; key: string }>,
): string {
  if (!country) return "…";
  if (typeof country.title === "string" && country.title.trim() !== "") {
    return country.title;
  }
  const tr = country.translations;
  if (tr?.length) {
    const langId = langs.find((l) => l.key === currentLangKey)?.id;
    const forLang =
      langId != null ? tr.find((x) => x.language_id === langId) : undefined;
    return forLang?.title ?? tr[0]?.title ?? "…";
  }
  return "…";
}

function RouteComponent() {
  const { t } = useTranslation();
  const currentLang = useTranslationStore((s) => s.currentLang);
  const { data: langs = [] } = useLangs();
  const { countryId: countryIdParam } = useParams({
    from: "/_app/countries/$countryId/cities/",
  });
  const navigate = useNavigate();
  const countryId = parseInt(countryIdParam, 10);

  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: CityListItem;
  }>({ type: null });

  const { data: country } = useCountry(countryId);
  const countryTitle = countryHeadingTitle(
    country as
      | {
          title?: string;
          translations?: Array<{ language_id: number; title: string }>;
        }
      | undefined,
    currentLang,
    langs,
  );

  const { data, isLoading } = useCitiesAdmin(countryId, filters);
  const deleteMutation = useDeleteCity(countryId);
  const toggleStatusMutation = useToggleCityStatus(countryId);
  const changeSortingMutation = useChangeCitySorting(countryId);

  const cities = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage) || 1;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleToggleStatus = async (city: CityListItem) => {
    try {
      await toggleStatusMutation.mutateAsync(city.id);
      toast.success(t("status_updated_successfully"));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleSortUp = async (city: CityListItem) => {
    try {
      await changeSortingMutation.mutateAsync({
        cityId: city.id,
        sort: city.sort + 1,
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (city: CityListItem) => {
    if (city.sort === 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        cityId: city.id,
        sort: Math.max(0, city.sort - 1),
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteMutation.mutateAsync(modalState.data.id);
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("an_error_occurred"));
    }
  };

  const closeModal = () => setModalState({ type: null });

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/countries" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">
          {t("cities")} — {countryTitle}
        </h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder={t("search")}
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_city")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead>{t("sort_order")}</TableHead>
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
                {[...Array(7)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : cities.length > 0 ? (
            cities.map((city, index) => (
              <TableRow key={city.id}>
                <TableCell>{filters.page * perPage - perPage + index + 1}</TableCell>
                <TableCell className="font-medium">{city.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{city.sort}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleSortUp(city)}
                        disabled={changeSortingMutation.isPending}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleSortDown(city)}
                        disabled={
                          city.sort === 0 || changeSortingMutation.isPending
                        }
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={city.is_active}
                    onCheckedChange={() => handleToggleStatus(city)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </TableCell>
                <TableCell>{city.created_user}</TableCell>
                <TableCell>{city.created_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "edit", data: city })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "delete", data: city })}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-gray-500">
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
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_city")}
        size="md"
      >
        <Add countryId={countryId} onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit" && !!modalState.data}
        onClose={closeModal}
        title={t("edit_city")}
        size="md"
      >
        {modalState.data && (
          <Edit
            countryId={countryId}
            cityId={modalState.data.id}
            onClose={closeModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_city")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>
    </div>
  );
}
