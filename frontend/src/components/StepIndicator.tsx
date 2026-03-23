import type { WizardStep } from './wizard/wizardReducer';

const steps: { key: WizardStep; label: string }[] = [
  { key: 'trip', label: 'Trip' },
  { key: 'registration', label: 'Register' },
  { key: 'payment', label: 'Payment' },
  { key: 'confirmation', label: 'Confirm' },
];

const stepIndex = (step: WizardStep) => {
  if (step === 'registered_confirmation') return steps.length - 1;
  return steps.findIndex((s) => s.key === step);
};

export default function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const current = stepIndex(currentStep);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((s, i) => {
          const isCompleted = i < current;
          const isCurrent = i === current;

          return (
            <li key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 w-full">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-kindo-green text-white'
                      : isCurrent
                        ? 'bg-kindo-purple text-white'
                        : 'bg-kindo-gray-200 text-kindo-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-kindo-purple' : isCompleted ? 'text-kindo-green' : 'text-kindo-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-full mx-2 ${
                    i < current ? 'bg-kindo-green' : 'bg-kindo-gray-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
