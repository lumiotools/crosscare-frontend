export type EmpathyTrigger = 
  | 'physical_harm' 
  | 'emotional_harm'
  | 'safety_concern'
  | 'financial_distress'
  | 'health_concern'
  | 'housing_insecurity'
  | 'food_insecurity'
  | 'isolation'
  | 'relationship_issue'
  | 'general_distress';

export interface EmpathyResponse {
  responseText: string;
  followUpQuestion?: string;
  resourcesOffered?: boolean;
}