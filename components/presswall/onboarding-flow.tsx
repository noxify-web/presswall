"use client";

import { useState } from "react";
import { OnboardingGoLiveStep } from "@/components/presswall/onboarding-go-live-step";
import { OnboardingOutletsStep } from "@/components/presswall/onboarding-outlets-step";
import { OnboardingTemplateStep } from "@/components/presswall/onboarding-template-step";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";

interface OnboardingFlowProps {
  editor: PresswallEditor;
}

export function OnboardingFlow({ editor }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  const handleSkip = () => {
    editor.completeOnboarding().catch(() => undefined);
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden px-6 pt-4">
        <div
          className="fade-in flex h-full min-h-0 w-full animate-in flex-col duration-300"
          key={step}
        >
          {step === 0 ? (
            <OnboardingOutletsStep
              editor={editor}
              onNext={() => setStep(1)}
              onSkip={handleSkip}
            />
          ) : null}

          {step === 1 ? (
            <OnboardingTemplateStep
              editor={editor}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              onSkip={handleSkip}
            />
          ) : null}

          {step === 2 ? (
            <OnboardingGoLiveStep
              editor={editor}
              onBack={() => setStep(1)}
              onComplete={() => editor.setNeedsOnboarding(false)}
              onSkip={handleSkip}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
