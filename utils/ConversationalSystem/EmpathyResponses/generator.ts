import { EmpathyResponse, EmpathyTrigger } from './types';
import { IntentClassification } from '../IntentClassification/types';
import axios from 'axios';

// Keep the existing trigger detection logic
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
    
    // Check for housing insecurity
    if (questionText.includes("housing") ||
        questionText.includes("home") ||
        questionText.includes("place to live") ||
        userResponse.toLowerCase().includes("homeless") ||
        userResponse.toLowerCase().includes("evict")) {
      return "housing_insecurity";
    }
    
    // Return general distress as fallback
    return "general_distress";
  };

// New AI-powered empathy response generator
export const generateEmpathyResponse = async (
  trigger: EmpathyTrigger,
  userResponse: string,
  questionContext: string,
  apiKey: string = process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''
): Promise<EmpathyResponse> => {
  try {
    console.log("Generating AI empathy response for:", {
      trigger,
      questionContext,
      responsePreview: userResponse.substring(0, 50) + (userResponse.length > 50 ? '...' : '')
    });
    
    // Determine the follow-up question based on trigger type
    let suggestedFollowUp = "";
    if (trigger === 'physical_harm' || trigger === 'safety_concern') {
      suggestedFollowUp = "Would you like information about safety resources that might be helpful?";
    } else if (trigger === 'financial_distress' || trigger === 'housing_insecurity' || trigger === 'food_insecurity') {
      suggestedFollowUp = "Would you like information about support services that might help with this challenge?";
    }
    
    // Check if we have a valid API key
    if (!apiKey || apiKey.trim() === '') {
      console.error("No API key provided for empathy generation");
      return fallbackEmpathyResponse(trigger, suggestedFollowUp);
    }
    
    // Create a prompt for the AI
    const prompt = `
You are a supportive and empathetic doula providing care to a pregnant person. The person has just shared something that requires an empathetic response.

Question that was asked: "${questionContext}"

Person's response: "${userResponse}"

Type of concern identified: ${trigger.replace('_', ' ')}

Please generate a warm, empathetic response that:
1. Acknowledges their feelings and validates their experience
2. Shows genuine care and concern
3. Is supportive without being judgmental
4. Is brief (2-3 sentences maximum)
5. Feels natural and conversational, not scripted
6. Does not ask follow-up questions (we'll handle that separately)
7. Does not offer solutions yet, just emotional support

Your response should sound like a caring healthcare professional, not a therapist or counselor.
Provide only the response text, no additional commentary.`;

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a supportive and empathetic doula assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extract the generated response
    const generatedResponse = response.data.choices[0]?.message?.content?.trim();
    
    if (!generatedResponse) {
      console.error("Empty response from OpenAI API");
      return fallbackEmpathyResponse(trigger, suggestedFollowUp);
    }
    
    console.log("Generated empathy response:", generatedResponse);
    
    return {
      responseText: generatedResponse,
      followUpQuestion: suggestedFollowUp,
      resourcesOffered: !!suggestedFollowUp
    };
  } catch (error) {
    console.error("Error generating AI empathy response:", error);
    return fallbackEmpathyResponse(trigger, 
      trigger === 'physical_harm' || trigger === 'safety_concern' 
        ? "Would you like information about safety resources that might be helpful?"
        : trigger === 'financial_distress' || trigger === 'housing_insecurity' || trigger === 'food_insecurity'
          ? "Would you like information about support services that might help with this challenge?"
          : undefined
    );
  }
};

// Define fallback responses in case the API call fails
const FALLBACK_TEMPLATES: Record<EmpathyTrigger, string[]> = {
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

// Provide a fallback response if the API call fails
const fallbackEmpathyResponse = (trigger: EmpathyTrigger, followUpQuestion?: string): EmpathyResponse => {
  const templates = FALLBACK_TEMPLATES[trigger];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    responseText: template,
    followUpQuestion,
    resourcesOffered: !!followUpQuestion
  };
};