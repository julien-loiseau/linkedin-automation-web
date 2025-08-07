'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthToken } from '@/lib/supabase'

interface LinkedInProfile {
  id: string
  name: string
  headline?: string
  profileUrl: string
  avatarUrl?: string
  isConnected?: boolean
}

export function LinkedInSetup() {
  const { user } = useAuth()
  const [liAtCookie, setLiAtCookie] = useState('')
  const [jsessionId, setJsessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<LinkedInProfile | null>(null)
  const [error, setError] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Check current LinkedIn connection status
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

      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.isConnected)
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Failed to check LinkedIn status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ liAtCookie, jsessionId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to connect LinkedIn account')
        return
      }

      setProfile(data.profile)
      setIsConnected(true)
      setLiAtCookie('')
      setJsessionId('')
      
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
      return
    }

    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setIsConnected(false)
        setProfile(null)
      }
    } catch (error) {
      console.error('Failed to disconnect LinkedIn:', error)
    }
  }

  if (checkingStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (isConnected && profile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">LinkedIn Account</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected
          </span>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          {profile.avatarUrl && (
            <img 
              src={profile.avatarUrl} 
              alt={profile.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{profile.name}</p>
            {profile.headline && (
              <p className="text-sm text-gray-600">{profile.headline}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Disconnect Account
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Connect LinkedIn Account</h3>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">How to get your LinkedIn cookies:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Open LinkedIn in your browser and log in</li>
          <li>2. Press F12 to open Developer Tools</li>
          <li>3. Go to the "Application" or "Storage" tab</li>
          <li>4. Find "Cookies" → "https://www.linkedin.com"</li>
          <li>5. Copy the value of "li_at" cookie</li>
          <li>6. Copy the value of "JSESSIONID" cookie (without quotes)</li>
        </ol>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleConnect}>
        <div className="mb-4">
          <label htmlFor="liAtCookie" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Cookie (li_at)
          </label>
          <textarea
            id="liAtCookie"
            value={liAtCookie}
            onChange={(e) => setLiAtCookie(e.target.value)}
            placeholder="Paste your li_at cookie value here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="jsessionId" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn JSESSIONID
          </label>
          <input
            type="text"
            id="jsessionId"
            value={jsessionId}
            onChange={(e) => setJsessionId(e.target.value)}
            placeholder="ajax:5567661790000071246"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !liAtCookie.trim() || !jsessionId.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect LinkedIn Account'}
        </button>
      </form>
    </div>
  )
}