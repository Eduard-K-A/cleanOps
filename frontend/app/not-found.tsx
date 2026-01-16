'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-slate-100 to-white px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
          <p className="text-2xl font-semibold text-slate-700">Page Not Found</p>
        </div>
        
        <p className="text-slate-600 mb-8 text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-4">
          <Link 
            href="/homepage"
            className="inline-block bg-sky-500 text-white px-8 py-3 rounded-lg font-semibold no-underline hover:bg-sky-600 transition-colors"
          >
            Go to Homepage
          </Link>
          
          <Link 
            href="/"
            className="inline-block text-sky-500 px-8 py-3 rounded-lg font-semibold no-underline hover:bg-sky-50 transition-colors border border-sky-500"
          >
            Go to Home
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Error Code: 404 | Invalid Route
          </p>
        </div>
      </div>
    </div>
  )
}
