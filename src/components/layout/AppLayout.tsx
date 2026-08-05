import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  BellDot,
  BookOpen,
  Building2,
  FileText,
  Gift,
  Globe,
  HeadphonesIcon,
  Languages,
  LayoutDashboard,
  LayoutList,
  List,
  Mail,
  Megaphone,
  Package,
  Palette,
  Settings as SettingsIcon,
  Settings2,
  Share2,
  ShoppingCart,
  Star,
  Tag,
  UserCheck,
  Users,
  Layers,
  FolderTree,
  MessageSquare,
  MapPin,
  HelpCircle,
  Percent,
} from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Sidebar, SidebarGroup, SidebarItem } from "../ui/sidebar";
import { Header } from "../ui/header";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useAuthStore } from "@/store/auth";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobileView = useMediaQuery("(width<48rem)");
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  // The global commission tiers endpoint is restricted to admins, so a
  // marketing user would only reach a 403 from the menu.
  const isAdmin = user?.roles?.some((role) => role.name === "Admin") ?? false;

  const sidebarGroupsBeforeProducts = [
    {
      icon: <Users />,
      label: t("management"),
      items: [
        { icon: <Building2 />, label: t("companies"), href: "/companies" },
        { icon: <UserCheck />, label: t("admins"), href: "/admins" },
        { icon: <Users />, label: t("users"), href: "/users" },
      ],
    },
    {
      icon: <Globe />,
      label: t("localization"),
      items: [
        { icon: <Globe />, label: t("languages"), href: "/languages" },
        {
          icon: <Languages />,
          label: t("translations"),
          href: "/translations",
        },
      ],
    },
    {
      icon: <FolderTree />,
      label: t("catalog"),
      items: [
        { icon: <Tag />, label: t("brands"), href: "/brands" },
        { icon: <MapPin />, label: t("countries"), href: "/countries" },
        { icon: <Palette />, label: t("car_colors"), href: "/car-colors" },
        { icon: <LayoutList />, label: t("catalogs"), href: "/catalogs" },
        { icon: <List />, label: t("categories"), href: "/categories" },
        { icon: <Layers />, label: t("groups"), href: "/groups" },
        {
          icon: <Settings2 />,
          label: t("product_options"),
          href: "/product-options",
        },
      ],
    },
  ];

  const sidebarGroupsAfterProducts = [
    {
      icon: <Megaphone />,
      label: t("marketing"),
      items: [
        {
          icon: <Megaphone />,
          label: t("advertisements"),
          href: "/advertisements",
        },
        {
          icon: <Bell />,
          label: t("push_notifications"),
          href: "/push-notifications",
        },
        {
          icon: <BellDot />,
          label: t("notification_settings"),
          href: "/notification-settings",
        },
      ],
    },
    {
      icon: <BookOpen />,
      label: t("content"),
      items: [
        { icon: <BookOpen />, label: t("pages"), href: "/static-pages" },
        { icon: <FileText />, label: t("meta_tags"), href: "/meta" },
        { icon: <Share2 />, label: t("socials"), href: "/socials" },
        { icon: <HelpCircle />, label: t("faqs"), href: "/faqs" },
      ],
    },
    {
      icon: <MessageSquare />,
      label: t("support"),
      items: [
        {
          icon: <Mail />,
          label: t("contact_messages"),
          href: "/contact-messages",
        },
        { icon: <HeadphonesIcon />, label: t("support"), href: "/support" },
      ],
    },
  ];

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobileView);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden bg-[#FBFBFBFB] dark:bg-[#242428]",
        isMobileView && "flex-col",
      )}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        isMobile={isMobileView}
      >
        <SidebarItem
          icon={<LayoutDashboard />}
          label={t("dashboard")}
          href="/"
        />

        {sidebarGroupsBeforeProducts.map((group) => (
          <SidebarGroup
            key={group.label}
            icon={group.icon}
            label={group.label}
            items={group.items}
          />
        ))}

        <SidebarItem
          icon={<Package />}
          label={t("products")}
          href="/products"
        />
        <SidebarItem
          icon={<ShoppingCart />}
          label={t("orders")}
          href="/orders"
        />
        <SidebarItem icon={<Star />} label={t("reviews")} href="/reviews" />
        <SidebarItem icon={<Gift />} label={t("referrals") || "Referrallar"} href="/referrals" />

        {sidebarGroupsAfterProducts.map((group) => (
          <SidebarGroup
            key={group.label}
            icon={group.icon}
            label={group.label}
            items={group.items}
          />
        ))}

        {isAdmin && (
          <SidebarItem
            icon={<Percent />}
            label={t("global_commission_tiers")}
            href="/commission-tiers"
          />
        )}

        <SidebarItem
          icon={<SettingsIcon />}
          label={t("settings")}
          href="/settings"
        />
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header pageTitle="Dashboard" />

        <main className="flex-1 overflow-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
