import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2, BarChart2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import Clicks from "./-popups/Clicks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
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
  useAdvertisements,
  useDeleteAdvertisement,
  useToggleAdvertisementStatus,
  type Advertisement,
} from "@/lib/queries/advertisements";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/advertisements/")({
  component: RouteComponent,
});

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "site", label: "Site" },
  { value: "app", label: "App" },
  { value: "both", label: "Both" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function PlatformBadge({ platform }: { platform: string }) {
  switch (platform) {
    case "site":
      return <Badge variant="info">Site</Badge>;
    case "app":
      return <Badge variant="secondary">App</Badge>;
    default:
      return <Badge variant="default">Both</Badge>;
  }
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    platform: "",
    is_active: undefined as boolean | undefined,
  });

  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | "clicks" | null;
    data?: Advertisement;
  }>({ type: null });

  const { data, isLoading, error } = useAdvertisements({
    page: filters.page,
    search: filters.search || undefined,
    platform: filters.platform || undefined,
    is_active: filters.is_active,
  });

  const deleteAdvertisementMutation = useDeleteAdvertisement();
  const toggleStatusMutation = useToggleAdvertisementStatus();

  const advertisements = data?.data || [];
  const total = data?.meta.total || 0;
  const lastPage = data?.meta.last_page || 1;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (advertisement: Advertisement) => {
    try {
      await toggleStatusMutation.mutateAsync(advertisement.id);
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
      await deleteAdvertisementMutation.mutateAsync(modalState.data.id);
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const closeModal = () => setModalState({ type: null });

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
          <TableHead>{t("platform")}</TableHead>
          <TableHead>{t("dates")}</TableHead>
          <TableHead className="w-[80px]">{t("status")}</TableHead>
          <TableHead className="w-[80px]">{t("live")}</TableHead>
          <TableHead className="w-[80px]">{t("clicks")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead className="w-[120px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(10)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : advertisements.length > 0 ? (
          advertisements.map((ad, index) => (
            <TableRow key={ad.id}>
              <TableCell>
                {(filters.page - 1) * 10 + index + 1}
              </TableCell>
              <TableCell>
                {ad.image_url ? (
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{ad.title}</p>
                  <p className="text-xs text-gray-500 font-mono">{ad.key}</p>
                </div>
              </TableCell>
              <TableCell>
                <PlatformBadge platform={ad.platform} />
              </TableCell>
              <TableCell className="text-sm">
                <div>
                  <p>{ad.start_date}</p>
                  <p className="text-gray-500">{ad.end_date}</p>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={ad.is_active}
                  onCheckedChange={() => handleToggleStatus(ad)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>
                {ad.is_currently_active ? (
                  <Badge variant="success">{t("live")}</Badge>
                ) : (
                  <Badge variant="outline">{t("inactive")}</Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="font-semibold">{ad.click_count}</span>
              </TableCell>
              <TableCell>{ad.created_user}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "clicks", data: ad })
                    }
                    title={t("clicks")}
                  >
                    <BarChart2 className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "edit", data: ad })}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: ad })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={10}>
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
            </div>
          ))}
        </div>
      ) : advertisements.length > 0 ? (
        advertisements.map((ad) => (
          <Card key={ad.id} className="p-4">
            <div className="flex items-start gap-4">
              {ad.image_url ? (
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-16 w-16 text-gray-400" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{ad.title}</h3>
                <p className="text-xs text-gray-500 font-mono">{ad.key}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <PlatformBadge platform={ad.platform} />
                  {ad.is_currently_active ? (
                    <Badge variant="success">{t("live")}</Badge>
                  ) : (
                    <Badge variant="outline">{t("inactive")}</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {ad.start_date} → {ad.end_date}
                </p>
                <p className="text-sm text-gray-500">
                  {t("clicks")}: {ad.click_count}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={ad.is_active}
                onCheckedChange={() => handleToggleStatus(ad)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "clicks", data: ad })}
                >
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "edit", data: ad })}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "delete", data: ad })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
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
          <p className="text-red-600">{t("an_error_occurred")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("advertisements")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_advertisement")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder={t("search")}
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={filters.platform}
            onValueChange={(val) =>
              setFilters((prev) => ({ ...prev, platform: val, page: 1 }))
            }
            options={PLATFORM_OPTIONS}
            placeholder="Platform"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={
              filters.is_active === undefined
                ? ""
                : String(filters.is_active)
            }
            onValueChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                is_active: val === "" ? undefined : val === "true",
                page: 1,
              }))
            }
            options={STATUS_OPTIONS}
            placeholder="Status"
          />
        </div>
      </div>

      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={filters.page}
        totalPages={lastPage}
        pageSize={10}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_advertisement")}
        size="lg"
      >
        <Add onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_advertisement")}
        size="lg"
      >
        {modalState.data && (
          <Edit advertisementId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "clicks"}
        onClose={closeModal}
        title={`${t("clicks")} — ${modalState.data?.title ?? ""}`}
        size="lg"
      >
        {modalState.data && <Clicks advertisement={modalState.data} />}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_advertisement")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteAdvertisementMutation.isPending}
        />
      </Modal>
    </div>
  );
}
