import { QuestionnaireResponse } from '../../../constants/questionaireData';

export type EmotionalState = 'neutral' | 'distressed' | 'concerned' | 'positive' | 'confused';
export type ConversationStage = 'intro' | 'question' | 'empathetic_response' | 'follow_up' | 'domain_transition' | 'paused' | 'completed';

export interface SensitiveDisclosure {
  topic: string;
  questionId: string;
  domainId: string;
  response: string;
  timestamp: Date;
}

export interface ConversationContext {
  // Basic state tracking
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  
  // Current position
  currentDomainIndex: number;
  currentQuestionIndex: number;
  
  // Enhanced context tracking
  stage: ConversationStage;
  emotionalState: EmotionalState;
  lastQuestion: {
    domainId: string;
    questionId: string;
    text: string;
  };
  
  // Important context for RAG and empathetic responses
  sensitiveDisclosures: SensitiveDisclosure[];
  
  // Responses collection
  responses: QuestionnaireResponse[];
}

export type ConversationStateUpdateAction = 
  | { type: 'SET_ACTIVE', payload?: Partial<ConversationContext> }
  | { type: 'SET_PAUSED' | 'SET_COMPLETED', payload?: Record<string, never> }
  | { type: 'SET_POSITION', payload: { currentDomainIndex?: number, currentQuestionIndex?: number } }
  | { type: 'SET_STAGE', payload: { stage: ConversationStage } }
  | { type: 'SET_EMOTIONAL_STATE', payload: { emotionalState: EmotionalState } }
  | { type: 'ADD_SENSITIVE_DISCLOSURE', payload: SensitiveDisclosure }
  | { type: 'ADD_RESPONSE', payload: QuestionnaireResponse }
  | { type: 'SET_LAST_QUESTION', payload: { lastQuestion: { domainId: string, questionId: string, text: string } } }
  | { type: 'RESET', payload?: Partial<ConversationContext> };