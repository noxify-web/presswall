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

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <OnboardingStepDots current={step} total={ONBOARDING_STEPS} />

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 pb-12">
        <div className="fade-in w-full animate-in duration-300" key={step}>
          {step === 0 ? (
            <div className="mx-auto flex justify-center">
              <OnboardingOutletsStep
                editor={editor}
                onContinue={() => setStep(1)}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mx-auto flex justify-center">
              <OnboardingTemplateStep
                editor={editor}
                onContinue={() => setStep(2)}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mx-auto flex justify-center">
              <OnboardingGoLiveStep
                editor={editor}
                onComplete={() => editor.setNeedsOnboarding(false)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
