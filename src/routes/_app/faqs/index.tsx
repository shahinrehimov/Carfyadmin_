import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Edit as EditIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useFaqs,
  useDeleteFaq,
  useToggleFaqStatus,
  useChangeFaqSorting,
  type Faq,
} from "@/lib/queries/faqs";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();

export const Route = createFileRoute("/_app/faqs/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: Faq;
  }>({ type: null });

  const { data, isLoading, error } = useFaqs(filters);
  const deleteFaqMutation = useDeleteFaq();
  const toggleStatusMutation = useToggleFaqStatus();
  const changeSortingMutation = useChangeFaqSorting();

  const faqs = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleAdded = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (faq: Faq) => {
    try {
      await toggleStatusMutation.mutateAsync(faq.id);
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleSortUp = async (faq: Faq) => {
    try {
      await changeSortingMutation.mutateAsync({
        id: faq.id,
        sort: faq.sort + 1,
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (faq: Faq) => {
    if (faq.sort === 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        id: faq.id,
        sort: Math.max(0, faq.sort - 1),
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteFaqMutation.mutateAsync(modalState.data.id);
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const closeModal = () => setModalState({ type: null });

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-lg text-gray-500">{t("no_data_found")}</p>
    </div>
  );

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("question")}</TableHead>
          <TableHead className="max-w-xs">{t("answer")}</TableHead>
          <TableHead className="w-[120px]">{t("sort")}</TableHead>
          <TableHead className="w-[100px]">{t("status")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead className="w-[120px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(8)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : faqs.length > 0 ? (
          faqs.map((faq, index) => (
            <TableRow key={faq.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell className="font-medium">{faq.question}</TableCell>
              <TableCell className="max-w-xs truncate text-gray-600">
                {stripHtml(faq.answer)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="min-w-[20px]">{faq.sort}</span>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortUp(faq)}
                      disabled={changeSortingMutation.isPending}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortDown(faq)}
                      disabled={
                        faq.sort === 0 || changeSortingMutation.isPending
                      }
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={faq.is_active}
                  onCheckedChange={() => handleToggleStatus(faq)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{faq.created_user}</TableCell>
              <TableCell>{faq.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "edit", data: faq })}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: faq })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8}>
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse border-b p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        ))
      ) : faqs.length > 0 ? (
        faqs.map((faq, index) => (
          <Card key={faq.id} className="p-4">
            <h3 className="text-lg font-medium">
              {filters.page * perPage - perPage + index + 1}. {faq.question}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">
              {stripHtml(faq.answer)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {t("sort")}: {faq.sort}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={faq.is_active}
                onCheckedChange={() => handleToggleStatus(faq)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "edit", data: faq })}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "delete", data: faq })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <NoData />
      )}
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <p className="text-red-600">{t("an_error_occurred")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("faqs")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_faq")}
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder={t("search")}
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_faq")}
        size="lg"
      >
        <Add onClose={closeModal} onSaved={handleAdded} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_faq")}
        size="lg"
      >
        {modalState.data && (
          <Edit faqId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_faq")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteFaqMutation.isPending}
        />
      </Modal>
    </div>
  );
}
