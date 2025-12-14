import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import EditLanguage from "./-popups/Edit";
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
  useDeleteLanguage,
  useLanguages,
  useToggleLanguageStatus,
} from "@/lib/queries/languages";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/languages/")({
  component: RouteComponent,
});

interface Language {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State for filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  // State for modals
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: Language;
  }>({ type: null });

  // Queries and mutations
  const { data, isLoading, error } = useLanguages(filters);
  const deleteLanguageMutation = useDeleteLanguage();
  const toggleStatusMutation = useToggleLanguageStatus();

  const languages = data?.data || [];
  const total = data?.meta.total || 0;
  const totalPages = Math.ceil(total / filters.limit);

  // Handlers
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleToggleStatus = async (language: Language) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: language.id,
        isActive: language.is_active,
      });
      toast.success("Status updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;

    try {
      await deleteLanguageMutation.mutateAsync(modalState.data.id);
      toast.success("Language deleted successfully");
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete language");
    }
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 border-b animate-pulse"
        >
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-10 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // No data component
  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-gray-500 text-lg">{t("no_data_found")}</p>
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("title")}</TableHead>
          <TableHead className="w-[100px]">Key</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell>
                <div className="h-6 w-10 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : languages.length > 0 ? (
          languages.map((language, index) => (
            <TableRow key={language.id}>
              <TableCell>
                {filters.page * filters.limit - filters.limit + index + 1}
              </TableCell>
              <TableCell className="font-medium">{language.title}</TableCell>
              <TableCell className="text-gray-600">{language.key}</TableCell>
              <TableCell>
                <Switch
                  checked={language.is_active}
                  onCheckedChange={() => handleToggleStatus(language)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "edit", data: language })
                    }
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "delete", data: language })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5}>
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Mobile card view
  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingSkeleton />
      ) : languages.length > 0 ? (
        languages.map((language, index) => (
          <Card key={language.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-lg">
                  {filters.page * filters.limit - filters.limit + index + 1}.{" "}
                  {language.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Key: {language.key}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Switch
                checked={language.is_active}
                onCheckedChange={() => handleToggleStatus(language)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "edit", data: language })
                  }
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "delete", data: language })
                  }
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
        <div className="text-center py-12">
          <p className="text-red-600">Error loading languages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("languages")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_language")}
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t("search")}
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-0 overflow-hidden">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={filters.limit}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handleLimitChange}
        disabled={isLoading}
      />

      {/* Modals */}
      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_language")}
        size="lg"
      >
        <Add onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_language")}
        size="lg"
      >
        {modalState.data && (
          <EditLanguage languageId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title="Delete Language"
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteLanguageMutation.isPending}
        />
      </Modal>
    </div>
  );
}
