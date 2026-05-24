import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Edit as EditIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  List,
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
  useCountriesAdmin,
  useDeleteCountry,
  useToggleCountryStatus,
  useChangeCountrySorting,
  type CountryListItem,
} from "@/lib/queries/countries";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/countries/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: CountryListItem;
  }>({ type: null });

  const { data, isLoading } = useCountriesAdmin(filters);
  const deleteMutation = useDeleteCountry();
  const toggleStatusMutation = useToggleCountryStatus();
  const changeSortingMutation = useChangeCountrySorting();

  const countries = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleToggleStatus = async (country: CountryListItem) => {
    try {
      await toggleStatusMutation.mutateAsync(country.id);
      toast.success(t("status_updated_successfully"));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleSortUp = async (country: CountryListItem) => {
    try {
      await changeSortingMutation.mutateAsync({
        id: country.id,
        sort: country.sort + 1,
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (country: CountryListItem) => {
    if (country.sort === 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        id: country.id,
        sort: Math.max(0, country.sort - 1),
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("countries")}</h1>
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_country")}
        </Button>
      </div>

      <Input
        placeholder={t("search")}
        value={filters.search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full max-w-sm"
      />

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
          ) : countries.length > 0 ? (
            countries.map((country, index) => (
              <TableRow key={country.id}>
                <TableCell>{filters.page * perPage - perPage + index + 1}</TableCell>
                <TableCell className="font-medium">{country.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{country.sort}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleSortUp(country)}
                        disabled={changeSortingMutation.isPending}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleSortDown(country)}
                        disabled={
                          country.sort === 0 || changeSortingMutation.isPending
                        }
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={country.is_active}
                    onCheckedChange={() => handleToggleStatus(country)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </TableCell>
                <TableCell>{country.created_user}</TableCell>
                <TableCell>{country.created_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link
                      to="/countries/$countryId/cities"
                      params={{ countryId: country.id.toString() }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label={t("cities")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "edit", data: country })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "delete", data: country })}
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
        title={t("new_country")}
        size="md"
      >
        <Add onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit" && !!modalState.data}
        onClose={closeModal}
        title={t("edit_country")}
        size="md"
      >
        {modalState.data && (
          <Edit countryId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_country")}
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
