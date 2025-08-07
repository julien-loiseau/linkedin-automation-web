'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LinkedInSetup } from '@/components/linkedin/LinkedInSetup'
import { AutomationForm } from '@/components/automation/AutomationForm'
import { AutomationList } from '@/components/automation/AutomationList'

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
                LinkedIn Automation Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* LinkedIn Setup */}
          <div className="mb-6">
            <LinkedInSetup />
          </div>

          {/* Create Automation Form or CTA */}
          {showAutomationForm ? (
            <div className="mb-6">
              <AutomationForm 
                onSuccess={() => {
                  setShowAutomationForm(false)
                  setRefreshKey(prev => prev + 1) // Trigger automation list refresh
                }}
                onCancel={() => setShowAutomationForm(false)}
              />
            </div>
          ) : (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Ready to automate your LinkedIn workflow?
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first automation to start sending DMs automatically based on comment engagement.
                </p>
                <button 
                  onClick={() => setShowAutomationForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Create New Automation
                </button>
              </div>
            </div>
          )}

          {/* Automations List */}
          <AutomationList key={refreshKey} />
        </div>
      </main>
    </div>
  )
}