import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { useAddGroupProductsBulk } from "@/lib/queries/groups";
import { useTranslation } from "@/lib/utils/translationLoader";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";

interface ProductVariant {
  id: number;
  product_id: number;
  product_title: string;
  title: string;
  sku: string;
  price: number;
  stock: number;
}

interface AddProductProps {
  groupId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddProduct: React.FC<AddProductProps> = ({
  groupId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);

  const addGroupProductsBulkMutation = useAddGroupProductsBulk();

  const loadVariants = useCallback(
    async (searchVal: string, pageVal: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pageVal) });
        if (searchVal.trim()) params.append("search", searchVal.trim());

        const res = await controlPrivateApi.get(
          `/product-variants/load?${params}`,
        );
        setVariants(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
        setPerPage(res.data.meta?.per_page || 10);
      } catch {
        toast.error(t("an_error_occurred"));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadVariants(search, page);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      loadVariants(search, 1);
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const handleToggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? variants.map((v) => v.id) : []);
  };

  const allSelected =
    variants.length > 0 && selected.length === variants.length;
  const someSelected = selected.length > 0 && !allSelected;

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error(t("please_select_at_least_one"));
      return;
    }
    try {
      const response = await addGroupProductsBulkMutation.mutateAsync({
        groupId,
        productVariantIds: selected,
      });
      toast.success(response.message || t("saved_successfully"));
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked as boolean)
                  }
                />
              </TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("variant")}</TableHead>
              <TableHead>{t("sku")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("stock")}</TableHead>
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
            ) : variants.length > 0 ? (
              variants.map((variant) => (
                <TableRow
                  key={variant.id}
                  className="cursor-pointer"
                  onClick={() => handleToggle(variant.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(variant.id)}
                      onCheckedChange={() => handleToggle(variant.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {variant.product_title}
                  </TableCell>
                  <TableCell>{variant.title}</TableCell>
                  <TableCell className="text-gray-500">{variant.sku}</TableCell>
                  <TableCell>{variant.price}</TableCell>
                  <TableCell>{variant.stock}</TableCell>
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
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / perPage)}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(p) => {
          setPage(p);
          loadVariants(search, p);
        }}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selected.length === 0 || addGroupProductsBulkMutation.isPending}
        >
          {t("add")} {selected.length > 0 ? `(${selected.length})` : ""}
        </Button>
      </div>
    </div>
  );
};

export default AddProduct;
