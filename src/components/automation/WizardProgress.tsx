'use client'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}

export function WizardProgress({ currentStep, totalSteps, stepTitles }: WizardProgressProps) {
  return (
    <div className="mb-8">
      {/* Steps with circles and labels perfectly aligned */}
      <div className="flex items-center justify-center">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          
          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step Container */}
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mb-2
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                
                {/* Step Label */}
                <p className={`
                  text-sm font-medium text-center whitespace-nowrap
                  ${isCompleted 
                    ? 'text-green-600' 
                    : isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                  }
                `}>
                  {stepTitles[index]}
                </p>
              </div>
              
              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className={`
                  w-24 h-px mx-6 mt-[-20px]
                  ${stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}