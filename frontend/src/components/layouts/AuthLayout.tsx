import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const brandName = 'SafariDesk';
  const brandInitials = brandName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 dark:text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40 dark:opacity-30 bg-[radial-gradient(circle_at_20%_20%,#34d399,transparent_25%),radial-gradient(circle_at_80%_0%,#22d3ee,transparent_25%),radial-gradient(circle_at_50%_80%,#a5f3fc,transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,118,110,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,118,110,0.08)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50 dark:opacity-20" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 min-h-screen">
        {/* Brand / Story panel */}
        <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-between space-y-10">
          <div className="flex items-center gap-4">
            {/* {businessLogoUrl ? (
              <img
                src={businessLogoUrl}
                alt={`${brandName} logo`}
                className="h-12 w-12 rounded-xl bg-white/10 p-2 backdrop-blur object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-lg font-semibold uppercase text-white shadow-lg">
                {brandInitials || 'SD'}
              </div>
            )} */}
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-200">Welcome</p>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{brandName}</h1>
              <p className="text-sm text-slate-600 dark:text-emerald-100">Workspace access</p>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur-xl shadow-2xl space-y-6 dark:bg-white/5 dark:border-white/10">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-200 mb-2">Purpose-built for support</p>
              <h2 className="text-3xl font-semibold leading-tight text-slate-900 dark:text-white">Keep tickets, SLAs, and knowledge in one flow</h2>
            </div>
            <p className="text-slate-700 dark:text-emerald-100 text-sm leading-relaxed">
              Sign back into {brandName} to pick up work where you left off—triage new requests, resolve incidents faster, and keep your customers informed.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 bg-white/80 border border-emerald-100 rounded-xl p-4 dark:bg-white/5 dark:border-white/10">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-teal-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Secured access</p>
                  <p className="text-xs text-slate-600 dark:text-emerald-100">OTP and password flows keep your workspace safe.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/80 border border-emerald-100 rounded-xl p-4 dark:bg-white/5 dark:border-white/10">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-teal-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Unified experience</p>
                  <p className="text-xs text-slate-600 dark:text-emerald-100">Tickets, approvals, knowledge, and updates in one clean hub.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-700 dark:text-emerald-100">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </div>
        </div>

        {/* Sign-in panel */}
        <div className="w-full lg:w-[420px]">
          <div className="bg-white/90 text-slate-900 rounded-2xl shadow-2xl border border-emerald-100/70 p-8 backdrop-blur dark:bg-gray-900/90 dark:text-gray-100 dark:border-white/10">
            {children}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">Powered by</span>
                <a href="https://safaridesk.io/privacy-policy/" target="_blank" rel="noreferrer" className="font-semibold text-emerald-600 dark:text-emerald-100 hover:text-emerald-700 dark:hover:text-emerald-200">
                  Safaridesk
                </a>
              </div>
              <div className="flex items-center gap-4">
                <a href="https://safaridesk.io/privacy-policy/" target="_blank" rel="noreferrer" className="hover:text-emerald-700 dark:hover:text-emerald-200">
                  Terms of Service
                </a>
                <a href="https://safaridesk.io/privacy-policy/" target="_blank" rel="noreferrer" className="hover:text-emerald-700 dark:hover:text-emerald-200">
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
