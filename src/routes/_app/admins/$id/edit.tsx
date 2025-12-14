import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/utils/translationLoader";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MultiSelect } from "@/components/ui/multi-select";

export const Route = createFileRoute("/_app/admins/$id/edit")({
  component: EditAdminComponent,
});

interface Role {
  id: string;
  name: string;
}

function EditAdminComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const [showPassword, setShowPassword] = useState(false);

  // Zod validation schema (password is optional for edit)
  const schema = z.object({
    username: z.string().min(1, t("required_field")),
    email: z.string().email(t("invalid_email")).min(1, t("required_field")),
    password: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // Empty password is allowed
          return (
            val.length >= 8 &&
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
              val,
            )
          );
        },
        {
          message: t("password_requirements"),
        },
      ),
    roles: z.array(z.string()).min(1, t("required_field")),
    name: z.string().min(1, t("required_field")),
    surname: z.string().min(1, t("required_field")),
  });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      roles: [],
      name: "",
      surname: "",
    },
  });

  // Fetch admin data
  const {
    data: admin,
    isLoading: adminLoading,
    error: adminError,
  } = useQuery({
    queryKey: ["admin", id],
    queryFn: async () => {
      const res = await controlPrivateApi.get(`/admins/show/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Fetch roles using TanStack Query
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await controlPrivateApi.get("/roles/list");
      return res.data.data;
    },
  });

  // Update admin mutation
  const updateAdminMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const submitData = { ...data };
      // Remove password if it's empty
      if (!submitData.password) {
        delete submitData.password;
      }
      const res = await controlPrivateApi.post(
        `/admins/update/${id}`,
        submitData,
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      router.navigate({ to: "/admins" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });

  // Reset form when admin data is loaded
  useEffect(() => {
    if (admin) {
      reset({
        username: admin.username,
        email: admin.email,
        password: "",
        roles: admin.roles.map((roleId: string | number) => String(roleId)),
        name: admin.name,
        surname: admin.surname,
      });
    }
  }, [admin, reset]);

  useEffect(() => {
    if (adminError) {
      toast.error("Failed to load admin data");
      router.navigate({ to: "/admins" });
    }
  }, [adminError, router]);

  useEffect(() => {
    if (rolesError) {
      toast.error("Failed to load roles");
    }
  }, [rolesError]);

  const onSubmit = (data: FormData) => {
    updateAdminMutation.mutate(data);
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Transform roles for MultiSelect component
  const roleOptions = roles.map((role: Role) => ({
    value: String(role.id),
    label: role.name,
  }));

  if (adminLoading) {
    return (
      <div className="w-full flex flex-col gap-5 pt-5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/admins" })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Button>
          <h1 className="text-2xl font-bold">{t("edit_admin")}</h1>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 pt-5">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/admins" })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("edit_admin")}</h1>
      </div>

      <div className="max-w-2xl mt-5 w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    id="username"
                    {...field}
                    placeholder={t("username")}
                    className={errors.username ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.username && (
                <p className="text-red-500 text-sm">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    id="email"
                    type="email"
                    {...field}
                    placeholder={t("email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="name"
                    {...field}
                    placeholder={t("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Surname */}
            <div className="space-y-2">
              <Label htmlFor="surname">{t("surname")}</Label>
              <Controller
                name="surname"
                control={control}
                render={({ field }) => (
                  <Input
                    id="surname"
                    {...field}
                    placeholder={t("surname")}
                    className={errors.surname ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.surname && (
                <p className="text-red-500 text-sm">{errors.surname.message}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...field}
                    placeholder={t("leave_empty_if_no_change")}
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                )}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {t("leave_empty_if_no_change")}
            </p>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label htmlFor="roles">{t("select_roles")}</Label>
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={roleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("select_roles")}
                  disabled={rolesLoading}
                  className={errors.roles ? "border-red-500" : ""}
                />
              )}
            />
            {errors.roles && (
              <p className="text-red-500 text-sm">{errors.roles.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={updateAdminMutation.isPending}
              className="min-w-[200px]"
            >
              {updateAdminMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("saving")}
                </div>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
