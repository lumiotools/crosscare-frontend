import {create} from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUESTIONNAIRE_DOMAINS } from '@/constants/questionaireData';

// Define the store types
interface QuestionnaireState {
  // Core state
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  
  // Position tracking
  currentDomainIndex: number;
  currentQuestionIndex: number;
  
  // Data storage
  responses: Array<{
    questionId: string;
    domainId: string;
    response: string;
    flag: string;
    timestamp: Date;
  }>;
  
  // Sensitive info tracking
  sensitiveDisclosures: Array<{
    topic: string;
    questionId: string;
    domainId: string;
    response: string;
    timestamp: Date;
  }>;
  
  // Last question details
  lastQuestion: {
    domainId: string;
    questionId: string;
    text: string;
  };
  
  // Actions
  startQuestionnaire: () => void;
  pauseQuestionnaire: () => void;
  resumeQuestionnaire: () => void;
  completeQuestionnaire: () => void;
  
  // Question navigation
  moveToNextQuestion: () => void;
  goToDomain: (domainIndex: number) => void;
  goToQuestion: (domainIndex: number, questionIndex: number) => void;
  
  // Data manipulation
  addResponse: (response: { 
    questionId: string; 
    domainId: string; 
    response: string; 
    flag: string;
  }) => void;
  
  addSensitiveDisclosure: (disclosure: {
    topic: string;
    questionId: string;
    domainId: string;
    response: string;
  }) => void;
  
  setLastQuestion: (question: {
    domainId: string;
    questionId: string;
    text: string;
  }) => void;
  
  resetQuestionnaire: () => void;
  
  // Helper methods
  getCurrentQuestion: () => any;
  getProgressPercentage: () => number;
  getCurrentDomainTitle: () => string;
}

// Create the store with persistence
export const useQuestionnaireStore = create<QuestionnaireState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      isPaused: false,
      isCompleted: false,
      currentDomainIndex: 0,
      currentQuestionIndex: 0,
      responses: [],
      sensitiveDisclosures: [],
      lastQuestion: {
        domainId: '',
        questionId: '',
        text: '',
      },
      
      // Actions
      startQuestionnaire: () => set({ 
        isActive: true, 
        isPaused: false,
        currentDomainIndex: 0,
        currentQuestionIndex: 0
      }),
      
      pauseQuestionnaire: () => set({ 
        isPaused: true, 
        isActive: false 
      }),
      
      resumeQuestionnaire: () => set({
        isPaused: false,
        isActive: true
      }),
      
      completeQuestionnaire: () => set({
        isCompleted: true,
        isActive: false,
        isPaused: false
      }),
      
      // Question navigation
      moveToNextQuestion: () => {
        const { currentDomainIndex, currentQuestionIndex } = get();
        const currentDomain = QUESTIONNAIRE_DOMAINS[currentDomainIndex];
        
        if (!currentDomain) return;
        
        // If we're at the end of the current domain
        if (currentQuestionIndex >= currentDomain.questions.length - 1) {
          // If we're at the last domain, complete the questionnaire
          if (currentDomainIndex >= QUESTIONNAIRE_DOMAINS.length - 1) {
            get().completeQuestionnaire();
            return;
          }
          
          // Otherwise move to the next domain
          set({
            currentDomainIndex: currentDomainIndex + 1,
            currentQuestionIndex: 0
          });
          return;
        }
        
        // Otherwise just move to the next question
        set({ currentQuestionIndex: currentQuestionIndex + 1 });
      },
      
      goToDomain: (domainIndex) => {
        if (domainIndex >= 0 && domainIndex < QUESTIONNAIRE_DOMAINS.length) {
          set({ 
            currentDomainIndex: domainIndex, 
            currentQuestionIndex: 0 
          });
        }
      },
      
      goToQuestion: (domainIndex, questionIndex) => {
        const domain = QUESTIONNAIRE_DOMAINS[domainIndex];
        if (domain && questionIndex >= 0 && questionIndex < domain.questions.length) {
          set({ 
            currentDomainIndex: domainIndex, 
            currentQuestionIndex: questionIndex 
          });
        }
      },
      
      // Data manipulation
      addResponse: (response) => set((state) => ({
        responses: [...state.responses, {
          ...response,
          timestamp: new Date()
        }]
      })),
      
      addSensitiveDisclosure: (disclosure) => set((state) => ({
        sensitiveDisclosures: [...state.sensitiveDisclosures, {
          ...disclosure,
          timestamp: new Date()
        }]
      })),
      
      setLastQuestion: (question) => set({
        lastQuestion: question
      }),
      
      resetQuestionnaire: () => set({
        isActive: false,
        isPaused: false,
        isCompleted: false,
        currentDomainIndex: 0,
        currentQuestionIndex: 0,
        responses: [],
        sensitiveDisclosures: [],
        lastQuestion: {
          domainId: '',
          questionId: '',
          text: '',
        }
      }),
      
      // Helper methods
      getCurrentQuestion: () => {
        const { currentDomainIndex, currentQuestionIndex } = get();
        const domain = QUESTIONNAIRE_DOMAINS[currentDomainIndex];
        if (!domain) return null;
        
        return domain.questions[currentQuestionIndex] || null;
      },
      
      getProgressPercentage: () => {
        const { responses } = get();
        const totalQuestions = QUESTIONNAIRE_DOMAINS.reduce(
          (sum, domain) => sum + domain.questions.length, 
          0
        );
        
        return Math.min(Math.round((responses.length / totalQuestions) * 100), 100);
      },
      
      getCurrentDomainTitle: () => {
        const { currentDomainIndex } = get();
        const domain = QUESTIONNAIRE_DOMAINS[currentDomainIndex];
        return domain ? domain.description : "Getting to Know You";
      }
    }),
    {
      name: 'questionnaire-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these properties
        isActive: state.isActive,
        isPaused: state.isPaused,
        isCompleted: state.isCompleted,
        currentDomainIndex: state.currentDomainIndex,
        currentQuestionIndex: state.currentQuestionIndex,
        responses: state.responses,
        sensitiveDisclosures: state.sensitiveDisclosures,
        lastQuestion: state.lastQuestion
      }),
      // Convert dates back from strings when hydrating from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert response timestamps
          if (state.responses) {
            state.responses = state.responses.map(response => ({
              ...response,
              timestamp: new Date(response.timestamp)
            }));
          }
          
          // Convert sensitive disclosure timestamps
          if (state.sensitiveDisclosures) {
            state.sensitiveDisclosures = state.sensitiveDisclosures.map(disclosure => ({
              ...disclosure,
              timestamp: new Date(disclosure.timestamp)
            }));
          }
        }
      }
    }
  )
);