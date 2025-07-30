import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  required: boolean;
}

export interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStep: string | null;
  isOnboardingComplete: boolean;
  isFirstTimeUser: boolean;
  markStepCompleted: (stepId: string) => Promise<void>;
  setCurrentStep: (stepId: string | null) => void;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  getProgress: () => { completed: number; total: number; percentage: number };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile_setup',
    title: 'Complete Profile',
    completed: false,
    required: true,
  },
  {
    id: 'club_discovery',
    title: 'Discover Clubs',
    completed: false,
    required: false,
  },
  {
    id: 'club_joining',
    title: 'Join a Club',
    completed: false,
    required: false,
  },
  {
    id: 'first_match_guidance',
    title: 'First Match Guide',
    completed: false,
    required: false,
  },
];

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  ONBOARDING_STEPS: 'onboarding_steps',
  CURRENT_STEP: 'current_onboarding_step',
  FIRST_TIME_USER: 'first_time_user',
};

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<OnboardingStep[]>(ONBOARDING_STEPS);
  const [currentStep, setCurrentStepState] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const { user } = useAuth();

  // Load onboarding state from storage
  useEffect(() => {
    loadOnboardingState();
  }, [user]);

  const loadOnboardingState = async () => {
    if (!user) return;

    try {
      const userKey = `${user.id}_`;
      
      // Load completion status
      const completionStatus = await AsyncStorage.getItem(userKey + STORAGE_KEYS.ONBOARDING_COMPLETE);
      const isComplete = completionStatus === 'true';
      setIsOnboardingComplete(isComplete);

      // Load first time user status
      const firstTimeStatus = await AsyncStorage.getItem(userKey + STORAGE_KEYS.FIRST_TIME_USER);
      const isFirstTime = firstTimeStatus !== 'false'; // Default to true for new users
      setIsFirstTimeUser(isFirstTime);

      // Load step progress
      const stepsData = await AsyncStorage.getItem(userKey + STORAGE_KEYS.ONBOARDING_STEPS);
      if (stepsData) {
        const savedSteps = JSON.parse(stepsData) as OnboardingStep[];
        setSteps(savedSteps);
      }

      // Load current step
      const currentStepData = await AsyncStorage.getItem(userKey + STORAGE_KEYS.CURRENT_STEP);
      setCurrentStepState(currentStepData);

      console.log('Onboarding state loaded:', {
        isComplete,
        isFirstTime,
        currentStep: currentStepData,
        stepsCompleted: stepsData ? JSON.parse(stepsData).filter((s: OnboardingStep) => s.completed).length : 0,
      });
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  };

  const saveOnboardingState = async () => {
    if (!user) return;

    try {
      const userKey = `${user.id}_`;
      
      await AsyncStorage.setItem(userKey + STORAGE_KEYS.ONBOARDING_STEPS, JSON.stringify(steps));
      await AsyncStorage.setItem(userKey + STORAGE_KEYS.ONBOARDING_COMPLETE, isOnboardingComplete.toString());
      await AsyncStorage.setItem(userKey + STORAGE_KEYS.FIRST_TIME_USER, isFirstTimeUser.toString());
      
      if (currentStep) {
        await AsyncStorage.setItem(userKey + STORAGE_KEYS.CURRENT_STEP, currentStep);
      } else {
        await AsyncStorage.removeItem(userKey + STORAGE_KEYS.CURRENT_STEP);
      }
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };

  const markStepCompleted = async (stepId: string) => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    setSteps(updatedSteps);
    
    // Check if all required steps are completed
    const requiredSteps = updatedSteps.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => step.completed);
    const allRequiredCompleted = completedRequiredSteps.length === requiredSteps.length;
    
    if (allRequiredCompleted) {
      setIsOnboardingComplete(true);
      setCurrentStepState(null);
      setIsFirstTimeUser(false);
    } else {
      // Move to next incomplete step
      const nextStep = updatedSteps.find(step => !step.completed);
      setCurrentStepState(nextStep?.id || null);
    }

    console.log('Step completed:', stepId, 'All required completed:', allRequiredCompleted);
  };

  const setCurrentStep = (stepId: string | null) => {
    setCurrentStepState(stepId);
  };

  const skipOnboarding = async () => {
    setIsOnboardingComplete(true);
    setCurrentStepState(null);
    setIsFirstTimeUser(false);
    console.log('Onboarding skipped');
  };

  const resetOnboarding = async () => {
    const resetSteps = ONBOARDING_STEPS.map(step => ({ ...step, completed: false }));
    setSteps(resetSteps);
    setIsOnboardingComplete(false);
    setIsFirstTimeUser(true);
    setCurrentStepState(resetSteps[0]?.id || null);
    console.log('Onboarding reset');
  };

  const getProgress = () => {
    const completedSteps = steps.filter(step => step.completed);
    const totalSteps = steps.length;
    const percentage = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
    
    return {
      completed: completedSteps.length,
      total: totalSteps,
      percentage,
    };
  };

  // Save state whenever it changes
  useEffect(() => {
    if (user) {
      saveOnboardingState();
    }
  }, [steps, isOnboardingComplete, currentStep, isFirstTimeUser, user]);

  const contextValue: OnboardingContextType = {
    steps,
    currentStep,
    isOnboardingComplete,
    isFirstTimeUser,
    markStepCompleted,
    setCurrentStep,
    skipOnboarding,
    resetOnboarding,
    getProgress,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};