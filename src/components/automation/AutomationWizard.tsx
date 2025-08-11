'use client'

import { useState, useCallback } from 'react'
import { getAuthToken } from '@/lib/supabase'
import { WizardProgress } from './WizardProgress'
import { Step1BasicConfig } from './Step1BasicConfig'
import { Step2MessageConfig } from './Step2MessageConfig'
import { Step3ReplyConfig } from './Step3ReplyConfig'
import { WizardNavigation } from './WizardNavigation'

interface AutomationWizardProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface WizardFormData {
  // Step 1
  name: string
  postUrl: string
  keyword: string
  
  // Step 2
  messageTemplate: string
  file: File | null
  processExistingComments: boolean
  
  // Step 3
  replyTemplate1stDegree: string
  replyTemplateNon1stDegree: string
}

export function AutomationWizard({ onSuccess, onCancel }: AutomationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepValidation, setStepValidation] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: true // Step 3 is optional, so default to valid
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    postUrl: '',
    keyword: '',
    messageTemplate: '',
    file: null,
    processExistingComments: false, // Default to unchecked as requested
    replyTemplate1stDegree: '',
    replyTemplateNon1stDegree: ''
  })

  const stepTitles = [
    'Basic Configuration',
    'Message Setup',
    'Reply Templates'
  ]

  const totalSteps = stepTitles.length

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateStepValidation = useCallback((step: number, isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [step]: isValid }))
  }, [])

  // Memoized validation callbacks for each step
  const handleStep1Validation = useCallback((isValid: boolean) => {
    updateStepValidation(1, isValid)
  }, [updateStepValidation])

  const handleStep2Validation = useCallback((isValid: boolean) => {
    updateStepValidation(2, isValid)
  }, [updateStepValidation])

  const handleStep3Validation = useCallback((isValid: boolean) => {
    updateStepValidation(3, isValid)
  }, [updateStepValidation])

  const handleNext = () => {
    if (currentStep < totalSteps && stepValidation[currentStep]) {
      setCurrentStep(prev => prev + 1)
      setError('')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!stepValidation[currentStep]) {
      setError('Please complete all required fields')
      return
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

      // Success!
      onSuccess?.()
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Automation creation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicConfig
            formData={{
              name: formData.name,
              postUrl: formData.postUrl,
              keyword: formData.keyword
            }}
            onUpdate={(updates) => updateFormData(updates)}
            onValidationChange={handleStep1Validation}
          />
        )
      case 2:
        return (
          <Step2MessageConfig
            formData={{
              messageTemplate: formData.messageTemplate,
              file: formData.file,
              processExistingComments: formData.processExistingComments
            }}
            onUpdate={(updates) => updateFormData(updates)}
            onValidationChange={handleStep2Validation}
          />
        )
      case 3:
        return (
          <Step3ReplyConfig
            formData={formData}
            onUpdate={(updates) => updateFormData(updates)}
            onValidationChange={handleStep3Validation}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Create New Automation</h2>
        <p className="text-gray-600 mt-2">Set up automated DM sending based on LinkedIn post comments.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Progress Indicator */}
      <WizardProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />

      {/* Current Step Content */}
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        canGoNext={stepValidation[currentStep]}
        isSubmitting={loading}
        onBack={handleBack}
        onNext={handleNext}
        onCancel={onCancel || (() => {})}
        onSubmit={handleSubmit}
      />
    </div>
  )
}