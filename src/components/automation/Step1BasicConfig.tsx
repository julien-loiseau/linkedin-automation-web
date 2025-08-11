'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthToken } from '@/lib/supabase'

interface Step1BasicConfigProps {
  formData: {
    name: string
    postUrl: string
    keyword: string
  }
  onUpdate: (data: Partial<{ name: string; postUrl: string; keyword: string }>) => void
  onValidationChange: (isValid: boolean) => void
}

export function Step1BasicConfig({ formData, onUpdate, onValidationChange }: Step1BasicConfigProps) {
  const [validatingPost, setValidatingPost] = useState(false)
  const [postValidated, setPostValidated] = useState(false)
  const [postDetails, setPostDetails] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const validatePost = useCallback(async () => {
    if (!formData.postUrl.trim()) {
      setError('Please enter a LinkedIn post URL')
      return
    }

    setValidatingPost(true)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/linkedin/validate-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postUrl: formData.postUrl })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to validate post')
        setPostValidated(false)
        setPostDetails(null)
        return
      }

      setPostValidated(true)
      setPostDetails(data)
      setError('')
    } catch (error) {
      setError('Failed to validate post')
      setPostValidated(false)
      setPostDetails(null)
    } finally {
      setValidatingPost(false)
    }
  }, [formData.postUrl])

  // Debounced validation function
  const debouncedValidatePost = useCallback(() => {
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      if (formData.postUrl.trim()) {
        validatePost()
      }
    }, 1000) // 1 second debounce

    validationTimeoutRef.current = timeout
  }, [formData.postUrl, validatePost])

  // Auto-validate when postUrl changes
  useEffect(() => {
    if (formData.postUrl.trim()) {
      debouncedValidatePost()
    } else {
      setPostValidated(false)
      setPostDetails(null)
      setError('')
      // Clear any pending validation
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [debouncedValidatePost, formData.postUrl])

  // Update validation state when dependencies change
  useEffect(() => {
    const isValid = formData.name.trim() !== '' && 
                   formData.postUrl.trim() !== '' && 
                   formData.keyword.trim() !== '' && 
                   postValidated
    onValidationChange(isValid)
  }, [formData.name, formData.postUrl, formData.keyword, postValidated, onValidationChange])

  return (
    <div className="space-y-6 border-none">
      <style jsx>{`
        label, div, p, span, h1, h2, h3 {
          border-bottom: none !important;
          text-decoration: none !important;
          border: none !important;
        }
      `}</style>
      <div className="border-none">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Basic Configuration</h2>
        <p className="text-gray-600">Set up the fundamental details for your LinkedIn automation.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Automation Name */}
      <div className="border-none">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Automation Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="My LinkedIn Automation"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1 border-none">Give your automation a descriptive name</p>
      </div>

      {/* LinkedIn Post URL */}
      <div className="border-none">
        <label htmlFor="postUrl" className="block text-sm font-medium text-gray-700 mb-2">
          LinkedIn Post URL *
        </label>
        <div className="relative">
          <input
            type="url"
            id="postUrl"
            value={formData.postUrl}
            onChange={(e) => {
              onUpdate({ postUrl: e.target.value })
              setPostValidated(false)
              setPostDetails(null)
              setError('')
            }}
            placeholder="https://www.linkedin.com/posts/..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {validatingPost && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        
        {/* How to find LinkedIn URL guide */}
        <div className="mt-3">
          <img 
            src="/linkedin-url-guide.gif" 
            alt="How to find LinkedIn post URL"
            className="w-full max-w-md rounded-md border border-gray-200 shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copy the LinkedIn post URL as shown above
          </p>
        </div>
        
        {postValidated && postDetails && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-800">Post validated successfully</span>
              </div>
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">LinkedIn Post</span>
              <span className="text-gray-500"> • Ready for automation</span>
            </div>
            
            <div className="mt-1 text-xs text-gray-700">
              Comments on this post will be monitored for your specified keyword
            </div>
            
            {postDetails.post?.embedUrl && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg 
                    className={`w-3 h-3 mr-1 transition-transform ${showPreview ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showPreview ? 'Hide Post Preview' : 'Show Post Preview'}
                </button>
                
                {showPreview && (
                  <div className="mt-2 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    <iframe
                      src={postDetails.post.embedUrl}
                      height="200"
                      width="100%"
                      frameBorder="0"
                      allowFullScreen
                      title="LinkedIn Post Preview"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyword Input */}
      <div className="border-none">
        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2" style={{border: 'none', textDecoration: 'none', borderBottom: 'none'}}>
          Keyword to Match in Comments *
        </label>
        <input
          type="text"
          id="keyword"
          value={formData.keyword}
          onChange={(e) => onUpdate({ keyword: e.target.value })}
          placeholder="Enter keyword or phrase..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1 border-none">
          Only comments containing this keyword will trigger automated messages
        </p>
      </div>
    </div>
  )
}