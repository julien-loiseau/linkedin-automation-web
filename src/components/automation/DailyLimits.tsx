'use client'

import { useState, useEffect } from 'react'
import { getAuthToken } from '@/lib/supabase'

interface DailyStats {
  sentToday: number
  scheduledToday: number
  dailyLimit: number
  nextResetTime: string
  availableToday: number
}

export function DailyLimits() {
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDailyStats = async () => {
    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/daily-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch daily stats')
      }

      const data = await response.json()
      setStats(data)
      setError('')
    } catch (err) {
      console.error('Error fetching daily stats:', err)
      setError('Failed to load daily limits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDailyStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-600">{error || 'Unable to load daily limits'}</p>
      </div>
    )
  }

  const percentage = Math.round((stats.sentToday + stats.scheduledToday) / stats.dailyLimit * 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  // Calculate time until reset
  const getTimeUntilReset = () => {
    const now = new Date()
    const resetTime = new Date(stats.nextResetTime)
    const diffMs = resetTime.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'Soon'
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-600 bg-red-50'
    if (isNearLimit) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getProgressBarColor = () => {
    if (isAtLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-900">Daily Message Limit</h3>
          <div className="ml-2 group relative">
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Daily limit to comply with LinkedIn restrictions
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {isAtLimit ? 'Limit Reached' : isNearLimit ? 'Near Limit' : 'Available'}
        </div>
      </div>

      <div className="space-y-2">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>

        {/* Stats display */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-900 font-medium">
              {stats.sentToday + stats.scheduledToday} / {stats.dailyLimit}
            </span>
            <span className="text-gray-500">
              ({stats.sentToday} sent, {stats.scheduledToday} scheduled)
            </span>
          </div>
          
          <span className="text-gray-500 text-xs">
            Resets in {getTimeUntilReset()}
          </span>
        </div>

        {/* Additional info when at/near limit */}
        {isAtLimit && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            🚫 Daily limit reached. New messages will be scheduled for tomorrow at 9 AM.
          </div>
        )}
        
        {isNearLimit && !isAtLimit && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
            ⚠️ Approaching daily limit. {stats.availableToday} messages remaining today.
          </div>
        )}
      </div>
    </div>
  )
}