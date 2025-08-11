'use client'

import { useEffect } from 'react'

interface Step2MessageConfigProps {
  formData: {
    messageTemplate: string
    file: File | null
    processExistingComments: boolean
  }
  onUpdate: (data: Partial<{ messageTemplate: string; file: File | null; processExistingComments: boolean }>) => void
  onValidationChange: (isValid: boolean) => void
}

export function Step2MessageConfig({ formData, onUpdate, onValidationChange }: Step2MessageConfigProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onUpdate({ file })
  }

  // Update validation state when dependencies change
  useEffect(() => {
    const isValid = formData.messageTemplate.trim() !== ''
    onValidationChange(isValid)
  }, [formData.messageTemplate, onValidationChange])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Message Configuration</h2>
        <p className="text-gray-600">Configure your direct message template and file attachments.</p>
      </div>

      {/* Message Template */}
      <div>
        <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700 mb-2">
          Message Template *
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
              onUpdate({ messageTemplate: newValue })
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
                  onUpdate({ messageTemplate: newValue })
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
            onChange={(e) => onUpdate({ messageTemplate: e.target.value })}
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

      {/* Process Existing Comments Toggle */}
      <div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="processExistingComments"
              type="checkbox"
              checked={formData.processExistingComments}
              onChange={(e) => onUpdate({ processExistingComments: e.target.checked })}
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

    </div>
  )
}