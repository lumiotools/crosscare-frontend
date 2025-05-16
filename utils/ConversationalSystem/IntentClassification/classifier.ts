import { OpenAI } from 'openai';
import { IntentClassification, ResponseIntent, EmotionalContent } from './types';
import { ChatCompletionTool } from 'openai/resources/chat';

// Regex patterns as fallbacks
const YES_PATTERNS = /^(yes|yeah|yep|yup|sure|ok|okay|definitely|absolutely)$/i;
const NO_PATTERNS = /^(no|nope|nah|not really|negative)$/i;
const PAUSE_PATTERNS = /(pause|stop|later|continue later|resume later|take a break|have to go)/i;



// Enhanced version of the classifyIntentWithAI function
export const classifyIntentWithAI = async (
  userResponse: string,
  questionContext: {
    questionText: string;
    options?: string[];
    currentDomainId: string;
    currentQuestionId: string;
  },
  apiKey: string
): Promise<IntentClassification> => {
  try {
    // If no API key, fall back to simpler classification
    if (!apiKey || apiKey.trim() === '') {
      console.warn('No valid API key provided, using fallback classification');
      return fallbackClassification(userResponse);
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });
    

    // Prepare the context with question and options
    const isPositiveQuestion = questionContext.questionText.includes("safe") || 
        questionContext.questionText.includes("comfortable") || 
        questionContext.questionText.includes("support");
        
    const isNegativeQuestion = questionContext.questionText.includes("unsafe") || 
        questionContext.questionText.includes("worried") || 
        questionContext.questionText.includes("threatened");
    
    let promptContext = `Question: "${questionContext.questionText}"\n`;
    promptContext += `Question Type: ${isPositiveQuestion ? 'Positive' : (isNegativeQuestion ? 'Negative' : 'Neutral')}\n`;
    
    if (questionContext.options && questionContext.options.length > 0) {
        promptContext += `Options: ${questionContext.options.join(', ')}\n`;
    }

    // Define the function for the API to call
    const tools: ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "classify_response",
          description: "Classify the user's response to a health questionnaire question",
          parameters: {
            type: "object",
            properties: {
              selectedOption: {
                type: "string",
                description: "The option the user selected, or 'other' if their response doesn't match any option"
              },
              matchedIntent: {
                type: "string",
                enum: ["yes", "no", "unclear", "pause_request", "resume_request", "specific_option", "general_response"],
                description: "The broad category of the user's response"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Confidence score for the classification (0-1)"
              },
              emotionalContent: {
                type: "string",
                enum: ["distress", "trauma", "anxiety", "concern", "relief", "none"],
                description: "The emotional content detected in the response, if any"
              },
              needsEmpathy: {
                type: "boolean",
                description: "Whether the response indicates the user needs an empathetic response"
              },
              isPauseRequest: {
                type: "boolean",
                description: "Whether the user is asking to pause or continue later"
              },
              isResumeRequest: {
                type: "boolean",
                description: "Whether the user is asking to resume the conversation"
              }
            },
            required: ["selectedOption", "matchedIntent", "confidence", "emotionalContent", "needsEmpathy", "isPauseRequest", "isResumeRequest"]
          }
        }
      }
    ];

    // Make the API request
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [
        {
        role: "system",
        content: `You are an assistant helping analyze responses to a health questionnaire. 
        Your task is to determine which option a user is selecting and whether their response 
        indicates emotional distress IN THE CONTEXT of the question. 
        
        Pay careful attention to whether the question is phrased positively or negatively:
        - For positive questions (e.g. "Do you feel safe?"), a "no" response might indicate distress
        - For negative questions (e.g. "Do you feel threatened?"), a "yes" response might indicate distress
        - The intensity of a response (e.g. "Yes majorly") does not automatically indicate distress
          if the response is positive in context (e.g. "majorly safe" is positive)
        
        Only mark responses as needing empathy if they truly express negative emotions or difficult circumstances.`
      },
      {
        role: "user",
        content: `${promptContext}\n\nUser response: "${userResponse}"\n\nPlease classify the intent and match to available options.`
      }
      ],
      tools: tools,
      tool_choice: { type: "function", function: { name: "classify_response" } }
    });

    // Process the results
    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.name === "classify_response" && toolCall?.function?.arguments) {
      const parsedArguments = JSON.parse(toolCall.function.arguments);
      
      // Map the enhanced response to our standard format
      return {
        intent: parsedArguments.matchedIntent as ResponseIntent,
        selectedOption: parsedArguments.selectedOption,
        confidence: parsedArguments.confidence,
        emotionalContent: parsedArguments.emotionalContent as EmotionalContent,
        needsEmpathy: parsedArguments.needsEmpathy,
        isPauseRequest: parsedArguments.isPauseRequest,
        isResumeRequest: parsedArguments.isResumeRequest
      };
    }

    // Fallback
    return fallbackClassification(userResponse);
  } catch (error) {
    console.error('Error in enhanced classification:', error);
    return fallbackClassification(userResponse);
  }
};

// Fallback classification using regex patterns
export const fallbackClassification = (userResponse: string): IntentClassification => {
  const cleanedResponse = userResponse.trim().toLowerCase();
  
  // Check for pause request first
  if (PAUSE_PATTERNS.test(cleanedResponse)) {
    return {
      intent: 'pause_request',
      confidence: 0.8,
      emotionalContent: 'none',
      needsEmpathy: false,
      isPauseRequest: true,
      isResumeRequest: false
    };
  }
  
  // Check for yes/no patterns
  if (YES_PATTERNS.test(cleanedResponse)) {
    return {
      intent: 'yes',
      confidence: 0.9,
      emotionalContent: 'none',
      needsEmpathy: false,
      isPauseRequest: false,
      isResumeRequest: false
    };
  }
  
  if (NO_PATTERNS.test(cleanedResponse)) {
    return {
      intent: 'no',
      confidence: 0.9,
      emotionalContent: 'none',
      needsEmpathy: false,
      isPauseRequest: false,
      isResumeRequest: false
    };
  }
  
  // Check for question
  if (cleanedResponse.endsWith('?')) {
    return {
      intent: 'question',
      confidence: 0.8,
      emotionalContent: 'none',
      needsEmpathy: false,
      isPauseRequest: false,
      isResumeRequest: false
    };
  }
  
  // Default to unclear
  return {
    intent: 'unclear',
    confidence: 0.5,
    emotionalContent: 'none',
    needsEmpathy: false,
    isPauseRequest: false,
    isResumeRequest: false
  };
};