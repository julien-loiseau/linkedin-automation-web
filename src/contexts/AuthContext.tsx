'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getAuthToken } from '@/lib/supabase'

interface LinkedInProfile {
  id: string
  name: string
  profilePicture?: string
  headline?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  linkedInProfile: LinkedInProfile | null
  linkedInLoading: boolean
  signOut: () => Promise<void>
  refreshLinkedInProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null)
  const [linkedInLoading, setLinkedInLoading] = useState(false)

  // Fetch LinkedIn profile data
  const fetchLinkedInProfile = async () => {
    if (!user) {
      setLinkedInProfile(null)
      return
    }

    setLinkedInLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        setLinkedInProfile(null)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.ok && data.isConnected && data.profile) {
        setLinkedInProfile(data.profile)
      } else {
        setLinkedInProfile(null)
      }
    } catch (error) {
      console.error('Failed to fetch LinkedIn profile:', error)
      setLinkedInProfile(null)
    } finally {
      setLinkedInLoading(false)
    }
  }

  const refreshLinkedInProfile = async () => {
    await fetchLinkedInProfile()
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch LinkedIn profile when user changes
  useEffect(() => {
    if (user) {
      fetchLinkedInProfile()
    } else {
      setLinkedInProfile(null)
    }
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      linkedInProfile, 
      linkedInLoading, 
      signOut, 
      refreshLinkedInProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}