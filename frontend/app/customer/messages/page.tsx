'use client'

import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { NavigationDrawer } from '@/components/layout/NavigationDrawer'
import { TopAppBar } from '@/components/layout/TopAppBar'
import { MessagesContent } from './MessagesContent'

export default function CustomerMessagesPage() {
  return (
    <ProtectedRoute requiredRole="customer" redirectTo="/employee/dashboard">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <NavigationDrawer />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar
            onMenuClick={() => {}}
            title="Messages"
          />

          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-500">
                Loading messages...
              </div>
            }
          >
            <MessagesContent />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  )
}
