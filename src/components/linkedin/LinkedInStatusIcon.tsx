'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '@/lib/supabase'

interface LinkedInStatus {
  connected: boolean
  profile?: {
    name: string
    headline: string
    profileUrl: string
  }
}

export function LinkedInStatusIcon() {
  const [status, setStatus] = useState<LinkedInStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkLinkedInStatus()
  }, [])

  const checkLinkedInStatus = async () => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setStatus({
        connected: response.ok && data.isConnected,
        profile: data.profile
      })
    } catch (error) {
      console.error('Error checking LinkedIn status:', error)
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    router.push('/linkedin-integration')
  }

  if (loading) {
    return (
      <button className="relative p-2 rounded-full border-2 border-gray-300 bg-gray-50">
        <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-full border-2 hover:bg-gray-50 transition-colors"
      style={{
        borderColor: status?.connected ? '#22c55e' : '#ef4444',
        backgroundColor: status?.connected ? '#f0fdf4' : '#fef2f2'
      }}
      title={status?.connected ? 'LinkedIn Connected' : 'LinkedIn Not Connected'}
    >
      {/* LinkedIn Icon */}
      <svg 
        className="w-5 h-5" 
        fill="#0077B5" 
        viewBox="0 0 24 24"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      
      {/* Status Indicator */}
      <div 
        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
        style={{
          backgroundColor: status?.connected ? '#22c55e' : '#ef4444'
        }}
      >
        {status?.connected ? (
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
    </button>
  )
}