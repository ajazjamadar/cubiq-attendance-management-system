'use client';

import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle2, ChevronRight, X, HardDrive } from 'lucide-react';
import { StorageDriverType } from '@/lib/db';

interface StorageModeBannerProps {
  mode: StorageDriverType;
}

export default function StorageModeBanner({ mode }: StorageModeBannerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isPostgres = mode === 'postgres_sql';
  const isSheets = mode === 'google_sheets';
  const isFile = mode === 'local_file';

  let bannerClass = 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200';
  let title = 'Storage: Persistent Disk File Active';
  let subtitle = 'All records are saved immediately to data/cubic_database.json across restarts.';

  if (isPostgres) {
    bannerClass = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200';
    title = 'Storage: PostgreSQL / Vercel Postgres Connected';
    subtitle = 'All tables and records are actively managed in your SQL database.';
  } else if (isSheets) {
    bannerClass = 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-200';
    title = 'Storage: Google Sheets Connected';
    subtitle = 'All rows are persisting directly into Google Sheets.';
  }

  return (
    <>
      <div className={`px-4 py-2 border-b text-xs flex items-center justify-between transition-colors ${bannerClass}`}>
        <div className="flex items-center gap-2 max-w-4xl">
          {isPostgres || isSheets ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="font-semibold">{title}</span>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">• {subtitle}</span>
        </div>

        <div className="flex items-center gap-3">
          {isFile && (
            <button
              onClick={() => setShowDetails(true)}
              className="font-medium underline hover:text-blue-950 dark:hover:text-blue-100 flex items-center gap-0.5"
            >
              Vercel SQL Setup <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-800 dark:text-white">Hosting on Vercel with SQL Database</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-3">
              <p>
                To host on <strong>Vercel with a real PostgreSQL database</strong> in 2 minutes:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>
                  Push this project to GitHub and import it into <strong>Vercel</strong>.
                </li>
                <li>
                  In your Vercel Project Dashboard, click the <strong>Storage</strong> tab and choose <strong>Postgres</strong> (or Neon / Supabase).
                </li>
                <li>
                  Click <strong>Connect to Project</strong>. Vercel automatically injects <code>POSTGRES_URL</code> into your environment variables!
                </li>
                <li>
                  That's it! When the app boots on Vercel, it automatically runs <code>CREATE TABLE IF NOT EXISTS</code> for all 5 tables and seeds initial data.
                </li>
              </ol>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
