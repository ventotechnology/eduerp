'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Tag,
  ShoppingBag,
  Zap,
  Users,
  KeyRound,
  Settings,
  FileText,
  Activity,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  Server,
  Plus,
  Headphones,
  MessageSquare,
  BookOpen,
  HelpCircle,
  Sparkles,
  Phone,
  Clock
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Overview', href: '/super-admin', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Commercial & Tenants',
    items: [
      { label: 'Institutions', href: '/super-admin/institutions', icon: Building2 },
      { label: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard },
      { label: 'Plans & Pricing', href: '/super-admin/plans', icon: Tag },
      { label: 'Orders & Revenue', href: '/super-admin/orders', icon: ShoppingBag },
      { label: 'Payment Gateways', href: '/super-admin/gateways', icon: Zap },
      { label: 'Universal SMS', href: '/super-admin/sms', icon: MessageSquare }
    ]
  },
  {
    title: 'Client Success & Support',
    items: [
      { label: 'Support Desk', href: '/super-admin/support', icon: Headphones },
      { label: 'Ticket Queue', href: '/super-admin/support/tickets', icon: FileText },
      { label: 'Sales Inquiries', href: '/super-admin/inquiries', icon: MessageSquare },
      { label: 'Knowledge Base', href: '/super-admin/knowledge', icon: BookOpen },
      { label: 'FAQs CMS', href: '/super-admin/faqs', icon: HelpCircle },
      { label: 'Release Notes', href: '/super-admin/releases', icon: Sparkles }
    ]
  },
  {
    title: 'Platform & Controls',
    items: [
      { label: 'Platform Users', href: '/super-admin/users', icon: Users },
      { label: 'Contact Settings', href: '/super-admin/contact-settings', icon: Phone },
      { label: 'SLA Policies', href: '/super-admin/sla', icon: Clock },
      { label: 'Demo Vault', href: '/super-admin/demo-credentials', icon: KeyRound },
      { label: 'Platform Settings', href: '/super-admin/settings', icon: Settings },
      { label: 'Audit Logs', href: '/super-admin/audit', icon: FileText },
      { label: 'System Health', href: '/super-admin/health', icon: Activity }
    ]
  }
];

export default function SuperAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function verifySuperAdminAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user?.isPlatformAdmin) {
          setSessionUser(data.user);
        } else {
          router.push(`/login?redirect=${encodeURIComponent(pathname || '/super-admin')}`);
        }
      } catch {
        router.push('/login');
      } finally {
        setCheckingAuth(false);
      }
    }
    verifySuperAdminAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-wider uppercase text-slate-400">
          Authenticating SaaS Platform Control Plane...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Platform Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <Link href="/super-admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-sm">
                EP
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  EduERP SaaS
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase block">
                  Control Plane
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {NAV_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {group.title && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 block">
                    {group.title}
                  </span>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Identity & Logout */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {sessionUser?.name?.[0] || 'A'}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-white truncate">
                    {sessionUser?.name || 'Super Admin'}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate">
                    {sessionUser?.email}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Link href="/super-admin" className="hover:text-white transition">
                Platform Control
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200 capitalize">
                {pathname.replace('/super-admin', '').replace('/', '') || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SaaS Production Engine</span>
            </div>

            <Link
              href="/super-admin/institutions"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Institution</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition hidden sm:flex items-center gap-1"
            >
              <span>Public Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
