import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmExitModal } from '../../components/onboarding/ConfirmExitModal';
import { CompletionModal } from '../../components/onboarding/CompletionModal';

interface GetStartedProps {
  agents: number;
  departments: number;
  articles: number;
  all_tickets: number;
  unassigned_tickets: number;
  all_tasks: number;
  unassigned_tasks: number;
}

export const GetStarted: React.FC<GetStartedProps> = ({ 
    agents, 
    departments, 
    articles,
    all_tickets,
    unassigned_tickets,
    all_tasks,
    unassigned_tasks
}) => {
  const navigate = useNavigate();
  
  // Check if onboarding is completed or skipped
  const [isSkipped, setIsSkipped] = useState(() => sessionStorage.getItem('onboardingSkipped') === 'true');
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const steps = [
    {
      title: "Initial Configurations",
      description: "Set up policies, business hours, holidays, ticket categories, departments, and email settings.",
      isComplete: departments > 0, // Simplified check
      link: "/config/general"
    },
    {
      title: "Add Agents",
      description: "Invite your team members to start collaborating.",
      isComplete: agents > 0, // Any agents including admin
      link: "/users/agents"
    },
    {
      title: "Create First Ticket",
      description: "Start managing customer requests by creating your first ticket.",
      isComplete: all_tickets > 0,
      link: "/tickets"
    },
    {
      title: "Create First Task",
      description: "Organize your work by creating tasks for your team.",
      isComplete: all_tasks > 0,
      link: "/tasks"
    },
    {
      title: "Assign Tasks & Tickets",
      description: "Assign tickets and tasks to your agents to get work done.",
      isComplete: (all_tickets > 0 && unassigned_tickets < all_tickets) || (all_tasks > 0 && unassigned_tasks < all_tasks),
      link: "/tickets"
    },
    {
      title: "Set Up Knowledge Base",
      description: "Create articles to help your customers and agents.",
      isComplete: articles > 0,
      link: "/knowledge"
    }
  ];

  const allStepsComplete = steps.every(step => step.isComplete);
  const firstIncompleteStep = steps.findIndex(step => !step.isComplete);
  const [currentStep, setCurrentStep] = useState(firstIncompleteStep !== -1 ? firstIncompleteStep : steps.length);

  useEffect(() => {
    const newFirstIncompleteStep = steps.findIndex(step => !step.isComplete);
    setCurrentStep(newFirstIncompleteStep !== -1 ? newFirstIncompleteStep : steps.length);
  }, [agents, departments, articles, all_tickets, unassigned_tickets, all_tasks, unassigned_tasks]);

  // Handle completion detection
  useEffect(() => {
    if (allStepsComplete && localStorage.getItem('onboardingCompleted') !== 'true') {
      // Mark complete immediately so wizard and resume button disappear
      localStorage.setItem('onboardingCompleted', 'true');
      setShowCompletionModal(true);
    }
  }, [allStepsComplete]);

  // Handle skip confirmation
  const handleSkipConfirm = () => {
    sessionStorage.setItem('onboardingSkipped', 'true');
    setIsSkipped(true);
    setShowExitModal(false);
  };

  // Handle completion modal close
  const handleCompletionClose = () => {
    setShowCompletionModal(false);
  };

  // Don't render if skipped or completed
  if (isSkipped || localStorage.getItem('onboardingCompleted') === 'true') {
    return null;
  }

  // Safety check: if currentStep is out of bounds, don't render
  if (currentStep >= steps.length) {
    return null;
  }

  const activeStepDetails = steps[currentStep];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm relative">
        {/* Close Button */}
        <button
          onClick={() => setShowExitModal(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close onboarding"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Get Started with SafariDesk
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Follow these steps to get your helpdesk up and running.
        </p>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center flex-col relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                  step.isComplete ? 'bg-green-500 text-white' : 
                  index === currentStep ? 'bg-blue-600 text-white' : 
                  'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {step.isComplete ? <Check size={20} /> : <span className="font-bold">{index + 1}</span>}
              </div>
              <p className={`text-xs mt-2 text-center w-24 ${index === currentStep ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>{step.title}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 -mx-2 ${steps[index].isComplete ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg text-center">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{activeStepDetails.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">{activeStepDetails.description}</p>
        <div className="flex items-center justify-center gap-3">
          {!activeStepDetails.isComplete && (
            <button 
              onClick={() => navigate(activeStepDetails.link)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Setup <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Skip Setup
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentStep(s => s - 1)}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        
        <button
          onClick={() => setCurrentStep(s => s + 1)}
          disabled={currentStep >= steps.length - 1 || !steps[currentStep].isComplete}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>
      </div>

      {/* Modals */}
      <ConfirmExitModal
        isOpen={showExitModal}
        onConfirm={handleSkipConfirm}
        onCancel={() => setShowExitModal(false)}
      />
      
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={handleCompletionClose}
      />
    </>
  );
};
