import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
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
import { Select } from "@/components/ui/select";
import {
  useReviews,
  useDeleteReview,
  useApproveToggle,
  type Review,
} from "@/lib/queries/reviews";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/reviews/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState<{
    page: number;
    rating: string;
    approved: string;
  }>({
    page: 1,
    rating: "",
    approved: "",
  });

  const [modalState, setModalState] = useState<{
    type: "delete" | null;
    data?: Review;
  }>({ type: null });

  const { data, isLoading, error } = useReviews(filters);
  const deleteReviewMutation = useDeleteReview();
  const approveToggleMutation = useApproveToggle();

  const reviews = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleApproveToggle = async (review: Review) => {
    try {
      await approveToggleMutation.mutateAsync(review.id);
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;

    try {
      await deleteReviewMutation.mutateAsync(modalState.data.id);
      toast.success(t("review_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_delete_review"),
      );
    }
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

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
          <TableHead>{t("user")}</TableHead>
          <TableHead>{t("product")}</TableHead>
          <TableHead>{t("seller")}</TableHead>
          <TableHead className="w-[150px]">{t("rating")}</TableHead>
          <TableHead>{t("review")}</TableHead>
          <TableHead className="w-[100px]">{t("approved")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead className="w-[100px]">{t("actions")}</TableHead>
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
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <TableRow key={review.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {review.name} {review.surname}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {review.product_variant?.product?.title ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {review.seller?.label ?? "—"}
              </TableCell>
              <TableCell>
                <RatingStars rating={review.rating} />
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate">{review.review}</p>
              </TableCell>
              <TableCell>
                <Switch
                  checked={review.is_approved}
                  onCheckedChange={() => handleApproveToggle(review)}
                  disabled={approveToggleMutation.isPending}
                />
              </TableCell>
              <TableCell>{review.created_at}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "delete", data: review })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
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

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse border-b p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        ))
      ) : reviews.length > 0 ? (
        reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">
                    {review.name} {review.surname}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {review.product_variant?.product?.title ?? "—"}
                  </p>
                  {review.seller && (
                    <p className="text-xs text-gray-500">{review.seller.label}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "delete", data: review })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              <RatingStars rating={review.rating} />
              <p className="text-sm">{review.review}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {review.created_at}
                </span>
                <Switch
                  checked={review.is_approved}
                  onCheckedChange={() => handleApproveToggle(review)}
                  disabled={approveToggleMutation.isPending}
                />
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
          <p className="text-red-600">{t("error_loading_reviews")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("reviews")}</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Select
          value={filters.approved}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, approved: value === "all" ? "" : value, page: 1 }))
          }
          placeholder={t("all")}
          options={[
            { value: "all", label: t("all") },
            { value: "yes", label: t("approved") },
            { value: "no", label: t("not_approved") },
          ]}
          className="w-[160px]"
        />

        <Select
          value={filters.rating}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, rating: value === "all" ? "" : value, page: 1 }))
          }
          placeholder={t("rating")}
          options={[
            { value: "all", label: t("all") },
            ...([1, 2, 3, 4, 5].map((r) => ({ value: String(r), label: `${r} ★` }))),
          ]}
          className="w-[140px]"
        />
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
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_review")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteReviewMutation.isPending}
        />
      </Modal>
    </div>
  );
}
