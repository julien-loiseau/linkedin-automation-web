'use client'

import { useState, useEffect } from 'react'
import { getAuthToken } from '@/lib/supabase'
import { CommentCard } from './CommentCard'
import { CommentsPagination } from './CommentsPagination'

interface Comment {
  id: string
  comment_id: string
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
  processed_at: string
  comment_permalink?: string
}

interface PaginationInfo {
  current_page: number
  total_pages: number
  total_comments: number
  per_page: number
  has_next: boolean
  has_prev: boolean
}

interface CommentsResponse {
  comments: Comment[]
  pagination: PaginationInfo
  automation: {
    post_url: string
    has_reply_templates: boolean
  }
  total_stats?: {
    total_connected: number
    total_dms_sent: number
  }
  error?: string
}

interface CommentsSectionProps {
  automationId: string
  isOpen: boolean
  onClose: () => void
}

export function CommentsSection({ automationId, isOpen, onClose }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [automation, setAutomation] = useState<{ post_url: string; has_reply_templates: boolean } | null>(null)
  const [totalStats, setTotalStats] = useState<{ total_connected: number; total_dms_sent: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (isOpen && automationId) {
      // Clear any previous error state when opening
      setError('')
      fetchComments(1)
    } else if (!isOpen) {
      // Clear state when closing to avoid stale data
      setError('')
      setComments([])
      setPagination(null)
      setAutomation(null)
      setTotalStats(null)
      setCurrentPage(1)
    }
  }, [isOpen, automationId])

  const fetchComments = async (page: number = 1) => {
    setLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automationId}/comments?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const data: CommentsResponse = await response.json()

      if (response.ok) {
        // Explicitly clear any previous error state on success
        setError('')
        setComments(data.comments)
        setPagination(data.pagination)
        setAutomation(data.automation)
        setTotalStats(data.total_stats || null)
        setCurrentPage(page)
      } else {
        setError(data.error || 'Failed to fetch comments')
      }
    } catch (error) {
      setError('Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchComments(page)
  }

  const getConnectionStats = () => {
    // Use total stats from API instead of just current page stats
    if (totalStats) {
      return { 
        connected: totalStats.total_connected, 
        total: pagination?.total_comments || 0, 
        dmSent: totalStats.total_dms_sent 
      }
    }
    
    // Fallback to current page stats if total stats not available
    if (!comments.length) return { connected: 0, total: 0, dmSent: 0 }
    
    const connected = comments.filter(c => c.is_connected).length
    const dmSent = comments.filter(c => c.dm_sent).length
    
    return { connected, total: comments.length, dmSent }
  }

  if (!isOpen) return null

  const stats = getConnectionStats()

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Comments Details</h3>
            {pagination && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {pagination.total_comments} total comments
                </span>
                {stats.connected > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {stats.connected} connected
                  </span>
                )}
                {stats.dmSent > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {stats.dmSent} DMs sent
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && comments.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm text-gray-600">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading comments...
            </div>
          </div>
        )}

        {/* No comments state */}
        {!loading && comments.length === 0 && !error && (
          <div className="text-center py-8">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Found</h3>
              <p className="text-gray-600">This automation hasn't processed any comments yet.</p>
              <p className="text-gray-600 mt-1">Try running "Monitor Comments" to fetch recent comments.</p>
            </div>
          </div>
        )}

        {/* Comments list */}
        {comments.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  automationId={automationId}
                  hasReplyTemplates={automation?.has_reply_templates || false}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <CommentsPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}

        {/* Footer with refresh button */}
        <div className="mt-6 flex justify-between items-center border-t border-gray-200 pt-4">
          <button
            onClick={() => fetchComments(currentPage)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}