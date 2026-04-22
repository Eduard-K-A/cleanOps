'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { Button } from '@/components/ui/button';
import { runAdminSql } from '@/app/actions/admin';
import toast from 'react-hot-toast';
import { Database, Play, AlertCircle, CheckCircle2, Table as TableIcon } from 'lucide-react';

export default function AdminSqlPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sql, setSql] = useState(`-- Migration: Add email column to profiles
-- Populating from auth.identities as requested

-- 1. Add column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update existing profiles with emails from auth.identities
UPDATE public.profiles p
SET email = identities.email
FROM (
  SELECT DISTINCT ON (user_id) user_id, identity_data->>'email' as email
  FROM auth.identities
  WHERE identity_data->>'email' IS NOT NULL
  ORDER BY user_id, created_at DESC
) as identities
WHERE p.id = identities.user_id;

-- 3. Verify the data
SELECT id, full_name, role, email FROM public.profiles LIMIT 10;`);

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSql = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await runAdminSql(sql);
      if (data.success === false && data.error) {
        setError(data.error);
      } else {
        setResults(data);
        toast.success("SQL executed successfully");
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
      toast.error("Execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden bg-slate-900">
        <NavigationDrawer isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar 
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            title="SQL Code Editor" 
          />
          
          <main className="flex-1 overflow-auto p-6 flex flex-col gap-6">
            <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 gap-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Database Console
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Execute administrative SQL queries directly against the schema.</p>
                </div>
                <Button 
                  onClick={handleRunSql} 
                  disabled={loading || !sql.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Query
                </Button>
              </div>

              {/* Editor Area */}
              <div className="flex-1 min-h-[400px] relative bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">PostgreSQL</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                </div>
                <textarea
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent text-blue-100 p-6 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                  placeholder="Enter SQL here..."
                />
              </div>

              {/* Results Area */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden min-h-[200px] flex flex-col shadow-lg">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Results</span>
                </div>
                
                <div className="flex-1 overflow-auto p-4 max-h-[400px]">
                  {loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-pulse">
                      <Play className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">Executing query...</p>
                    </div>
                  )}

                  {!loading && error && (
                    <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-red-400">Execution Error</h4>
                        <p className="text-xs text-red-300/80 mt-1 font-mono">{error}</p>
                      </div>
                    </div>
                  )}

                  {!loading && results && (
                    <div className="space-y-4">
                      {results.success ? (
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-lg border border-green-900/30">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Command executed successfully.</span>
                        </div>
                      ) : Array.isArray(results) ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-700">
                                {results.length > 0 && Object.keys(results[0]).map(key => (
                                  <th key={key} className="p-2 text-slate-400 font-medium bg-slate-900/50">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {results.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                  {Object.values(row).map((val: any, j: number) => (
                                    <td key={j} className="p-2 text-slate-300 font-mono">
                                      {val === null ? <span className="text-slate-600">NULL</span> : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {results.length === 0 && (
                            <p className="p-4 text-center text-slate-500">Query returned 0 rows.</p>
                          )}
                        </div>
                      ) : (
                        <pre className="text-xs text-slate-400 bg-black/20 p-4 rounded overflow-auto">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {!loading && !results && !error && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-8">
                      <p className="text-sm">No results to display. Run a query to see output.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
