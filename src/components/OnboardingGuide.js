"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

const TOOLTIPS = {
  first_time_visitor: {
    title: "Welcome to Motorke! 👋",
    steps: [
      {
        target: "search-bar",
        title: "Start by Searching",
        content: "Browse 1000+ verified vehicles. Filter by make, model, price, or location.",
        position: "bottom",
      },
      {
        target: "saved-cars",
        title: "Save Your Favorites",
        content: "Click the heart icon to save cars. Compare them side-by-side when you're ready.",
        position: "bottom",
      },
      {
        target: "nearby-dealers",
        title: "Find Dealers Near You",
        content: "Enable location to see dealers and cars closest to you.",
        position: "bottom",
      },
      {
        target: "enquiry-form",
        title: "Contact Dealers",
        content: "Found the right car? Send an enquiry or call the dealer directly.",
        position: "top",
      },
    ],
  },
  dealer_first_time: {
    title: "Welcome to Motorke Dealer Portal! 🚗",
    steps: [
      {
        target: "add-car-btn",
        title: "Add Your First Car",
        content: "List vehicles individually or bulk upload up to 500 cars at once.",
        position: "bottom",
      },
      {
        target: "upload-photos",
        title: "Upload Quality Photos",
        content: "Good photos = more buyers. Use your mobile camera to upload on the spot.",
        position: "bottom",
      },
      {
        target: "leads-tab",
        title: "Manage Leads",
        content: "See all buyer inquiries here. Respond quickly to close deals faster.",
        position: "bottom",
      },
      {
        target: "analytics-tab",
        title: "Track Your Performance",
        content: "PRO dealers get analytics: views, enquiries, and conversion rates.",
        position: "bottom",
      },
    ],
  },
};

function OnboardingTooltip({ step, onClose, onNext, currentStep, totalSteps }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const target = document.querySelector(`[data-tooltip="${step.target}"]`);
    if (!target) {
      console.warn(`[Tooltip] Target not found: ${step.target}`);
      return;
    }

    const rect = target.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.top + scrollTop;
    let left = rect.left + scrollLeft;

    if (step.position === "bottom") {
      top += rect.height + 16;
      left += rect.width / 2 - 150;
    } else {
      top -= 120;
      left += rect.width / 2 - 150;
    }

    setPosition({ top, left });
  }, [step]);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl p-6 w-80 border border-blue-200"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-slate-900 pr-4">{step.title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-700 mb-4">{step.content}</p>

        {/* Progress */}
        <div className="mb-4">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 sm:py-2 border border-slate-300 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition"
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className="flex-1 px-4 py-3 sm:py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            {currentStep === totalSteps ? "Done" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function OnboardingGuide({ type = "first_time_visitor" }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  const steps = TOOLTIPS[type]?.steps || [];

  useEffect(() => {
    // Check if user has already seen this tutorial
    const key = `motorke_tutorial_${type}`;
    const seen = localStorage.getItem(key);

    if (!seen) {
      // Show after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setHasSeenTutorial(true);
    }
  }, [type]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`motorke_tutorial_${type}`, "true");
  };

  if (!isVisible || hasSeenTutorial || steps.length === 0) {
    return null;
  }

  return (
    <OnboardingTooltip
      step={steps[currentStep]}
      onClose={handleClose}
      onNext={handleNext}
      currentStep={currentStep + 1}
      totalSteps={steps.length}
    />
  );
}

// Re-export for use in components
export function addTooltipTarget(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) {
    el.setAttribute("data-tooltip", value);
  }
}
