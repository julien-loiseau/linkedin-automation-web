'use client'

import { useEffect, useState } from 'react'

interface Step3ReplyConfigProps {
  formData: {
    replyTemplate1stDegree: string
    replyTemplateNon1stDegree: string
    name: string
    postUrl: string
    keyword: string
    messageTemplate: string
    file: File | null
    processExistingComments: boolean
  }
  onUpdate: (data: Partial<{ replyTemplate1stDegree: string; replyTemplateNon1stDegree: string }>) => void
  onValidationChange: (isValid: boolean) => void
}

export function Step3ReplyConfig({ formData, onUpdate, onValidationChange }: Step3ReplyConfigProps) {
  const [skipReplyFeature, setSkipReplyFeature] = useState(true)

  // Update validation state - always valid since reply feature is optional
  useEffect(() => {
    if (skipReplyFeature) {
      onValidationChange(true)
    } else {
      // If not skipping, both templates must be provided
      const isValid = formData.replyTemplate1stDegree.trim() !== '' && 
                     formData.replyTemplateNon1stDegree.trim() !== ''
      onValidationChange(isValid)
    }
  }, [formData.replyTemplate1stDegree, formData.replyTemplateNon1stDegree, skipReplyFeature, onValidationChange])

  const addEmoji = (templateType: '1st' | 'non1st', emoji: string) => {
    if (templateType === '1st') {
      onUpdate({ replyTemplate1stDegree: formData.replyTemplate1stDegree + emoji })
    } else {
      onUpdate({ replyTemplateNon1stDegree: formData.replyTemplateNon1stDegree + emoji })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Reply to Comments Configuration</h2>
        <p className="text-gray-600">Configure automated replies to comments that match your criteria.</p>
      </div>

      {/* Skip Reply Feature Toggle */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="skipReplyFeature"
              type="checkbox"
              checked={skipReplyFeature}
              onChange={(e) => {
                setSkipReplyFeature(e.target.checked)
                if (e.target.checked) {
                  // Clear templates when skipping
                  onUpdate({ 
                    replyTemplate1stDegree: '', 
                    replyTemplateNon1stDegree: '' 
                  })
                }
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="skipReplyFeature" className="text-sm font-medium text-gray-700">
              Skip Reply to Comments feature
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {skipReplyFeature 
                ? "Your automation will only send direct messages, no public comment replies"
                : "Enable automated public replies to comments that match your criteria"
              }
            </p>
          </div>
        </div>
      </div>

      {!skipReplyFeature && (
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">How Reply Templates Work</h3>
            <div className="space-y-1 text-xs text-blue-700">
              <div>• Your name will automatically be prepended to each reply</div>
              <div>• 1st degree template: Used when you can send direct messages</div>
              <div>• Non-1st degree template: Used when connection request is needed</div>
              <div>• Both templates are required to enable this feature</div>
            </div>
          </div>

          {/* Reply Template for 1st Degree Connections */}
          <div>
            <label htmlFor="replyTemplate1stDegree" className="block text-sm font-medium text-gray-700 mb-2">
              Reply Template for 1st Degree Connections *
            </label>
            <div className="relative">
              <textarea
                id="replyTemplate1stDegree"
                value={formData.replyTemplate1stDegree}
                onChange={(e) => onUpdate({ replyTemplate1stDegree: e.target.value })}
                placeholder="I just sent you a DM!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="absolute top-2 right-2 flex gap-1 text-sm">
                {['👍', '😊', '💡', '🚀', '📈', '🎯'].map((emoji) => (
                  <span 
                    key={emoji}
                    className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                    onClick={() => addEmoji('1st', emoji)}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used when replying to 1st degree connections (when direct message can be sent).
            </p>
            
            {/* Preview for 1st degree */}
            {formData.replyTemplate1stDegree.trim() && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                <span className="font-medium">Preview:</span> @John Smith {formData.replyTemplate1stDegree}
              </div>
            )}
          </div>

          {/* Reply Template for Non-1st Degree Connections */}
          <div>
            <label htmlFor="replyTemplateNon1stDegree" className="block text-sm font-medium text-gray-700 mb-2">
              Reply Template for Non-1st Degree Connections *
            </label>
            <div className="relative">
              <textarea
                id="replyTemplateNon1stDegree"
                value={formData.replyTemplateNon1stDegree}
                onChange={(e) => onUpdate({ replyTemplateNon1stDegree: e.target.value })}
                placeholder="Please connect so I can send you a DM!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="absolute top-2 right-2 flex gap-1 text-sm">
                {['👍', '😊', '💡', '🚀', '📈', '🎯'].map((emoji) => (
                  <span 
                    key={emoji}
                    className="cursor-pointer hover:bg-gray-100 px-1 rounded" 
                    onClick={() => addEmoji('non1st', emoji)}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used when replying to 2nd/3rd+ degree connections (when they need to connect first).
            </p>
            
            {/* Preview for non-1st degree */}
            {formData.replyTemplateNon1stDegree.trim() && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                <span className="font-medium">Preview:</span> @Jane Doe {formData.replyTemplateNon1stDegree}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Review Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Basic Configuration</h4>
            <div className="space-y-1 text-gray-600">
              <div>• Name: <span className="font-medium">{formData.name || 'Not set'}</span></div>
              <div>• Keyword: <span className="font-medium">"{formData.keyword || 'Not set'}"</span></div>
              <div>• Post: <span className={`font-medium ${formData.postUrl ? 'text-green-600' : 'text-red-600'}`}>
                {formData.postUrl ? 'Validated ✓' : 'Not set'}
              </span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Message Configuration</h4>
            <div className="space-y-1 text-gray-600">
              <div>• Template: <span className={`font-medium ${formData.messageTemplate ? 'text-green-600' : 'text-red-600'}`}>
                {formData.messageTemplate ? 'Configured ✓' : 'Not set'}
              </span></div>
              <div>• File: <span className="font-medium">{formData.file ? formData.file.name : 'None'}</span></div>
              <div>• Existing comments: <span className="font-medium">
                {formData.processExistingComments ? 'Include' : 'Skip'}
              </span></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Reply Configuration</h4>
          <div className="text-gray-600 text-sm">
            {skipReplyFeature ? (
              <span className="text-orange-600 font-medium">Reply feature disabled</span>
            ) : (
              <div className="space-y-1">
                <div>• 1st degree replies: <span className={`font-medium ${formData.replyTemplate1stDegree ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.replyTemplate1stDegree ? 'Configured ✓' : 'Not set'}
                </span></div>
                <div>• Non-1st degree replies: <span className={`font-medium ${formData.replyTemplateNon1stDegree ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.replyTemplateNon1stDegree ? 'Configured ✓' : 'Not set'}
                </span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}