'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Handle the auth callback from email link
    const handleAuthCallback = async () => {
      try {
        // Check if we have a session (user clicked the email link)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError('Invalid or expired password reset link')
          return
        }

        if (!session) {
          console.error('No session found')
          setError('Invalid or expired password reset link')
          return
        }

        // Check if this is a password recovery session
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Invalid or expired password reset link')
          return
        }

        console.log('Password reset session valid for:', user.email)
        setLoading(false)

      } catch (err) {
        console.error('Reset password callback error:', err)
        setError('An error occurred while processing the reset link')
      }
    }

    handleAuthCallback()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Processing Reset Link...
          </h2>
          <p className="mt-2 text-gray-600">Please wait while we verify your reset link.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              LinkedIn Automation Platform
            </h1>
          </div>
          
          <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
              Reset Link Error
            </h2>
            
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
            
            <p className="text-gray-600 text-center mb-6">
              The password reset link may have expired or is invalid. Please request a new password reset link.
            </p>
            
            <div className="text-center">
              <button
                onClick={() => router.push('/auth')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <ResetPasswordForm />
}