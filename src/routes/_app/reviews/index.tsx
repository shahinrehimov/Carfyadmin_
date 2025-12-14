import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
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
  useReviews,
  useDeleteReview,
  useToggleReviewStatus,
} from "@/lib/queries/reviews";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/reviews/")({
  component: RouteComponent,
});

interface Review {
  id: number;
  user_name: string;
  user_email: string;
  product_title: string;
  rating: number;
  comment: string;
  is_active: boolean;
  created_date: string;
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
  });

  const [modalState, setModalState] = useState<{
    type: "delete" | null;
    data?: Review;
  }>({ type: null });

  const { data, isLoading, error } = useReviews(filters);
  const deleteReviewMutation = useDeleteReview();
  const toggleStatusMutation = useToggleReviewStatus();

  const reviews = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (review: Review) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: review.id,
        isActive: review.is_active,
      });
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
          <TableHead className="w-[150px]">{t("rating")}</TableHead>
          <TableHead>{t("comment")}</TableHead>
          <TableHead className="w-[100px]">{t("status")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead className="w-[100px]">{t("actions")}</TableHead>
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
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <TableRow key={review.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{review.user_name}</div>
                  <div className="text-sm text-gray-600">
                    {review.user_email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {review.product_title}
              </TableCell>
              <TableCell>
                <RatingStars rating={review.rating} />
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate">{review.comment}</p>
              </TableCell>
              <TableCell>
                <Switch
                  checked={review.is_active}
                  onCheckedChange={() => handleToggleStatus(review)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{review.created_date}</TableCell>
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
      ) : reviews.length > 0 ? (
        reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{review.user_name}</h3>
                  <p className="text-sm text-gray-600">
                    {review.product_title}
                  </p>
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
              <p className="text-sm">{review.comment}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {review.created_date}
                </span>
                <Switch
                  checked={review.is_active}
                  onCheckedChange={() => handleToggleStatus(review)}
                  disabled={toggleStatusMutation.isPending}
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
