'use client'

import React, { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Request {
  id: string
  name: string
  email: string
  rooms: number
  selectedTypes: string[]
  notes: string
  status: 'Pending' | 'Active' | 'Finished'
  createdAt: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [activeTab, setActiveTab] = useState<'Pending' | 'Active' | 'Finished'>('Pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('http://localhost:5000/api/orders')
      
      // Ensure response.data is an array and normalize each request
      const data = Array.isArray(response.data) ? response.data : []
      const normalizedRequests = data.map(req => ({
        ...req,
        selectedTypes: Array.isArray(req.selectedTypes) ? req.selectedTypes : []
      }))
      
      setRequests(normalizedRequests)
    } catch (err) {
      setError('Failed to load requests. Please try again.')
      toast.error('Failed to load requests')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(req => req.status === activeTab)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'Active':
        return 'bg-blue-50 border-blue-200'
      case 'Finished':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Active':
        return 'bg-blue-100 text-blue-800'
      case 'Finished':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-b from-slate-50 to-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">My Clean Requests</h1>
            <p className="text-slate-600">Track and manage all your cleaning requests</p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-4 border-b border-slate-200">
            {(['Pending', 'Active', 'Finished'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === tab
                    ? 'text-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-600 rounded-t-sm"></div>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                <p className="text-slate-600 mt-4">Loading requests...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={fetchRequests}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
              <div className="text-slate-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No {activeTab.toLowerCase()} requests</h3>
              <p className="text-slate-600">You don't have any {activeTab.toLowerCase()} cleaning requests at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className={`border rounded-xl p-6 transition-all hover:shadow-md ${getStatusColor(request.status)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{request.name}</h3>
                      <p className="text-slate-500 text-sm">{request.email}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 py-4 border-t border-slate-200 border-opacity-50">
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">Rooms</p>
                      <p className="text-slate-900 font-semibold">{request.rooms}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {(request.selectedTypes ?? []).map((type, idx) => (
                          <span key={idx} className="text-xs bg-white bg-opacity-60 text-slate-700 px-3 py-1 rounded-full">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium mb-1">Request Date</p>
                      <p className="text-slate-900 text-sm">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="pt-4 border-t border-slate-200 border-opacity-50">
                      <p className="text-slate-600 text-sm font-medium mb-2">Notes</p>
                      <p className="text-slate-700 text-sm leading-relaxed">{request.notes}</p>
                    </div>
                  )}

                  {request.status === 'Active' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 bg-opacity-50 px-3 py-2 rounded-lg border border-blue-200 border-opacity-50">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      Your cleaning is in progress
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
