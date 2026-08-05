import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";
import type { CommissionTier } from "@/components/ui/commission-tiers-editor";

export type { CommissionTier };

/**
 * Platform-wide commission tiers. They are the last step of the rate chain,
 * checked after the seller and category rates and before the
 * default_commission_percent setting.
 */
async function getGlobalCommissionTiers() {
  const response = await controlPrivateApi.get("/commission-tiers/load");
  return response.data.data as Array<CommissionTier>;
}

async function updateGlobalCommissionTiers(tiers: Array<CommissionTier>) {
  const response = await controlPrivateApi.post("/commission-tiers/update", {
    commission_tiers: tiers,
  });
  return response.data;
}

export const globalCommissionTiersQueryOptions = () =>
  queryOptions({
    queryKey: ["commissionTiers", "global"],
    queryFn: getGlobalCommissionTiers,
  });

export function useGlobalCommissionTiers() {
  return useQuery(globalCommissionTiersQueryOptions());
}

export function useUpdateGlobalCommissionTiers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGlobalCommissionTiers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionTiers", "global"] });
    },
  });
}
