'use client';

import { useEffect, useState } from 'react';
import {
  Save, Loader2, Globe, Building2, Upload, X,
  CheckCircle2, Check, Star, Shield, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

const INDUSTRY_OPTIONS = [
  'Technology', 'Fashion & Apparel', 'Food & Beverage', 'Beauty & Wellness',
  'Finance & Fintech', 'Gaming', 'Travel & Hospitality', 'Health & Fitness',
  'E-commerce', 'Education', 'Entertainment', 'Sports', 'Automotive', 'Home & Lifestyle',
];

/* ── Premium input ── */
function PremiumInput({
  label, value, onChange, placeholder, textarea, rows = 4, prefix, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  prefix?: React.ReactNode;
  hint?: string;
}) {
  const base =
    'w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg text-sm text-white placeholder-[#3d3d3d] focus:outline-none focus:border-[#404040] transition-colors duration-200';
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">{prefix}</span>
        )}
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={cn(base, 'px-4 py-3 resize-none leading-relaxed')}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(base, 'px-4 py-3 h-11', prefix && 'pl-9')}
          />
        )}
      </div>
      {hint && <p className="text-[11px] text-[#4b5563] mt-1">{hint}</p>}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-[#6b7280] mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function OrgProfilePage() {
  const { user } = useUserStore();
  const [saving, setSaving] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => {
      setBrandName(data?.name || '');
      setDescription(data?.bio || '');
      setWebsiteUrl(data?.website_url || '');
      setPicUrl(data?.profile_picture_url || '');
      setIndustries(data?.industries || []);
    }).catch(() => {});
  }, [user?.id]);

  const toggleIndustry = (i: string) =>
    setIndustries((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateMe({
        name: brandName,
        bio: description,
        profile_picture_url: picUrl || null,
      });
      toast.success('Brand profile updated!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Sticky Header Bar ── */}
      <div className="sticky top-0 z-10" style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Brand Account</p>
            <h1 className="text-lg font-bold text-white leading-none mt-0.5">Brand Profile</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ── Left Sidebar ── */}
          <div className="space-y-4">

            {/* Brand Identity Card */}
            <div className="rounded-xl p-6 text-center space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex justify-center">
                {picUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={picUrl}
                    alt="Brand Logo"
                    className="w-20 h-20 rounded-xl object-cover"
                    style={{ border: '2px solid #222222' }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center"
                    style={{ background: '#1a1a1a', border: '2px solid #222222' }}
                  >
                    <Building2 size={28} className="text-[#4b5563]" />
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold text-lg text-white leading-tight">{brandName || 'Your Brand'}</p>
                <p className="text-xs text-[#4b5563] truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold bg-white text-black">
                  Brand Account
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold text-[#d1d5db]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                  <Star size={10} className="fill-[#f59e0b] text-[#f59e0b]" /> 4.5 Rep
                </span>
              </div>

              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors"
                >
                  <Globe size={11} />
                  {websiteUrl.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}
            </div>

            {/* Account Stats */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Account Status</p>
              {[
                { icon: CheckCircle2, label: 'Identity Verified', value: 'Verified', color: '#22c55e' },
                { icon: Star, label: 'Brand Reputation', value: '4.5 / 5', color: '#f59e0b' },
                { icon: Shield, label: 'Escrow Protected', value: 'Active', color: '#60a5fa' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #161616' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <span className="text-xs text-[#9ca3af]">{label}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Industry Tags (read-only preview) */}
            {industries.length > 0 && (
              <div className="rounded-xl p-5 space-y-3" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Industry Verticals</p>
                <div className="flex flex-wrap gap-1.5">
                  {industries.map((ind) => (
                    <span
                      key={ind}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#d1d5db]"
                      style={{ background: '#1a1a1a', border: '1px solid #222222' }}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Payment Wallet</p>
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              </div>
              <p className="text-xs text-[#4b5563] leading-relaxed">
                This wallet funds escrow contracts when you post deals.
              </p>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
                <Wallet size={12} className="text-[#6b7280] flex-shrink-0" />
                <span className="text-[11px] font-mono text-[#9ca3af] truncate select-all">
                  {user?.walletAddress ?? 'No wallet connected'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Main Content ── */}
          <div className="space-y-5">

            {/* Brand Info */}
            <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <SectionHeader title="Brand Information" subtitle="Your public-facing brand details" />
              <div className="space-y-5">

                {/* Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
                    Brand Logo
                  </label>
                  {picUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={picUrl} alt="Logo Preview" className="w-16 h-16 rounded-xl object-cover" style={{ border: '1px solid #222222' }} />
                        <button
                          type="button"
                          onClick={() => setPicUrl('')}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <p className="text-xs text-[#6b7280]">Click × to remove and upload a new logo.</p>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center h-28 cursor-pointer rounded-xl transition-colors hover:border-[#404040]"
                      style={{ border: '1.5px dashed #222222', background: '#0f0f0f' }}
                    >
                      <Upload size={18} className="text-[#4b5563] mb-2" />
                      <p className="text-sm font-semibold text-[#9ca3af]">Upload Logo</p>
                      <p className="text-[11px] text-[#4b5563] mt-0.5">PNG, JPG, SVG or WEBP</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setPicUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <PremiumInput
                  label="Brand Name"
                  value={brandName}
                  onChange={setBrandName}
                  placeholder="Acme Corp"
                />

                <PremiumInput
                  label="About Your Brand"
                  value={description}
                  onChange={setDescription}
                  placeholder="What does your brand do and who is your target audience?"
                  textarea
                  rows={4}
                />

                <PremiumInput
                  label="Website"
                  value={websiteUrl}
                  onChange={setWebsiteUrl}
                  placeholder="https://yourbrand.com"
                  prefix={<Globe size={14} className="text-[#4b5563]" />}
                />
              </div>
            </div>

            {/* Industry Verticals */}
            <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <SectionHeader
                title="Industry Verticals"
                subtitle="Select the categories that best describe your brand — this helps creators discover you"
              />
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((ind) => {
                  const active = industries.includes(ind);
                  return (
                    <button
                      key={ind}
                      onClick={() => toggleIndustry(ind)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                        active
                          ? 'bg-white text-black border-white'
                          : 'text-[#9ca3af] border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#333333] hover:text-white'
                      )}
                    >
                      {active && <Check size={11} />}
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-all duration-150 disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Brand Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
