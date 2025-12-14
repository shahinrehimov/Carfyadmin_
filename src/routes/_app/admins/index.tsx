import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { toast } from "sonner";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import { Pagination } from "@/components/ui/pagination";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/admins/")({
  component: RouteComponent,
});

interface Admin {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  created_date: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
}

interface Filters {
  page: number;
  limit: number;
  search: string;
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobileView = useMediaQuery("(width<48rem)");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 10,
    search: "",
  });

  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(0);
  const [draftData, setDraftData] = useState<Admin | null>(null);

  const {
    data = { list: [], total: 0 },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admins", filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
      const res = await controlPrivateApi.get(
        `/admins/load?${queryParams.toString()}`,
      );
      return {
        list: res.data.data,
        total: res.data.meta.total,
      };
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await controlPrivateApi.delete(`/admins/delete/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setDraftData(null);
      setModal(0);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load admins");
    }
  }, [error]);

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

  const deleteRow = async () => {
    if (!draftData) return;
    deleteMutation.mutate(draftData.id);
  };

  const popups = [
    null,
    {
      title: t("delete_confirmation"),
      element: (
        <DeleteModal
          closeModal={() => setModal(0)}
          handleDelete={deleteRow}
          pending={deleteMutation.isPending}
        />
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

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <h6 className="text-lg font-medium text-muted-foreground">
        {t("no_data_found")}
      </h6>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-5 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admins")}</h1>
        <Button
          onClick={() => router.navigate({ to: "/admins/add" })}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("new_admin")}
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

      <div className="w-full">
        {isMobileView ? (
          <div className="space-y-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : data.list.length > 0 ? (
              data.list.map((admin: Admin, i: number) => (
                <div
                  key={admin.id}
                  className="bg-card border rounded-lg p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {filters.page * filters.limit - filters.limit + i + 1}.{" "}
                      {admin.name} {admin.surname}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {t("email")}:
                      </span>
                      <p className="text-foreground">{admin.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {t("username")}:
                      </span>
                      <p className="text-foreground">{admin.username}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {t("role")}:
                      </span>
                      <p className="text-foreground">
                        {admin.roles.map((role) => role.name).join(", ")}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {t("created_date")}:
                      </span>
                      <p className="text-foreground">{admin.created_date}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      }
                      aria-label={t("edit")}
                      onClick={() => {
                        router.navigate({ to: `/admins/${admin.id}/edit` });
                      }}
                    />
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4 text-red-500" />}
                      aria-label={t("delete")}
                      onClick={() => {
                        setDraftData(admin);
                        setModal(1);
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <NoData />
            )}
          </div>
        ) : (
          <div className="rounded-sm border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="font-medium w-16">#</TableHead>
                  <TableHead className="font-medium">{t("admin")}</TableHead>
                  <TableHead className="font-medium">{t("email")}</TableHead>
                  <TableHead className="font-medium">{t("username")}</TableHead>
                  <TableHead className="font-medium">{t("role")}</TableHead>
                  <TableHead className="font-medium">
                    {t("created_date")}
                  </TableHead>
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
                ) : data.list.length > 0 ? (
                  data.list.map((admin: Admin, i: number) => (
                    <TableRow
                      key={admin.id}
                      className="border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <TableCell>
                        {filters.page * filters.limit - filters.limit + i + 1}.
                      </TableCell>
                      <TableCell className="font-medium">
                        {admin.name} {admin.surname}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.username}</TableCell>
                      <TableCell>
                        {admin.roles.map((role) => role.name).join(", ")}
                      </TableCell>
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
                              router.navigate({
                                to: `/admins/${admin.id}/edit`,
                              });
                            }}
                          />
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4 text-red-500" />}
                            aria-label={t("delete")}
                            onClick={() => {
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
                    <TableCell colSpan={7}>
                      <NoData />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!isLoading && data.list.length > 0 && (
        <div className="flex items-center justify-end">
          <Pagination
            currentPage={filters.page}
            totalPages={Math.ceil(data.total / filters.limit)}
            pageSize={filters.limit}
            totalItems={data.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handleLimitChange}
          />
        </div>
      )}
    </div>
  );
}
