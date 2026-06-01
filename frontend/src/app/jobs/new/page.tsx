'use client';

import { useState, useMemo } from 'react'
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useForm } from '@/hooks/useForm'
import { useWalletInfo } from '@/hooks'
import { jobAPI } from '@/lib/api-client'
import { executeJobFundingFlow, getFundingProgress, getFundingStepLabel } from '@/utils/jobFunding'
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
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [funding, setFunding] = useState(false)
  const [fundingProgress, setFundingProgress] = useState(0)
  const [fundingStatus, setFundingStatus] = useState<string>('')
  const [fundingError, setFundingError] = useState<string>('')
  const [fundedJobId, setFundedJobId] = useState<string>('')
  
  const { address, isConnected } = useWalletInfo()
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''

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

  const handleFormSubmit = async (vals: Record<string, any>) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!authToken) {
      toast.error('Please log in first')
      return
    }

    setFunding(true)
    setFundingError('')
    setFundingStatus('')
    setFundingProgress(0)

    const result = await executeJobFundingFlow(
      {
        category: vals.category,
        location: vals.location,
        source: vals.source,
        freshness: vals.freshness,
        budget: parseFloat(vals.budget),
        maxRows: parseInt(vals.maxRows) || undefined,
        description: vals.description,
      },
      address as `0x${string}`,
      authToken,
      (step) => {
        setFundingProgress(getFundingProgress(step.step))
        setFundingStatus(`${getFundingStepLabel(step.step)}: ${step.message}`)
      }
    )

    setFunding(false)

    if (result.success && result.jobId) {
      setFundedJobId(result.jobId)
      toast.success('Job funded successfully!')
      setTimeout(() => {
        router.push(`/jobs/${result.jobId}`)
      }, 2000)
    } else {
      setFundingError(result.error || 'Funding failed')
      toast.error(result.error || 'Funding failed')
    }
  }

  const { values, errors, touched, handleChange, handleBlur, resetForm } = useForm({
    initialValues: {
      category: '', location: '', source: '', freshness: 'once', budget: '', maxRows: '', compliance: false, description: '',
    },
    validate: (vals) => {
      const errs: Record<string, string> = {}
      if (step === 1) {
        if (!vals.category) errs.category = 'Please select a category'
        if (!vals.location) errs.location = 'Location is required'
      }
      if (step === 2) {
        if (!vals.source) errs.source = 'Please select a source'
        if (validators.description(vals.description)) errs.description = validators.description(vals.description)!.message
      }
      if (step === 3) {
        if (validators.budget(vals.budget)) errs.budget = validators.budget(vals.budget)!.message
        if (validators.maxRows(vals.maxRows)) errs.maxRows = validators.maxRows(vals.maxRows)!.message
        if (!vals.compliance) errs.compliance = 'You must agree to the policy'
      }
      return errs
    },
    onSubmit: handleFormSubmit,
  })

  const estimatedCost = useMemo(() => {
    const budget = parseFloat(values.budget) || 0
    return budget ? calculations.jobCost(budget * 0.6, budget * 0.15, 20) : null
  }, [values.budget])

  const handleNext = () => step < 3 && setStep(step + 1)
  const handlePrev = () => step > 1 && setStep(step - 1)

  if (funding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center">Funding Job...</h2>
          
          {fundingStatus && (
            <p className="text-center text-gray-600">{fundingStatus}</p>
          )}
          
          <div className="w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
              style={{ width: `${fundingProgress}%` }}
            />
          </div>
          
          <p className="text-center text-lg font-bold">{fundingProgress}%</p>
          
          {fundingError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {fundingError}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden pb-16 font-sans">
      
      {/* Background Motion Graphics (Glowing Orbs) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

      <div className="fade-in max-w-3xl mx-auto p-6 relative z-10 mt-4">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Create Data Job</h1>
          <p className="text-gray-600 mt-2 text-lg">Define your dataset requirements and fund the micro-bounty</p>
          <p className="text-gray-500 font-medium mt-2">Step {step} of 3</p>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-emerald-50 hover:shadow-md hover:border-emerald-200 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-4">What data do you need?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <label key={cat.id} className={`card cursor-pointer transition-all duration-300 border-2 hover:shadow-md ${values.category === cat.id ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-gray-100 hover:border-emerald-200'}`}>
                      <div className="flex items-start">
                        <input type="radio" name="category" value={cat.id} checked={values.category === cat.id} onChange={handleChange} className="mt-1 mr-3 accent-emerald-500" />
                        <div>
                          <p className="font-bold text-gray-900">{cat.label}</p>
                          <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Location *</label>
                  <FormInput name="location" value={values.location} onChange={handleChange} onBlur={handleBlur} error={touched.location ? errors.location : undefined} placeholder="e.g., Manila, PH" className="focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Freshness Requirement</label>
                  <FormSelect name="freshness" value={values.freshness} onChange={handleChange} options={[{ value: 'once', label: 'Once' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} className="focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-4">Where should we collect data from?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sources.map((src) => (
                    <label key={src.id} className={`card cursor-pointer transition-all duration-300 border-2 hover:shadow-md ${values.source === src.id ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-gray-100 hover:border-emerald-200'}`}>
                       <div className="flex items-start">
                        <input type="radio" name="source" value={src.id} checked={values.source === src.id} onChange={handleChange} className="mt-1 mr-3 accent-emerald-500" />
                        <div>
                          <p className="font-bold text-gray-900">{src.label}</p>
                          <p className="text-sm text-gray-500 mt-1">{src.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-50">
                <label className="block text-sm font-bold text-gray-700">Job Description *</label>
                <FormTextarea name="description" value={values.description} onChange={handleChange} placeholder="Describe your data requirements..." rows={5} className="focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Budget (USDC) *</label>
                  <FormInput type="number" name="budget" value={values.budget} onChange={handleChange} placeholder="e.g., 100" className="focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Max Rows to Collect *</label>
                  <FormInput type="number" name="maxRows" value={values.maxRows} onChange={handleChange} placeholder="e.g., 500" className="focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
              
              {estimatedCost && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 shadow-inner">
                  <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                    <Zap size={18} className="text-emerald-500" /> Estimated Costs
                  </h3>
                  <PaymentBreakdown workerReward={estimatedCost.total * 0.6} verificationCost={estimatedCost.total * 0.15} platformFee={estimatedCost.platformFee} total={estimatedCost.total} />
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-50">
                <label className="flex items-start cursor-pointer group">
                  <FormCheckbox name="compliance" checked={values.compliance} onChange={handleChange} className="mt-1 accent-emerald-500" />
                  <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">I agree to the data collection policy and confirm that all sources comply with applicable regulations.</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
            <button type="button" onClick={handlePrev} disabled={step === 1} className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium">
              <ArrowLeft size={18} /> Previous
            </button>
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button type="submit" className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0" disabled={funding || !isConnected}>
                {funding ? 'Funding...' : 'Create Job & Fund'} <Zap size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
