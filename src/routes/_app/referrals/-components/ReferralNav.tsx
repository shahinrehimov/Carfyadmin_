import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "@/lib/utils/translationLoader";

const TABS = [
  { key: "overview",    href: "/referrals" },
  { key: "withdrawals", href: "/referrals/withdrawals" },
  { key: "fraud_flags", href: "/referrals/fraud-flags" },
  { key: "codes",       href: "/referrals/codes" },
  { key: "settings",    href: "/referrals/settings" },
] as const;

export function ReferralNav() {
  const { t } = useTranslation();
  const { location } = useRouterState();
  const pathname = location.pathname.replace(/\/$/, "");

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0 mb-6">
      {TABS.map((tab) => {
        const href = tab.href.replace(/\/$/, "");
        const isActive = pathname === href;
        return (
          <Link
            key={tab.key}
            to={tab.href}
            className={[
              "px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors",
              isActive
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
            ].join(" ")}
          >
            {t(tab.key) || tab.key}
          </Link>
        );
      })}
    </div>
  );
}
