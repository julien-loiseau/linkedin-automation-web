'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthToken } from '@/lib/supabase'
import { CommentsSection } from './CommentsSection'
import { EditAutomationModal } from './EditAutomationModal'
import { useConfig } from '@/hooks/useConfig'

interface Automation {
  id: string
  name: string
  post_url: string
  status: string
  message_template: string
  resource_type: string | null
  file_name: string | null
  engagement_criteria: any
  keywords?: string[]
  created_at: string
}

interface AutomationStats {
  totalComments: number
  matchingComments: number
  messagesSent: number
  keyword: string | null
}

export function AutomationList() {
  const { user } = useAuth()
  const { config } = useConfig()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [testingId, setTestingId] = useState<string | null>(null)
  const [monitoringId, setMonitoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [statsCache, setStatsCache] = useState<Record<string, AutomationStats>>({})
  const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchAutomations()
    }
  }, [user])

  // Auto-refresh when there are processing automations
  useEffect(() => {
    const hasProcessingAutomations = automations.some(auto => auto.status === 'processing_comments')
    
    if (hasProcessingAutomations) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing automations (processing detected)')
        fetchAutomations()
      }, 3000) // Check every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [automations.length, automations.map(a => a.status).join(',')]) // Only re-run when count or statuses change

  const fetchAutomations = async () => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Debug: Check first automation data
        const fetchedAutomations = data.automations || []
        setAutomations(fetchedAutomations)
        
        // Fetch statistics for all automations
        fetchAllStats(fetchedAutomations)
      } else {
        setError(data.error || 'Failed to fetch automations')
      }
    } catch (error) {
      setError('Failed to fetch automations')
    } finally {
      setLoading(false)
    }
  }

  const testAutomation = async (automationId: string) => {
    setTestingId(automationId)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automationId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Test message sent successfully!\n\nMessage: "${data.details.processedMessage}"\nHas file: ${data.details.hasFile ? 'Yes' : 'No'}`)
      } else {
        setError(data.error || 'Failed to send test message')
      }
    } catch (error) {
      setError('Failed to send test message')
    } finally {
      setTestingId(null)
    }
  }

  const monitorComments = async (automationId: string) => {
    setMonitoringId(automationId)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automationId}/monitor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Comment monitoring completed!\n\nTotal comments: ${data.statistics.totalComments}\nProcessed: ${data.statistics.processedComments}\nMatched criteria: ${data.statistics.matchedCriteria}`)
      } else {
        setError(data.error || 'Failed to monitor comments')
      }
    } catch (error) {
      setError('Failed to monitor comments')
    } finally {
      setMonitoringId(null)
    }
  }

  const archiveAutomation = async (automationId: string, automationName: string) => {
    if (!confirm(`Are you sure you want to archive the automation "${automationName}"? It will be hidden from the active list but data will be preserved.`)) {
      return
    }

    setDeletingId(automationId)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Remove the automation from the local state
        setAutomations(prev => prev.filter(automation => automation.id !== automationId))
        alert(`✅ Automation "${automationName}" archived successfully`)
      } else {
        setError(data.error || 'Failed to archive automation')
      }
    } catch (error) {
      setError('Failed to archive automation')
    } finally {
      setDeletingId(null)
    }
  }

  const getCriteriaText = (criteria: any) => {
    const selected = []
    if (criteria.hasLiked) selected.push('Liked')
    if (criteria.hasFollowed) selected.push('Followed')
    if (criteria.hasConnected) selected.push('Connected')
    if (criteria.hasCommented) selected.push('Commented')
    return selected.length > 0 ? selected.join(', ') : 'None'
  }

  const getDetailedCriteriaText = (automation: Automation) => {
    const criteria = automation.engagement_criteria
    const selected = []
    if (criteria.hasLiked) selected.push('Has liked the post')
    if (criteria.hasFollowed) selected.push('Has followed the author')
    if (criteria.hasConnected) selected.push('Has connected with you')
    if (criteria.hasCommented) selected.push('Has commented on the post')
    
    let result = selected.join(' • ')
    
    // Debug: Check automation keywords availability
    
    // Add keyword if commented criteria is selected
    if (criteria.hasCommented && automation.keywords && automation.keywords.length > 0) {
      result += ` • Keyword: "${automation.keywords[0]}"`
    } else if (criteria.hasCommented) {
      result += ` • Keyword: [Not available]`
    }
    
    return result
  }

  const formatLastProcessed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const fetchAllStats = async (automations: Automation[]) => {
    const token = await getAuthToken()
    if (!token) return

    // Fetch stats for all automations in parallel
    const statsPromises = automations.map(async (automation) => {
      try {
        setLoadingStats(prev => new Set([...prev, automation.id]))
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automation.id}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const stats = await response.json()
          return { id: automation.id, stats }
        } else {
          console.error(`Failed to fetch stats for automation ${automation.id}`)
          return { id: automation.id, stats: { processedComments: 0, messagesSent: 0 } }
        }
      } catch (error) {
        console.error(`Error fetching stats for automation ${automation.id}:`, error)
        return { id: automation.id, stats: { processedComments: 0, messagesSent: 0 } }
      } finally {
        setLoadingStats(prev => {
          const newSet = new Set(prev)
          newSet.delete(automation.id)
          return newSet
        })
      }
    })

    const results = await Promise.all(statsPromises)
    
    // Update stats cache
    const newStatsCache: Record<string, AutomationStats> = {}
    results.forEach(({ id, stats }) => {
      newStatsCache[id] = stats
    })
    setStatsCache(newStatsCache)
  }

  const getAutomationStats = (automation: Automation) => {
    const stats = statsCache[automation.id]
    if (!stats) {
      return {
        totalComments: loadingStats.has(automation.id) ? '...' : 0,
        matchingComments: loadingStats.has(automation.id) ? '...' : 0,
        dmsSent: loadingStats.has(automation.id) ? '...' : 0,
        keyword: null
      }
    }
    
    return {
      totalComments: stats.totalComments,
      matchingComments: stats.matchingComments,
      dmsSent: stats.messagesSent,
      keyword: stats.keyword
    }
  }

  const toggleComments = (automationId: string) => {
    if (openCommentsId === automationId) {
      // Closing the section
      setOpenCommentsId(null)
    } else {
      // Opening the section - this will trigger refresh in CommentsSection useEffect
      setOpenCommentsId(automationId)
    }
  }

  const handleEditSuccess = () => {
    fetchAutomations() // Refresh the automations list
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (automations.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Automations Yet</h3>
        <p className="text-gray-600">Create your first automation to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Automations</h3>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {automations.map((automation) => (
          <div key={automation.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    automation.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : automation.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : automation.status === 'processing_comments'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {automation.status === 'processing_comments' && (
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {automation.status === 'processing_comments' ? 'Processing Comments' : automation.status}
                  </span>
                </div>
                
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setEditingAutomation(automation)}
                  className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => toggleComments(automation.id)}
                  className="inline-flex items-center px-3 py-2 border border-purple-300 shadow-sm text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {openCommentsId === automation.id ? 'Hide Comments' : 'View Comments'}
                </button>
                {config?.devDebug && (
                  <button
                    onClick={() => monitorComments(automation.id)}
                    disabled={monitoringId === automation.id}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {monitoringId === automation.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Monitoring...
                      </>
                    ) : (
                      'Monitor Comments'
                    )}
                  </button>
                )}
                <button
                  onClick={() => archiveAutomation(automation.id, automation.name)}
                  disabled={deletingId === automation.id}
                  className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {deletingId === automation.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Archiving...
                    </>
                  ) : (
                    'Archive'
                  )}
                </button>
              </div>
            </div>
            
            {/* Analytics Section - Post Link and Stats */}
            <div className="mt-4 space-y-3">
              {/* Post Link */}
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <a 
                  href={automation.post_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View original post
                </a>
              </div>
              
              {/* Analytics Row */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>{getAutomationStats(automation).totalComments} total comments</span>
                  <div className="relative group inline-block ml-1.5">
                    <svg className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {/* Comments Info Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                      <div className="text-gray-200">Only first comments are considered. Replies to comments are excluded.</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{getAutomationStats(automation).matchingComments} matching comments</span>
                  <div className="relative group inline-block ml-1.5">
                    <svg className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {/* Matching Comments Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                      <div className="text-gray-200">
                        {getAutomationStats(automation).keyword 
                          ? `Comments that matches the keyword "${getAutomationStats(automation).keyword}"`
                          : 'Comments that match the automation criteria'
                        }
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{getAutomationStats(automation).dmsSent} DMs sent</span>
                </div>
                
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Last processed {formatLastProcessed(automation.created_at)}</span>
                  <div className="relative group inline-block ml-1.5">
                    <svg className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {/* Processing Schedule Info Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                      <div className="text-gray-200">Comments are processed every hour</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Separator and Comments Section */}
            {openCommentsId === automation.id && (
              <div className="mt-6 pt-4 border-t border-gray-200"></div>
            )}
            <CommentsSection
              key={`comments-${automation.id}`}
              automationId={automation.id}
              isOpen={openCommentsId === automation.id}
              onClose={() => setOpenCommentsId(null)}
            />
          </div>
        ))}
      </div>

      {/* Edit Automation Modal */}
      {editingAutomation && (
        <EditAutomationModal
          automation={editingAutomation}
          onClose={() => setEditingAutomation(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}