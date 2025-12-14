import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import EditTranslation from "./-popups/Edit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import {
  useDeleteTranslation,
  useTranslations,
} from "@/lib/queries/translations";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/translations/")({
  component: RouteComponent,
});

interface Translation {
  key: string;
  group: string;
  [key: string]: string; // For dynamic language fields like lang_en, lang_fr, etc.
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State for filters and pagination
  const [filters, setFilters] = useState({
    group: "",
    keyword: "",
    text: "",
  });

  // State for modals
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: Translation;
  }>({ type: null });

  // Queries and mutations
  const { data, isLoading, error } = useTranslations(filters);
  const deleteTranslationMutation = useDeleteTranslation();

  const translations = data?.data.translations || [];
  const languages = data?.data.languages || [];

  // Handlers
  const handleSearch = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      group: "",
      keyword: "",
      text: "",
    });
  };

  const handleDelete = async () => {
    if (!modalState.data) return;

    try {
      await deleteTranslationMutation.mutateAsync({
        group: modalState.data.group,
        key: modalState.data.key,
      });
      toast.success("Translation deleted successfully");
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete translation",
      );
    }
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  // Scroll to hash on load
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - 100;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 1000);
    }
  }, [translations]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 border-b animate-pulse"
        >
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // No data component
  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-gray-500 text-lg">{t("no_data_found")}</p>
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <div className="overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("key")}</TableHead>
            {languages.map((lang) => (
              <TableHead key={lang.id} className="max-w-[300px]">
                {t("translation")} {lang.key}
              </TableHead>
            ))}
            <TableHead>{t("group")}</TableHead>
            <TableHead className="w-[120px] sticky right-0 bg-white dark:bg-[#171717] border-l">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                {languages.map((lang) => (
                  <TableCell key={lang.id}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                ))}
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="sticky right-0 bg-white dark:bg-[#171717] border-l">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : translations.length > 0 ? (
            translations.map((translation) => (
              <TableRow
                key={translation.key + translation.group}
                id={translation.key}
              >
                <TableCell className="font-medium">{translation.key}</TableCell>
                {languages.map((lang) => (
                  <TableCell key={lang.id} className="max-w-[400px]">
                    <div className="truncate">
                      {translation[`lang_${lang.key}`] || ""}
                    </div>
                  </TableCell>
                ))}
                <TableCell>{translation.group}</TableCell>
                <TableCell className="sticky right-0 bg-white dark:bg-[#171717] border-l">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalState({ type: "edit", data: translation })
                      }
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalState({ type: "delete", data: translation })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={languages.length + 3}
                className="text-center py-8"
              >
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
      ) : translations.length > 0 ? (
        translations.map((translation) => (
          <Card key={translation.key + translation.group} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-wrap whitespace-normal break-all">
                  {translation.key}
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {translation.group}
                </span>
              </div>

              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div className="text-xs text-gray-500 mb-1">
                      {t("translation")} ({lang.key})
                    </div>
                    <div className="text-sm">
                      {translation[`lang_${lang.key}`] || ""}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setModalState({ type: "edit", data: translation })
                  }
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setModalState({ type: "delete", data: translation })
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                  Delete
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

  const modalContent = {
    add: {
      title: t("add"),
      component: <Add languages={languages} onClose={closeModal} />,
    },
    edit: {
      title: t("edit"),
      component: (
        <EditTranslation
          languages={languages}
          defaultData={modalState.data}
          onClose={closeModal}
        />
      ),
    },
    delete: {
      title: "",
      component: (
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteTranslationMutation.isPending}
        />
      ),
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t("translations")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("new_key")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder={t("keyword")}
            value={filters.keyword}
            onChange={(e) => handleSearch("keyword", e.target.value)}
          />
          <Input
            placeholder={t("text")}
            value={filters.text}
            onChange={(e) => handleSearch("text", e.target.value)}
          />
          <Select
            value={filters.group}
            onValueChange={(value) => handleSearch("group", value)}
            options={[
              { value: "", label: "All Groups" },
              { value: "admin", label: "Admin" },
              { value: "app", label: "App" },
            ]}
            placeholder={t("group")}
          />
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>

      {/* Content */}
      <Card className="p-6">
        {error ? (
          <div className="text-center py-8 text-red-500">
            Error loading translations
          </div>
        ) : isMobile ? (
          <MobileView />
        ) : (
          <DesktopView />
        )}
      </Card>

      {/* Modal */}
      {modalState.type && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={modalContent[modalState.type].title}
          size="lg"
        >
          {modalContent[modalState.type].component}
        </Modal>
      )}
    </div>
  );
}
