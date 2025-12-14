import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRedirectBack } from "./-utils";
import { controlApi } from "@/lib/axios/controlApi";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/themes/provider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/utils/translationLoader";
const loginPageSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/signin")({
  component: RouteComponent,
  validateSearch: zodValidator(loginPageSchema),
});

const LoginFormSchema = z.object({
  username: z
    .string({ message: "Email or username is required" })
    .min(1, "Email or username is required"),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});
type LoginFormSchema = z.infer<typeof LoginFormSchema>;

function RouteComponent() {
  const searchParams = Route.useSearch();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const redirect = useRedirectBack(searchParams.redirect);

  const form = useForm({
    resolver: zodResolver(LoginFormSchema),
  });

  const login = useMutation({
    mutationFn: async (json: LoginFormSchema) => {
      const response = await controlApi.post("/login", {
        ...json,
        device_type: "web",
      });
      return response.data;
    },
    onSuccess(data) {
      useAuthStore.getState().setAuth(data.data, data.token);
      redirect();
    },
    async onError(error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message);
      }
    },
  });

  return (
    <div className="mx-auto w-full max-w-sm py-8">
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((formData) => {
          if (login.isPending) return;
          login.mutate(formData);
        })}
      >
        <div className="space-y-5">
          <input
            type="text"
            placeholder={t("username")}
            className={`w-full rounded-md border ${
              isDark
                ? "border-gray-600 bg-gray-800 text-white"
                : "border-gray-300 bg-white text-black"
            } focus:border-primary px-4 py-3 focus:outline-none`}
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-sm text-red-500">
              {form.formState.errors.username.message}
            </p>
          )}

          <input
            type="password"
            placeholder={t("password")}
            className={`w-full rounded-md border ${
              isDark
                ? "border-gray-600 bg-gray-800 text-white"
                : "border-gray-300 bg-white text-black"
            } focus:border-primary px-4 py-3 focus:outline-none`}
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* <div className="text-right">
          <Link
            to="/auth/forgot-password"
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} hover:text-primary`}
          >
            {t("forgot_password")}
          </Link>
        </div> */}

        <button
          type="submit"
          disabled={login.isPending}
          className="bg-primary hover:bg-primary/90 w-full rounded-md py-3 font-medium text-white transition-colors"
        >
          {login.isPending ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          ) : (
            t("login")
          )}
        </button>
      </form>
    </div>
  );
}
