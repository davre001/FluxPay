import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from '@/stores/userStore'

// Demo-only illustrative balance, keyed per (role, identity). A BRAND starts with
// a funded balance (so it can pay deals) and ticks DOWN as it pays; a CREATOR
// starts at $0 and ticks UP as it gets paid. Persisted per browser; reset via the
// presenter control. Purely cosmetic — no real funds.
const BRAND_BASE = Number(process.env.NEXT_PUBLIC_DEMO_BALANCE || 1000)
const CREATOR_BASE = Number(process.env.NEXT_PUBLIC_DEMO_CREATOR_BALANCE || 0)

export function keyFor(id?: string | null, role?: string | null) {
  return `${role === 'organization' ? 'brand' : 'creator'}:${id || 'anon'}`
}
export function baseFor(role?: string | null) {
  return role === 'organization' ? BRAND_BASE : CREATOR_BASE
}

interface DemoBalanceStore {
  deltas: Record<string, number>
  adjust: (key: string, amountUsdc: number) => void   // +receive / -pay
  reset: () => void
}

export const useDemoBalance = create<DemoBalanceStore>()(
  persist(
    (set) => ({
      deltas: {},
      adjust: (key, amountUsdc) =>
        set((s) => ({ deltas: { ...s.deltas, [key]: (s.deltas[key] || 0) + (Number(amountUsdc) || 0) } })),
      reset: () => set({ deltas: {} }),
    }),
    { name: 'fluxpay-demo-balance' },
  ),
)

// Compute the current (role, identity) demo balance from a store snapshot.
export function demoBalance(deltas: Record<string, number>, id?: string | null, role?: string | null) {
  return Math.max(0, Math.round((baseFor(role) + (deltas[keyFor(id, role)] || 0)) * 100) / 100)
}

// Adjust the current user's demo balance (role + identity inferred). Demo only.
export function adjustDemoBalance(amountUsdc: number) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return
  const u = useUserStore.getState().user
  if (!u?.id) return
  useDemoBalance.getState().adjust(keyFor(u.id, u.profileType), amountUsdc)
}

// Reflect a milestone settlement on BOTH sides of the same demo account: the
// brand balance ticks down, the creator balance ticks up — so whichever
// dashboard the judge views shows the transfer. Demo only.
export function settleDemoBalance(amountUsdc: number) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return
  const u = useUserStore.getState().user
  if (!u?.id) return
  const amt = Number(amountUsdc) || 0
  const store = useDemoBalance.getState()
  store.adjust(keyFor(u.id, 'organization'), -amt) // brand pays
  store.adjust(keyFor(u.id, 'creator'), amt)        // creator receives
}
