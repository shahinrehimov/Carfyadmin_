import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Eye,
  Image as ImageIcon,
  Layers,
  Package,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useProducts, useToggleProductStatus } from "@/lib/queries/products";
import type { Product } from "@/lib/queries/products";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/products/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
  });

  const { data, isLoading, error } = useProducts(filters);
  const toggleStatusMutation = useToggleProductStatus();

  const products = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await toggleStatusMutation.mutateAsync(product.id);
      toast.success(t("status_updated_successfully"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

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
          <TableHead>{t("brand")}</TableHead>
          <TableHead>{t("category")}</TableHead>
          <TableHead className="w-[80px]">{t("type")}</TableHead>
          <TableHead className="w-[90px]">{t("variants")}</TableHead>
          <TableHead className="w-[90px]">{t("pending")}</TableHead>
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
              {[...Array(12)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : products.length > 0 ? (
          products.map((product, index) => (
            <TableRow key={product.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                {product.main_image ? (
                  <img
                    src={product.main_image}
                    alt={product.title}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
              </TableCell>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell className="text-gray-600">
                {product.brand.title}
              </TableCell>
              <TableCell className="text-gray-600">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">
                    {product.main_category.title}
                  </span>
                  {product.main_category.parent && (
                    <span className="text-xs text-gray-400">
                      {product.main_category.parent.title}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {product.is_set ? (
                  <Badge variant="secondary">
                    <PackageCheck className="mr-1 h-3 w-3" />
                    {t("set")}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Package className="mr-1 h-3 w-3" />
                    {t("single")}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="default">{product.variants_count}</Badge>
              </TableCell>
              <TableCell>
                {product.pending_variants_count > 0 ? (
                  <Badge variant="destructive">
                    {product.pending_variants_count}
                  </Badge>
                ) : (
                  <Badge variant="outline">0</Badge>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={product.is_active}
                  onCheckedChange={() => handleToggleStatus(product)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{product.created_user}</TableCell>
              <TableCell>{product.created_date}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Link
                    to="/products/$productId/variants"
                    params={{ productId: String(product.id) }}
                  >
                    <Button variant="ghost" size="icon" title={t("variants")}>
                      <Layers className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    to="/products/$productId"
                    params={{ productId: String(product.id) }}
                  >
                    <Button variant="ghost" size="icon" title={t("view")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={12}>
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
              <div className="flex items-center gap-2">
                <div className="h-6 w-10 rounded bg-gray-200"></div>
                <div className="h-8 w-8 rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        products.map((product, index) => (
          <Card key={product.id} className="p-4">
            <div className="flex items-start gap-4">
              {product.main_image ? (
                <img
                  src={product.main_image}
                  alt={product.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-16 w-16 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="font-medium">
                  {filters.page * perPage - perPage + index + 1}. {product.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {product.brand.title} · {product.main_category.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.is_set ? (
                    <Badge variant="secondary">
                      <PackageCheck className="mr-1 h-3 w-3" />
                      {t("set")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Package className="mr-1 h-3 w-3" />
                      {t("single")}
                    </Badge>
                  )}
                  <Badge variant="default">
                    {t("variants")}: {product.variants_count}
                  </Badge>
                  {product.pending_variants_count > 0 && (
                    <Badge variant="destructive">
                      {t("pending")}: {product.pending_variants_count}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {product.created_user} · {product.created_date}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={product.is_active}
                onCheckedChange={() => handleToggleStatus(product)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex items-center gap-1">
                <Link
                  to="/products/$productId/variants"
                  params={{ productId: String(product.id) }}
                >
                  <Button variant="ghost" size="icon">
                    <Layers className="h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  to="/products/$productId"
                  params={{ productId: String(product.id) }}
                >
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
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
          <p className="text-red-600">{t("error_loading_data")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("products")}</h1>
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
    </div>
  );
}
