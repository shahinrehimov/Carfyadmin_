import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Edit as EditIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  ShoppingBag,
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
  useGroups,
  useDeleteGroup,
  useToggleGroupStatus,
  useChangeGroupSorting,
  useDeleteGroupImage,
  type Group,
} from "@/lib/queries/groups";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/groups/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | "deleteImage" | null;
    data?: Group;
  }>({ type: null });

  const { data, isLoading, error } = useGroups(filters);
  const deleteGroupMutation = useDeleteGroup();
  const toggleStatusMutation = useToggleGroupStatus();
  const changeSortingMutation = useChangeGroupSorting();
  const deleteImageMutation = useDeleteGroupImage();

  const groups = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (group: Group) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: group.id,
        isActive: group.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleSortUp = async (group: Group) => {
    try {
      await changeSortingMutation.mutateAsync({
        id: group.id,
        sort: group.sort + 1,
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (group: Group) => {
    if (group.sort === 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        id: group.id,
        sort: Math.max(0, group.sort - 1),
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteGroupMutation.mutateAsync(modalState.data.id);
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("an_error_occurred"),
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
      toast.error(
        error.response?.data?.message || t("failed_to_delete_image"),
      );
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
          <TableHead className="w-[80px]">{t("image")}</TableHead>
          <TableHead>{t("title")}</TableHead>
          <TableHead>{t("slug")}</TableHead>
          <TableHead className="w-[100px]">{t("max_count")}</TableHead>
          <TableHead className="w-[120px]">{t("sort")}</TableHead>
          <TableHead className="w-[100px]">{t("status")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead className="w-[160px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(10)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : groups.length > 0 ? (
          groups.map((group, index) => (
            <TableRow key={group.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                {group.image ? (
                  <div className="group/img relative inline-block">
                    <img
                      src={group.image}
                      alt={group.title}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ type: "deleteImage", data: group });
                      }}
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover/img:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
              </TableCell>
              <TableCell className="font-medium">{group.title}</TableCell>
              <TableCell className="text-gray-600">{group.slug}</TableCell>
              <TableCell>{group.max_count}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="min-w-[20px]">{group.sort}</span>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortUp(group)}
                      disabled={changeSortingMutation.isPending}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSortDown(group)}
                      disabled={group.sort === 0 || changeSortingMutation.isPending}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={group.is_active}
                  onCheckedChange={() => handleToggleStatus(group)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{group.created_user}</TableCell>
              <TableCell>{group.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Link
                    to="/groups/$groupId/products"
                    params={{ groupId: group.id.toString() }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={t("products")}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "edit", data: group })}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: group })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={10}>
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
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        groups.map((group, index) => (
          <Card key={group.id} className="p-4">
            <div className="flex items-start gap-4">
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-16 w-16 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-medium">
                  {filters.page * perPage - perPage + index + 1}. {group.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("slug")}: {group.slug}
                </p>
                <p className="text-sm text-gray-600">
                  {t("sort")}: {group.sort}
                </p>
                <p className="text-sm text-gray-600">
                  {t("max_count")}: {group.max_count}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={group.is_active}
                onCheckedChange={() => handleToggleStatus(group)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Link
                  to="/groups/$groupId/products"
                  params={{ groupId: group.id.toString() }}
                >
                  <Button variant="ghost" size="icon" type="button">
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "edit", data: group })}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "delete", data: group })}
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
        <h1 className="text-2xl font-semibold">{t("groups")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_group")}
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
        title={t("new_group")}
        size="lg"
      >
        <Add onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_group")}
        size="lg"
      >
        {modalState.data && (
          <Edit groupId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_group")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteGroupMutation.isPending}
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
