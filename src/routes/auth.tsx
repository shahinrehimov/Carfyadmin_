import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { checkUserQueryOptions } from "@/lib/queries/checkUser";
import { isAxiosError } from "axios";
import { useTheme } from "@/components/themes/provider";

const authLayoutSearchSchema = z.object({
  redirect: z.string().optional(),
});
export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(authLayoutSearchSchema),
  loaderDeps: ({ search: { redirect: redirectPath } }) => ({
    redirectPath,
  }),
  async loader({ context: { queryClient }, deps: { redirectPath } }) {
    try {
      const data = await queryClient.ensureQueryData(checkUserQueryOptions);
      if (data) throw redirect({ to: redirectPath ?? "/" });
    } catch (e) {
      if (!isAxiosError(e)) {
        throw e;
      }
    }
  },
  pendingComponent: () => (
    <div className="flex h-screen w-screen grow items-center justify-center">
      Loading...
    </div>
  ),
  component: AuthLayout,
});

function AuthLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex h-screen w-screen flex-col-reverse lg:flex-row">
      <div
        className={`flex flex-1 flex-col justify-center px-8 ${isDark ? "bg-[#1D1D1D]" : "bg-white"}`}
      >
        <Outlet />
      </div>
      <div className="relative flex lg:flex-1 flex-col items-center justify-center bg-primary dark:bg-[#060C18] overflow-hidden h-[150px] lg:h-full">
        <img src="/logo.svg" alt="DeTech" className="w-1/2 object-contain" />
        {/* Top left circle */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full border-[40px] border-primary-foreground/20 dark:border-primary-foreground/10 hidden lg:block"></div>
        {/* Bottom right circle */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full border-[40px] border-primary-foreground/20  dark:border-primary-foreground/10 hidden lg:block"></div>
      </div>
    </div>
  );
}
