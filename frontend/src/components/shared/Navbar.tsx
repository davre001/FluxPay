'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap, LayoutDashboard, Briefcase, User, Wallet, Star,
  LogOut, Menu, X, ChevronRight, Building2, Search, FileText,
} from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/react';
import { useUserStore } from '@/stores/userStore';

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
  { href: '/organization/jobs/active', label: 'Active Jobs', icon: Zap },
  { href: '/organization/jobs',      label: 'All Jobs',     icon: Briefcase },
  { href: '/jobs/new',               label: 'Post a Job',   icon: Building2 },
  { href: '/organization/profile',   label: 'Profile',      icon: User },
  { href: '/organization/wallet',    label: 'Wallet',       icon: Wallet },
  { href: '/organization/reputation',label: 'Reputation',   icon: Star },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const { address, isConnected } = useAccount();
  const { connect } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();

  const links = user?.profileType === 'organization' ? orgLinks : creatorLinks;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    // Disconnect Web3Auth too (with cleanup) so the embedded wallet widget is
    // torn down — otherwise the floating wallet button lingers until a refresh.
    try {
      if (isConnected) await disconnect({ cleanup: true });
    } catch {
      // ignore — still clear the local session below
    }
    logout();
    router.push('/');
  };

  // Onboarding pages — no sidebar even when authenticated
  const isOnboarding = pathname.startsWith('/onboarding');
  const isLandingPage = pathname === '/';

  // Public landing pages OR onboarding — minimal top navbar only
  if (!isAuthenticated || isOnboarding || isLandingPage) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
           style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="container-custom flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Flux<span className="gradient-text">Pay</span></span>
          </Link>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                href={user?.profileType === 'organization' ? '/organization/dashboard' : '/creator/dashboard'}
                className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
          {!isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-2 px-5 btn-shimmer">Get Started</Link>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40 border-r border-white/5"
             style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(24px)' }}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Flux<span className="gradient-text">Pay</span></span>
          </Link>
        </div>

        {/* Profile badge */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
               style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.email}</p>
              <span className={`badge text-xs mt-0.5 ${user?.profileType === 'organization' ? 'badge-cyan' : 'badge-purple'}`}>
                {user?.profileType === 'organization' ? 'Brand' : 'Creator'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {isActive(href) && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          ))}
        </nav>

        {/* Wallet + Logout */}
        <div className="px-4 py-4 border-t border-white/5 space-y-3">
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <Wallet size={14} className="text-brand-400" />
              <span className="truncate">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            </button>
          ) : (
            <button
              onClick={() => connect()}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <Wallet size={14} className="text-brand-400" />
              <span>Connect Wallet</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 border-b border-white/5"
              style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-base text-white">Flux<span className="gradient-text">Pay</span></span>
        </Link>
        <button className="text-slate-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16"
             style={{ background: 'rgba(10,10,15,0.98)' }}>
          <nav className="p-4 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/5">
              <button onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400">
                <LogOut size={15} /> Sign out
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