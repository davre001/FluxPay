import { NextRequest, NextResponse } from 'next/server'
import { formatUnits } from 'viem'
import { getChainConfig } from '@/config/chains'

// Server-side balances proxy. Primary source is GoldRush (Covalent); if that
// fails or its key expires, we fall back to Alchemy for EVM chains. Both keys
// stay server-side (no NEXT_PUBLIC_ prefix). The client calls /api/balances.

interface WalletToken {
  symbol: string
  name: string
  address: string
  decimals: number
  logo: string | null
  balanceRaw: string
  balance: string
  usdValue: number | null
  isNative: boolean
}

// chainId → Alchemy network slug (EVM only; Solana stays GoldRush-only).
const ALCHEMY_NETWORKS: Record<number, string> = {
  1: 'eth-mainnet',
  8453: 'base-mainnet',
  42161: 'arb-mainnet',
  43114: 'avax-mainnet',
  59144: 'linea-mainnet',
  56: 'bnb-mainnet',
  42220: 'celo-mainnet',
  11155111: 'eth-sepolia',
  84532: 'base-sepolia',
  421614: 'arb-sepolia',
}

// ── GoldRush (Covalent): balances + metadata + USD in one call ──
async function fetchFromGoldRush(chainId: string, address: string): Promise<WalletToken[]> {
  const key = process.env.GOLDRUSH_API_KEY
  if (!key) throw new Error('GOLDRUSH_API_KEY is not configured')

  const url =
    `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/` +
    `?nft=false&no-spam=true`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 30 },
  } as RequestInit & { next: { revalidate: number } })
  if (!res.ok) throw new Error(`GoldRush request failed (${res.status})`)

  const json = await res.json()
  const items: any[] = json?.data?.items ?? []
  return items
    .filter((it) => it?.balance && it.balance !== '0')
    .map((it) => ({
      symbol: it.contract_ticker_symbol ?? '???',
      name: it.contract_name ?? 'Unknown token',
      address: it.contract_address ?? '',
      decimals: it.contract_decimals ?? 18,
      logo: it.logo_url ?? null,
      balanceRaw: String(it.balance),
      balance: formatUnits(BigInt(it.balance), it.contract_decimals ?? 18),
      usdValue: typeof it.quote === 'number' ? it.quote : null,
      isNative: Boolean(it.native_token),
    }))
}

// ── Alchemy fallback (EVM only): balances + metadata, no USD prices ──
async function fetchFromAlchemy(chainId: number, address: string): Promise<WalletToken[]> {
  const slug = ALCHEMY_NETWORKS[chainId]
  const key = process.env.ALCHEMY_API
  if (!slug || !key) throw new Error('Alchemy not available for this chain')

  const url = `https://${slug}.g.alchemy.com/v2/${key}`
  const rpc = async (method: string, params: any[]) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
    })
    if (!r.ok) throw new Error(`Alchemy ${method} failed (${r.status})`)
    const j = await r.json()
    if (j.error) throw new Error(j.error.message || 'Alchemy error')
    return j.result
  }

  const cfg = getChainConfig(chainId)
  const out: WalletToken[] = []

  // Native balance
  try {
    const wei = BigInt(await rpc('eth_getBalance', [address, 'latest']))
    if (wei > 0n) {
      const decimals = cfg?.nativeCurrency.decimals ?? 18
      out.push({
        symbol: cfg?.nativeCurrency.symbol ?? 'ETH',
        name: cfg?.nativeCurrency.name ?? 'Native token',
        address: 'native',
        decimals,
        logo: null,
        balanceRaw: wei.toString(),
        balance: formatUnits(wei, decimals),
        usdValue: null,
        isNative: true,
      })
    }
  } catch {
    // skip native if it fails
  }

  // ERC-20 balances (bounded to keep metadata calls reasonable)
  const tb = await rpc('alchemy_getTokenBalances', [address, 'erc20'])
  const nonZero = (tb?.tokenBalances ?? [])
    .filter((t: any) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
    .slice(0, 30)

  const metas = await Promise.all(
    nonZero.map((t: any) => rpc('alchemy_getTokenMetadata', [t.contractAddress]).catch(() => null)),
  )

  nonZero.forEach((t: any, i: number) => {
    const m = metas[i]
    const decimals = m?.decimals ?? 18
    const raw = BigInt(t.tokenBalance)
    out.push({
      symbol: m?.symbol ?? '???',
      name: m?.name ?? 'Unknown token',
      address: t.contractAddress,
      decimals,
      logo: m?.logo ?? null,
      balanceRaw: raw.toString(),
      balance: formatUnits(raw, decimals),
      usdValue: null,
      isNative: false,
    })
  })

  return out
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const chainId = searchParams.get('chainId')
  const address = searchParams.get('address')

  if (!chainId || !address) {
    return NextResponse.json({ error: 'chainId and address are required' }, { status: 400 })
  }

  try {
    const tokens = await fetchFromGoldRush(chainId, address)
    return NextResponse.json({ tokens, source: 'goldrush' })
  } catch (goldrushErr) {
    // Fall back to Alchemy for EVM chains if a key is configured.
    const numericChainId = Number(chainId)
    if (!Number.isNaN(numericChainId) && ALCHEMY_NETWORKS[numericChainId] && process.env.ALCHEMY_API) {
      try {
        const tokens = await fetchFromAlchemy(numericChainId, address)
        return NextResponse.json({ tokens, source: 'alchemy' })
      } catch (alchemyErr) {
        console.warn('[balances] both providers failed:', goldrushErr, alchemyErr)
        return NextResponse.json({ error: 'Failed to load balances' }, { status: 502 })
      }
    }
    console.warn('[balances] GoldRush failed (no Alchemy fallback):', goldrushErr)
    return NextResponse.json({ error: 'Failed to load balances' }, { status: 502 })
  }
}
