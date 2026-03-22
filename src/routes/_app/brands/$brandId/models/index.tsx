import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import AddModel from "../../-popups/AddModel";
import EditModel from "../../-popups/EditModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBrandModels,
  useDeleteBrandModel,
  type BrandModelListItem,
} from "@/lib/queries/brandModels";
import { useBrand } from "@/lib/queries/brands";
import { useLangs } from "@/lib/queries/langs";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useTranslationStore } from "@/store/translations";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/brands/$brandId/models/")({
  component: RouteComponent,
});

type BrandShowResponse = {
  title?: string;
  slug?: string;
  translations?: Array<{ language_id: number; title: string }>;
};

function brandHeadingTitle(
  brand: BrandShowResponse | undefined,
  currentLangKey: string,
  langs: Array<{ id: number; key: string }>,
): string {
  if (!brand) return "…";
  if (typeof brand.title === "string" && brand.title.trim() !== "") {
    return brand.title;
  }
  const tr = brand.translations;
  if (tr?.length) {
    const langId = langs.find((l) => l.key === currentLangKey)?.id;
    const forLang =
      langId != null ? tr.find((x) => x.language_id === langId) : undefined;
    return forLang?.title ?? tr[0]?.title ?? brand.slug ?? "…";
  }
  return brand.slug ?? "…";
}

function RouteComponent() {
  const { t } = useTranslation();
  const currentLang = useTranslationStore((s) => s.currentLang);
  const { data: langs = [] } = useLangs();
  const { brandId: brandIdParam } = useParams({
    from: "/_app/brands/$brandId/models/",
  });
  const navigate = useNavigate();
  const brandId = parseInt(brandIdParam, 10);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
  });

  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: BrandModelListItem;
  }>({ type: null });

  const { data: brand } = useBrand(brandId);
  const brandTitle = brandHeadingTitle(
    brand as BrandShowResponse | undefined,
    currentLang,
    langs,
  );
  const { data, isLoading, error } = useBrandModels(brandId, filters);
  const deleteModelMutation = useDeleteBrandModel(brandId);

  const models = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage) || 1;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      const res = await deleteModelMutation.mutateAsync(modalState.data.id);
      toast.success(res.message || t("model_deleted_successfully"));
      setModalState({ type: null });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("failed_to_delete_model"));
    }
  };

  const closeModal = () => setModalState({ type: null });

  const handleGoBack = () => {
    navigate({ to: "/brands" });
  };

  const LoadingSkeleton = () => (
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
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-gray-200"></div>
            <div className="h-8 w-8 rounded bg-gray-200"></div>
          </div>
        </div>
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
          <TableHead>{t("title")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead className="w-[150px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(5)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : models.length > 0 ? (
          models.map((model, index) => (
            <TableRow key={model.id}>
              <TableCell>
                {filters.page * perPage - perPage + index + 1}
              </TableCell>
              <TableCell className="font-medium">{model.title}</TableCell>
              <TableCell>{model.created_user ?? "—"}</TableCell>
              <TableCell>{model.created_date ?? "—"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "edit", data: model })
                    }
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "delete", data: model })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5}>
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
        <LoadingSkeleton />
      ) : models.length > 0 ? (
        models.map((model, index) => (
          <Card key={model.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium">
                  {filters.page * perPage - perPage + index + 1}. {model.title}
                </h3>
                {model.created_user != null && (
                  <p className="mt-1 text-sm text-gray-600">
                    {t("created_by")}: {model.created_user}
                  </p>
                )}
                {model.created_date != null && (
                  <p className="text-sm text-gray-600">
                    {t("created_date")}: {model.created_date}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "edit", data: model })}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setModalState({ type: "delete", data: model })
                  }
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

  if (Number.isNaN(brandId)) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <p className="text-red-600">{t("an_error_occurred")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <p className="text-red-600">{t("error_loading_models")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {t("brand_models")} — {brandTitle}
          </h1>
        </div>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_model")}
        </Button>
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
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_model")}
        size="lg"
      >
        <AddModel brandId={brandId} onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_model")}
        size="lg"
      >
        {modalState.data && (
          <EditModel
            brandId={brandId}
            modelId={modalState.data.id}
            onClose={closeModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_model")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteModelMutation.isPending}
        />
      </Modal>
    </div>
  );
}
