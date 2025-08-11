'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LinkedInStatusIcon } from '@/components/linkedin/LinkedInStatusIcon'
import { LinkedInConnectionBanner } from '@/components/linkedin/LinkedInConnectionBanner'
import { AutomationWizard } from '@/components/automation/AutomationWizard'
import { AutomationList } from '@/components/automation/AutomationList'
import { DailyLimits } from '@/components/automation/DailyLimits'
import { ProfileDropdown } from '@/components/common/ProfileDropdown'
import { getAuthToken } from '@/lib/supabase'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [showAutomationForm, setShowAutomationForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [processingInvitations, setProcessingInvitations] = useState(false)
  const [linkedInConnected, setLinkedInConnected] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Check LinkedIn connection status
  useEffect(() => {
    const checkLinkedInStatus = async () => {
      if (!user) return
      
      try {
        const token = await getAuthToken()
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setLinkedInConnected(data.isConnected)
        } else {
          setLinkedInConnected(false)
        }
      } catch (error) {
        console.error('Failed to check LinkedIn status:', error)
        setLinkedInConnected(false)
      }
    }

    checkLinkedInStatus()
  }, [user])

  const handleAcceptInvitations = async () => {
    console.log('🎯 Accept invitations button clicked')
    setProcessingInvitations(true)

    try {
      console.log('🔑 Getting auth token...')
      const token = await getAuthToken()
      if (!token) {
        console.log('❌ No auth token found')
        alert('Please log in first')
        return
      }

      console.log('✅ Auth token obtained, making API request...')
      console.log('📡 API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/accept-invitations`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/accept-invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📥 Response status:', response.status, response.statusText)

      const data = await response.json()
      console.log('📊 Response data:', data)

      if (response.ok) {
        alert(`✅ Invitation processing completed!\n\nProcessed: ${data.results.processed}\nSuccessful: ${data.results.successful}\nFailed: ${data.results.failed}`)
      } else {
        alert(`❌ Failed to process invitations: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Accept invitations error:', error)
      alert('❌ Failed to process invitations')
    } finally {
      setProcessingInvitations(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.user_metadata?.full_name || (user.email?.split('@')?.[0] ? (user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)) : 'User')}! 😊
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <LinkedInStatusIcon />
              <button
                onClick={handleAcceptInvitations}
                disabled={processingInvitations}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                {processingInvitations ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    Accept Invitations
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAutomationForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Automation
              </button>
              <ProfileDropdown user={user} onSignOut={signOut} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* LinkedIn Connection Banner */}
          {linkedInConnected === false && <LinkedInConnectionBanner />}
          
          {/* Create Automation Wizard */}
          {showAutomationForm && (
            <div className="mb-6">
              <AutomationWizard 
                onSuccess={() => {
                  setShowAutomationForm(false)
                  setRefreshKey(prev => prev + 1) // Trigger automation list refresh
                }}
                onCancel={() => setShowAutomationForm(false)}
              />
            </div>
          )}

          {/* Daily Message Limits */}
          <DailyLimits />

          {/* Automations List */}
          <AutomationList key={refreshKey} />
        </div>
      </main>
    </div>
  )
}