import { Link, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../../lib/utils/index";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import type { ReactNode } from "react";

export interface SidebarNavItem {
  icon: ReactNode;
  label: string;
  href: string;
}

interface SidebarSharedProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarItemProps extends SidebarSharedProps {
  icon: ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  isPrimary?: boolean;
  nested?: boolean;
}

export function SidebarItem({
  icon,
  label,
  href,
  isPrimary = false,
  isCollapsed = false,
  isMobile = false,
  onItemClick,
  nested = false,
}: SidebarItemProps) {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, href);

  const handleClick = () => {
    if (isMobile && onItemClick) {
      onItemClick();
    }
  };

  const linkClassName = cn(
    "flex items-center gap-3 py-3 text-sm rounded-lg transition-colors my-1 relative",
    isMobile ? "text-primary px-4" : "text-white px-6",
    nested && !isMobile && "pl-10 py-2.5",
    nested && isMobile && "pl-8 py-2.5",
    !isActive && "hover:bg-white/10 hover:z-10",
    isPrimary && "text-white",
    isActive &&
      !isPrimary &&
      "bg-white text-primary font-medium dark:bg-[#242428] dark:text-[#50B5FF]",
    isMobile &&
      isActive &&
      "bg-[#3371EB33] text-primary font-medium dark:bg-[#1A1B23] dark:text-[#50B5FF]",
  );

  if (isCollapsed && !isMobile && !nested) {
    return (
      <div className="relative">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link to={href} onClick={handleClick} className={linkClassName}>
                <span className="text-lg">{icon}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="relative">
      <Link to={href} onClick={handleClick} className={linkClassName}>
        {!nested && <span className="text-lg">{icon}</span>}
        <span>{label}</span>
      </Link>
    </div>
  );
}

interface SidebarGroupProps extends SidebarSharedProps {
  icon: ReactNode;
  label: string;
  items: SidebarNavItem[];
}

export function SidebarGroup({
  icon,
  label,
  items,
  isCollapsed = false,
  isMobile = false,
  onItemClick,
}: SidebarGroupProps) {
  const { pathname } = useLocation();
  const hasActiveChild = items.some((item) => isPathActive(pathname, item.href));
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const handleChildClick = () => {
    if (isMobile && onItemClick) {
      onItemClick();
    }
  };

  const groupButtonClassName = cn(
    "flex w-full items-center gap-3 rounded-lg py-3 text-sm transition-colors my-1",
    isMobile ? "text-primary px-4" : "text-white px-6",
    hasActiveChild && "bg-white/10",
    !hasActiveChild && "hover:bg-white/10",
  );

  if (isCollapsed && !isMobile) {
    return (
      <Popover>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button type="button" className={groupButtonClassName}>
                  <span className="text-lg">{icon}</span>
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent side="right" align="start" className="w-56 p-2">
          <p className="mb-2 px-2 text-xs font-semibold text-gray-500">{label}</p>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                  isPathActive(pathname, item.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={groupButtonClassName}
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="space-y-0.5">
          {items.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              nested
              isMobile={isMobile}
              onItemClick={handleChildClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  className?: string;
  children: ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  className,
  children,
  isCollapsed = false,
  onToggle,
  isMobile = false,
}: SidebarProps) {
  // Clone children to pass isCollapsed prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        isCollapsed,
        isMobile,
        onItemClick: isMobile ? onToggle : undefined,
      } as SidebarSharedProps);
    }
    return child;
  });

  return (
    <aside
      className={cn(
        " bg-primary dark:bg-[#1A1B23] flex flex-col transition-all duration-300 ease-in-out relative",
        isCollapsed && !isMobile ? "w-[90px] h-screen" : "w-[250px] h-screen",
        isMobile && "w-full h-16 shrink-0 overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center h-16 px-6 ">
        <div
          className={cn(
            "flex items-center gap-2 w-full justify-center ",
            isCollapsed && !isMobile ? "justify-center" : "justify-between",
          )}
        >
          {(!isCollapsed || isMobile) && (
            <Link to="/" className="cursor-pointer">
              <img
                src="/logo.svg"
                alt="logo"
                className="w-30 brightness-0 invert "
              />
            </Link>
          )}

          <button
            onClick={onToggle}
            className=" text-white hover:text-white/80 transition-colors cursor-pointer"
          >
            {!isCollapsed && isMobile ? (
              <X className="w-6 h-6" />
            ) : (
              <img src="/icons/menu.svg" alt="menu" className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "flex-1 py-4 overflow-y-auto mt-2 transition-all duration-300 ease-in-out",
          isMobile &&
            (isCollapsed
              ? "opacity-0 pointer-events-none transform translate-y-[-20px]"
              : "opacity-100 pointer-events-auto transform translate-y-0"),
          isMobile &&
            "absolute top-full z-50 left-0 right-0 w-full h-[calc(100dvh-4rem)] mx-auto bg-gray-200 dark:bg-[#1A1B23]",
        )}
      >
        <nav
          className={cn(
            "space-y-1 px-2",
            isMobile &&
              " w-[90%] mx-auto bg-white dark:bg-[#242428] rounded-lg py-2",
          )}
        >
          {childrenWithProps}
        </nav>
      </div>
    </aside>
  );
}
