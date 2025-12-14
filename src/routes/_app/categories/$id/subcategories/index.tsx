import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit as EditIcon,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  useCategory,
  useChangeSubCategorySorting,
  useDeleteSubCategory,
  useDeleteSubCategoryImage,
  useSubCategories,
  useToggleSubCategoryStatus,
} from "@/lib/queries/categories";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/categories/$id/subcategories/")({
  component: RouteComponent,
});

interface SubCategory {
  id: number;
  category_id: number;
  title: string;
  slug: string;
  image: string | null;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

function RouteComponent() {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/_app/categories/$id/subcategories/" });
  const navigate = useNavigate();
  const categoryId = parseInt(id);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State for filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    category_id: categoryId,
  });

  // State for modals
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | "deleteImage" | null;
    data?: SubCategory;
  }>({ type: null });

  // Queries and mutations
  const { data: category } = useCategory(categoryId);
  const { data, isLoading, error } = useSubCategories(filters);
  const deleteSubCategoryMutation = useDeleteSubCategory();
  const toggleStatusMutation = useToggleSubCategoryStatus();
  const changeSortingMutation = useChangeSubCategorySorting();
  const deleteImageMutation = useDeleteSubCategoryImage();

  const subCategories = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  // Handlers
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (subCategory: SubCategory) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: subCategory.id,
        isActive: subCategory.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleSortUp = async (subCategory: SubCategory) => {
    try {
      await changeSortingMutation.mutateAsync({
        id: subCategory.id,
        sort: subCategory.sort + 1,
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (subCategory: SubCategory) => {
    if (subCategory.sort === 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        id: subCategory.id,
        sort: Math.max(0, subCategory.sort - 1),
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;

    try {
      await deleteSubCategoryMutation.mutateAsync(modalState.data.id);
      toast.success(t("subcategory_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_delete_subcategory"),
      );
    }
  };

  const handleDeleteImage = async () => {
    if (!modalState.data) return;

    try {
      await deleteImageMutation.mutateAsync(modalState.data.id);
      toast.success(t("image_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_image"));
    }
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  const handleGoBack = () => {
    navigate({ to: "/categories" });
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center justify-between border-b p-4"
        >
          <div className="flex-1">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-10 rounded bg-gray-200"></div>
            <div className="h-8 w-8 rounded bg-gray-200"></div>
            <div className="h-8 w-8 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // No data component
  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-lg text-gray-500">{t("no_data_found")}</p>
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead className="w-[80px]">{t("image")}</TableHead>
          <TableHead>{t("title")}</TableHead>
          <TableHead>{t("slug")}</TableHead>
          <TableHead className="w-[120px]">{t("sort")}</TableHead>
          <TableHead className="w-[100px]">{t("status")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead className="w-[150px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(9)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : subCategories.length > 0 ? (
          subCategories.map((subCategory, index) => (
            <TableRow key={subCategory.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                {subCategory.image ? (
                  <div className="group relative inline-block">
                    <img
                      src={subCategory.image}
                      alt={subCategory.title}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({
                          type: "deleteImage",
                          data: subCategory,
                        });
                      }}
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
              </TableCell>
              <TableCell className="font-medium">{subCategory.title}</TableCell>
              <TableCell className="text-gray-600">
                {subCategory.slug}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="min-w-[20px]">{subCategory.sort}</span>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortUp(subCategory)}
                      disabled={changeSortingMutation.isPending}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortDown(subCategory)}
                      disabled={
                        subCategory.sort === 0 ||
                        changeSortingMutation.isPending
                      }
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={subCategory.is_active}
                  onCheckedChange={() => handleToggleStatus(subCategory)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{subCategory.created_user}</TableCell>
              <TableCell>{subCategory.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "edit", data: subCategory })
                    }
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "delete", data: subCategory })
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
            <TableCell colSpan={9}>
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
      ) : subCategories.length > 0 ? (
        subCategories.map((subCategory, index) => (
          <Card key={subCategory.id} className="p-4">
            <div className="flex items-start gap-4">
              {subCategory.image ? (
                <img
                  src={subCategory.image}
                  alt={subCategory.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-16 w-16 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-medium">
                  {filters.page * perPage - perPage + index + 1}.{" "}
                  {subCategory.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("slug")}: {subCategory.slug}
                </p>
                <p className="text-sm text-gray-600">
                  {t("sort")}: {subCategory.sort}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={subCategory.is_active}
                onCheckedChange={() => handleToggleStatus(subCategory)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "edit", data: subCategory })
                  }
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "delete", data: subCategory })
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
        <div className="py-12 text-center">
          <p className="text-red-600">{t("error_loading_subcategories")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {t("subcategories")} -{" "}
            {(category as any)?.translations[0]?.title || ""}
          </h1>
        </div>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_subcategory")}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      {/* Modals */}
      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_subcategory")}
        size="lg"
      >
        <Add categoryId={categoryId} onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_subcategory")}
        size="lg"
      >
        {modalState.data && (
          <Edit
            categoryId={categoryId}
            subCategoryId={modalState.data.id}
            onClose={closeModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_subcategory")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteSubCategoryMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={modalState.type === "deleteImage"}
        onClose={closeModal}
        title={t("delete_image")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDeleteImage}
          pending={deleteImageMutation.isPending}
        />
      </Modal>
    </div>
  );
}
