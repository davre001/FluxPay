import { authAPI } from './api-client'

export type ResolvedUser = {
  id: string
  email: string
  profileType: 'creator' | 'organization' | null
  walletAddress: string
}

// Establishes a FluxPay session from a verified Web3Auth login. Tries the
// backend first (server-verified role); falls back to the local cache if the
// backend is unreachable so dev still works. Always refreshes the local cache.
export async function establishSession(opts: {
  idToken: string
  walletAddress: string
  profileType?: 'creator' | 'organization' // intent, set on signup
  email?: string
}): Promise<ResolvedUser> {
  const { idToken, walletAddress, profileType, email } = opts
  const cacheKey = `fp_wallet_${walletAddress.toLowerCase()}`

  let resolved: ResolvedUser = {
    id: walletAddress,
    email: email || '',
    profileType: profileType ?? null,
    walletAddress,
  }

  try {
    const { data } = await authAPI.createSession({ idToken, profileType })
    resolved = {
      id: data.user.id,
      email: data.user.email || email || '',
      profileType: data.user.profileType ?? profileType ?? null,
      walletAddress: data.user.walletAddress || walletAddress,
    }
  } catch (err) {
    console.warn('Backend session unavailable, using local session:', err)
    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      const cached = JSON.parse(raw) as ResolvedUser
      resolved = { ...cached, profileType: cached.profileType ?? profileType ?? null, walletAddress }
    }
  }

  localStorage.setItem(cacheKey, JSON.stringify(resolved))
  return resolved
}
