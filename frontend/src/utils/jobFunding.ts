// Complete job funding flow: API + on-chain integration
// Usage: Call executeJobFundingFlow with job details and it handles everything

import { Address } from 'viem'
import { jobAPI } from '@/lib/api-client'
import {
  createEscrow,
  approveUSDC,
  fundEscrow,
  getEscrowAddress,
} from './contracts'

// Map the frontend form's source choice to a backend source_type the
// worker adapters understand. Customer-provided URLs use the customer_urls
// adapter; everything else falls back to the generic e-commerce scraper.
function toSourceType(source: string): string {
  if (source === 'urls') return 'customer_urls'
  return 'generic_ecommerce'
}

export interface JobQuoteRequest {
  category: string
  location: string
  source: string
  freshness?: string
  budget: number
  maxRows?: number
  description?: string
}

export interface FundingFlowSteps {
  step: 'quote' | 'escrow_created' | 'usdc_approved' | 'funded' | 'confirmed' | 'error'
  message: string
  hash?: string
  escrowAddress?: string
}

/**
 * Complete flow for funding a job:
 * 1. Get quote from backend (creates the job record)
 * 2. Create escrow on-chain via the factory
 * 3. Approve USDC for the escrow
 * 4. Fund the escrow
 * 5. Confirm funding with the backend (kicks off the coordinator pipeline)
 */
export async function executeJobFundingFlow(
  quoteRequest: JobQuoteRequest,
  userAddress: Address,
  authToken: string,
  onStepChange: (step: FundingFlowSteps) => void
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // Step 1: Get quote from backend
    onStepChange({ step: 'quote', message: 'Getting job quote...' })

    const jobCreatePayload = {
      title: `${quoteRequest.category} data — ${quoteRequest.location}`.slice(0, 120),
      description: quoteRequest.description || '',
      category: quoteRequest.category,
      region: quoteRequest.location,
      source_type: toSourceType(quoteRequest.source),
      output_schema: {},
      freshness: quoteRequest.freshness || 'once',
      max_rows: quoteRequest.maxRows || 100,
      budget_usdc: quoteRequest.budget,
      compliance_accepted: true,
    }

    const quoteResponse = await jobAPI.quote(jobCreatePayload)
    const jobId: string = quoteResponse.data.id
    const quotedAmount: number = quoteResponse.data.quote.total_usdc

    // Step 2: Create escrow on-chain
    onStepChange({ step: 'escrow_created', message: 'Creating escrow contract...' })

    const escrowResult = await createEscrow(
      jobId,
      userAddress,
      Math.floor(Date.now() / 1000) + 86400
    )
    const escrowTxHash = escrowResult.hash

    // Wait a moment for the createEscrow tx to be mined before reading the address
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const escrowAddress = await getEscrowAddress(jobId)
    if (!escrowAddress) {
      throw new Error('Failed to retrieve escrow address')
    }

    onStepChange({
      step: 'escrow_created',
      message: 'Escrow created successfully',
      hash: escrowTxHash,
      escrowAddress,
    })

    // Step 3: Approve USDC
    onStepChange({ step: 'usdc_approved', message: 'Approving USDC spending...' })

    const approveResult = await approveUSDC(escrowAddress as Address, quotedAmount)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    onStepChange({
      step: 'usdc_approved',
      message: 'USDC approval confirmed',
      hash: approveResult.hash,
    })

    // Step 4: Fund escrow
    onStepChange({ step: 'funded', message: 'Funding escrow...' })

    const fundResult = await fundEscrow(escrowAddress as Address, quotedAmount)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    onStepChange({
      step: 'funded',
      message: 'Escrow funded successfully',
      hash: fundResult.hash,
    })

    // Step 5: Confirm with backend (starts coordinator -> worker -> verifier -> payout)
    onStepChange({ step: 'confirmed', message: 'Confirming funding with backend...' })

    await jobAPI.confirmFunding(jobId, {
      tx_hash: fundResult.hash,
      escrow_address: escrowAddress,
      funded_amount_usdc: quotedAmount,
      requester_address: userAddress,
    })

    onStepChange({ step: 'confirmed', message: 'Job funded and confirmed!' })

    return { success: true, jobId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    onStepChange({ step: 'error', message: `Funding flow failed: ${errorMessage}` })
    return { success: false, error: errorMessage }
  }
}

/** Format funding flow state for UI display */
export function getFundingStepLabel(step: FundingFlowSteps['step']): string {
  const labels: Record<FundingFlowSteps['step'], string> = {
    quote: 'Calculating Quote',
    escrow_created: 'Creating Escrow',
    usdc_approved: 'Approving USDC',
    funded: 'Funding Escrow',
    confirmed: 'Confirming with Backend',
    error: 'Error',
  }
  return labels[step]
}

/** Get progress percentage for the current step */
export function getFundingProgress(step: FundingFlowSteps['step']): number {
  const progress: Record<FundingFlowSteps['step'], number> = {
    quote: 20,
    escrow_created: 40,
    usdc_approved: 60,
    funded: 80,
    confirmed: 100,
    error: 0,
  }
  return progress[step]
}
