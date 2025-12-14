import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers, useDeleteUser, useToggleUserStatus } from "@/lib/queries/users";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [modalState, setModalState] = useState<{ type: "delete" | null; data?: any }>({
    type: null,
  });

  const { data, isLoading } = useUsers(filters);
  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();

  const users = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleStatusMutation.mutateAsync(user.id);
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteUserMutation.mutateAsync(modalState.data.id);
      toast.success(t("user_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_user"));
    }
  };

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("email")}</TableHead>
          <TableHead>{t("email_verified")}</TableHead>
          <TableHead>{t("status")}</TableHead>
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
        ) : users.length > 0 ? (
          users.map((user: any, index: number) => (
            <TableRow key={user.id}>
              <TableCell>{filters.page * perPage - perPage + index + 1}</TableCell>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className={user.email_is_verified ? "text-green-600" : "text-red-600"}>
                  {user.email_is_verified ? "✓" : "✗"}
                </span>
              </TableCell>
              <TableCell>
                <Switch
                  checked={user.is_active}
                  onCheckedChange={() => handleToggleStatus(user)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{user.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link to="/users/$userId/addresses" params={{ userId: user.id.toString() }}>
                    <Button variant="ghost" size="icon">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: user })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
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
      ) : users.length > 0 ? (
        users.map((user: any) => (
          <Card key={user.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    {user.email_is_verified ? (
                      <span className="text-green-600">✓ {t("verified")}</span>
                    ) : (
                      <span className="text-red-600">✗ {t("not_verified")}</span>
                    )}
                  </p>
                </div>
                <Switch checked={user.is_active} onCheckedChange={() => handleToggleStatus(user)} />
              </div>
              <div className="flex justify-end gap-2">
                <Link to="/users/$userId/addresses" params={{ userId: user.id.toString() }}>
                  <Button variant="ghost" size="icon">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "delete", data: user })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
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
      <h1 className="text-2xl font-semibold">{t("users")}</h1>
      <Input
        placeholder={t("search")}
        value={filters.search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full max-w-md"
      />
      <div className="overflow-hidden p-0">{isMobile ? <MobileView /> : <DesktopView />}</div>
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page: number) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={(_newSize: number) => {}}
        disabled={isLoading}
      />
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_user")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteUserMutation.isPending}
        />
      </Modal>
    </div>
  );
}
