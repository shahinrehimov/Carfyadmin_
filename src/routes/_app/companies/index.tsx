import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Edit as EditIcon,
  Plus,
  Trash2,
  CheckCircle,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
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
import {
  useCompanies,
  useDeleteCompany,
  useToggleCompanyStatus,
  useVerifyCompany,
  type Company,
} from "@/lib/queries/companies";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";

export const Route = createFileRoute("/_app/companies/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [draftData, setDraftData] = useState<Company | null>(null);

  // Queries and mutations
  const { data, isLoading, error } = useCompanies(filters);
  const deleteCompanyMutation = useDeleteCompany();
  const toggleStatusMutation = useToggleCompanyStatus();
  const verifyCompanyMutation = useVerifyCompany();

  const companies = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  // Handlers
  const handleToggleStatus = async (company: Company) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: company.id,
        isActive: company.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_update_status"),
      );
    }
  };

  const handleVerify = async () => {
    if (!draftData) return;

    try {
      await verifyCompanyMutation.mutateAsync(draftData.id);
      toast.success(t("company_verified_successfully"));
      setDraftData(null);
      setModal(0);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_verify_company"),
      );
    }
  };

  const handleDelete = async () => {
    if (!draftData) return;

    try {
      await deleteCompanyMutation.mutateAsync(draftData.id);
      toast.success(t("company_deleted_successfully"));
      setDraftData(null);
      setModal(0);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_delete_company"),
      );
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
      title: t("delete_company"),
      element: (
        <DeleteModal
          closeModal={() => setModal(0)}
          handleDelete={handleDelete}
          pending={deleteCompanyMutation.isPending}
        />
      ),
    },
    {
      title: t("verify_company"),
      element: (
        <div className="space-y-4">
          <p className="text-center">
            {t("are_you_sure_you_want_to_verify_this_company")}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setModal(0)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifyCompanyMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {verifyCompanyMutation.isPending ? t("verifying") : t("verify")}
            </Button>
          </div>
        </div>
      ),
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
            <TableHead className="font-medium">{t("title")}</TableHead>
            <TableHead className="font-medium">{t("voen")}</TableHead>
            <TableHead className="font-medium">{t("email")}</TableHead>
            <TableHead className="font-medium">{t("phone")}</TableHead>
            <TableHead className="font-medium">{t("verified")}</TableHead>
            <TableHead className="font-medium">{t("status")}</TableHead>
            <TableHead className="font-medium">{t("created_date")}</TableHead>
            <TableHead className="font-medium text-center w-48">
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
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
                    <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
                    <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : companies.length > 0 ? (
            companies.map((company, index) => (
              <TableRow
                key={company.id}
                className="border-b last:border-b-0 hover:bg-muted/50"
              >
                <TableCell>
                  {filters.page * perPage - perPage + index + 1}.
                </TableCell>
                <TableCell className="font-medium">{company.title}</TableCell>
                <TableCell>{company.voen}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>{company.phone}</TableCell>
                <TableCell>
                  {company.is_verified ? (
                    <Badge variant="default" className="bg-green-600">
                      {t("verified")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("not_verified")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={company.is_active}
                    onCheckedChange={() => handleToggleStatus(company)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </TableCell>
                <TableCell>{company.created_date}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {!company.is_verified && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        }
                        aria-label={t("verify_company")}
                        onClick={() => {
                          setDraftData(company);
                          setModal(2);
                        }}
                      />
                    )}
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={
                        <EditIcon className="w-4 h-4 text-muted-foreground" />
                      }
                      aria-label={t("edit")}
                      onClick={() => {
                        navigate({
                          to: "/companies/$id/edit",
                          params: { id: String(company.id) },
                        });
                      }}
                    />
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={<Users className="w-4 h-4 text-blue-600" />}
                      aria-label={t("company_admins")}
                      onClick={() => {
                        navigate({
                          to: "/companies/$id/admins",
                          params: { id: String(company.id) },
                        });
                      }}
                    />
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-red-500" />}
                      aria-label={t("delete")}
                      onClick={() => {
                        setDraftData(company);
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
      ) : companies.length > 0 ? (
        companies.map((company, index) => (
          <div
            key={company.id}
            className="bg-card border rounded-lg p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {filters.page * perPage - perPage + index + 1}. {company.title}
              </span>
              {company.is_verified ? (
                <Badge variant="default" className="bg-green-600">
                  {t("verified")}
                </Badge>
              ) : (
                <Badge variant="secondary">{t("not_verified")}</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("voen")}:
                </span>
                <p className="text-foreground">{company.voen}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("email")}:
                </span>
                <p className="text-foreground">{company.email}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("phone")}:
                </span>
                <p className="text-foreground">{company.phone}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  {t("created_date")}:
                </span>
                <p className="text-foreground">{company.created_date}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <Switch
                checked={company.is_active}
                onCheckedChange={() => handleToggleStatus(company)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex items-center gap-2">
                {!company.is_verified && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<CheckCircle className="w-4 h-4 text-green-600" />}
                    aria-label={t("verify_company")}
                    onClick={() => {
                      setDraftData(company);
                      setModal(2);
                    }}
                  />
                )}
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<EditIcon className="w-4 h-4 text-muted-foreground" />}
                  aria-label={t("edit")}
                  onClick={() => {
                    navigate({
                      to: "/companies/$id/edit",
                      params: { id: String(company.id) },
                    });
                  }}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Users className="w-4 h-4 text-blue-600" />}
                  aria-label={t("company_admins")}
                  onClick={() => {
                    navigate({
                      to: "/companies/$id/admins",
                      params: { id: String(company.id) },
                    });
                  }}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4 text-red-500" />}
                  aria-label={t("delete")}
                  onClick={() => {
                    setDraftData(company);
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
          <p className="text-red-600">{t("error_loading_companies")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("companies")}</h1>
        <Button
          onClick={() => navigate({ to: "/companies/add" })}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("new_company")}
        </Button>
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
      {!isLoading && companies.length > 0 && (
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
