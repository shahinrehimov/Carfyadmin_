import { useEffect, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGroup,
  useGroupProductList,
  useRemoveGroupProduct,
  useRemoveGroupProductsBulk,
  type GroupProductListItem,
} from "@/lib/queries/groups";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";
import AddProduct from "./-popups/AddProduct";

export const Route = createFileRoute("/_app/groups/$groupId/products/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId } = useParams({ from: "/_app/groups/$groupId/products/" });
  const groupIdNum = parseInt(groupId);

  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [selected, setSelected] = useState<number[]>([]);
  const [modalState, setModalState] = useState<{
    type: "add" | "delete" | "deleteBulk" | null;
    data?: GroupProductListItem;
  }>({ type: null });

  const { data: group } = useGroup(groupIdNum);
  const { data, isLoading, refetch } = useGroupProductList({
    page: filters.page,
    group_id: groupIdNum,
    search: filters.search,
  });

  const removeProductMutation = useRemoveGroupProduct();
  const removeProductsBulkMutation = useRemoveGroupProductsBulk();

  const products = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  // Clear selections when data changes
  useEffect(() => {
    setSelected([]);
  }, [data]);

  // Search with debounce
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(id);
  }, [filters.search]);

  const allSelected = products.length > 0 && selected.length === products.length;
  const someSelected = selected.length > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? products.map((p) => p.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((v) => v !== id),
    );
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      const response = await removeProductMutation.mutateAsync({
        groupId: groupIdNum,
        productId: modalState.data.id,
      });
      toast.success(response.message || t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await removeProductsBulkMutation.mutateAsync({
        groupId: groupIdNum,
        productIds: selected,
      });
      toast.success(response.message || t("deleted_successfully"));
      setSelected([]);
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const closeModal = () => setModalState({ type: null });

  const groupTitle = (group as any)?.title || (group as any)?.slug || `#${groupId}`;

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/groups" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {groupTitle} — {t("products")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setModalState({ type: "deleteBulk" })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")} ({selected.length})
            </Button>
          )}
          <Button onClick={() => setModalState({ type: "add" })}>
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder={t("search")}
        value={filters.search}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, search: e.target.value }))
        }
        className="w-full max-w-sm"
      />

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = someSelected;
                }}
                onCheckedChange={(checked) =>
                  handleSelectAll(checked as boolean)
                }
              />
            </TableHead>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[70px]">{t("image")}</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead>{t("brand")}</TableHead>
            <TableHead>{t("categories")}</TableHead>
            <TableHead className="w-[100px]">{t("status")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead className="w-[70px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(9)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(product.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(product.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  {(filters.page - 1) * perPage + index + 1}
                </TableCell>
                <TableCell>
                  {product.main_image ? (
                    <img
                      src={product.main_image}
                      alt={product.title}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] font-medium">
                  {product.title}
                </TableCell>
                <TableCell>
                  {product.brand ? (
                    <Badge variant="outline">{product.brand.title}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {product.categories?.map((cat) => (
                      <Badge key={cat.id} variant="secondary">
                        {cat.title}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {product.created_date}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "delete", data: product })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={9}
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
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      {/* Add Modal */}
      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("add_product")}
        size="xl"
      >
        <AddProduct
          groupId={groupIdNum}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            closeModal();
          }}
        />
      </Modal>

      {/* Single Delete Modal */}
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={removeProductMutation.isPending}
        />
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={modalState.type === "deleteBulk"}
        onClose={closeModal}
        title={t("delete")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleBulkDelete}
          pending={removeProductsBulkMutation.isPending}
        />
      </Modal>
    </div>
  );
}
