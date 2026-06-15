import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Demo-only illustrative balance ledger. Starts at NEXT_PUBLIC_DEMO_BALANCE and
// is nudged by settlements — down when the judge pays as a brand, up when they
// get paid as a creator — so the no-real-funds walkthrough feels live. Persisted
// per browser; reset via the hidden presenter control.
const BASE = Number(process.env.NEXT_PUBLIC_DEMO_BALANCE || 400)

interface DemoBalanceStore {
  delta: number
  // Net the running balance (BASE + delta), never below 0.
  balance: () => number
  adjust: (amountUsdc: number) => void   // +receive / -pay
  reset: () => void
}

export const useDemoBalance = create<DemoBalanceStore>()(
  persist(
    (set, get) => ({
      delta: 0,
      balance: () => Math.max(0, Math.round((BASE + get().delta) * 100) / 100),
      adjust: (amountUsdc) =>
        set((s) => ({ delta: s.delta + (Number(amountUsdc) || 0) })),
      reset: () => set({ delta: 0 }),
    }),
    { name: 'fluxpay-demo-balance' },
  ),
)

// Convenience: adjust only when the demo build is active.
export function adjustDemoBalance(amountUsdc: number) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    useDemoBalance.getState().adjust(amountUsdc)
  }
}
