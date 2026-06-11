'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import type { WalletToken } from '@/hooks';

interface HoldingsCardProps {
  title: string;
  subtitle?: string;
  tokens: WalletToken[];
  totalUsd: number;
  isLoading: boolean;
  isError: boolean;
  show: boolean; // whether an account exists to query (e.g. connected / has Solana account)
  notReadyHint: string; // shown when `show` is false
  onRefresh: () => void;
}

// Presentational list of token holdings — reused for EVM and Solana.
export function HoldingsCard({
  title,
  subtitle,
  tokens,
  totalUsd,
  isLoading,
  isError,
  show,
  notReadyHint,
  onRefresh,
}: HoldingsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            {subtitle}
            {totalUsd > 0 && (
              <> · ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} total</>
            )}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!show ? (
        <p className="text-sm text-gray-500 py-6 text-center">{notReadyHint}</p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-sm text-amber-600 py-6 text-center">
          Could not load balances. Set <code className="font-mono">GOLDRUSH_API_KEY</code> and try again.
        </p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">No tokens found.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {tokens.map((t) => (
            <div key={`${t.address}-${t.symbol}`} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {t.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt={t.symbol} className="w-8 h-8 rounded-full bg-gray-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {t.symbol.slice(0, 3)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    {t.symbol}
                    {t.isNative && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        NATIVE
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{t.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-sm">
                  {Number(t.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </p>
                {t.usdValue !== null && (
                  <p className="text-xs text-gray-500">
                    ${t.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HoldingsCard;
