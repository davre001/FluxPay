import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Demo-only illustrative balance ledger, keyed PER identity (real judge wallet,
// demo-brand, demo-creator) so each party has its own balance: a brand ticks
// down when it pays, a creator ticks up when it gets paid. Starts every identity
// at NEXT_PUBLIC_DEMO_BALANCE. Persisted per browser; reset via the presenter
// control. Purely cosmetic — no real funds.
const BASE = Number(process.env.NEXT_PUBLIC_DEMO_BALANCE || 1000)

interface DemoBalanceStore {
  deltas: Record<string, number>
  adjust: (id: string, amountUsdc: number) => void   // +receive / -pay
  balanceFor: (id?: string | null) => number
  reset: () => void
}

export const useDemoBalance = create<DemoBalanceStore>()(
  persist(
    (set, get) => ({
      deltas: {},
      adjust: (id, amountUsdc) =>
        set((s) => ({ deltas: { ...s.deltas, [id]: (s.deltas[id] || 0) + (Number(amountUsdc) || 0) } })),
      balanceFor: (id) =>
        Math.max(0, Math.round((BASE + (id ? get().deltas[id] || 0 : 0)) * 100) / 100),
      reset: () => set({ deltas: {} }),
    }),
    { name: 'fluxpay-demo-balance' },
  ),
)

// Adjust the current identity's demo balance, only when the demo build is active.
export function adjustDemoBalance(id: string | null | undefined, amountUsdc: number) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && id) {
    useDemoBalance.getState().adjust(id, amountUsdc)
  }
}
