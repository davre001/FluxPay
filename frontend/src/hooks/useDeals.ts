'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobAPI, applicationAPI } from '@/lib/api-client';
import { EXTRA_MOCK_JOBS } from '@/lib/mock-jobs';
import { useUserStore } from '@/stores/userStore';

// Centralizes deal data-fetching on TanStack Query so every screen gets the same
// loading/error handling, caching (no refetch flicker when navigating), and the
// single API→mock fallback below. Mirrors the house pattern in useTokenBalances.

export interface DealFilters {
  status?: string;
  platform?: string;
  payout_type?: string;
  min_budget?: number;
  max_budget?: number;
}

// Public catalog: API first, fall back to the seeded mock deals so Browse stays
// populated in the demo even when the API is empty or unreachable. The status
// filter is honored in the fallback so an "open" browse never shows taken deals.
async function fetchDeals(filters?: DealFilters): Promise<any[]> {
  try {
    const { data } = await jobAPI.list(filters as Record<string, unknown>);
    if (Array.isArray(data) && data.length > 0) return data as any[];
  } catch {
    /* fall through to mock */
  }
  return (EXTRA_MOCK_JOBS as any[]).filter((d) => !filters?.status || d.status === filters.status);
}

export function useDeals(filters?: DealFilters) {
  const query = useQuery({
    queryKey: ['deals', filters ?? {}],
    staleTime: 30_000,
    queryFn: () => fetchDeals(filters),
  });
  return {
    deals: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

async function fetchDeal(jobId: string): Promise<any | null> {
  try {
    const { data } = await jobAPI.detail(jobId);
    if (data) return data;
  } catch {
    /* fall through to mock */
  }
  return (EXTRA_MOCK_JOBS as any[]).find((d) => d.id === jobId) ?? null;
}

export function useDeal(jobId: string | undefined) {
  const query = useQuery({
    queryKey: ['deal', jobId],
    enabled: Boolean(jobId),
    staleTime: 30_000,
    queryFn: () => fetchDeal(jobId as string),
  });
  return {
    deal: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

// User-specific — NO mock fallback (mock would show another user's data). Real
// loading/empty/error. Gated on a logged-in user.
export function useMyApplications() {
  const { user } = useUserStore();
  const query = useQuery({
    queryKey: ['my-applications', user?.id],
    enabled: Boolean(user?.id),
    staleTime: 15_000,
    queryFn: async () => {
      const { data } = await applicationAPI.listMine();
      return (data as any[]) ?? [];
    },
  });
  const applications = query.data ?? [];
  return {
    applications,
    appliedJobIds: new Set<string>(applications.map((a: any) => a.job_id)),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
}

// Apply to a deal, then refresh the caller's application list so the card flips
// to "Applied" without a manual refetch.
export function useApplyToDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, coverNote }: { jobId: string; coverNote: string }) =>
      jobAPI.apply(jobId, { cover_note: coverNote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-applications'] }),
  });
}
