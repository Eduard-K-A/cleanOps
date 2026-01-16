'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CatchAllProps {
  params: {
    slug: string[]
  }
}

export default function CatchAll({ params }: CatchAllProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to homepage for any non-existent route
    router.replace('/homepage')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-lg text-slate-600 mb-8">Redirecting you to the homepage...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
      </div>
    </div>
  )
}
