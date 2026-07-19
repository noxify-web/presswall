"use client";

import { useEffect, useState } from "react";
import { OnboardingOutletsStep } from "@/components/presswall/onboarding-outlets-step";
import { OnboardingTemplateStep } from "@/components/presswall/onboarding-template-step";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import { setCrispChatboxVisible } from "@/lib/crisp-config";

interface OnboardingFlowProps {
  editor: PresswallEditor;
}

export function OnboardingFlow({ editor }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  // Crisp launcher sits bottom-right and covers Finish / Continue.
  useEffect(() => {
    setCrispChatboxVisible(false);
    return () => {
      setCrispChatboxVisible(true);
    };
  }, []);

  const handleFinish = () => {
    editor
      .completeOnboarding()
      .then((saved) => {
        if (saved) {
          editor.setNeedsOnboarding(false);
        }
      })
      .catch(() => undefined);
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <div
        className={
          step === 1
            ? "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 sm:px-6"
            : "flex min-h-0 flex-1 flex-col items-center overflow-hidden px-6 pt-4"
        }
      >
        <div
          className="fade-in flex h-full min-h-0 w-full animate-in flex-col duration-300"
          key={step}
        >
          {step === 0 ? (
            <OnboardingOutletsStep editor={editor} onNext={() => setStep(1)} />
          ) : null}

          {step === 1 ? (
            <OnboardingTemplateStep
              editor={editor}
              onBack={() => setStep(0)}
              onNext={handleFinish}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
