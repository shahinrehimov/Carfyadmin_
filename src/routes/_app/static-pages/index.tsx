import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import DeleteModal from "@/components/ui/delete-modal";
import {
  useStaticPages,
  useDeleteStaticPage,
  useTogglePageStatus,
  type StaticPage,
} from "@/lib/queries/static-pages";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/static-pages/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    page: number;
    limit: number;
    search: string;
  }>({ page: 1, limit: 10, search: "" });
  const [modalState, setModalState] = useState<{
    type: "delete" | null;
    data?: StaticPage;
  }>({ type: null });

  const { data, isLoading } = useStaticPages(filters);
  const deleteMutation = useDeleteStaticPage();
  const toggleMutation = useTogglePageStatus();

  const pages = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = data?.meta.last_page || 1;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleToggleStatus = async (page: StaticPage) => {
    try {
      await toggleMutation.mutateAsync(page.id);
      toast.success(t("status_updated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
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

  const closeModal = () => setModalState({ type: null });

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("pages")}</h1>
        <Button asChild>
          <Link to="/static-pages/add">
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t("search")}
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[60px]">{t("image")}</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead>{t("slug")}</TableHead>
            <TableHead className="w-[80px]">{t("sort")}</TableHead>
            <TableHead className="w-[90px]">{t("status")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead className="w-[120px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(8)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : pages.length > 0 ? (
            pages.map((page, index) => {
              const firstTranslation = page.translations?.[0];
              return (
                <TableRow key={page.id}>
                  <TableCell>
                    {(filters.page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell>
                    {page.main_image ? (
                      <img
                        src={page.main_image}
                        alt={firstTranslation?.title || ""}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-400">—</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="line-clamp-2 text-sm">
                      {firstTranslation?.title || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">{page.slug}</span>
                  </TableCell>
                  <TableCell>{page.sort}</TableCell>
                  <TableCell>
                    <Switch
                      checked={page.is_active}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => handleToggleStatus(page)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {page.created_date || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/static-pages/$id" params={{ id: String(page.id) }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to="/static-pages/$id/edit" params={{ id: String(page.id) }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setModalState({ type: "delete", data: page })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-gray-500"
              >
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
        onPageSizeChange={(limit) =>
          setFilters((prev) => ({ ...prev, limit, page: 1 }))
        }
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete")}
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
