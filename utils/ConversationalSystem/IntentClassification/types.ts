export type ResponseIntent = 
  | 'yes'             // Affirmative response
  | 'no'              // Negative response
  | 'unclear'         // Not clear if yes or no
  | 'pause_request'   // User wants to pause the conversation
  | 'resume_request'  // User wants to resume the conversation
  | 'question'        // User is asking a question
  | 'emotional'       // Emotional response that needs empathy
  | 'neutral'         // Neutral response with no specific intent
  | 'specific_option' // User is providing a specific response

export type EmotionalContent = 
  | 'distress'      // Signs of emotional distress
  | 'trauma'        // Indication of trauma
  | 'anxiety'       // Showing anxiety or worry
  | 'concern'       // General concern
  | 'relief'        // Positive feeling of relief
  | 'none';         // No emotional content detected

export interface IntentClassification {
  intent: ResponseIntent;
  confidence: number;
  emotionalContent?: EmotionalContent;
  needsEmpathy: boolean;
  isPauseRequest: boolean;
  isResumeRequest: boolean;
  selectedOption?: string;
}