import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useCreateCompanyAdmin } from "@/lib/queries/company-admins";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/passwordInput";

interface AddCompanyAdminProps {
  companyId: number;
  closeModal: () => void;
}

export default function AddCompanyAdmin({
  companyId,
  closeModal,
}: AddCompanyAdminProps) {
  const { t } = useTranslation();
  const createMutation = useCreateCompanyAdmin(companyId);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
    name: "",
    surname: "",
    is_root: false,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!formData.password) {
      newErrors.password = t("password_is_required");
    } else if (formData.password.length < 6) {
      newErrors.password = t("password_must_be_at_least_6_characters");
    }
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = t("password_confirmation_is_required");
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = t("passwords_do_not_match");
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
      await createMutation.mutateAsync(formData);
      toast.success(t("admin_created_successfully"));
      closeModal();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t("failed_to_create_admin");
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">
            {t("password")} <span className="text-red-500">*</span>
          </Label>
          <PasswordInput
            id="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder={t("enter_password")}
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password_confirmation">
            {t("confirm_password")} <span className="text-red-500">*</span>
          </Label>
          <PasswordInput
            id="password_confirmation"
            value={formData.password_confirmation}
            onChange={(e) =>
              handleChange("password_confirmation", e.target.value)
            }
            placeholder={t("confirm_password")}
            className={errors.password_confirmation ? "border-red-500" : ""}
          />
          {errors.password_confirmation && (
            <p className="text-sm text-red-500">
              {errors.password_confirmation}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
        <div className="flex items-center gap-3">
          <Label htmlFor="is_root" className="cursor-pointer">
            {t("root_admin")}
          </Label>
          <Switch
            id="is_root"
            checked={formData.is_root}
            onCheckedChange={(checked) => handleChange("is_root", checked)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="is_active" className="cursor-pointer">
            {t("active")}
          </Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleChange("is_active", checked)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={closeModal}
          disabled={createMutation.isPending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? t("creating") : t("create")}
        </Button>
      </div>
    </form>
  );
}

