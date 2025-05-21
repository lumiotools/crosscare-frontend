import { QuestionnaireResponse } from '@/constants/questionaireData';
import { ConversationContext, ConversationStateUpdateAction, EmotionalState, SensitiveDisclosure } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial conversation context state
export const initialConversationContext: ConversationContext = {
  isActive: false,
  isPaused: false,
  isCompleted: false,
  currentDomainIndex: 0,
  currentQuestionIndex: 0,
  stage: 'intro',
  emotionalState: 'neutral',
  lastQuestion: {
    domainId: '',
    questionId: '',
    text: '',
  },
  sensitiveDisclosures: [],
  responses: [],
};

// Save context to AsyncStorage
export const saveConversationContext = async (userId: string, context: ConversationContext): Promise<void> => {
  try {
    // Just log the context before saving
    console.log('Saving conversation context to storage:', context);
    
    // Then save it (no need to capture the return value)
    await AsyncStorage.setItem(`conversation_context_${userId}`, JSON.stringify(context));
    
    console.log('Conversation context saved successfully');
  } catch (error) {
    console.error('Error saving conversation context:', error);
  }
};

// Load context from AsyncStorage
export const loadConversationContext = async (userId: string): Promise<ConversationContext | null> => {
  try {
    const savedContext = await AsyncStorage.getItem(`conversation_context_${userId}`);
    console.log('Loaded conversation context from storage:', savedContext);
    if (savedContext) {
      const parsedContext = JSON.parse(savedContext);
      
      // Convert string timestamps back to Date objects for sensitive disclosures
      if (parsedContext.sensitiveDisclosures) {
        parsedContext.sensitiveDisclosures = parsedContext.sensitiveDisclosures.map(
          (disclosure: any) => ({
            ...disclosure,
            timestamp: new Date(disclosure.timestamp)
          })
        );
      }
      
      // Convert response timestamps
      if (parsedContext.responses) {
        parsedContext.responses = parsedContext.responses.map(
          (response: any) => ({
            ...response,
            timestamp: new Date(response.timestamp)
          })
        );
      }
      
      return parsedContext;
    }
    return null;
  } catch (error) {
    console.error('Error loading conversation context:', error);
    return null;
  }
};

// Context reducer for state management
export const conversationReducer = (state: ConversationContext, action: ConversationStateUpdateAction): ConversationContext => {
  switch (action.type) {
    case 'SET_ACTIVE':
      if (action.payload && typeof action.payload === 'object') {
        // Keep all properties from the payload but ensure isActive is true and isPaused is false
        return { 
          ...state,
          ...action.payload, 
          isActive: true, 
          isPaused: false,
        };
      }
      return { ...state, isActive: true, isPaused: false };
    case 'SET_PAUSED':
      return { ...state, isPaused: true, isActive: false, stage: 'paused' };
    case 'SET_COMPLETED':
      return { ...state, isCompleted: true, isActive: false, isPaused: false, stage: 'completed' };
    case 'SET_POSITION':
    return { 
        ...state, 
        currentDomainIndex: action.payload.currentDomainIndex ?? state.currentDomainIndex,
        currentQuestionIndex: action.payload.currentQuestionIndex ?? state.currentQuestionIndex
    };
    case 'SET_STAGE':
      return { ...state, stage: action.payload.stage as any };
    case 'SET_EMOTIONAL_STATE':
      return { ...state, emotionalState: action.payload.emotionalState as EmotionalState };
    case 'ADD_SENSITIVE_DISCLOSURE':
      return { 
        ...state, 
        sensitiveDisclosures: [...state.sensitiveDisclosures, action.payload as unknown as SensitiveDisclosure]
      };
    case 'ADD_RESPONSE':
      return { 
        ...state, 
        responses: [...state.responses, action.payload as unknown as QuestionnaireResponse]
      };
    case 'SET_LAST_QUESTION':
      return { ...state, lastQuestion: action.payload.lastQuestion as any };
    case 'RESET':
      return initialConversationContext;
    default:
      return state;
  }
};