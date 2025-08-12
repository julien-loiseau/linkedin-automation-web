'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthToken } from '@/lib/supabase'

interface AutomationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AutomationForm({ onSuccess, onCancel }: AutomationFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validatingPost, setValidatingPost] = useState(false)
  const [postValidated, setPostValidated] = useState(false)
  const [postDetails, setPostDetails] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    postUrl: '',
    keyword: '',
    messageTemplate: '',
    replyTemplate1stDegree: '',
    replyTemplateNon1stDegree: '',
    file: null as File | null,
    processExistingComments: true
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, file }))
  }

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
        return
      }

      setPostValidated(true)
      setPostDetails(data)
      setError('')
    } catch (error) {
      setError('Failed to validate post')
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
  }, [formData.postUrl])

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
  }, [debouncedValidatePost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!postValidated) {
      setError('Please validate the LinkedIn post first')
      return
    }

    // Check if keyword is provided
    if (!formData.keyword.trim()) {
      setError('Please enter a keyword to match in comments')
      return
    }

    // Validate reply templates - must be both provided or both empty
    const hasReplyTemplate1st = formData.replyTemplate1stDegree.trim()
    const hasReplyTemplateNon1st = formData.replyTemplateNon1stDegree.trim()
    
    if (hasReplyTemplate1st || hasReplyTemplateNon1st) {
      if (!hasReplyTemplate1st || !hasReplyTemplateNon1st) {
        setError('Both reply templates must be provided when using Reply to Comment feature')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('postUrl', formData.postUrl)
      formDataToSend.append('keyword', formData.keyword)
      formDataToSend.append('messageTemplate', formData.messageTemplate)
      formDataToSend.append('processExistingComments', formData.processExistingComments.toString())
      
      // Add reply templates if provided
      if (formData.replyTemplate1stDegree.trim()) {
        formDataToSend.append('replyTemplate1stDegree', formData.replyTemplate1stDegree)
      }
      if (formData.replyTemplateNon1stDegree.trim()) {
        formDataToSend.append('replyTemplateNon1stDegree', formData.replyTemplateNon1stDegree)
      }
      
      if (formData.file) {
        formDataToSend.append('file', formData.file)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser will set it automatically
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create automation')
        return
      }

      onSuccess?.()
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create New Automation</h2>
        <p className="text-gray-600 mt-2">Set up automated DM sending based on LinkedIn post comments.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Automation Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Automation Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My LinkedIn Automation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* LinkedIn Post URL */}
        <div>
          <label htmlFor="postUrl" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Post URL
          </label>
          <div className="relative">
            <input
              type="url"
              id="postUrl"
              value={formData.postUrl}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, postUrl: e.target.value }))
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
          <p className="text-xs text-gray-500 mt-1">
            Post validation will start automatically after you enter a URL
          </p>
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
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
            Keyword to Match in Comments
          </label>
          <input
            type="text"
            id="keyword"
            value={formData.keyword}
            onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
            placeholder="Enter keyword or phrase..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Only comments containing this keyword will trigger automated messages
          </p>
        </div>

        {/* Process Existing Comments Toggle */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="processExistingComments"
                type="checkbox"
                checked={formData.processExistingComments}
                onChange={(e) => setFormData(prev => ({ ...prev, processExistingComments: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="processExistingComments" className="text-sm font-medium text-gray-700">
                Send messages to existing comments
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {formData.processExistingComments 
                  ? "Will send messages to existing comments that match your keyword, plus future comments"
                  : "Will only send messages to new comments posted after creating this automation"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Message Template */}
        <div>
          <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700 mb-2">
            Message Template
          </label>
          
          {/* Variable and Emoji Controls */}
          <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
            {/* firstName Variable Button */}
            <button
              type="button"
              onClick={() => {
                const textarea = document.getElementById('messageTemplate') as HTMLTextAreaElement
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const newValue = formData.messageTemplate.slice(0, start) + '{firstName}' + formData.messageTemplate.slice(end)
                setFormData(prev => ({ ...prev, messageTemplate: newValue }))
                // Focus back and set cursor position
                setTimeout(() => {
                  textarea.focus()
                  textarea.setSelectionRange(start + 11, start + 11)
                }, 0)
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded hover:bg-blue-200 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              + firstName
            </button>

            {/* Emoji Quick Bar */}
            <div className="flex items-center gap-1 ml-4">
              <span className="text-xs text-gray-600 mr-2">Quick emojis:</span>
              {['👋', '😊', '💡', '🚀', '📊', '💼', '✨', '🎯'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById('messageTemplate') as HTMLTextAreaElement
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const newValue = formData.messageTemplate.slice(0, start) + emoji + formData.messageTemplate.slice(end)
                    setFormData(prev => ({ ...prev, messageTemplate: newValue }))
                    // Focus back and set cursor position
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
                    }, 0)
                  }}
                  className="w-6 h-6 text-sm hover:bg-gray-200 rounded transition-colors flex items-center justify-center"
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="messageTemplate"
              value={formData.messageTemplate}
              onChange={(e) => setFormData(prev => ({ ...prev, messageTemplate: e.target.value }))}
              placeholder="Hi {firstName}, I saw your comment. I'd love to share a resource that might help..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
              required
            />
            {/* Syntax highlighting overlay - shows {firstName} in blue */}
            <div 
              className="absolute top-0 left-0 px-3 py-2 font-mono text-sm pointer-events-none whitespace-pre-wrap overflow-hidden text-transparent"
              style={{ 
                lineHeight: '1.5',
                wordWrap: 'break-word',
                width: '100%',
                height: '100%'
              }}
            >
              {formData.messageTemplate.replace(/{firstName}/g, '').split('{firstName}').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="bg-blue-100 text-blue-800 px-1 rounded">
                      {'{firstName}'}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          
          {/* Live Preview */}
          {formData.messageTemplate.trim() && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs font-medium text-green-800 mb-2">Preview with sample data:</p>
              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                {formData.messageTemplate.replace(/{firstName}/g, 'John')}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            Click + firstName to insert the variable. Use the emoji bar for quick additions. Links can be included directly in the message text.
          </p>
        </div>

        {/* File Upload (Optional) */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            File to Share (Optional)
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
          />
          {formData.file && (
            <p className="text-sm text-green-600 mt-1">✓ {formData.file.name} selected</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF
          </p>
        </div>

        {/* Reply Templates (Optional) */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Reply to Comment Templates (Optional)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enable the "Reply to Comment" feature by providing custom templates. Both templates are required to enable this feature.
            </p>
          </div>

          <div>
            <label htmlFor="replyTemplate1stDegree" className="block text-sm font-medium text-gray-700 mb-2">
              Reply Template for 1st Degree Connections
            </label>
            <div className="relative">
              <textarea
                id="replyTemplate1stDegree"
                value={formData.replyTemplate1stDegree}
                onChange={(e) => setFormData(prev => ({ ...prev, replyTemplate1stDegree: e.target.value }))}
                placeholder="I just sent you a DM!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="absolute top-2 right-2 flex gap-1 text-sm">
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplate1stDegree: prev.replyTemplate1stDegree + '👍' }))}
                >👍</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplate1stDegree: prev.replyTemplate1stDegree + '😊' }))}
                >😊</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplate1stDegree: prev.replyTemplate1stDegree + '💡' }))}
                >💡</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplate1stDegree: prev.replyTemplate1stDegree + '🚀' }))}
                >🚀</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplate1stDegree: prev.replyTemplate1stDegree + '📈' }))}
                >📈</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplate1stDegree: prev.replyTemplate1stDegree + '🎯' }))}
                >🎯</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used when replying to 1st degree connections (when direct message can be sent).
            </p>
          </div>

          <div>
            <label htmlFor="replyTemplateNon1stDegree" className="block text-sm font-medium text-gray-700 mb-2">
              Reply Template for Non-1st Degree Connections
            </label>
            <div className="relative">
              <textarea
                id="replyTemplateNon1stDegree"
                value={formData.replyTemplateNon1stDegree}
                onChange={(e) => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: e.target.value }))}
                placeholder="Please connect so I can send you a DM!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="absolute top-2 right-2 flex gap-1 text-sm">
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: prev.replyTemplateNon1stDegree + '👍' }))}
                >👍</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: prev.replyTemplateNon1stDegree + '😊' }))}
                >😊</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: prev.replyTemplateNon1stDegree + '💡' }))}
                >💡</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: prev.replyTemplateNon1stDegree + '🚀' }))}
                >🚀</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: prev.replyTemplateNon1stDegree + '📈' }))}
                >📈</span>
                <span 
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, replyTemplateNon1stDegree: prev.replyTemplateNon1stDegree + '🎯' }))}
                >🎯</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used when replying to 2nd/3rd+ degree connections (when they need to connect first).
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !postValidated}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Creating...' : 'Create Automation'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}