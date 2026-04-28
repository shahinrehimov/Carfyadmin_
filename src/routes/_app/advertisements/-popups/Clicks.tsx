import React, { useState } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
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
  useAdvertisementClicks,
  type Advertisement,
} from "@/lib/queries/advertisements";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "@/components/ui/card";

interface ClicksProps {
  advertisement: Advertisement;
}

const USER_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "authenticated", label: "Authenticated" },
  { value: "guest", label: "Guest" },
  { value: "anonymous", label: "Anonymous" },
];

const Clicks: React.FC<ClicksProps> = ({ advertisement }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    date_from: "",
    date_to: "",
    user_type: "",
  });

  const { data, isLoading } = useAdvertisementClicks(advertisement.id, filters);

  const clicks = data?.data || [];
  const total = data?.meta.total || 0;
  const lastPage = data?.meta.last_page || 1;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case "authenticated":
        return <Badge variant="success">{t("authenticated")}</Badge>;
      case "guest":
        return <Badge variant="info">{t("guest")}</Badge>;
      default:
        return <Badge variant="secondary">{t("anonymous")}</Badge>;
    }
  };

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
          <TableHead className="w-[130px]">{t("user_type")}</TableHead>
          <TableHead>{t("user")}</TableHead>
          <TableHead>{t("ip_address")}</TableHead>
          <TableHead>{t("user_agent")}</TableHead>
          <TableHead>{t("clicked_at")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(6)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : clicks.length > 0 ? (
          clicks.map((click, index) => (
            <TableRow key={click.id}>
              <TableCell>
                {(filters.page - 1) * filters.limit + index + 1}
              </TableCell>
              <TableCell>{getUserTypeBadge(click.user_type)}</TableCell>
              <TableCell className="text-sm">
                {click.user_id ? (
                  <span>
                    {t("user")} #{click.user_id}
                  </span>
                ) : click.guest_identifier ? (
                  <span className="text-gray-500 font-mono text-xs">
                    {click.guest_identifier.slice(0, 8)}…
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {click.ip_address}
              </TableCell>
              <TableCell
                className="max-w-[200px] truncate text-xs text-gray-500"
                title={click.user_agent}
              >
                {click.user_agent}
              </TableCell>
              <TableCell className="text-sm">{click.clicked_at}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6}>
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-3">
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center justify-between border-b p-4"
          >
            <div className="flex-1">
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-3 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        ))
      ) : clicks.length > 0 ? (
        clicks.map((click) => (
          <Card key={click.id} className="p-4">
            <div className="flex items-center justify-between">
              {getUserTypeBadge(click.user_type)}
              <span className="text-xs text-gray-500">{click.clicked_at}</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-mono">{click.ip_address}</p>
              {click.user_id && (
                <p className="text-sm text-gray-600">
                  {t("user")} #{click.user_id}
                </p>
              )}
              {click.guest_identifier && (
                <p className="text-xs text-gray-500 font-mono">
                  {click.guest_identifier}
                </p>
              )}
              <p
                className="text-xs text-gray-400 truncate"
                title={click.user_agent}
              >
                {click.user_agent}
              </p>
            </div>
          </Card>
        ))
      ) : (
        <NoData />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t("total_clicks")}:
        </span>
        <span className="text-lg font-semibold">
          {advertisement.click_count}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DatePicker
          value={filters.date_from}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, date_from: val, page: 1 }))
          }
          placeholder={t("date_from")}
        />
        <DatePicker
          value={filters.date_to}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, date_to: val, page: 1 }))
          }
          placeholder={t("date_to")}
        />
        <Select
          value={filters.user_type}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, user_type: val, page: 1 }))
          }
          options={USER_TYPE_OPTIONS}
          placeholder={t("user_type")}
        />
      </div>

      <div className="overflow-hidden">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={filters.page}
        totalPages={lastPage}
        pageSize={filters.limit}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />
    </div>
  );
};

export default Clicks;
