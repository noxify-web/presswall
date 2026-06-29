"use client";

import { useState } from "react";
import { OnboardingGoLiveStep } from "@/components/presswall/onboarding-go-live-step";
import { OnboardingOutletsStep } from "@/components/presswall/onboarding-outlets-step";
import { OnboardingStepDots } from "@/components/presswall/onboarding-step-dots";
import { OnboardingTemplateStep } from "@/components/presswall/onboarding-template-step";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";

const ONBOARDING_STEPS = 3;

interface OnboardingFlowProps {
  editor: PresswallEditor;
}

export function OnboardingFlow({ editor }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  const dots = <OnboardingStepDots current={step} total={ONBOARDING_STEPS} />;

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-4 pb-12">
        <div className="fade-in w-full animate-in duration-300" key={step}>
          {step === 0 ? (
            <OnboardingOutletsStep
              dots={dots}
              editor={editor}
              onNext={() => setStep(1)}
            />
          ) : null}

          {step === 1 ? (
            <OnboardingTemplateStep
              dots={dots}
              editor={editor}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          ) : null}

          {step === 2 ? (
            <OnboardingGoLiveStep
              dots={dots}
              editor={editor}
              onBack={() => setStep(1)}
              onComplete={() => editor.setNeedsOnboarding(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
