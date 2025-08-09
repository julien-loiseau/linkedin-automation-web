'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LinkedInStatusIcon } from '@/components/linkedin/LinkedInStatusIcon'
import { AutomationForm } from '@/components/automation/AutomationForm'
import { AutomationList } from '@/components/automation/AutomationList'
import { ProfileDropdown } from '@/components/common/ProfileDropdown'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [showAutomationForm, setShowAutomationForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

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
          {/* Create Automation Form */}
          {showAutomationForm && (
            <div className="mb-6">
              <AutomationForm 
                onSuccess={() => {
                  setShowAutomationForm(false)
                  setRefreshKey(prev => prev + 1) // Trigger automation list refresh
                }}
                onCancel={() => setShowAutomationForm(false)}
              />
            </div>
          )}

          {/* Automations List */}
          <AutomationList key={refreshKey} />
        </div>
      </main>
    </div>
  )
}