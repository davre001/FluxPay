'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/jobs/new', label: 'Create Job' },
    { href: '/workers', label: 'Workers' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-emerald-100">
      <div className="container-custom flex items-center justify-between py-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
          <div className="bg-emerald-500 p-1.5 rounded-lg group-hover:bg-emerald-600 transition-colors">
            <Zap className="text-white" size={20} />
          </div>
          <span className="text-gray-900">FluxPay</span>
        </Link>

        {/* Desktop Navigation (Bigger text) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base font-bold transition-all duration-200 ${
                isActive(link.href)
                  ? 'text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet Button */}
        <div className="hidden md:flex items-center">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm">
            <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100">
          <div className="container-custom py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-base font-bold transition-colors ${
                  isActive(link.href)
                    ? 'text-emerald-600'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-emerald-50">
              <div className="bg-white/80 backdrop-blur-sm inline-block px-3 py-1.5 rounded-2xl border border-emerald-200 text-sm">
                <ConnectButton showBalance={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}