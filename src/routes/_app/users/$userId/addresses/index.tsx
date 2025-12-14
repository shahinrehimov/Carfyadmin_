import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
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
import { useUserAddresses, useDeleteUserAddress, useUser } from "@/lib/queries/users";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";
import Modal from "@/components/ui/modal";

export const Route = createFileRoute("/_app/users/$userId/addresses/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { userId } = Route.useParams();
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<{ type: "delete" | null; data?: any }>({
    type: null,
  });

  const userIdNumber = Number(userId);
  const { data: userData } = useUser(userIdNumber);
  const { data, isLoading } = useUserAddresses({ page, user_id: userIdNumber });
  const deleteAddressMutation = useDeleteUserAddress();

  const addresses = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteAddressMutation.mutateAsync({
        userId: userIdNumber,
        addressId: modalState.data.id,
      });
      toast.success(t("address_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_address"));
    }
  };

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{t("address_type")}</TableHead>
          <TableHead>{t("country")}</TableHead>
          <TableHead>{t("city")}</TableHead>
          <TableHead>{t("address")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(7)].map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : addresses.length > 0 ? (
          addresses.map((address: any, index: number) => (
            <TableRow key={address.id}>
              <TableCell>{page * perPage - perPage + index + 1}</TableCell>
              <TableCell>{address.type_title}</TableCell>
              <TableCell>{address.country}</TableCell>
              <TableCell>{address.city}</TableCell>
              <TableCell className="max-w-xs truncate">{address.address}</TableCell>
              <TableCell>{address.created_date}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "delete", data: address })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-gray-500">
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
      ) : addresses.length > 0 ? (
        addresses.map((address: any) => (
          <Card key={address.id} className="p-4">
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{address.type_title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: address })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                <p className="text-sm">
                  {address.city}, {address.country}
                </p>
                <p className="text-sm text-gray-600">{address.address}</p>
                <p className="mt-2 text-xs text-gray-500">{address.created_date}</p>
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
          {t("user_addresses")} - {userData?.full_name || userData?.email || t("loading")}
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
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_address")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteAddressMutation.isPending}
        />
      </Modal>
    </div>
  );
}
