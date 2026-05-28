'use client';

import { useState, useMemo } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from '@/hooks/useForm'
import { useCreateJob, useJobQuote } from '@/hooks'
import { useWalletInfo, useUSDCApproval, useEscrowFunding } from '@/hooks/useWallet'
import { useAccount } from 'wagmi'
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  ValidationAlert,
  Alert,
  PaymentBreakdown,
  TransactionStatus,
} from '@/components/shared'
import { validators, calculations } from '@/utils'

export default function CreateJob() {
  const [step, setStep] = useState(1)
  const [transactionStatus, setTransactionStatus] = useState<'pending' | 'success' | 'error' | null>(null)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved' | 'funding' | 'complete'>('idle')
  const { isConnected } = useAccount()
  const { address } = useWalletInfo()
  const { createJob, loading: creating, error: createError } = useCreateJob()
  const { getQuote, quote, loading: quoting } = useJobQuote()
  
  // Wallet transaction hooks
  const { approve, isPending: approvalPending, isWaiting: approvalWaiting, isSuccess: approvalSuccess } = useUSDCApproval({
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    spenderAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
  })
  const { fund, isPending: fundingPending, isWaiting: fundingWaiting, isSuccess: fundingSuccess } = useEscrowFunding({
    escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
  })

  const categories = [
    { id: 'ecommerce', label: 'E-commerce Price Tracking', description: 'Track prices across marketplaces' },
    { id: 'leads', label: 'Merchant Leads', description: 'Collect merchant contact information' },
    { id: 'realestate', label: 'Real Estate Listings', description: 'Track property listings and prices' },
    { id: 'custom', label: 'Custom Source List', description: 'Provide your own sources' },
  ]

  const sources = [
    { id: 'approved', label: 'Approved Source', description: 'Pre-verified data sources' },
    { id: 'urls', label: 'Customer-provided URLs', description: 'Your own URL list' },
    { id: 'api', label: 'Official API', description: 'Official platform APIs' },
    { id: 'manual', label: 'Manual Worker', description: 'Human verification' },
  ]

  const { values, errors, touched, handleChange, handleBlur, resetForm } = useForm({
    initialValues: {
      category: '',
      location: '',
      source: '',
      freshness: 'once',
      budget: '',
      maxRows: '',
      compliance: false,
      description: '',
    },
    validate: (vals) => {
      const errs: Record<string, string> = {}

      if (step === 1) {
        if (!vals.category) errs.category = 'Please select a category'
        if (!vals.location) errs.location = 'Location is required'
      }

      if (step === 2) {
        if (!vals.source) errs.source = 'Please select a source'
        const descError = validators.description(vals.description)
        if (descError) errs.description = descError.message
      }

      if (step === 3) {
        const budgetError = validators.budget(vals.budget)
        if (budgetError) errs.budget = budgetError.message
        const maxRowsError = validators.maxRows(vals.maxRows)
        if (maxRowsError) errs.maxRows = maxRowsError.message
        if (!vals.compliance) errs.compliance = 'You must agree to the data collection policy'
      }

      return errs
    },
  })

  // Calculate estimated costs
  const estimatedCost = useMemo(() => {
    const budget = parseFloat(values.budget) || 0
    if (!budget) return null
    return calculations.jobCost(budget * 0.6, budget * 0.15, 20)
  }, [values.budget])

  const handleNext = async () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    const budgetAmount = parseFloat(values.budget)
    const toastId = toast.loading('Preparing job creation...')

    try {
      setTransactionStatus('pending')
      setApprovalStep('approving')

      // Step 1: Get price quote
      toast.loading('Getting price estimate...', { id: toastId })
      const quoteData = await getQuote({
        category: values.category,
        location: values.location,
        source: values.source,
        maxRows: parseInt(values.maxRows),
      })

      // Step 2: Approve USDC (converted to smallest units - 6 decimals for USDC)
      toast.loading('Requesting USDC approval...', { id: toastId })
      const usdcAmount = BigInt(Math.floor(budgetAmount * 1_000_000))
      
      const approvalTx = await approve({ amount: usdcAmount })
      
      if (approvalTx) {
        setApprovalStep('approved')
        toast.loading('Waiting for approval confirmation...', { id: toastId })
      }

      // Step 3: Fund escrow contract
      setApprovalStep('funding')
      toast.loading('Funding escrow contract...', { id: toastId })
      
      const fundingTx = await fund({ 
        amount: usdcAmount, 
        jobId: '' // Will be generated by backend
      })
      
      if (fundingTx) {
        toast.loading('Waiting for funding confirmation...', { id: toastId })
      }

      // Step 4: Create job record in database
      setApprovalStep('complete')
      toast.loading('Creating job in database...', { id: toastId })
      
      const jobData = await createJob({
        ...values,
        budget: budgetAmount,
        maxRows: parseInt(values.maxRows),
        estimatedCost: quoteData.totalCost,
        approvalTxHash: approvalTx?.hash || '',
        fundingTxHash: fundingTx?.hash || '',
      })

      setTransactionHash(jobData.id)
      setTransactionStatus('success')
      toast.success('✅ Job created successfully! Redirecting...', { id: toastId })
      
      setTimeout(() => {
        resetForm()
        setTransactionStatus(null)
        setApprovalStep('idle')
        window.location.href = `/jobs/${jobData.id}`
      }, 2000)
    } catch (error) {
      console.error('Job creation failed:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to create job. Please try again.'
      toast.error(errorMsg, { id: toastId })
      setTransactionStatus('error')
      setApprovalStep('idle')
      setTimeout(() => setTransactionStatus(null), 4000)
    }
  }

  if (transactionStatus === 'success') {
    return (
      <div className="fade-in">
        <TransactionStatus
          status="success"
          txHash={transactionHash}
          message="Your job has been created successfully!"
          amount={estimatedCost?.total}
        />
      </div>
    )
  }

  if (transactionStatus === 'error') {
    return (
      <div className="fade-in">
        <TransactionStatus
          status="error"
          message={createError || 'Failed to create job. Please try again.'}
        />
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Wallet Check */}
      {!isConnected && (
        <Alert
          type="warning"
          title="Wallet Not Connected"
          message="Please connect your wallet to create a data job"
          dismissible={false}
        />
      )}

      {/* Header */}
      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Data Job</h1>
        <p className="text-gray-600">Step {step} of 3</p>
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <ValidationAlert
          errors={Object.entries(errors).map(([field, message]) => ({
            field,
            message: message as string,
          }))}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                What data do you need?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className={`card cursor-pointer transition-all border-2 ${
                      values.category === cat.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={values.category === cat.id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <p className="font-semibold text-gray-900">{cat.label}</p>
                      <p className="text-sm text-gray-600">{cat.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {touched.category && errors.category && (
                <p className="text-red-600 text-sm mt-2">{errors.category}</p>
              )}
            </div>

            {/* Location & Freshness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <FormInput
                  name="location"
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.location ? errors.location : undefined}
                  placeholder="e.g., Manila, PH"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Freshness Requirement</label>
                <FormSelect
                  name="freshness"
                  value={values.freshness}
                  onChange={handleChange}
                  options={[
                    { value: 'once', label: 'Once' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Source & Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Where should we collect data from?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((src) => (
                  <label
                    key={src.id}
                    className={`card cursor-pointer transition-all border-2 ${
                      values.source === src.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="source"
                      value={src.id}
                      checked={values.source === src.id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <p className="font-semibold text-gray-900">{src.label}</p>
                      <p className="text-sm text-gray-600">{src.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {touched.source && errors.source && (
                <p className="text-red-600 text-sm mt-2">{errors.source}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Job Description *</label>
              <FormTextarea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description ? errors.description : undefined}
                placeholder="Describe your data requirements in detail (10-5000 characters)..."
                rows={5}
              />
            </div>
          </div>
        )}

        {/* Step 3: Budget & Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Budget (USDC) *</label>
                <FormInput
                  type="number"
                  name="budget"
                  value={values.budget}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.budget ? errors.budget : undefined}
                  placeholder="e.g., 100"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Max Rows to Collect *</label>
                <FormInput
                  type="number"
                  name="maxRows"
                  value={values.maxRows}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.maxRows ? errors.maxRows : undefined}
                  placeholder="e.g., 500"
                  min="0"
                />
              </div>
            </div>

            {/* Estimated Costs */}
            {estimatedCost && (
              <div className="card space-y-3 bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-gray-900">Estimated Costs</h3>
                <PaymentBreakdown
                  workerReward={estimatedCost.total * 0.6}
                  verificationCost={estimatedCost.total * 0.15}
                  platformFee={estimatedCost.platformFee}
                  total={estimatedCost.total}
                />
              </div>
            )}

            {/* Compliance */}
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <FormCheckbox
                  name="compliance"
                  checked={values.compliance}
                  onChange={handleChange}
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the data collection policy and confirm that all sources comply with applicable regulations
                </span>
              </label>
              {touched.compliance && !values.compliance && (
                <p className="text-red-600 text-sm">You must agree to proceed</p>
              )}
            </div>
          </div>
        )}
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                What data do you need?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className={`card cursor-pointer transition-all border-2 ${
                      values.category === cat.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={values.category === cat.id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <p className="font-semibold text-gray-900">{cat.label}</p>
                      <p className="text-sm text-gray-600">{cat.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {touched.category && errors.category && (
                <p className="text-red-600 text-sm mt-2">{errors.category}</p>
              )}
            </div>

            {/* Location & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <FormInput
                  name="location"
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.location ? errors.location : undefined}
                  placeholder="e.g., Manila, PH"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Freshness Requirement</label>
                <FormSelect
                  name="freshness"
                  value={values.freshness}
                  onChange={handleChange}
                  options={[
                    { value: 'once', label: 'Once' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Source & Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Where should we collect data from?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((src) => (
                  <label
                    key={src.id}
                    className={`card cursor-pointer transition-all border-2 ${
                      values.source === src.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="source"
                      value={src.id}
                      checked={values.source === src.id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <p className="font-semibold text-gray-900">{src.label}</p>
                      <p className="text-sm text-gray-600">{src.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {touched.source && errors.source && (
                <p className="text-red-600 text-sm mt-2">{errors.source}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Job Description</label>
              <FormTextarea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description ? errors.description : undefined}
                placeholder="Describe your data requirements in detail..."
                rows={5}
              />
            </div>
          </div>
        )}

        {/* Step 3: Budget & Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Budget (USDC)</label>
                <FormInput
                  type="number"
                  name="budget"
                  value={values.budget}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.budget ? errors.budget : undefined}
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Max Rows to Collect</label>
                <FormInput
                  type="number"
                  name="maxRows"
                  value={values.maxRows}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.maxRows ? errors.maxRows : undefined}
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            {/* Estimated Costs */}
            {estimatedCost && (
              <div className="card space-y-3 bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-gray-900">Estimated Costs</h3>
                <PaymentBreakdown
                  workerReward={estimatedCost.total * 0.6}
                  verificationCost={estimatedCost.total * 0.15}
                  platformFee={estimatedCost.platformFee}
                  total={estimatedCost.total}
                />
              </div>
            )}

            {/* Compliance */}
            <div className="space-y-2">
              <FormCheckbox
                name="compliance"
                checked={values.compliance}
                onChange={handleChange}
              />
              <label className="text-sm text-gray-700">
                I agree to the data collection policy and confirm that all sources comply with applicable regulations
              </label>
              {touched.compliance && !values.compliance && (
                <p className="text-red-600 text-sm">You must agree to proceed</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-8">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft size={18} /> Previous
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={quoting}
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={creating || quoting || !isConnected}
            >
              {creating ? 'Creating Job...' : 'Create Job & Fund Escrow'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
