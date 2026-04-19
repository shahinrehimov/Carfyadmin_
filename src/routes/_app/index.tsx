import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  UserCheck,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useOrdersStatistics,
  useTopStores,
  useTopProducts,
  useUsersStatistics,
  useCancellationsStatistics,
  type OrderPeriod,
} from "@/lib/queries/statistics";
import { useTranslation } from "@/lib/utils/translationLoader";
import { DatePicker } from "@/components/ui/date-picker";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLORS = {
  primary: "#6366f1",
  secondary: "#22d3ee",
  accent: "#f59e0b",
  danger: "#ef4444",
  success: "#10b981",
  muted: "#94a3b8",
};

const PIE_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#ef4444", "#10b981"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAZN(value: number) {
  return `${value.toLocaleString("az-AZ", { maximumFractionDigits: 2 })} ₼`;
}

function formatDate(date: string, period: OrderPeriod) {
  if (period === "monthly") return date;
  try {
    return new Date(date).toLocaleDateString("az-AZ", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-sm">{title}</p>
          {loading ? (
            <div className="bg-muted mt-1 h-6 w-24 animate-pulse rounded" />
          ) : (
            <p className="truncate text-2xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Period selector ─────────────────────────────────────────────────────────

const PERIOD_VALUES: OrderPeriod[] = ["daily", "weekly", "monthly"];

interface PeriodTabsProps {
  value: OrderPeriod;
  onChange: (v: OrderPeriod) => void;
}

function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  const { t } = useTranslation();

  const periodLabels: Record<OrderPeriod, string> = {
    daily: t("daily"),
    weekly: t("weekly"),
    monthly: t("monthly"),
  };

  return (
    <div className="bg-muted flex rounded-lg p-1 text-sm">
      {PERIOD_VALUES.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={
            value === p
              ? "bg-background rounded-md px-3 py-1 font-medium shadow-sm transition-all"
              : "text-muted-foreground rounded-md px-3 py-1 transition-all hover:text-foreground"
          }
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton chart ───────────────────────────────────────────────────────────

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-muted animate-pulse rounded-lg" style={{ height }} />
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

function DashboardPage() {
  const { t } = useTranslation();

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [period, setPeriod] = useState<OrderPeriod>("daily");

  const sharedFilters = { date_from: dateFrom, date_to: dateTo };

  const { data: ordersData, isLoading: ordersLoading } = useOrdersStatistics({
    ...sharedFilters,
    period,
  });
  const { data: usersData, isLoading: usersLoading } = useUsersStatistics({
    ...sharedFilters,
    period,
  });
  const { data: topStores, isLoading: storesLoading } = useTopStores({
    ...sharedFilters,
    limit: 10,
  });
  const { data: topProducts, isLoading: productsLoading } = useTopProducts({
    ...sharedFilters,
    limit: 8,
  });
  const { data: cancellations, isLoading: cancellationsLoading } =
    useCancellationsStatistics({ ...sharedFilters });

  const orderChart = (ordersData?.chart ?? []).map((p) => ({
    ...p,
    date: formatDate(p.date, period),
  }));

  const userChart = (usersData?.registration_chart ?? []).map((p) => ({
    ...p,
    date: formatDate(p.date, period),
  }));

  // Flatten nested company object so recharts dataKey works (company.name is nested + can be null)
  const storesChart = (topStores ?? []).map((s) => ({
    ...s,
    companyName: s.company.name ?? `#${s.company.id}`,
  }));

  // Labels used inside recharts `name` props and tooltip comparisons
  const labelOrderCount = t("order_count");
  const labelRevenue = t("revenue_azn");
  const labelNewUsers = t("new_users");
  const labelCount = t("count");
  const labelNoData = t("no_data_found");

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("platform_general_statistics")}
          </p>
        </div>

        {/* Date range filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <DatePicker
              value={dateFrom}
              onChange={(v) => v && setDateFrom(v)}
              placeholder={t("date_from")}
              className="w-[9.5rem]"
            />
            <span className="text-muted-foreground select-none">—</span>
            <DatePicker
              value={dateTo}
              onChange={(v) => v && setDateTo(v)}
              placeholder={t("date_to")}
              className="w-[9.5rem]"
            />
          </div>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={t("total_orders")}
          value={ordersData?.summary.total_orders ?? "—"}
          icon={<ShoppingCart size={22} />}
          color={COLORS.primary}
          loading={ordersLoading}
        />
        <StatCard
          title={t("total_revenue")}
          value={
            ordersData ? formatAZN(ordersData.summary.total_revenue) : "—"
          }
          icon={<DollarSign size={22} />}
          color={COLORS.success}
          loading={ordersLoading}
        />
        <StatCard
          title={t("quantity_sold")}
          value={ordersData?.summary.total_quantity ?? "—"}
          icon={<Package size={22} />}
          color={COLORS.accent}
          loading={ordersLoading}
        />
        <StatCard
          title={t("registrations")}
          value={usersData?.summary.registered ?? "—"}
          icon={<Users size={22} />}
          color={COLORS.secondary}
          loading={usersLoading}
        />
        <StatCard
          title={t("active_via_login")}
          value={usersData?.summary.active_via_login ?? "—"}
          icon={<UserCheck size={22} />}
          color={COLORS.primary}
          loading={usersLoading}
        />
        <StatCard
          title={t("cancelled")}
          value={cancellations?.total_cancelled ?? "—"}
          icon={<XCircle size={22} />}
          color={COLORS.danger}
          loading={cancellationsLoading}
        />
      </div>

      {/* ── Orders chart ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            {t("order_dynamics")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={orderChart}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.success}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.success}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}₼`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === labelRevenue)
                      return [formatAZN(Number(value)), name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="order_count"
                  name={labelOrderCount}
                  stroke={COLORS.primary}
                  fill="url(#gradOrders)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name={labelRevenue}
                  stroke={COLORS.success}
                  fill="url(#gradRevenue)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Users registration chart ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} className="text-cyan-500" />
            {t("user_registrations")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={userChart}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={labelNewUsers}
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Top stores + Cancellations ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top stores */}
        <Card>
          <CardHeader>
            <CardTitle>{t("top_selling_stores")}</CardTitle>
          </CardHeader>
          <CardContent>
            {storesLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={storesChart}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}₼`}
                  />
                  <YAxis
                    type="category"
                    dataKey="companyName"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === labelRevenue)
                        return [formatAZN(Number(value)), name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name={labelRevenue}
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="order_count"
                    name={labelOrderCount}
                    fill={COLORS.secondary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cancellations */}
        <Card>
          <CardHeader>
            <CardTitle>{t("cancellation_statistics")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {cancellationsLoading ? (
              <ChartSkeleton height={260} />
            ) : (
              <>
                {/* By actor pie */}
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <PieChart width={140} height={140}>
                      <Pie
                        data={cancellations?.by_actor ?? []}
                        dataKey="count"
                        nameKey="actor"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={62}
                      >
                        {(cancellations?.by_actor ?? []).map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                  <div className="space-y-2 text-sm">
                    {(cancellations?.by_actor ?? []).map((item, i) => (
                      <div key={item.actor} className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground">
                          {item.actor}:
                        </span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                    {(cancellations?.by_actor ?? []).length === 0 && (
                      <p className="text-muted-foreground text-xs">
                        {labelNoData}
                      </p>
                    )}
                  </div>
                </div>

                {/* Top reasons bar */}
                {(cancellations?.top_reasons ?? []).length > 0 && (
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart
                      data={cancellations?.top_reasons ?? []}
                      layout="vertical"
                      margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="reason"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        width={140}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name={labelCount}
                        fill={COLORS.danger}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top products ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top selling */}
        <Card>
          <CardHeader>
            <CardTitle>{t("top_selling_products")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {productsLoading ? (
              <div className="p-6">
                <ChartSkeleton height={200} />
              </div>
            ) : (
              <div className="divide-border divide-y">
                {(topProducts?.top_selling ?? []).map((item, i) => (
                  <div
                    key={item.cpv.id}
                    className="hover:bg-muted/30 flex items-center gap-3 px-5 py-3 transition-colors"
                  >
                    <span className="text-muted-foreground w-5 shrink-0 text-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    {item.cpv.main_image ? (
                      <img
                        src={item.cpv.main_image}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                        <Package size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.cpv.title}
                    </p>
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-semibold text-emerald-600">
                        {formatAZN(item.revenue)}
                      </p>
                      <p className="text-muted-foreground">
                        {item.quantity_sold} {t("pcs")}
                      </p>
                    </div>
                  </div>
                ))}
                {(topProducts?.top_selling ?? []).length === 0 && (
                  <p className="text-muted-foreground p-5 text-center text-sm">
                    {labelNoData}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top viewed */}
        <Card>
          <CardHeader>
            <CardTitle>{t("top_viewed_products")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {productsLoading ? (
              <div className="p-6">
                <ChartSkeleton height={200} />
              </div>
            ) : (
              <div className="divide-border divide-y">
                {(topProducts?.top_viewed ?? []).map((item, i) => (
                  <div
                    key={item.cpv.id}
                    className="hover:bg-muted/30 flex items-center gap-3 px-5 py-3 transition-colors"
                  >
                    <span className="text-muted-foreground w-5 shrink-0 text-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    {item.cpv.main_image ? (
                      <img
                        src={item.cpv.main_image}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                        <Package size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.cpv.title}
                    </p>
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-semibold text-indigo-600">
                        {item.view_count.toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">{t("views")}</p>
                    </div>
                  </div>
                ))}
                {(topProducts?.top_viewed ?? []).length === 0 && (
                  <p className="text-muted-foreground p-5 text-center text-sm">
                    {labelNoData}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
