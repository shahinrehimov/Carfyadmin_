import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid" | "cancelled";
export type FraudSeverity = "hard_block" | "soft_flag";
export type FraudResolution = "approved" | "rejected";
export type BalanceAdjustType = "add" | "deduct";

export interface ReferralOverview {
  total_referrers: number;
  active_referrers: number;
  total_attributions: number;
  active_attributions: number;
  pending_earnings_azn: number;
  available_earnings_azn: number;
  total_paid_azn: number;
  pending_withdrawals: number;
  unresolved_fraud_flags: number;
}

export interface WithdrawalUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
}

export interface Withdrawal {
  id: number;
  user: WithdrawalUser;
  amount: number;       // cents
  fee: number;          // cents
  net_amount: number;   // cents
  card_last4: string;
  card_holder_name: string;
  status: WithdrawalStatus;
  admin_id: number | null;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
}

export interface FraudUser {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface FraudFlag {
  id: number;
  user: FraudUser;
  matched_with_user: FraudUser | null;
  flag_type: "card" | "phone" | "device" | "ip" | "velocity";
  severity: FraudSeverity;
  resolved: boolean;
  resolved_by: number | null;
  resolution: FraudResolution | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ReferralCodeUser {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface ReferralCode {
  id: number;
  user: ReferralCodeUser;
  code: string;
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ReferralSetting {
  id: number;
  key: string;
  value: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { current_page: number; per_page: number; total: number };
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface WithdrawalFilters {
  page: number;
  limit?: number;
  status?: WithdrawalStatus | "";
}

export interface FraudFlagFilters {
  page: number;
  limit?: number;
  unresolved_only?: boolean;
  severity?: FraudSeverity | "";
}

export interface CodesFilters {
  page: number;
  limit?: number;
  search?: string;
  is_active?: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") p.append(k, String(v));
  });
  return p;
}

async function getOverview(): Promise<ReferralOverview> {
  const res = await controlPrivateApi.get("/referral/overview");
  return res.data.data;
}

async function getWithdrawals(filters: WithdrawalFilters): Promise<PaginatedResponse<Withdrawal>> {
  const res = await controlPrivateApi.get(
    `/referral/withdrawals/load?${buildParams({ limit: 20, ...filters })}`
  );
  return res.data;
}

async function approveWithdrawal(id: number) {
  const res = await controlPrivateApi.post(`/referral/withdrawals/${id}/approve`);
  return res.data;
}

async function rejectWithdrawal({ id, note }: { id: number; note: string }) {
  const res = await controlPrivateApi.post(`/referral/withdrawals/${id}/reject`, { note });
  return res.data;
}

async function markPaidWithdrawal(id: number) {
  const res = await controlPrivateApi.post(`/referral/withdrawals/${id}/mark-paid`);
  return res.data;
}

async function getFraudFlags(filters: FraudFlagFilters): Promise<PaginatedResponse<FraudFlag>> {
  const res = await controlPrivateApi.get(
    `/referral/fraud-flags/load?${buildParams({ limit: 20, ...filters })}`
  );
  return res.data;
}

async function resolveFraudFlag({ id, resolution }: { id: number; resolution: FraudResolution }) {
  const res = await controlPrivateApi.post(`/referral/fraud-flags/${id}/resolve`, { resolution });
  return res.data;
}

async function balanceAdjust(payload: {
  user_id: number;
  type: BalanceAdjustType;
  amount_azn: number;
  reason: string;
}) {
  const res = await controlPrivateApi.post("/referral/balance-adjust", payload);
  return res.data;
}

async function getCodes(filters: CodesFilters): Promise<PaginatedResponse<ReferralCode>> {
  const res = await controlPrivateApi.get(
    `/referral/codes/load?${buildParams({ limit: 20, ...filters })}`
  );
  return res.data;
}

async function updateCode({ id, code }: { id: number; code: string }) {
  const res = await controlPrivateApi.put(`/referral/codes/${id}`, { code });
  return res.data;
}

async function deactivateCode(id: number) {
  const res = await controlPrivateApi.post(`/referral/codes/${id}/deactivate`);
  return res.data;
}

async function deleteCode(id: number) {
  const res = await controlPrivateApi.delete(`/referral/codes/${id}`);
  return res.data;
}

async function getSettings(): Promise<ReferralSetting[]> {
  const res = await controlPrivateApi.get("/referral/settings");
  return res.data.data;
}

async function updateSettings(settings: Array<{ key: string; value: string }>) {
  const res = await controlPrivateApi.post("/referral/settings", { settings });
  return res.data;
}

// ─── Query options ────────────────────────────────────────────────────────────

export const referralOverviewQueryOptions = () =>
  queryOptions({ queryKey: ["referral-overview"], queryFn: getOverview });

export const referralWithdrawalsQueryOptions = (f: WithdrawalFilters) =>
  queryOptions({ queryKey: ["referral-withdrawals", f], queryFn: () => getWithdrawals(f) });

export const referralFraudFlagsQueryOptions = (f: FraudFlagFilters) =>
  queryOptions({ queryKey: ["referral-fraud-flags", f], queryFn: () => getFraudFlags(f) });

export const referralCodesQueryOptions = (f: CodesFilters) =>
  queryOptions({ queryKey: ["referral-codes", f], queryFn: () => getCodes(f) });

export const referralSettingsQueryOptions = () =>
  queryOptions({ queryKey: ["referral-settings"], queryFn: getSettings });

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useReferralOverview() {
  return useQuery(referralOverviewQueryOptions());
}

export function useReferralWithdrawals(f: WithdrawalFilters) {
  return useQuery(referralWithdrawalsQueryOptions(f));
}

export function useReferralFraudFlags(f: FraudFlagFilters) {
  return useQuery(referralFraudFlagsQueryOptions(f));
}

export function useReferralCodes(f: CodesFilters) {
  return useQuery(referralCodesQueryOptions(f));
}

export function useReferralSettings() {
  return useQuery(referralSettingsQueryOptions());
}

export function useApproveWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveWithdrawal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-withdrawals"] }),
  });
}

export function useRejectWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectWithdrawal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-withdrawals"] }),
  });
}

export function useMarkPaidWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markPaidWithdrawal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-withdrawals"] }),
  });
}

export function useResolveFraudFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveFraudFlag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-fraud-flags"] });
      qc.invalidateQueries({ queryKey: ["referral-overview"] });
    },
  });
}

export function useBalanceAdjust() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: balanceAdjust,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-overview"] }),
  });
}

export function useUpdateCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-codes"] }),
  });
}

export function useDeactivateCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-codes"] }),
  });
}

export function useDeleteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-codes"] }),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral-settings"] }),
  });
}
