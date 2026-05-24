import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useUser,
  useUserCars,
  useDeleteUserCar,
  type UserCar,
} from "@/lib/queries/users";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";
import Modal from "@/components/ui/modal";
import Show from "./-popups/Show";

export const Route = createFileRoute("/_app/users/$userId/cars/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { userId } = Route.useParams();
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<{
    type: "delete" | "show" | null;
    data?: UserCar;
  }>({
    type: null,
  });

  const userIdNumber = Number(userId);
  const { data: userData } = useUser(userIdNumber);
  const { data, isLoading } = useUserCars({ page, user_id: userIdNumber });
  const deleteCarMutation = useDeleteUserCar();

  const cars = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteCarMutation.mutateAsync({
        userId: userIdNumber,
        carId: modalState.data.id,
      });
      toast.success(t("car_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_car"));
    }
  };

  const carTitle = (car: UserCar) => {
    const brand = car.brand?.title;
    const model = car.brand_model?.title;
    if (brand && model) return `${brand} ${model}`;
    return brand || model || "—";
  };

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{t("brand")}</TableHead>
          <TableHead>{t("brand_model")}</TableHead>
          <TableHead>{t("year")}</TableHead>
          <TableHead>{t("car_color")}</TableHead>
          <TableHead>{t("vin_number")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(8)].map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : cars.length > 0 ? (
          cars.map((car, index) => (
            <TableRow key={car.id}>
              <TableCell>{page * perPage - perPage + index + 1}</TableCell>
              <TableCell>{car.brand?.title || "—"}</TableCell>
              <TableCell>{car.brand_model?.title || "—"}</TableCell>
              <TableCell>{car.year ?? "—"}</TableCell>
              <TableCell>{car.car_color?.title || "—"}</TableCell>
              <TableCell className="max-w-xs truncate">{car.vin_number || "—"}</TableCell>
              <TableCell>{car.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "show", data: car })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: car })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} className="py-12 text-center text-gray-500">
              {t("no_data_found")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse border-b p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        ))
      ) : cars.length > 0 ? (
        cars.map((car) => (
          <Card key={car.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{carTitle(car)}</h3>
                  <p className="text-sm text-gray-600">
                    {car.year ?? "—"} · {car.car_color?.title || "—"}
                  </p>
                  {car.vin_number && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t("vin_number")}: {car.vin_number}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">{car.created_date}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "show", data: car })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: car })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="py-12 text-center text-gray-500">{t("no_data_found")}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/users" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">
          {t("user_cars")} - {userData?.full_name || userData?.email || t("loading")}
        </h1>
      </div>
      <div className="overflow-hidden p-0">{isMobile ? <MobileView /> : <DesktopView />}</div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(newPage: number) => setPage(newPage)}
        onPageSizeChange={(_newSize: number) => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "show" && !!modalState.data}
        onClose={() => setModalState({ type: null })}
        title={t("car_details")}
        size="md"
      >
        {modalState.data && <Show userId={userIdNumber} carId={modalState.data.id} />}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_car")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteCarMutation.isPending}
        />
      </Modal>
    </div>
  );
}
