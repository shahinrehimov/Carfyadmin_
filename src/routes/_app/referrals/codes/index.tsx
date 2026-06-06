import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import DeleteModal from "@/components/ui/delete-modal";
import {
  useReferralCodes,
  useDeactivateCode,
  useDeleteCode,
  type ReferralCode,
} from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";
import { ReferralNav } from "../-components/ReferralNav";
import Edit from "./-popups/Edit";

export const Route = createFileRoute("/_app/referrals/codes/")({
  component: RouteComponent,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });

type ModalState =
  | { type: "edit"; data: ReferralCode }
  | { type: "delete"; data: ReferralCode }
  | { type: null };

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({ page: 1, search: "", is_active: "" });
  const [modal, setModal] = useState<ModalState>({ type: null });

  const { data, isLoading } = useReferralCodes(filters);
  const deactivateMutation = useDeactivateCode();
  const deleteMutation = useDeleteCode();

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const perPage = data?.meta?.per_page ?? 20;
  const totalPages = Math.ceil(total / perPage);

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync(id);
      toast.success(t("code_deactivated") || "Kod deaktiv edildi");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  const handleDelete = async () => {
    if (modal.type !== "delete") return;
    try {
      await deleteMutation.mutateAsync(modal.data.id);
      toast.success(t("code_deleted") || "Kod silindi");
      setModal({ type: null });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  const ActionButtons = ({ item }: { item: ReferralCode }) => (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => setModal({ type: "edit", data: item })}
        title={t("edit_code") || "Kodu dəyiş"}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      {item.is_active && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-amber-600 hover:text-amber-700"
          onClick={() => handleDeactivate(item.id)}
          disabled={deactivateMutation.isPending}
          title={t("deactivate") || "Deaktiv et"}
        >
          <PowerOff className="w-4 h-4" />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-red-500 hover:text-red-700"
        onClick={() => setModal({ type: "delete", data: item })}
        title={t("delete") || "Sil"}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-semibold">{t("referrals") || "Referrallar"}</h1>
      <ReferralNav />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder={t("search_code") || "Kod axtarın..."}
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          className="w-full max-w-xs"
        />
        <Select
          value={filters.is_active}
          onValueChange={(v) => setFilters((p) => ({ ...p, is_active: v, page: 1 }))}
          options={[
            { value: "",      label: t("all")      || "Hamısı" },
            { value: "true",  label: t("active")   || "Aktiv" },
            { value: "false", label: t("inactive") || "Qeyri-aktiv" },
          ]}
          placeholder={t("all_statuses") || "Bütün statuslar"}
          className="w-44"
        />
        <span className="text-sm text-gray-500">{t("total") || "Cəmi"}: {total}</span>
      </div>

      {/* Desktop table */}
      {!isMobile && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("user") || "İstifadəçi"}</TableHead>
              <TableHead>{t("code") || "Kod"}</TableHead>
              <TableHead>{t("custom") || "Xüsusi"}</TableHead>
              <TableHead>{t("status") || "Status"}</TableHead>
              <TableHead>{t("created_at") || "Tarix"}</TableHead>
              <TableHead>{t("actions") || "Əməliyyatlar"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}><div className="h-4 animate-pulse rounded bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{(filters.page - 1) * perPage + idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.user.name} {item.user.surname}</div>
                    <div className="text-xs text-gray-500">{item.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold tracking-wider text-primary">
                      {item.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.is_custom
                      ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{t("custom") || "Xüsusi"}</span>
                      : <span className="text-xs text-gray-400">{t("auto") || "Auto"}</span>}
                  </TableCell>
                  <TableCell>
                    {item.is_active
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{t("active") || "Aktiv"}</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{t("inactive") || "Deaktiv"}</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(item.created_at)}</TableCell>
                  <TableCell><ActionButtons item={item} /></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                  {t("no_data_found") || "Məlumat tapılmadı"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Mobile cards */}
      {isMobile && (
        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)
          ) : items.length > 0 ? (
            items.map((item) => (
              <Card key={item.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.user.name} {item.user.surname}</p>
                    <p className="text-xs text-gray-500">{item.user.email}</p>
                  </div>
                  <span className="font-mono font-bold tracking-wider text-primary">{item.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.is_active
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t("active") || "Aktiv"}</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t("inactive") || "Deaktiv"}</span>}
                  {item.is_custom && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t("custom") || "Xüsusi"}</span>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                  <ActionButtons item={item} />
                </div>
              </Card>
            ))
          ) : (
            <div className="py-10 text-center text-gray-500">{t("no_data_found") || "Məlumat tapılmadı"}</div>
          )}
        </div>
      )}

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modal.type === "edit"}
        onClose={() => setModal({ type: null })}
        title={t("edit_code") || "Kodu Dəyiş"}
        size="sm"
      >
        {modal.type === "edit" && (
          <Edit
            id={modal.data.id}
            currentCode={modal.data.code}
            onClose={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === "delete"}
        onClose={() => setModal({ type: null })}
        title={t("delete_code") || "Kodu Sil"}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModal({ type: null })}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>
    </div>
  );
}
