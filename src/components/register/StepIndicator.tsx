'use client';

import { RegistrationStep, STEPS } from './types';

interface StepIndicatorProps {
  currentStep: RegistrationStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-white bg-opacity-20 text-gray-300'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-purple-400' : 'text-gray-300'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    isCompleted ? 'bg-emerald-500' : 'bg-white bg-opacity-20'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

