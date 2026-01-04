import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/utils/translationLoader";
import {
  useUpdateCompanyAdmin,
  type CompanyAdmin,
} from "@/lib/queries/company-admins";
import { toast } from "sonner";

interface EditCompanyAdminProps {
  companyId: number;
  admin: CompanyAdmin;
  closeModal: () => void;
}

export default function EditCompanyAdmin({
  companyId,
  admin,
  closeModal,
}: EditCompanyAdminProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateCompanyAdmin(companyId);

  const [formData, setFormData] = useState({
    username: admin.username,
    email: admin.email,
    name: admin.name,
    surname: admin.surname,
    is_active: admin.is_active,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      username: admin.username,
      email: admin.email,
      name: admin.name,
      surname: admin.surname,
      is_active: admin.is_active,
    });
  }, [admin]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t("username_is_required");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("email_is_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("invalid_email_format");
    }
    if (!formData.name.trim()) {
      newErrors.name = t("name_is_required");
    }
    if (!formData.surname.trim()) {
      newErrors.surname = t("surname_is_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        adminId: admin.id,
        data: formData,
      });
      toast.success(t("admin_updated_successfully"));
      closeModal();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t("failed_to_update_admin");
      toast.error(errorMessage);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">
            {t("username")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder={t("enter_username")}
            className={errors.username ? "border-red-500" : ""}
          />
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            {t("email")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder={t("enter_email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            {t("name")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t("enter_name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">
            {t("surname")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="surname"
            value={formData.surname}
            onChange={(e) => handleChange("surname", e.target.value)}
            placeholder={t("enter_surname")}
            className={errors.surname ? "border-red-500" : ""}
          />
          {errors.surname && (
            <p className="text-sm text-red-500">{errors.surname}</p>
          )}
        </div>
      </div>

      {admin.is_root && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          {t("root_admin_note")}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t">
        <Label htmlFor="is_active" className="cursor-pointer">
          {t("active")}
        </Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleChange("is_active", checked)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={closeModal}
          disabled={updateMutation.isPending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("updating") : t("update")}
        </Button>
      </div>
    </form>
  );
}

