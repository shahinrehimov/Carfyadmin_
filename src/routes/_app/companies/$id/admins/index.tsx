import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useMediaQuery } from "@uidotdev/usehooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  useCompanyAdmins,
  useDeleteCompanyAdmin,
  useToggleCompanyAdminStatus,
  type CompanyAdmin,
} from "@/lib/queries/company-admins";
import { useCompany } from "@/lib/queries/companies";
import AddCompanyAdmin from "./-popups/Add";
import EditCompanyAdmin from "./-popups/Edit";

export const Route = createFileRoute("/_app/companies/$id/admins/")({
  component: CompanyAdminsComponent,
});

function CompanyAdminsComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const companyId = Number(id);
  const isMobileView = useMediaQuery("(width<48rem)");

  // State for filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  // State for modals
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(0);
  const [draftData, setDraftData] = useState<CompanyAdmin | null>(null);

  // Queries and mutations
  const { data: companyData } = useCompany(companyId);
  const { data, isLoading, error } = useCompanyAdmins(companyId, filters);
  const deleteAdminMutation = useDeleteCompanyAdmin(companyId);
  const toggleStatusMutation = useToggleCompanyAdminStatus(companyId);

  const admins = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  // Handlers
  const handleToggleStatus = async (admin: CompanyAdmin) => {
    if (admin.is_root) {
      toast.error(t("cannot_change_root_admin_status"));
      return;
    }

    try {
      await toggleStatusMutation.mutateAsync({
        adminId: admin.id,
        isActive: admin.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleDelete = async () => {
    if (!draftData) return;

    if (draftData.is_root) {
      toast.error(t("cannot_delete_root_admin"));
      return;
    }

    try {
      await deleteAdminMutation.mutateAsync(draftData.id);
      toast.success(t("admin_deleted_successfully"));
      setDraftData(null);
      setModal(0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_admin"));
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: newLimit,
    }));
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search,
    }));
  };

  const popups = [
    null,
    {
      title: t("delete_admin"),
      element: (
        <DeleteModal
          closeModal={() => setModal(0)}
          handleDelete={handleDelete}
          pending={deleteAdminMutation.isPending}
        />
      ),
    },
    {
      title: t("add_admin"),
      element: (
        <AddCompanyAdmin companyId={companyId} closeModal={() => setModal(0)} />
      ),
    },
    {
      title: t("edit_admin"),
      element: draftData ? (
        <EditCompanyAdmin
          companyId={companyId}
          admin={draftData}
          closeModal={() => setModal(0)}
        />
      ) : null,
    },
  ];

  useEffect(() => {
    setOpen(modal ? true : false);
  }, [modal]);

  useEffect(() => {
    if (!open) {
      setModal(0);
    }
  }, [open]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="p-4 border-b">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded"></div>
            </div>
            <div className="flex justify-end gap-2">
              <div className="h-8 w-8 bg-gray-300 rounded"></div>
              <div className="h-8 w-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // No data component
  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <h6 className="text-lg font-medium text-muted-foreground">
        {t("no_data_found")}
      </h6>
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <div className="rounded-sm border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="font-medium w-16">#</TableHead>
            <TableHead className="font-medium">{t("full_name")}</TableHead>
            <TableHead className="font-medium">{t("username")}</TableHead>
            <TableHead className="font-medium">{t("email")}</TableHead>
            <TableHead className="font-medium">{t("role")}</TableHead>
            <TableHead className="font-medium">{t("status")}</TableHead>
            <TableHead className="font-medium">{t("created_by")}</TableHead>
            <TableHead className="font-medium">{t("created_date")}</TableHead>
            <TableHead className="font-medium text-center w-32">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-4"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-6 bg-gray-300 rounded w-10"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"></div>
                </TableCell>
                <TableCell>
                  <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"></div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
                    <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : admins.length > 0 ? (
            admins.map((admin, index) => (
              <TableRow
                key={admin.id}
                className="border-b last:border-b-0 hover:bg-muted/50"
              >
                <TableCell>
                  {filters.page * perPage - perPage + index + 1}.
                </TableCell>
                <TableCell className="font-medium">{admin.full_name}</TableCell>
                <TableCell>{admin.username}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  {admin.is_root ? (
                    <Badge variant="default" className="bg-purple-600">
                      {t("root_admin")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("admin")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={admin.is_active}
                    onCheckedChange={() => handleToggleStatus(admin)}
                    disabled={toggleStatusMutation.isPending || admin.is_root}
                  />
                </TableCell>
                <TableCell>{admin.created_user || "-"}</TableCell>
                <TableCell>{admin.created_date}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      }
                      aria-label={t("edit")}
                      onClick={() => {
                        setDraftData(admin);
                        setModal(3);
                      }}
                    />
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-red-500" />}
                      aria-label={t("delete")}
                      disabled={admin.is_root}
                      onClick={() => {
                        if (admin.is_root) {
                          toast.error(t("cannot_delete_root_admin"));
                          return;
                        }
                        setDraftData(admin);
                        setModal(1);
                      }}
                    />
                  </div>
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
    </div>
  );

  // Mobile card view
  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingSkeleton />
      ) : admins.length > 0 ? (
        admins.map((admin, index) => (
          <div
            key={admin.id}
            className="bg-card border rounded-lg p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {filters.page * perPage - perPage + index + 1}.{" "}
                {admin.full_name}
              </span>
              {admin.is_root ? (
                <Badge variant="default" className="bg-purple-600">
                  {t("root_admin")}
                </Badge>
              ) : (
                <Badge variant="secondary">{t("admin")}</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("username")}:
                </span>
                <p className="text-foreground">{admin.username}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("email")}:
                </span>
                <p className="text-foreground">{admin.email}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("created_by")}:
                </span>
                <p className="text-foreground">{admin.created_user || "-"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("created_date")}:
                </span>
                <p className="text-foreground">{admin.created_date}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <Switch
                checked={admin.is_active}
                onCheckedChange={() => handleToggleStatus(admin)}
                disabled={toggleStatusMutation.isPending || admin.is_root}
              />
              <div className="flex items-center gap-2">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="w-4 h-4 text-muted-foreground" />}
                  aria-label={t("edit")}
                  onClick={() => {
                    setDraftData(admin);
                    setModal(3);
                  }}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4 text-red-500" />}
                  aria-label={t("delete")}
                  disabled={admin.is_root}
                  onClick={() => {
                    if (admin.is_root) {
                      toast.error(t("cannot_delete_root_admin"));
                      return;
                    }
                    setDraftData(admin);
                    setModal(1);
                  }}
                />
              </div>
            </div>
          </div>
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
          <p className="text-red-600">{t("error_loading_company_admins")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 pt-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/companies" })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {t("company_admins")} -{" "}
          {companyData?.translations?.[0]?.title || `${t("company")} #${id}`}
        </h1>
        <div className="ml-auto">
          <Button
            onClick={() => setModal(2)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("new_admin")}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={popups[modal]?.title}
      >
        {popups[modal]?.element}
      </Modal>

      {/* Search Input */}
      <div className="w-full max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("search")}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        {isMobileView ? <MobileView /> : <DesktopView />}
      </div>

      {/* Pagination */}
      {!isLoading && admins.length > 0 && (
        <div className="flex items-center justify-end">
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            pageSize={perPage}
            totalItems={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handleLimitChange}
          />
        </div>
      )}
    </div>
  );
}
