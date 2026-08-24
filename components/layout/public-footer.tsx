'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Shield,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-emerald-500/20">
                E
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white">
                  EduERP
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase -mt-0.5">
                  Institutional OS
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified multi-institution Education Operating System built for Schools, Colleges, Madrasahs, Universities & Technical Institutes.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gulshan-2, Dhaka-1212, Bangladesh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>support@eduerp.us</span>
              </div>
            </div>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Institutional Verticals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/demo" className="hover:text-emerald-400 transition">K-12 School Engine</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">College & HSC Engine</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">School & College Combined</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">Madrasha & 30-Para Hifz</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">University & Semester Credit</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">Polytechnic & BTEB Diploma</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">Vocational & Technical Training</Link></li>
            </ul>
          </div>

          {/* Product & Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform & Demos</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/pricing" className="hover:text-emerald-400 transition">Pricing & Packages</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition">Interactive Demo Showroom</Link></li>
              <li><Link href="/results" className="hover:text-emerald-400 transition">Public Result Verification</Link></li>
              <li><Link href="/login" className="hover:text-emerald-400 transition">Institutional Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-emerald-400 transition">Start 14-Day Free Trial</Link></li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy & Student Data</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition">Terms of Service & SLAs</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition">Contact & Sales Hotline</Link></li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 font-mono">
                  <Shield className="w-3 h-3" />
                  <span>PostgreSQL 16 • AES-256 Encrypted</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 EduERP OS by Vento Technology. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-400 transition">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-400 transition">Terms of Service</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-400 transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
