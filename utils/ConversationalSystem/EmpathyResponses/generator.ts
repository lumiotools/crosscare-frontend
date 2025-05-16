import { EmpathyResponse, EmpathyTrigger } from './types';
import { IntentClassification } from '../IntentClassification/types';

// Map of pre-defined empathetic responses for common scenarios
const EMPATHY_TEMPLATES: Record<EmpathyTrigger, string[]> = {
  physical_harm: [
    "I'm truly sorry to hear that you've experienced physical harm. That must have been very difficult. Your safety and well-being are important, and no one deserves to be hurt.",
    "Thank you for sharing that with me. I'm really sorry you've gone through this. It takes courage to talk about experiences of physical harm, and I want you to know that your safety matters."
  ],
  emotional_harm: [
    "I'm sorry to hear you've experienced emotional harm. Those kinds of experiences can be deeply painful. Your feelings are valid, and it's important that you're recognized and supported.",
    "Thank you for sharing something so personal. Emotional harm can affect us deeply, and I want you to know that your experiences and feelings are valid."
  ],
  safety_concern: [
    "Your safety is really important, and I'm concerned about what you've shared. No one should have to feel unsafe in their environment.",
    "I understand you have concerns about your safety, which is incredibly important. Everyone deserves to feel safe in their daily life."
  ],
  financial_distress: [
    "I hear your concerns about financial challenges. This can be a significant source of stress, especially during pregnancy and planning for a new baby.",
    "Financial worries can be overwhelming, especially at this important time in your life. Thank you for sharing this with me."
  ],
  health_concern: [
    "Thank you for sharing your health concerns with me. Health issues during pregnancy can be worrying, and it's important that you receive the care and support you need.",
    "I understand you're concerned about your health, which is completely natural, especially during pregnancy. Your well-being is a priority."
  ],
  housing_insecurity: [
    "Housing insecurity can be extremely stressful, especially during pregnancy. I'm sorry you're facing this challenge right now.",
    "Thank you for sharing your housing situation with me. Having stable housing is important, and I understand this is a difficult challenge you're facing."
  ],
  food_insecurity: [
    "I'm concerned to hear you're worried about having enough food. Proper nutrition is especially important during pregnancy, and no one should have to worry about where their next meal is coming from.",
    "Food insecurity is a serious concern, particularly when you're pregnant. Thank you for being open about this challenge."
  ],
  isolation: [
    "It sounds like you might be feeling isolated, which can be particularly difficult during pregnancy. Social connections and support are so important during this time.",
    "Thank you for sharing these feelings of isolation. Pregnancy can sometimes feel lonely, and it's important to have support around you."
  ],
  relationship_issue: [
    "Relationship challenges can be particularly difficult during pregnancy. Thank you for sharing this with me.",
    "I appreciate you opening up about your relationship concerns. These issues can be complicated and emotionally demanding, especially during pregnancy."
  ],
  general_distress: [
    "I can hear that you're going through a difficult time. Thank you for sharing that with me. It's important to acknowledge these feelings and know that you're not alone.",
    "Thank you for sharing how you're feeling. It sounds like you're dealing with a lot right now, and I want you to know that your feelings are valid."
  ]
};

// Detect empathy trigger from response and classification
export const detectEmpathyTrigger = (
    userResponse: string,
    classification: IntentClassification,
    questionText: string
  ): EmpathyTrigger | null => {
    
    if (!classification.needsEmpathy) {
      return null;
    }
    
    // Get the intent and context
    const intent = classification.intent;
    const emotionalContent = classification.emotionalContent;
    
    // Parse the question to understand its context
    const isPositiveQuestion = questionText.includes("safe") || 
      questionText.includes("comfortable") || 
      questionText.includes("support") ||
      questionText.includes("help");
      
    const isNegativeQuestion = questionText.includes("unsafe") || 
      questionText.includes("worried") || 
      questionText.includes("threatened") || 
      questionText.includes("hurt") ||
      questionText.includes("threatened") ||
      questionText.includes("afraid");
    
    
    const isYesPositive = isPositiveQuestion && !isNegativeQuestion;
    const isYesNegative = !isPositiveQuestion && isNegativeQuestion;
    
    
    const isDistressResponse = (
     
      (intent === 'yes' && isYesNegative) ||  // "Yes" to negative questions ("Are you threatened?")
      (intent === 'no' && isYesPositive) ||   // "No" to positive questions ("Do you feel safe?")
      
      
      emotionalContent === 'distress' || 
      emotionalContent === 'trauma' ||
      emotionalContent === 'anxiety' ||
      emotionalContent === 'concern'
    );
    
    // Only return a trigger if it actually indicates distress in context
    if (!isDistressResponse) {
      console.log("Empathy marked as needed but response doesn't indicate distress in context:", {
        questionText,
        userResponse,
        isPositiveQuestion,
        isNegativeQuestion,
        isYesPositive,
        isYesNegative
      });
      return null;
    }
    
    // If we get here, the response does indicate distress in context
    // Now determine the specific trigger
    
    // Check for safety concerns
    if (questionText.includes("safe") || 
        questionText.includes("hurt") || 
        questionText.includes("threatened") || 
        questionText.includes("afraid")) {
      return "safety_concern";
    }
    
    // Check for physical harm
    if (userResponse.toLowerCase().includes("hit") || 
        userResponse.toLowerCase().includes("beat") ||
        userResponse.toLowerCase().includes("abuse") ||
        userResponse.toLowerCase().includes("hurt")) {
      return "physical_harm";
    }
    
    // Check for financial difficulties
    
    if (questionText.includes("money") || 
        questionText.includes("afford") || 
        questionText.includes("financial")) {
      return "financial_distress";
    }
    
    // Return general distress as fallback
    return "general_distress";
  };

// Generate an empathetic response
export const generateEmpathyResponse = (
  trigger: EmpathyTrigger,
  userResponse: string,
  questionContext: string
): EmpathyResponse => {
  // Select a random template from the available options for this trigger
  const templates = EMPATHY_TEMPLATES[trigger];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // For more specific scenarios, we could add follow-up questions
  let followUpQuestion: string | undefined;
  
  if (trigger === 'physical_harm' || trigger === 'safety_concern') {
    followUpQuestion = "Would you like information about safety resources that might be helpful?";
  } else if (trigger === 'financial_distress' || trigger === 'housing_insecurity' || trigger === 'food_insecurity') {
    followUpQuestion = "Would you like information about support services that might help with this challenge?";
  }
  
  return {
    responseText: template,
    followUpQuestion,
    resourcesOffered: !!followUpQuestion
  };
};