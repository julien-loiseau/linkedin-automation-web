'use client'

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
  comment_url?: string
  processed_at: string
}

interface CommentCardProps {
  comment: Comment
}

export function CommentCard({ comment }: CommentCardProps) {
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
    if (!comment.dm_sent) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          No DM
        </span>
      )
    }

    const statusColors = {
      sent: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[comment.dm_status as keyof typeof statusColors] || 'bg-green-100 text-green-800'
      }`}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        DM Sent
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