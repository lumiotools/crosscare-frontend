import { useState, useEffect, useRef, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUESTIONNAIRE_DOMAINS } from '../../constants/questionaireData';
import { 
  ConversationalQuestionnaireProps,
  ConversationalQuestionnaireManager,
  QuestionnaireAction
} from './types';
import { 
  initialConversationContext,
  conversationReducer, 
  saveConversationContext,
  loadConversationContext
} from '../../utils/ConversationalSystem/ConversationalContext/contextManager';
import { 
  classifyIntentWithAI,
  fallbackClassification
} from '../../utils/ConversationalSystem/IntentClassification/classifier';
import {
  getCachedClassification
} from '../../utils/ConversationalSystem/IntentClassification/cache';
import {
  detectEmpathyTrigger,
  generateEmpathyResponse
} from '../../utils/ConversationalSystem/EmpathyResponses/generator';
import axios from 'axios';

// Default OpenAI API key (you'll want to store this securely)
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const ConversationalQuestionnaire = ({
  userId,
  onQuestionReady,
  onQuestionnaireComplete,
  onResponseSaved,
  openAIApiKey = DEFAULT_API_KEY
}: ConversationalQuestionnaireProps): ConversationalQuestionnaireManager => {
  // Use useReducer instead of multiple useState calls for complex state
  const [context, dispatch] = useReducer(conversationReducer, initialConversationContext);
  
  // Track sent messages to prevent duplicates
  const sentMessages = useRef(new Set<string>()).current;
  
  // Flag to prevent multiple starts
  const isStartingQuestionnaire = useRef(false);
  
  // Flag to track if intro has been shown
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  
  // Intro step tracking
  const [introStep, setIntroStep] = useState(0);
  
  // Tracking for "Do you have a few minutes" question
  const [hasAskedForTime, setHasAskedForTime] = useState(false);
  const [userWantsToStart, setUserWantsToStart] = useState(false);
  
  // Flag for waiting for domain transition confirmation
  const [waitingForDomainTransition, setWaitingForDomainTransition] = useState(false);
  const [nextDomainIndex, setNextDomainIndex] = useState(-1);
  const hasLoadedRef = useRef(false);
  
  // Save context whenever it changes
  // useEffect(() => {
  //   saveConversationState();
  // }, [context]);

  useEffect(() => {
    let isMounted = true;
    
    if (isMounted && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadConversationState();
      console.log("Initial conversation context load complete");
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      context.isActive &&
      !context.isPaused &&
      !context.isCompleted &&
      context.currentQuestionIndex !== null
    ) {
      sendNextQuestion();
    }
  }, [context.currentQuestionIndex, context.currentDomainIndex]);
  
  // Intro sequence effect - similar to the current implementation but with improvements
  useEffect(() => {
    if (!context.isActive || context.isCompleted) return;
    
    // First, ask if they have a few minutes if we haven't asked yet
    if (!hasAskedForTime) {
      const timeQuestion = `Hey there, do you have a few minutes for a health questionnaire?`;
      
      if (!sentMessages.has("time_question")) {
        sentMessages.add("time_question");
        saveLastQuestion("time", "time_question", timeQuestion);
        onQuestionReady(timeQuestion);
        setHasAskedForTime(true);
      }
      return;
    }
    
    // Only proceed if user has indicated they want to start
    if (!userWantsToStart) {
      return;
    }
    
    // First-time user who needs to see the intro
    if (!hasSeenIntro && introStep < 4) {
      const introMessages = [
        `I'm here to support you throughout your pregnancy journey. I'd like to better understand your situation to provide personalized guidance.`,
        
        `Many factors in our lives—like housing, food access, support systems, and more—can affect our health and wellbeing during pregnancy.`,
        
        `I'd like to ask you some questions about your life circumstances. This will help me connect you with useful resources and information. Everything you share is confidential, and you can skip any questions that make you uncomfortable.`
      ];
      
      if (introStep < 3) {
        // Send the current intro message if not already sent
        const messageKey = `intro_${introStep}`;
        if (!sentMessages.has(messageKey)) {
          sentMessages.add(messageKey);
          onQuestionReady(introMessages[introStep]);
        }
        
        // Schedule the next intro message with a delay
        const timer = setTimeout(() => {
          setIntroStep((prevStep) => prevStep + 1);
        }, 1500);
        
        return () => clearTimeout(timer);
      } else if (introStep === 3) {
        // Start the actual questionnaire after a delay
        const timer = setTimeout(() => {
          setIntroStep(4); // Mark intro as complete
          
          // Mark intro as shown in AsyncStorage
          AsyncStorage.setItem(`intro_shown_${userId}`, "true")
            .then(() => {
              setHasSeenIntro(true);
              
              // Send the first question if not already sent
              if (!sentMessages.has("first_question")) {
                sendNextQuestion();
              }
            })
            .catch(error => console.error("Error saving intro shown status:", error));
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
    // Returning user who has seen the intro
    else if (hasSeenIntro && introStep >= 4) {
      // Send the first question if not already sent
      setTimeout(() => {
        if (!sentMessages.has("first_question")) {
          sendNextQuestion();
        }
      }, 500);
    }
  }, [
    context.isActive,
    context.isCompleted,
    introStep,
    hasSeenIntro,
    hasAskedForTime,
    userWantsToStart
  ]);
  
  // Load conversation state from storage
  const loadConversationState = async () => {
    try {
      const savedContext = await loadConversationContext(userId);
      if (savedContext) {
        // Dispatch the loaded context to our reducer
        dispatch({
          type: 'RESET',
          payload: savedContext
        });
        
        // If the conversation was paused, we'll need to restore the appropriate state variables
        if (savedContext.isPaused) {
          setWaitingForDomainTransition(false);
          setNextDomainIndex(-1);
          
          // Skip intro for returning users
          setIntroStep(4);
          setHasSeenIntro(true);
          setHasAskedForTime(true);
          setUserWantsToStart(true);
        }
      }
      
      // Check if intro has been shown previously
      const introShown = await AsyncStorage.getItem(`intro_shown_${userId}`);
      if (introShown === "true") {
        setHasSeenIntro(true);
        setIntroStep(4);
      }
    } catch (error) {
      console.error("Error loading conversation state:", error);
    }
  };
  
  // Save conversation state to storage
  const saveConversationState = async () => {
    try {
      await saveConversationContext(userId, context);
    } catch (error) {
      console.error("Error saving conversation state:", error);
    }
  };
  
  // Track the last question we sent
  const saveLastQuestion = (domainId: string, questionId: string, questionText: string) => {
    try {
      const lastQuestion = {
        domainId,
        questionId,
        text: questionText
      };
      
      // Update the context
      dispatch({
        type: 'SET_LAST_QUESTION',
        payload: { lastQuestion }
      });
      
      // Also save directly to AsyncStorage for resuming
      AsyncStorage.setItem(`last_question_${userId}`, JSON.stringify(lastQuestion))
        .catch(error => console.error("Error saving last question:", error));
    } catch (error) {
      console.error("Error in saveLastQuestion:", error);
    }
  };
  
  // Send the next question in the sequence
  const sendNextQuestion = () => {
    try {
      // Don't send questions if paused
      if (context.isPaused) {
        console.log("Questionnaire is paused, not sending next question");
        return;
      }
      
      // Debug log with current state
      console.log("sendNextQuestion called with state:", {
        currentDomainIndex: context.currentDomainIndex,
        currentQuestionIndex: context.currentQuestionIndex,
        introStep,
        hasSeenIntro,
        waitingForDomainTransition
      });
      
      // Get the current domain
      const currentDomain = QUESTIONNAIRE_DOMAINS[context.currentDomainIndex];
      if (!currentDomain) {
        console.error("Invalid domain index:", context.currentDomainIndex);
        completeQuestionnaire();
        return;
      }
      
      // Get the current question
      const currentQuestion = currentDomain.questions[context.currentQuestionIndex];
      
      // Log before checking to see what's happening
      console.log(`Looking for question at index ${context.currentQuestionIndex} in domain ${currentDomain.id}`);
      console.log(`Found question:`, currentQuestion ? currentQuestion.id : "NOT FOUND");
      
      if (!currentQuestion) {
        console.error("Invalid question index:", context.currentQuestionIndex);
        askToContinue();
        return;
      }
      
      // Create a unique key for this question
      const questionKey = `question_${currentDomain.id}_${currentQuestion.id}`;
      
      // Only send if we haven't sent this question before
      if (!sentMessages.has(questionKey)) {
        sentMessages.add(questionKey);
        
        // Format the question conversationally
        let formattedQuestion = formatQuestionConversationally(currentDomain, currentQuestion);
        
        // Add options if available
        if (currentQuestion.options && currentQuestion.options.length > 0) {
          formattedQuestion += " " + currentQuestion.options.map(opt => `"${opt}"`).join(" or ");
        }
        
        // Save the last question
        saveLastQuestion(currentDomain.id, currentQuestion.id, formattedQuestion);
        
        // Set the conversation stage to question
        dispatch({
          type: 'SET_STAGE',
          payload: { stage: 'question' }
        });
        
        // Send the question
        onQuestionReady(formattedQuestion);
        
        // Mark first question as sent if this is the first one
        if (context.currentDomainIndex === 0 && context.currentQuestionIndex === 0) {
          sentMessages.add("first_question");
        }
      }
    } catch (error) {
      console.error("Error in sendNextQuestion:", error);
    }
  };
  
  // Format question in a conversational way
  const formatQuestionConversationally = (domain: any, question: any) => {
    // Add domain intro if it's the first question
    if (context.currentQuestionIndex === 0) {
      return `Now I'd like to ask you about ${domain.description.toLowerCase()}. ${question.text}`;
    }
    
    // Otherwise just ask the question naturally
    const conversationalLeadIns = ["", "Could you tell me, ", "I'd like to know, "];
    const leadIn = conversationalLeadIns[Math.floor(Math.random() * conversationalLeadIns.length)];
    return `${leadIn}${question.text}`;
  };
  
  // Ask if user wants to continue to the next domain
  const askToContinue = () => {
    try {
      const continueKey = `continue_${context.currentDomainIndex}`;
      if (!sentMessages.has(continueKey)) {
        sentMessages.add(continueKey);
        
        // Set waiting for domain transition
        setWaitingForDomainTransition(true);
        setNextDomainIndex(context.currentDomainIndex + 1);
        
        // Set stage to domain transition
        dispatch({
          type: 'SET_STAGE',
          payload: { stage: 'domain_transition' }
        });
        
        // Create the message
        const nextDomainIndex = context.currentDomainIndex + 1;
        let continueMessage = "Would you like to continue with more questions, or would you prefer to take a break?";
        
        if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
          const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex];
          continueMessage = `That completes this section. Would you like to continue to questions about ${nextDomain.description.toLowerCase()}, or would you prefer to take a break?`;
        }
        
        // Save the message
        saveLastQuestion("continue", `continue_${context.currentDomainIndex}`, continueMessage);
        
        // Send the message
        onQuestionReady(continueMessage);
      }
    } catch (error) {
      console.error("Error in askToContinue:", error);
    }
  };
  
  // Core function to handle user responses
  
    const handleUserResponse = async (response: string): Promise<boolean> => {
    try {
      console.log("Processing user response:", response);
      
      // Early return if questionnaire is not active
      if (!context.isActive || context.isCompleted) {
        console.log("Questionnaire is not active or is completed");
        return false;
      }
      
      // Handle the "Do you have a few minutes?" question
      if (hasAskedForTime && !userWantsToStart) {
        console.log("Processing response to 'Do you have a few minutes?' question");
        
        // Use our AI-powered intent classifier
        const classificationKey = `time_${response.trim().toLowerCase()}`;
        const classification = await getCachedClassification(
          classificationKey,
          () => classifyIntentWithAI(
            response,
            {
              questionText: "Do you have a few minutes to answer some health questions?",
              options: ["Yes", "No"],
              currentDomainId: "intro",
              currentQuestionId: "time_question"
            },
            openAIApiKey
          )
        );
        
        console.log(`Classified intent for time question: ${classification.intent} (confidence: ${classification.confidence})`);
        
        // Handle positive responses
        if (classification.intent === 'yes' || 
            (classification.selectedOption && 
             classification.selectedOption.toLowerCase() === 'yes')) {
          console.log("User wants to start the questionnaire");
          setUserWantsToStart(true);
          return true;
        }
        
        // Handle negative responses
        if (classification.intent === 'no' || 
            classification.isPauseRequest || 
            (classification.selectedOption && 
             classification.selectedOption.toLowerCase() === 'no')) {
          console.log("User doesn't want to start the questionnaire now");
          
          // Send a polite response and mark as paused
          const noTimeKey = "no_time_response";
          if (!sentMessages.has(noTimeKey)) {
            sentMessages.add(noTimeKey);
            const noTimeMessage = "No problem! We can continue this conversation whenever you have more time. Just let me know when you're ready.";
            
            // Save as last message
            saveLastQuestion("pause", noTimeKey, noTimeMessage);
            
            // Set paused state
            dispatch({
              type: 'SET_PAUSED',
              payload: {}
            });
            
            // Send response
            onQuestionReady(noTimeMessage);
          }
          return true;
        }
        
        // For unclear or other responses, assume they want to start
        console.log("Unclear response to time question, assuming user wants to start");
        setUserWantsToStart(true);
        return true;
      }
      
      // Handle domain transition responses
      if (waitingForDomainTransition) {
        console.log("Processing response to domain transition question");
        
        // Use enhanced classification
        const classification = await classifyIntentWithAI(
          response,
          {
            questionText: "Would you like to continue with more questions or take a break?",
            options: ["Continue", "Pause"],
            currentDomainId: "domain_transition",
            currentQuestionId: `continue_${context.currentDomainIndex}`
          },
          openAIApiKey
        );
        
        console.log(`Classified intent for domain transition: ${classification.intent}`);
        
        // If they want to continue
        if (classification.intent === 'yes' || 
            (classification.selectedOption && 
             classification.selectedOption.toLowerCase().includes('continue'))) {
          console.log("User wants to continue to the next domain");
          
          // Reset waiting flag
          setWaitingForDomainTransition(false);
          
          // Move to the next domain if valid
          if (nextDomainIndex >= 0 && nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
            dispatch({
              type: 'SET_POSITION',
              payload: {
                currentDomainIndex: nextDomainIndex,
                currentQuestionIndex: 0
              }
            });
          } else {
            moveToNextDomain();
          }
          return true;
        }
        
        // If they want to pause
        if (classification.intent === 'no' || 
            classification.isPauseRequest || 
            (classification.selectedOption && 
             (classification.selectedOption.toLowerCase().includes('pause') || 
              classification.selectedOption.toLowerCase().includes('break')))) {
          console.log("User wants to pause the questionnaire");
          
          // Reset waiting flags
          setWaitingForDomainTransition(false);
          setNextDomainIndex(-1);
          
          // Set context to paused with slight delay
          setTimeout(() => {
            dispatch({
              type: 'SET_PAUSED',
              payload: {}
            });
          }, 100);
          
          // Send confirmation message
          const pauseKey = `pause_${context.currentDomainIndex}`;
          if (!sentMessages.has(pauseKey)) {
            sentMessages.add(pauseKey);
            const pauseMessage = "I've saved your progress. We can continue whenever you're ready - just let me know.";
            
            // Save as last message
            saveLastQuestion("pause", pauseKey, pauseMessage);
            
            // Send message
            onQuestionReady(pauseMessage);
          }
          return true;
        }
        
        // For unclear responses or questions, provide clarification
        if (classification.intent === 'unclear' || classification.intent === 'question') {
          const clarificationKey = `clarify_${context.currentDomainIndex}`;
          if (!sentMessages.has(clarificationKey)) {
            sentMessages.add(clarificationKey);
            
            let clarificationMessage = "I'm asking if you'd like to continue with more questions now, or if you'd prefer to pause and come back later. You can say 'yes' to continue or 'no' to pause.";
            
            // Add context about the next domain if available
            if (nextDomainIndex >= 0 && nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
              const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex];
              clarificationMessage = `I'm asking if you'd like to continue with questions about ${nextDomain.description.toLowerCase()} now, or if you'd prefer to pause and come back later. You can say 'yes' to continue or 'no' to pause.`;
            }
            
            // Send clarification
            onQuestionReady(clarificationMessage);
          }
          return true;
        }
        
        // For any other response, assume they want to continue
        console.log("Assuming user wants to continue based on response");
        
        // Reset waiting flag
        setWaitingForDomainTransition(false);
        
        // Move to next domain
        if (nextDomainIndex >= 0 && nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
          dispatch({
            type: 'SET_POSITION',
            payload: {
              currentDomainIndex: nextDomainIndex,
              currentQuestionIndex: 0
            }
          });
        } else {
          moveToNextDomain();
        }
        return true;
      }
      
      // Process regular question responses
      return await processQuestionResponse(response);
    } catch (error) {
      console.error("Error in handleUserResponse:", error);
      return false;
    }
  };
  
  // Process a response to a regular question
  const processQuestionResponse = async (response: string): Promise<boolean> => {
    try {
      // Get the current domain and question
      const currentDomain = QUESTIONNAIRE_DOMAINS[context.currentDomainIndex];
      if (!currentDomain) {
        console.error("Invalid domain index:", context.currentDomainIndex);
        return false;
      }
      
      // Validate question index
      if (context.currentQuestionIndex >= currentDomain.questions.length) {
        console.log("At the end of domain questions, asking to continue");
        askToContinue();
        return true;
      }
      
      // Get the current question
      const currentQuestion = currentDomain.questions[context.currentQuestionIndex];
      if (!currentQuestion) {
        console.error("Invalid question index:", context.currentQuestionIndex);
        return false;
      }
      
      console.log("Processing response to question:", currentQuestion.id);
      
      // Use enhanced classification with full context
      const classification = await classifyIntentWithAI(
        response,
        {
          questionText: currentQuestion.text,
          options: currentQuestion.options || [],
          currentDomainId: currentDomain.id,
          currentQuestionId: currentQuestion.id
        },
        openAIApiKey
      );
      
      console.log("Response classification:", classification);
      
      // // First, check if this is a pause request (can happen at any time)
      // if (classification.isPauseRequest) {
      //   console.log("Detected pause request during questionnaire");
        
      //   // Send confirmation and pause
      //   const pauseKey = `pause_request`;
      //   if (!sentMessages.has(pauseKey)) {
      //     sentMessages.add(pauseKey);
      //     const pauseMessage = "I understand you'd like to take a break. I've saved your progress, and we can continue whenever you're ready.";
          
      //     // Save the context
      //     saveLastQuestion("pause", pauseKey, pauseMessage);
          
      //     // Set the state to paused
      //     dispatch({
      //       type: 'SET_PAUSED',
      //       payload: {}
      //     });
          
      //     await saveConversationState();

      //     // Send the message
      //     onQuestionReady(pauseMessage);
      //   }
      //   return true;
      // }

      // if (classification.isResumeRequest) {
      //   console.log("Detected resume request")
      //   await resumeQuestionnaire();
      //   return true;
      // }
      
      // Check if the response needs empathy
      if (classification.needsEmpathy || classification.emotionalContent !== 'none') {
        const empathyTrigger = detectEmpathyTrigger(response, classification, currentQuestion.text);
        
        if (empathyTrigger) {
          console.log("Detected need for empathetic response, trigger:", empathyTrigger);
          
          // Generate an empathetic response
          const empathyResponse = generateEmpathyResponse(
            empathyTrigger,
            response,
            currentQuestion.text
          );
          
          // Record this as a sensitive disclosure
          const sensitiveDisclosure = {
            topic: empathyTrigger,
            questionId: currentQuestion.id,
            domainId: currentDomain.id,
            response: response,
            timestamp: new Date()
          };
          
          // Add to context
          dispatch({
            type: 'ADD_SENSITIVE_DISCLOSURE',
            payload: sensitiveDisclosure
          });
          
          // Update emotional state
          dispatch({
            type: 'SET_EMOTIONAL_STATE',
            payload: { 
              emotionalState: 
                empathyTrigger === 'physical_harm' || empathyTrigger === 'safety_concern' 
                  ? 'distressed' 
                  : 'concerned'
            }
          });
          
          // Set stage to empathetic response
          dispatch({
            type: 'SET_STAGE',
            payload: { stage: 'empathetic_response' }
          });
          
          // Send the empathetic response
          onQuestionReady(empathyResponse.responseText);

          console.log("Current question ID:", currentQuestion.id);
          console.log("Follow-up mapping:", currentQuestion.followUp);
          console.log("Selected option:", classification.selectedOption);
          
          // If there's a follow-up question, send that after a delay
            if (empathyResponse.followUpQuestion) {
              setTimeout(() => {
                onQuestionReady(empathyResponse.followUpQuestion as string);
                
                // Add this section to continue after the follow-up
                setTimeout(() => {
                  // After follow-up question, determine next question based on follow-up mapping
                  if (currentQuestion.followUp) {
                    let followUpId = null;
                    
                    // Check for selected option in the mapping
                    if (classification.selectedOption && currentQuestion.followUp[classification.selectedOption]) {
                      followUpId = currentQuestion.followUp[classification.selectedOption];
                    } 
                    // Use wildcard if available
                    else if (currentQuestion.followUp["*"]) {
                      followUpId = currentQuestion.followUp["*"];
                    }
                    
                    if (followUpId) {
                      const targetQuestionIndex = currentDomain.questions.findIndex(q => q.id === followUpId);
                      if (targetQuestionIndex !== -1) {
                        dispatch({
                          type: 'SET_POSITION',
                          payload: {
                            currentQuestionIndex: targetQuestionIndex
                          }
                        });
                        return;
                      }
                    }
                  }
                  
                  // Fallback to incrementing sequentially if no mapping found
                  const nextQuestionIndex = context.currentQuestionIndex + 1;
                  if (nextQuestionIndex < currentDomain.questions.length) {
                    dispatch({
                      type: 'SET_POSITION',
                      payload: {
                        currentQuestionIndex: nextQuestionIndex
                      }
                    });
                  } else {
                    // End of domain, ask to continue
                    askToContinue();
                  }
                }, 5000);
                
              }, 2000);
            } else {
              // If no follow-up, just save the response and continue
              saveResponseAndContinue(response, currentQuestion, currentDomain);
            }
          
          return true;
        }
      }

         // ADD THIS SECTION - handle unclear responses to branching questions

         if ((classification.intent === 'unclear' || 
          (classification.intent === 'specific_option' && 
          classification.selectedOption === 'other')) && 
          currentQuestion.followUp && 
          currentQuestion.options && 
          currentQuestion.options.length > 0) {
        
        console.log("Detected unclear response to branching question, asking for clarification");
        
        // Generate clarification key different from the original question key
        const clarificationKey = `clarify_${currentDomain.id}_${currentQuestion.id}`;
        
        if (!sentMessages.has(clarificationKey)) {
          sentMessages.add(clarificationKey);
          
          // Clear the original question from sentMessages to allow it to be sent again
          const originalQuestionKey = `question_${currentDomain.id}_${currentQuestion.id}`;
          sentMessages.delete(originalQuestionKey);
          
          // Ask for clarification
          let clarificationMsg = `I need a clearer answer to proceed. ${currentQuestion.text}`;
          
          // Add options if available
          if (currentQuestion.options && currentQuestion.options.length > 0) {
            clarificationMsg += " Please choose " + currentQuestion.options.map(opt => `"${opt}"`).join(" or ");
          }
          
          // Send the clarification
          onQuestionReady(clarificationMsg);
          
          return true;
        }
      }
      
      // Process follow-up logic if present and we have options
      if (currentQuestion.followUp && 
          Object.keys(currentQuestion.followUp).length > 0 && 
          currentQuestion.options && 
          currentQuestion.options.length > 0) {
        
        // Get the selected option from classification
        const selectedOption = classification.selectedOption;
        
        if (selectedOption) {
          // Check if this option has a follow-up defined
          let followUpId = null;
          
          // Check exact match
          if (currentQuestion.followUp[selectedOption]) {
            followUpId = currentQuestion.followUp[selectedOption];
          } else {
            // Check case-insensitive match
            for (const option of Object.keys(currentQuestion.followUp)) {
              if (option.toLowerCase() === selectedOption.toLowerCase()) {
                followUpId = currentQuestion.followUp[option];
                break;
              }
            }
          }
          
          // Check for wildcard
          if (!followUpId && currentQuestion.followUp["*"]) {
            followUpId = currentQuestion.followUp["*"];
          }
          
          if (followUpId) {
            console.log(`Found follow-up ID ${followUpId} for selected option ${selectedOption}`);
            
            // Handle domain transition if specified
            if (followUpId.startsWith("domain[")) {
              const targetQuestionId = followUpId.match(/domain\[([^\]]+)\]/)?.[1];
              if (targetQuestionId) {
                // Find the domain that contains this question
                for (let i = 0; i < QUESTIONNAIRE_DOMAINS.length; i++) {
                  if (QUESTIONNAIRE_DOMAINS[i].questions.some(q => q.id === targetQuestionId)) {
                    // Save the response
                    const questionnaireResponse = {
                      questionId: currentQuestion.id,
                      domainId: currentDomain.id,
                      response: selectedOption,
                      flag: currentQuestion.flag || "",
                      timestamp: new Date()
                    };
                    
                    // Save state after processing a response
                    await saveConversationState();
                    
                    // Add to context
                    dispatch({
                      type: 'ADD_RESPONSE',
                      payload: questionnaireResponse
                    });
                    
                    // Notify parent
                    onResponseSaved(questionnaireResponse);
                    
                    // Set up for domain transition
                    setNextDomainIndex(i);
                    setWaitingForDomainTransition(true);
                    
                    // Ask to continue
                    askToContinue();
                    
                    return true;
                  }
                }
              }
            } else {
              // Regular follow-up within the same domain
              // Find the index of the target question
              const targetQuestionIndex = currentDomain.questions.findIndex(q => q.id === followUpId);
              
              if (targetQuestionIndex !== -1) {
                console.log(`Found follow-up question at index ${targetQuestionIndex}`);
                
                // Save the response
                const questionnaireResponse = {
                  questionId: currentQuestion.id,
                  domainId: currentDomain.id,
                  response: selectedOption,
                  flag: currentQuestion.flag || "",
                  timestamp: new Date()
                };
                
                // Update parent
                onResponseSaved(questionnaireResponse);
                
                // Update context with explicit state management
                const newState = {
                  ...context,
                  currentQuestionIndex: targetQuestionIndex
                };
                
                // Use dispatch action to update the state
                dispatch({
                  type: 'SET_POSITION',
                  payload: {
                    currentQuestionIndex: targetQuestionIndex
                  }
                });
                
                // Add a log before and after sending the next question
                console.log(`Will send follow-up question ${followUpId} after state update`);

                console.log("State should be updated now, sending next question");
                console.log(`Current question index should be ${targetQuestionIndex}`);
                
                return true;
              }
            }
          }
        }
      }
      
      // Handle wildcard follow-up for non-option questions
      if (currentQuestion.followUp && currentQuestion.followUp["*"]) {
        const followUpId = currentQuestion.followUp["*"];
        
        // Handle domain transition if specified
        if (followUpId.startsWith("domain[")) {
          const targetQuestionId = followUpId.match(/domain\[([^\]]+)\]/)?.[1];
          if (targetQuestionId) {
            // Find the domain that contains this question
            for (let i = 0; i < QUESTIONNAIRE_DOMAINS.length; i++) {
              if (QUESTIONNAIRE_DOMAINS[i].questions.some(q => q.id === targetQuestionId)) {
                // Save the response and continue to next domain
                saveResponseAndContinue(response, currentQuestion, currentDomain);
                
                // Set up for domain transition
                setNextDomainIndex(i);
                setWaitingForDomainTransition(true);
                
                // Ask to continue
                askToContinue();
                
                return true;
              }
            }
          }
        } else {
          // Regular follow-up within the same domain
          // Find the index of the target question
          const targetQuestionIndex = currentDomain.questions.findIndex(q => q.id === followUpId);
          
          if (targetQuestionIndex !== -1) {
            // Save the response
            const questionnaireResponse = {
              questionId: currentQuestion.id,
              domainId: currentDomain.id,
              response: response,
              flag: currentQuestion.flag || "",
              timestamp: new Date()
            };
            
            // Add to context
            dispatch({
              type: 'ADD_RESPONSE',
              payload: questionnaireResponse
            });
            
            // Update position
            dispatch({
              type: 'SET_POSITION',
              payload: { 
                currentQuestionIndex: targetQuestionIndex 
              }
            });
            
            // Notify parent
            onResponseSaved(questionnaireResponse);
            
            // Send the next question
            setTimeout(() => sendNextQuestion(), 500);
            
            return true;
          }
        }
      }
      
      // For regular responses with no special handling needed:
      return saveResponseAndContinue(response, currentQuestion, currentDomain);
    } catch (error) {
      console.error("Error in processQuestionResponse:", error);
      return false;
    }
  };
  
  // Helper to save a response and continue to the next question
  const saveResponseAndContinue = (response: string, currentQuestion: any, currentDomain: any): boolean => {
    try {
      // Create the response object
      const questionnaireResponse = {
        questionId: currentQuestion.id,
        domainId: currentDomain.id,
        response: response,
        flag: currentQuestion.flag || "",
        timestamp: new Date()
      };
      
      // Add to context
      dispatch({
        type: 'ADD_RESPONSE',
        payload: questionnaireResponse
      });
      
      // Notify parent
      onResponseSaved(questionnaireResponse);
      
      // Move to next question
      if (currentQuestion.followUp) {
        // If followUp is defined, the existing logic in processQuestionResponse handles it
        moveToNextQuestion(currentQuestion.id);
      } else {
        // If no followUp, move to the next question by index
        const nextQuestionIndex = context.currentQuestionIndex + 1;
        if (nextQuestionIndex < currentDomain.questions.length) {
          const nextQuestion = currentDomain.questions[nextQuestionIndex];
          dispatch({
            type: 'SET_POSITION',
            payload: {
              currentQuestionIndex: nextQuestionIndex
            }
          });
          
          // Send next question after a short delay
          setTimeout(() => {
            console.log(`Moving to next question at index ${nextQuestionIndex}`);
            sendNextQuestion();
          }, 1000);
        } else {
          // End of domain, ask to continue
          askToContinue();
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in saveResponseAndContinue:", error);
      return false;
    }
  };
  
  // Move to the next question
  const moveToNextQuestion = (targetQuestionId: string) => {
    try {
      console.log(`Moving to specific question: ${targetQuestionId}`);
      
      // Get the current domain
      const currentDomain = QUESTIONNAIRE_DOMAINS[context.currentDomainIndex];
      if (!currentDomain) {
        console.error("Invalid domain index in moveToNextQuestion:", context.currentDomainIndex);
        return;
      }
      
      // Find the index of the target question
      const targetIndex = currentDomain.questions.findIndex(q => q.id === targetQuestionId);
      
      if (targetIndex === -1) {
        console.error(`Question ${targetQuestionId} not found in domain ${currentDomain.id}`);
        return;
      }
      
      console.log(`Found question ${targetQuestionId} at index ${targetIndex}`);
      
      // Update the state directly with the new question index
      dispatch({
        type: 'SET_POSITION',
        payload: {
          currentQuestionIndex: targetIndex
        }
      });
      
      // Use a longer delay to ensure state is updated
      setTimeout(() => {
        console.log(`State should be updated, current question index should be ${targetIndex}`);
        console.log(`Sending question: ${targetQuestionId}`);
        sendNextQuestion();
      }, 1000);
    } catch (error) {
      console.error("Error in moveToNextQuestion:", error);
    }
  };
  
  // Move to the next domain
  const moveToNextDomain = () => {
    try {
      // Check if we're at the last domain
      if (context.currentDomainIndex >= QUESTIONNAIRE_DOMAINS.length - 1) {
        // All domains completed
        completeQuestionnaire();
        return;
      }
      
      // Move to the first question of the next domain
      dispatch({
        type: 'SET_POSITION',
        payload: {
          currentDomainIndex: context.currentDomainIndex + 1,
          currentQuestionIndex: 0
        }
      });
      
      // Reset transition flags
      setWaitingForDomainTransition(false);
      setNextDomainIndex(-1);
      
      // Send the first question of the new domain
      setTimeout(() => sendNextQuestion(), 500);
    } catch (error) {
      console.error("Error in moveToNextDomain:", error);
    }
  };
  
  // Complete the questionnaire
  const completeQuestionnaire = async () => {
    try {
      // Mark as completed first
      dispatch({
        type: 'SET_COMPLETED',
        payload: {}
      });

      await saveConversationState();
      
      // Submit responses to backend
      try {
        await submitResponsesToBackend();
        
        // Save completion status
        await AsyncStorage.setItem(`questionnaire_completed_${userId}`, "true");
        
                // Send thank you message
                const thankYouKey = "thank_you_message";
                if (!sentMessages.has(thankYouKey)) {
                  sentMessages.add(thankYouKey);
                  const thankYouMessage = "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you.";
                  
                  // Save as last message
                  saveLastQuestion("complete", thankYouKey, thankYouMessage);
                  
                  // Send the message
                  onQuestionReady(thankYouMessage);
                }
              } catch (error) {
                console.error("Error submitting questionnaire responses:", error);
                
                // Still show thank you message even if API fails
                const thankYouKey = "thank_you_message";
                if (!sentMessages.has(thankYouKey)) {
                  sentMessages.add(thankYouKey);
                  const thankYouMessage = "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you.";
                  
                  // Send the message
                  onQuestionReady(thankYouMessage);
                }
              }
              
              // Notify parent component
              onQuestionnaireComplete();
            } catch (error) {
              console.error("Error in completeQuestionnaire:", error);
            }
          };
          
          // Submit responses to backend
          const submitResponsesToBackend = async () => {
            try {
              // Format responses for the API
              const formattedResponses = context.responses.map(response => ({
                domainId: response.domainId,
                questionId: response.questionId,
                response: response.response,
                flag: response.flag,
                timestamp: response.timestamp.toISOString()
              }));
              
              console.log("Submitting responses to backend:", formattedResponses.length);
              
              // Submit each response individually to ensure all are saved
              for (const responseData of formattedResponses) {
                const response = await axios.post(
                  `https://crosscare-backends.onrender.com/api/user/${userId}/domain`,
                  responseData,
                  {
                    headers: {
                      "Content-Type": "application/json"
                    }
                  }
                );
                console.log(`Response saved for question ${responseData.questionId}:`, response.status);
              }
              
              console.log("All responses submitted successfully");
            } catch (error: any) {
              console.error("Error submitting responses to backend:", error);
              
              // Show more detailed error information
              if (error.response) {
                console.error("Error status:", error.response.status);
                console.error("Error data:", JSON.stringify(error.response.data));
              } else if (error.request) {
                console.error("No response received:", error.request);
              } else {
                console.error("Error message:", error.message);
              }
              
              // Mark as completed anyway to prevent restart issues
              await AsyncStorage.setItem(`questionnaire_completed_${userId}`, "true");
              console.log("Marked questionnaire as completed despite API error");
              
              throw error;
            }
          };
                  
          // Check if questionnaire is completed
          const isQuestionnaireCompleted = async (): Promise<boolean> => {
            // First check in-memory state
            if (context.isCompleted) {
              return true;
            }
            
            try {
              const completedStatus = await AsyncStorage.getItem(`questionnaire_completed_${userId}`);
              return completedStatus === "true";
            } catch (error) {
              console.error("Error checking questionnaire completion status:", error);
              return false;
            }
          };
          
          // Start the questionnaire
          const startQuestionnaire = () => {
            // Prevent multiple starts
            if (isStartingQuestionnaire.current) return;
            isStartingQuestionnaire.current = true;
            
            console.log("Starting questionnaire, checking intro status...");
            
            // Reset transition flags
            setWaitingForDomainTransition(false);
            setNextDomainIndex(-1);
            
            // Check if user has seen intro before
            AsyncStorage.getItem(`intro_shown_${userId}`)
              .then((introShown) => {
                // Clear sent messages
                sentMessages.clear();
                
                // Set state to active
                dispatch({
                  type: 'SET_ACTIVE',
                  payload: {}
                });
                
                // Always start by asking if they have time
                setHasAskedForTime(false);
                setUserWantsToStart(false);
                
                if (introShown === "true") {
                  // Skip intro for returning users
                  console.log("User has seen intro before, will skip after time confirmation");
                  setHasSeenIntro(true);
                  setIntroStep(4);
                } else {
                  // Show intro for new users
                  console.log("First time user, will show intro after time confirmation");
                  setHasSeenIntro(false);
                  setIntroStep(0);
                }
                
                // Reset starting flag
                setTimeout(() => {
                  isStartingQuestionnaire.current = false;
                }, 2000);
              })
              .catch((error) => {
                console.error("Error checking intro status:", error);
                
                // Default to showing intro
                setHasSeenIntro(false);
                setIntroStep(0);
                setHasAskedForTime(false);
                setUserWantsToStart(false);
                
                // Set active state
                dispatch({
                  type: 'SET_ACTIVE',
                  payload: {}
                });
                
                isStartingQuestionnaire.current = false;
              });
          };
          
          // Resume a paused questionnaire
          const resumeQuestionnaire = async (): Promise<void> => {
            console.log("Resuming questionnaire");
            
            try {
              // Clear sent messages
              sentMessages.clear();
              
              // Reset transition flags
              setWaitingForDomainTransition(false);
              setNextDomainIndex(-1);
              
              // Load the saved context
              const savedContext = await loadConversationContext(userId);
              console.log("Loaded saved context for resuming:", savedContext);
              if (!savedContext) {
                console.error("No saved context found for resuming");
                return;
              }  
              // Mark intro as seen
              await AsyncStorage.setItem(`intro_shown_${userId}`, "true");
              
              // Skip intro sequence
              setIntroStep(4);
              setHasSeenIntro(true);
              setHasAskedForTime(true);
              setUserWantsToStart(true);
              
              // Set state with saved values but make active
              dispatch({
                type: 'SET_ACTIVE',
                payload: savedContext
              });
              
              // Load the last question
              const lastQuestionJson = await AsyncStorage.getItem(`last_question_${userId}`);
              let lastQuestion = null;
              
              if (lastQuestionJson) {
                lastQuestion = JSON.parse(lastQuestionJson);
                console.log("Loaded last question for resuming:", lastQuestion);
              }
              
              // Wait before continuing
              setTimeout(() => {
                // Check if we were at a domain continuation point
                if (savedContext.currentQuestionIndex >= QUESTIONNAIRE_DOMAINS[savedContext.currentDomainIndex]?.questions.length) {
                  console.log("Resuming at domain continuation point");
                  
                  // Set waiting for transition
                  setWaitingForDomainTransition(true);
                  setNextDomainIndex(savedContext.currentDomainIndex + 1);
                  
                  // Create continuation message
                  const nextDomainIndex = savedContext.currentDomainIndex + 1;
                  let continueMessage = "Welcome back! Would you like to continue with the questionnaire where we left off?";
                  
                  if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
                    const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex];
                    continueMessage = `Welcome back! We were about to discuss ${nextDomain.description.toLowerCase()}. Would you like to continue?`;
                  }
                  
                  // Use last question if available
                  if (lastQuestion && lastQuestion.domainId === "continue") {
                    continueMessage = `Welcome back! ${lastQuestion.text.replace(/Would you like to keep going/, "Would you like to continue")}`;
                  }
                  
                  // Send the message
                  onQuestionReady(continueMessage);
                } else {
                  // Resume at specific question
                  console.log("Resuming at specific question");
                  
                  const currentDomain = QUESTIONNAIRE_DOMAINS[savedContext.currentDomainIndex];
                  if (!currentDomain) {
                    console.error("Invalid domain index when resuming:", savedContext.currentDomainIndex);
                    return;
                  }
                  
                  const currentQuestion = currentDomain.questions[savedContext.currentQuestionIndex];
                  if (!currentQuestion) {
                    console.error("Invalid question index when resuming:", savedContext.currentQuestionIndex);
                    return;
                  }
                  
                  // Mark as sent
                  const questionKey = `question_${currentDomain.id}_${currentQuestion.id}`;
                  sentMessages.add(questionKey);
                  
                  // Create resume message
                  let resumeMessage = "Welcome back! Let's continue where we left off. ";
                  
                  // Add the question
                  if (lastQuestion && lastQuestion.domainId === currentDomain.id && lastQuestion.questionId === currentQuestion.id) {
                    resumeMessage += lastQuestion.text;
                  } else {
                    resumeMessage += formatQuestionConversationally(currentDomain, currentQuestion);
                  }
                  
                  // Send the message
                  onQuestionReady(resumeMessage);
                }
              }, 1000);
            } catch (error) {
              console.error("Error resuming questionnaire:", error);
            }
          };
          
          // Return the public API for the questionnaire manager
          return {
            startQuestionnaire,
            handleUserResponse,
            resumeQuestionnaire,
            isPaused: context.isPaused,
            isActive: context.isActive,
            isCompleted: context.isCompleted,
            isQuestionnaireCompleted,
            pauseQuestionnaire: async () => {
              dispatch({
                type: 'SET_PAUSED',
                payload: {}
              });
              await saveConversationState();
              return context;
            },
            loadPausedState: async () => {
              hasLoadedRef.current = false; // Reset loading flag
              await loadConversationState(); // Reload the conversation state
              return context;
            },
            context
          };
        };
        
        export default ConversationalQuestionnaire;