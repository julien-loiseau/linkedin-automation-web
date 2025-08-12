'use client'

import { useState, useEffect } from 'react'
import { getAuthToken } from '@/lib/supabase'

interface DailyStats {
  messages: {
    sentToday: number
    scheduledToday: number
    dailyLimit: number
    availableToday: number
  }
  replies: {
    sentToday: number
    scheduledToday: number
    dailyLimit: number
    availableToday: number
  }
  nextResetTime: string
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

  // Calculate percentages for progress bars (only sent/completed items)
  const messageSentPercentage = Math.round(stats.messages.sentToday / stats.messages.dailyLimit * 100)
  const replySentPercentage = Math.round(stats.replies.sentToday / stats.replies.dailyLimit * 100)
  
  // Calculate total usage percentage for status determination (sent + scheduled)
  const messageTotalPercentage = Math.round((stats.messages.sentToday + stats.messages.scheduledToday) / stats.messages.dailyLimit * 100)
  const replyTotalPercentage = Math.round((stats.replies.sentToday + stats.replies.scheduledToday) / stats.replies.dailyLimit * 100)
  
  const isMessageNearLimit = messageTotalPercentage >= 80
  const isMessageAtLimit = messageTotalPercentage >= 100
  const isReplyNearLimit = replyTotalPercentage >= 80
  const isReplyAtLimit = replyTotalPercentage >= 100

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

  const getStatusColor = (isAtLimit: boolean, isNearLimit: boolean) => {
    if (isAtLimit) return 'text-red-600 bg-red-50'
    if (isNearLimit) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getProgressBarColor = (isAtLimit: boolean, isNearLimit: boolean) => {
    if (isAtLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const getStatusText = (isAtLimit: boolean, isNearLimit: boolean) => {
    if (isAtLimit) return 'Limit Reached'
    if (isNearLimit) return 'Near Limit'
    return 'Available'
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-900">Daily Limits</h3>
          <div className="ml-2 group relative">
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Daily limits to comply with LinkedIn restrictions
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        
        <span className="text-gray-500 text-xs">
          Resets in {getTimeUntilReset()}
        </span>
      </div>

      <div className="space-y-4">
        {/* Messages Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Messages</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isMessageAtLimit, isMessageNearLimit)}`}>
              {getStatusText(isMessageAtLimit, isMessageNearLimit)}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(isMessageAtLimit, isMessageNearLimit)}`}
              style={{ width: `${Math.min(messageSentPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-900 font-medium">
              {stats.messages.sentToday} / {stats.messages.dailyLimit}
            </span>
            <span className="text-gray-500">
              ({stats.messages.sentToday} sent, {stats.messages.scheduledToday} scheduled)
            </span>
          </div>
        </div>

        {/* Replies Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Replies to comment</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isReplyAtLimit, isReplyNearLimit)}`}>
              {getStatusText(isReplyAtLimit, isReplyNearLimit)}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(isReplyAtLimit, isReplyNearLimit)}`}
              style={{ width: `${Math.min(replySentPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-900 font-medium">
              {stats.replies.sentToday} / {stats.replies.dailyLimit}
            </span>
            <span className="text-gray-500">
              ({stats.replies.sentToday} sent, {stats.replies.scheduledToday} scheduled)
            </span>
          </div>
        </div>

        {/* Additional info when at/near limit */}
        {(isMessageAtLimit || isReplyAtLimit) && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            🚫 Daily limit reached for {isMessageAtLimit && isReplyAtLimit ? 'messages and replies' : isMessageAtLimit ? 'messages' : 'replies'}. New items will be scheduled for tomorrow at 9 AM.
          </div>
        )}
        
        {((isMessageNearLimit && !isMessageAtLimit) || (isReplyNearLimit && !isReplyAtLimit)) && !(isMessageAtLimit || isReplyAtLimit) && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
            ⚠️ Approaching daily limit. 
            {isMessageNearLimit && !isMessageAtLimit && ` ${stats.messages.availableToday} messages remaining.`}
            {isReplyNearLimit && !isReplyAtLimit && ` ${stats.replies.availableToday} replies remaining.`}
          </div>
        )}
      </div>
    </div>
  )
}