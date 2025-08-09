'use client'

import { useState } from 'react'
import { getAuthToken } from '@/lib/supabase'

interface Automation {
  id: string
  name: string
  post_url: string
  status: string
  message_template: string
  resource_type: string | null
  file_name: string | null
  engagement_criteria: any
  created_at: string
}

interface EditAutomationModalProps {
  automation: Automation
  onClose: () => void
  onSuccess: () => void
}

export function EditAutomationModal({ automation, onClose, onSuccess }: EditAutomationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state - pre-populate with existing automation data
  const [formData, setFormData] = useState({
    name: automation.name,
    messageTemplate: automation.message_template,
    keyword: (automation as any).keywords?.[0] || '',
    file: null as File | null,
    removeFile: false
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, file, removeFile: false }))
  }

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null, removeFile: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError('')

    // Validate keyword
    if (!formData.keyword.trim()) {
      setError('Please enter a keyword to match in comments')
      setLoading(false)
      return
    }

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in first')
        return
      }

      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('messageTemplate', formData.messageTemplate)
      formDataToSend.append('keyword', formData.keyword)
      formDataToSend.append('removeFile', formData.removeFile.toString())
      
      if (formData.file) {
        formDataToSend.append('file', formData.file)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/automations/${automation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser will set it automatically
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update automation')
        return
      }

      onSuccess()
      onClose()
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-white/20"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl z-10 max-h-screen overflow-y-auto">
          <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Edit Automation</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
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

            {/* Info about non-editable settings */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">What can be edited</h4>
                  <p className="text-xs text-blue-700 mb-2">
                    You can edit the automation name, keyword, message template, and file attachment.
                  </p>
                  <p className="text-xs text-blue-700">
                    To change the post URL, please <strong>create a new automation</strong> to preserve your existing data.
                  </p>
                </div>
              </div>
            </div>

            {/* Message Template with Enhanced UI */}
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

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File to Share
              </label>
              
              {/* Current file info */}
              {automation.file_name && !formData.removeFile && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-blue-800">Current file: {automation.file_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              
              {/* New file upload */}
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
              />
              {formData.file && (
                <p className="text-sm text-green-600 mt-1">✓ {formData.file.name} will replace the current file</p>
              )}
              {formData.removeFile && (
                <p className="text-sm text-red-600 mt-1">Current file will be removed</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Updating...' : 'Update Automation'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}