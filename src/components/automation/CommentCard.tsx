'use client'

import { useState } from 'react'
import { getAuthToken } from '@/lib/supabase'

interface Comment {
  id: string
  comment_text: string
  commenter_name: string
  commenter_profile_url?: string
  commenter_headline?: string
  commenter_company?: string
  comment_created_at: string
  connection_degree: '1st' | '2nd' | '3rd+' | 'unknown'
  is_connected: boolean
  matches_criteria: boolean
  keyword_matched?: string
  dm_sent: boolean
  dm_sent_at?: string
  dm_status?: string
  processing_status?: 'pending' | 'skipped_existing' | 'dm_sent' | 'failed'
  comment_url?: string
  processed_at: string
}

interface CommentCardProps {
  comment: Comment
  automationId: string
}

export function CommentCard({ comment, automationId }: CommentCardProps) {
  const [testing, setTesting] = useState(false)

  const testMessage = async () => {
    setTesting(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        alert('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automationId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetCommenter: {
            name: comment.commenter_name,
            profileUrl: comment.commenter_profile_url
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Test message sent to ${comment.commenter_name}!`)
      } else {
        alert(`❌ Failed to send test message: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Test message error:', error)
      alert('❌ Failed to send test message')
    } finally {
      setTesting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getConnectionBadgeColor = (degree: string) => {
    switch (degree) {
      case '1st':
        return 'bg-green-100 text-green-800 border-green-200'
      case '2nd':
      case '3rd+':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getDMStatusIcon = () => {
    const status = comment.processing_status || 'pending'
    
    const statusConfig = {
      pending: {
        color: 'bg-blue-100 text-blue-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        text: 'Pending'
      },
      skipped_existing: {
        color: 'bg-gray-100 text-gray-600',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
        text: 'Skipped'
      },
      dm_sent: {
        color: 'bg-green-100 text-green-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        text: 'Sent'
      },
      failed: {
        color: 'bg-red-100 text-red-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        text: 'Failed'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    )
  }

  return (
    <div className="border border-gray-200 rounded-md p-3 bg-white hover:shadow-sm transition-shadow">
      {/* Compact header with all info on one line */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900">
              {comment.commenter_profile_url ? (
                <a 
                  href={comment.commenter_profile_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  {comment.commenter_name}
                </a>
              ) : (
                comment.commenter_name
              )}
            </h4>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${
              getConnectionBadgeColor(comment.connection_degree)
            }`}>
              {comment.connection_degree}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(comment.comment_created_at)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={testMessage}
            disabled={testing}
            className="inline-flex items-center px-2 py-1 border border-green-300 shadow-sm text-xs leading-4 font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50"
          >
            {testing ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Test Message
              </>
            )}
          </button>
          {getDMStatusIcon()}
        </div>
      </div>

      {/* Comment text - more compact */}
      <div className="mb-2">
        <p className="text-sm text-gray-700 leading-snug">
          "{comment.comment_text}"
        </p>
      </div>

      {/* Footer with metadata - single line */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          {comment.keyword_matched && (
            <span className="flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {comment.keyword_matched}
            </span>
          )}
          {comment.comment_url && (
            <a
              href={comment.comment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on LinkedIn
            </a>
          )}
        </div>
        {comment.matches_criteria ? (
          <span className="flex items-center text-green-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Matches criteria
          </span>
        ) : (
          <span className="flex items-center text-red-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Did not match criteria
          </span>
        )}
      </div>
    </div>
  )
}