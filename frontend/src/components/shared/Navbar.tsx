'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap, LayoutDashboard, Briefcase, User, Wallet, Star,
  LogOut, Menu, X, ChevronRight, Building2, FileText,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react';
import { useUserStore } from '@/stores/userStore';
import { profileAPI } from '@/lib/api-client';

const creatorLinks = [
  { href: '/creator/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/creator/deals',     label: 'Active Deals', icon: Briefcase },
  { href: '/creator/applications', label: 'Applications', icon: FileText },
  { href: '/creator/profile',   label: 'Profile',      icon: User },
  { href: '/creator/wallet',    label: 'Wallet',       icon: Wallet },
  { href: '/creator/reputation',label: 'Reputation',   icon: Star },
];

const orgLinks = [
  { href: '/organization/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/organization/jobs',      label: 'All Jobs',     icon: Briefcase },
  { href: '/organization/jobs/new',  label: 'Post a Deal',  icon: Building2 },
  { href: '/organization/approvals', label: 'Approvals',    icon: Zap },
  { href: '/organization/profile',   label: 'Profile',      icon: User },
  { href: '/organization/wallet',    label: 'Wallet',       icon: Wallet },
  { href: '/organization/reputation',label: 'Reputation',   icon: Star },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const { address, isConnected } = useAccount();
  const { connect } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => setProfileName(data?.name || '')).catch(() => {});
  }, [user?.id]);

  const links = user?.profileType === 'organization' ? orgLinks : creatorLinks;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      if (isConnected) await disconnect({ cleanup: true });
    } catch {}
    logout();
    router.push('/');
  };

  const isOnboarding = pathname.startsWith('/onboarding');
  const isLandingPage = pathname === '/';

  if (!isAuthenticated || isOnboarding || isLandingPage) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
           style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="container-custom flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Flux<span className="text-[#6b7280]">Pay</span></span>
          </Link>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                href={user?.profileType === 'organization' ? '/organization/dashboard' : '/creator/dashboard'}
                className="text-sm font-semibold text-[#d1d5db] hover:text-white transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-[#6b7280] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
          {!isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-semibold text-[#d1d5db] hover:text-white transition-colors">Log in</Link>
              <Link href="/auth/signup?type=organization" className="bg-white text-black hover:bg-[#f0f0f0] text-xs py-2 px-5 font-bold transition-all rounded-lg active:scale-95">Sign up</Link>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40"
             style={{ background: '#050505', borderRight: '1px solid #161616', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
        
        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid #161616' }}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Flux<span className="text-[#6b7280]">Pay</span></span>
          </Link>
        </div>

        {/* Profile badge */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #161616' }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-[#111111]"
               style={{ border: '1px solid #1a1a1a' }}>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black text-xs font-black">
              {(profileName || user?.email)?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{profileName || user?.email}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                {user?.profileType === 'organization' ? 'Brand' : 'Creator'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-[#6b7280] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet + Logout */}
        <div className="px-5 py-5 space-y-3" style={{ borderTop: '1px solid #161616' }}>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-xs font-bold text-[#d1d5db] hover:text-white hover:bg-[#111111] transition-all"
              style={{ border: '1px solid #1a1a1a' }}
            >
              <Wallet size={14} className="text-[#22c55e]" />
              <span className="truncate">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            </button>
          ) : (
            <button
              onClick={() => connect()}
              className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-xs font-bold text-[#d1d5db] hover:text-white hover:bg-[#111111] transition-all"
              style={{ border: '1px solid #1a1a1a' }}
            >
              <Wallet size={14} className="text-[#6b7280]" />
              <span>Connect Wallet</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-xs font-bold text-[#6b7280] hover:text-[#ef4444] hover:bg-[#1a0f0f] transition-all"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 border-b border-white/5"
              style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <Zap size={14} className="text-black" />
          </div>
          <span className="font-extrabold text-base text-white">Flux<span className="text-[#6b7280]">Pay</span></span>
        </Link>
        <button className="text-[#6b7280] hover:text-white transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16"
             style={{ background: '#050505' }}>
          <nav className="p-5 space-y-2">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-[#6b7280] hover:text-white hover:bg-[#111111]'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
            <div className="pt-5 mt-2" style={{ borderTop: '1px solid #161616' }}>
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-bold text-[#6b7280] hover:text-[#ef4444] transition-colors">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop content offset */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
}