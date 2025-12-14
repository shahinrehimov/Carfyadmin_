import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Edit as EditIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Users,
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
  useCategories,
  useDeleteCategory,
  useToggleCategoryStatus,
  useChangeCategorySorting,
  useDeleteCategoryImage,
} from "@/lib/queries/categories";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/categories/")({
  component: RouteComponent,
});

interface Category {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  sort: number;
  is_active: boolean;
  subs_count: number;
  created_user: string;
  created_date: string;
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State for filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
  });

  // State for modals
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | "deleteImage" | null;
    data?: Category;
  }>({ type: null });

  // Queries and mutations
  const { data, isLoading, error } = useCategories(filters);
  const deleteCategoryMutation = useDeleteCategory();
  const toggleStatusMutation = useToggleCategoryStatus();
  const changeSortingMutation = useChangeCategorySorting();
  const deleteImageMutation = useDeleteCategoryImage();

  const categories = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  // Handlers
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: category.id,
        isActive: category.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleSortUp = async (category: Category) => {
    try {
      await changeSortingMutation.mutateAsync({
        id: category.id,
        sort: category.sort + 1,
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (category: Category) => {
    if (category.sort === 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        id: category.id,
        sort: Math.max(0, category.sort - 1),
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;

    try {
      await deleteCategoryMutation.mutateAsync(modalState.data.id);
      toast.success(t("category_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_delete_category"),
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
          <TableHead className="w-[200px]">{t("actions")}</TableHead>
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
        ) : categories.length > 0 ? (
          categories.map((category, index) => (
            <TableRow key={category.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                {category.image ? (
                  <div className="group relative inline-block">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ type: "deleteImage", data: category });
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
              <TableCell className="font-medium">{category.title}</TableCell>
              <TableCell className="text-gray-600">{category.slug}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="min-w-[20px]">{category.sort}</span>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortUp(category)}
                      disabled={changeSortingMutation.isPending}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortDown(category)}
                      disabled={
                        category.sort === 0 || changeSortingMutation.isPending
                      }
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={category.is_active}
                  onCheckedChange={() => handleToggleStatus(category)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{category.created_user}</TableCell>
              <TableCell>{category.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "edit", data: category })
                    }
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "delete", data: category })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                  <Link
                    to="/categories/$id/subcategories"
                    params={{ id: String(category.id) }}
                  >
                    <Button variant="ghost" size="icon">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
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
      ) : categories.length > 0 ? (
        categories.map((category, index) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-start gap-4">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-16 w-16 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-medium">
                  {filters.page * perPage - perPage + index + 1}.{" "}
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("slug")}: {category.slug}
                </p>
                <p className="text-sm text-gray-600">
                  {t("sort")}: {category.sort}
                </p>
                <p className="text-sm text-gray-600">
                  {t("subcategories")}: {category.subs_count}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={category.is_active}
                onCheckedChange={() => handleToggleStatus(category)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "edit", data: category })
                  }
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "delete", data: category })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
                <Link
                  to="/categories/$id/subcategories"
                  params={{ id: String(category.id) }}
                >
                  <Button variant="ghost" size="icon">
                    <Users className="h-4 w-4" />
                  </Button>
                </Link>
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
          <p className="text-red-600">{t("error_loading_categories")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("categories")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_category")}
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
        title={t("new_category")}
        size="lg"
      >
        <Add onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_category")}
        size="lg"
      >
        {modalState.data && (
          <Edit categoryId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_category")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteCategoryMutation.isPending}
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
