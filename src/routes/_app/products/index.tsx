import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Clock,
  Eye,
  Image as ImageIcon,
  Layers,
  Loader2,
  Package,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Badge } from "@/components/ui/badge";
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
  useProducts,
  useToggleProductStatus,
  useProductRevisions,
  useApproveProductRevision,
  useRejectProductRevision,
} from "@/lib/queries/products";
import type { Product, ProductRevision } from "@/lib/queries/products";
import { useTranslation } from "@/lib/utils/translationLoader";

function ProductRevisionsModal({ productId, onClose }: { productId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: revisions, isLoading, refetch } = useProductRevisions(productId, true);
  const approveMutation = useApproveProductRevision();
  const rejectMutation = useRejectProductRevision();
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const handleApprove = async (revision: ProductRevision) => {
    try {
      await approveMutation.mutateAsync(revision.id);
      toast.success(t("approved_successfully"));
      refetch();
    } catch {
      toast.error(t("error_occurred"));
    }
  };

  const handleReject = async (revisionId: number) => {
    try {
      await rejectMutation.mutateAsync({ id: revisionId, message: rejectMessage });
      toast.success(t("rejected_successfully"));
      setRejectingId(null);
      setRejectMessage("");
      refetch();
    } catch {
      toast.error(t("error_occurred"));
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !revisions?.length ? (
        <p className="py-6 text-center text-gray-500">{t("no_data_found")}</p>
      ) : (
        <div className="space-y-4">
          {revisions.map((revision) => (
            <div key={revision.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {revision.status === "pending" && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>}
                  {revision.status === "approved" && <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>}
                  {revision.status === "rejected" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>}
                  {revision.company && <span className="text-sm text-gray-500">{revision.company.title}</span>}
                </div>
                <span className="text-xs text-gray-400">{revision.created_date}</span>
              </div>

              {revision.data.translations?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">{t("translations")}</p>
                  {revision.data.translations.map((tr) => (
                    <div key={tr.language_id} className="rounded bg-blue-50 dark:bg-blue-950 p-2 text-sm space-y-0.5">
                      <p className="text-xs text-blue-600 font-medium">{t("language")} #{tr.language_id}</p>
                      {tr.title && <p><span className="text-gray-500">{t("title")}:</span> {tr.title}</p>}
                      {tr.description_short && <p><span className="text-gray-500">{t("description_short")}:</span> {tr.description_short}</p>}
                    </div>
                  ))}
                </div>
              )}

              {(revision.images.main_image || revision.images.images.length > 0) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">{t("images")}</p>
                  <div className="flex flex-wrap gap-2">
                    {revision.images.main_image && (
                      <img src={revision.images.main_image} alt="main" className="h-16 w-16 rounded object-cover border" />
                    )}
                    {revision.images.hover_image && (
                      <img src={revision.images.hover_image} alt="hover" className="h-16 w-16 rounded object-cover border" />
                    )}
                    {revision.images.images.map((img) => (
                      <img key={img.id} src={img.url} alt="" className="h-16 w-16 rounded object-cover border" />
                    ))}
                  </div>
                </div>
              )}

              {revision.rejection_message && (
                <p className="rounded bg-red-50 dark:bg-red-950 p-2 text-sm text-red-700">{revision.rejection_message}</p>
              )}

              {revision.status === "pending" && (
                <div className="space-y-2">
                  {rejectingId === revision.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={2}
                        placeholder={t("rejection_message") || "Rədd etmə səbəbi..."}
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleReject(revision.id)} disabled={rejectMutation.isPending}>
                          {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm_reject") || "Rədd et"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>{t("cancel")}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(revision)} disabled={approveMutation.isPending}>
                        {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />{t("approve")}</>}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectingId(revision.id)}>
                        <XCircle className="h-4 w-4 mr-1" />{t("reject")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>{t("close")}</Button>
      </div>
    </div>
  );
}

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
  const [revisionsProductId, setRevisionsProductId] = useState<number | null>(null);

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
                <div className="flex flex-col gap-1">
                  {product.pending_variants_count > 0 ? (
                    <Badge variant="destructive">{product.pending_variants_count}</Badge>
                  ) : (
                    <Badge variant="outline">0</Badge>
                  )}
                  {product.pending_revisions_count > 0 && (
                    <Badge variant="secondary" className="gap-1 text-yellow-700 border-yellow-300 bg-yellow-50">
                      {product.pending_revisions_count} {t("variant_revisions") || "variant revizyon"}
                    </Badge>
                  )}
                  {product.pending_product_revisions_count > 0 && (
                    <Badge variant="secondary" className="gap-1 text-blue-700 border-blue-300 bg-blue-50">
                      {product.pending_product_revisions_count} {t("product_revisions") || "məhsul revizyon"}
                    </Badge>
                  )}
                </div>
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
                  {product.pending_product_revisions_count > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("product_revisions") || "Məhsul reviziyaları"}
                      className="text-yellow-600 hover:text-yellow-700"
                      onClick={() => setRevisionsProductId(product.id)}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  )}
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
                  {product.pending_revisions_count > 0 && (
                    <Badge className="gap-1 text-yellow-700 border-yellow-300 bg-yellow-50">
                      {product.pending_revisions_count} {t("revisions") || "revizyon"}
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
                {product.pending_product_revisions_count > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-yellow-600 hover:text-yellow-700"
                    onClick={() => setRevisionsProductId(product.id)}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
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

      <Modal
        isOpen={revisionsProductId !== null}
        title={t("product_revisions") || "Məhsul Reviziyaları"}
        onClose={() => setRevisionsProductId(null)}
      >
        {revisionsProductId !== null && (
          <ProductRevisionsModal
            productId={revisionsProductId}
            onClose={() => setRevisionsProductId(null)}
          />
        )}
      </Modal>
    </div>
  );
}
