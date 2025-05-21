import { useCallback, useEffect, useRef, useState } from "react"
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native"
import { Ionicons, Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useFocusEffect } from "expo-router"
import VoiceRecorder from "@/components/VoiceRecorder"
import AudioMessage from "@/components/AudioMessage"
import { useSelector } from "react-redux"
import axios from "axios"
import { systemPrompts } from "@/constants/systemPrompts"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { QUESTIONNAIRE_DOMAINS, type QuestionnaireResponse } from "@/constants/questionaireData"
import { useLocalSearchParams } from "expo-router"
import User from "@/assets/images/Svg/User"
import { fetchHealthData, type HealthData } from "@/utils/DoulaChatUtils/fetchHealthData"
import { detectAndHandleLogRequest } from "@/utils/DoulaChatUtils/detectAndHandleLogRequest"
import { detectAndHandleGoalRequest } from "@/utils/DoulaChatUtils/detectAndHandleGoalRequest"
import { processUserQuery } from "@/utils/DoulaChatUtils/processUserQuery"
import ConversationalQuestionnaire from "@/components/ConversationalQuestionnaire"

interface PauseStateStorage {
  paused: boolean
  userId: string | undefined
}

interface Message {
  id: string;
  isUser: boolean;
  timestamp: Date;
  type: "text" | "audio";
  content: string; // text content or audio URI
}


export default function askdoula() {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const user = useSelector((state: any) => state.user);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthStats, setHealthStats] = useState({
    water: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
    steps: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
    weight: {
      today: 0,
      weekly: 0,
      monthly: 0,
      avgWeekly: 0,
      avgMonthly: 0,
      unit: "kg",
    },
    heart: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
    sleep: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
  });

  const [isPaused, setIsPaused] = useState(false)

  const params = useLocalSearchParams();
  const fromModal = params.from_modal === "true";
  const RAG_SERVICE_URL = "https://crosscare-rag.onrender.com/api/chat";
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0)

  // Add this function to directly get progress from AsyncStorage
  const getProgressFromStorage = async () => {
    try {
      // Get the conversation context directly from storage
      const contextString = await AsyncStorage.getItem(`conversation_context_${user?.user_id}`)
      if (!contextString) {
        console.log("No context found in storage")
        return 0
      }

      // Parse the context and get the response count
      const context = JSON.parse(contextString)
      const responseCount = context?.responses?.length || 0

      // Calculate progress
      const totalQuestions = QUESTIONNAIRE_DOMAINS.reduce((sum, domain) => sum + domain.questions.length, 0)

      const percentage = Math.min(Math.round((responseCount / totalQuestions) * 100), 100)
      console.log(`Direct progress calculation: ${responseCount}/${totalQuestions} = ${percentage}%`)

      return percentage
    } catch (error) {
      console.error("Error getting progress from storage:", error)
      return 0
    }
  }



  const scrollViewRef = useRef<ScrollView>(null);
  const loadingAnimation = useRef(new Animated.Value(0)).current;


  // Initialize questionnaire manager
  const questionnaireManager = ConversationalQuestionnaire({
    userId: user?.user_id,
    onQuestionReady: (question) => {
      // Add the question as a message from the assistant
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          type: "text",
          content: question,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    },
    onQuestionnaireComplete: () => {
      // Questionnaire completion is handled internally by the ConversationalQuestionnaire
      // Any additional actions can be added here
      console.log("Questionnaire completed");
    },
    onResponseSaved: (response: QuestionnaireResponse) => {
      // You can do additional processing here if needed
      console.log("Response saved:", response);
    },
    // You need to add your OpenAI API key here
    openAIApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''
  });

  // Add this useEffect to check for paused questionnaire on mount
  useEffect(() => {
    const checkPausedQuestionnaire = async () => {
      try {
        // Check if there's a paused questionnaire
        const savedContext = await loadConversationContext(user?.user_id);
        
        console.log("Checking saved questionnaire state:", savedContext);
        
        // If we have ANY saved context (not just paused), load it
        if (savedContext) {
          // Make sure to await this so the state is actually loaded
          if (questionnaireManager.loadPausedState) {
            await questionnaireManager.loadPausedState();
            console.log("After loading state:", {
              isActive: questionnaireManager.isActive,
              isPaused: questionnaireManager.isPaused,
              currentDomain: questionnaireManager.context?.currentDomainIndex,
              currentQuestion: questionnaireManager.context?.currentQuestionIndex
            });
          }
        }
      } catch (error) {
        console.error("Error checking for saved questionnaire:", error);
      }
    };
    
    checkPausedQuestionnaire();
  }, []);

  const checkQuestionnaireCompletionStatus = async () => {
    try {
      const completedStatus = await AsyncStorage.getItem(
        `questionnaire_completed_${user?.user_id}`
      );
      return completedStatus === "true";
    } catch (error) {
      console.error("Error checking questionnaire completion status:", error);
      return false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - loading progress and pause state")

      // Load progress directly from storage
      const loadProgressAndPauseState = async () => {
        try {
          // First check the dedicated pause state storage
          const pauseState = await AsyncStorage.getItem(`questionnaire_paused_${user?.user_id}`)
          const isPausedFromDedicated = pauseState === "true"

          // Get the progress
          const storedProgress = await getProgressFromStorage()
          setProgress(storedProgress)

          // Also get the pause state from context as a fallback
          const contextString = await AsyncStorage.getItem(`conversation_context_${user?.user_id}`)
          if (contextString) {
            const context = JSON.parse(contextString)
            // Use dedicated storage value first, fall back to context
            const wasPaused = isPausedFromDedicated || context?.isPaused || false

            console.log(`Loaded pause state from storage: isPaused=${wasPaused}`)
            setIsPaused(wasPaused)

            // Also force the questionnaire manager to update its state if possible
            if (questionnaireManager && wasPaused) {
              console.log("Setting questionnaire manager to paused state")
              // If we have a reloadContextFromStorage method, use it
              if (typeof questionnaireManager.reloadContextFromStorage === "function") {
                await questionnaireManager.reloadContextFromStorage()
              }
            }
          } else if (pauseState === "true") {
            // If we have no context but we do have a pause state, still set it
            setIsPaused(true)
          }
        } catch (error) {
          console.error("Error loading progress and pause state:", error)
        }
      }

      loadProgressAndPauseState()

      return () => {
        // Nothing to clean up
      }
    }, [user?.user_id]),
  )

  const [isContextLoaded, setIsContextLoaded] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  useFocusEffect(
    useCallback(() => {
      const loadContextAndUpdateProgress = async () => {
        console.log("Screen focused - updating progress bar")
        setIsContextLoaded(false)

        // Wait a moment to allow context to load
        setTimeout(async () => {
          // If questionnaireManager exists, make sure it's properly initialized
          if (questionnaireManager) {
            try {
              const savedContext = await AsyncStorage.getItem(`conversation_context_${user?.user_id}`)
              if (savedContext) {
                console.log("Found saved context for progress calculation")
                // Force a re-render of the progress bar
                setForceUpdate((prev) => prev + 1)
              }
            } catch (error) {
              console.error("Error checking saved context:", error)
            }
          }
          setIsContextLoaded(true)
        }, 500)
      }

      loadContextAndUpdateProgress()

      return () => {
        // Nothing to clean up
      }
    }, []),
  )


  const calculateProgress = useCallback(() => {
    // Debug log to see the state values when calculating progress
    console.log("Calculate progress called with state:", {
      isActive: questionnaireManager.isActive,
      isPaused: questionnaireManager.isPaused,
      responseCount: questionnaireManager.context?.responses?.length || 0,
      domainIdx: questionnaireManager.context?.currentDomainIndex,
    })

    // If questionnaire manager isn't available yet, return 0
    if (!questionnaireManager) return 0

    // Get total questions across all domains
    const totalQuestions = QUESTIONNAIRE_DOMAINS.reduce((sum, domain) => sum + domain.questions.length, 0)

    // Get completed questions count - safely access responses
    const responses = questionnaireManager.context?.responses || []
    const completedCount = responses.length

    // Log calculation details for debugging
    const percentage = Math.min(Math.round((completedCount / totalQuestions) * 100), 100)
    console.log(`Progress bar calculation: ${completedCount}/${totalQuestions} = ${percentage}%`)

    return percentage
  }, [questionnaireManager])

  // Get current domain title
  const getCurrentDomainIndex = () => {
    return questionnaireManager.context?.currentDomainIndex || 0
  }

  useEffect(() => {
    // Initialize progress when component mounts
    const initProgress = async () => {
      const initialProgress = await getProgressFromStorage()
      setProgress(initialProgress)
      console.log(`Initial progress set to ${initialProgress}%`)
    }

    initProgress()
  }, [])


  // useEffect(() => {
  //   const checkQuestionnaireStatus = async () => {
  //     const isPaused = await questionnaireManager.isPaused();

  //     // In the useEffect for checkQuestionnaireStatus, modify the paused questionnaire section
  //     // If there's a paused questionnaire and no messages yet, ask if they want to continue
  //     if (isPaused && messages.length === 0) {
  //       console.log("Found paused questionnaire, asking to continue");

  //       // Try to load the last question that was asked
  //       try {
  //         const lastQuestionJson = await AsyncStorage.getItem(
  //           `last_question_${user?.user_id}`
  //         );
  //         if (lastQuestionJson) {
  //           const lastQuestion = JSON.parse(lastQuestionJson);
  //           console.log(
  //             "Found last question for paused questionnaire:",
  //             lastQuestion
  //           );

  //           // If the last message was a pause confirmation, use a different message to resume
  //           if (lastQuestion.domainId === "pause") {
  //             setMessages([
  //               {
  //                 id: Date.now().toString(),
  //                 type: "text",
  //                 content: `Hey ${
  //                   user?.user_name || "there"
  //                 }, you have an unfinished questionnaire. Would you like to continue where you left off?`,
  //                 isUser: false,
  //                 timestamp: new Date(),
  //               },
  //             ]);
  //             return;
  //           }

  //           // If it was a domain continuation question, use that context
  //           if (lastQuestion.domainId === "continue") {
  //             const savedState = await AsyncStorage.getItem(
  //               `questionnaire_state_${user?.user_id}`
  //             );
  //             if (savedState) {
  //               const parsedState = JSON.parse(savedState);
  //               const nextDomainIndex = parsedState.currentDomainIndex + 1;

  //               if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
  //                 const nextDomain =
  //                   QUESTIONNAIRE_DOMAINS[parsedState.currentDomainIndex];
  //                 setMessages([
  //                   {
  //                     id: Date.now().toString(),
  //                     type: "text",
  //                     content: `Hey ${
  //                       user?.user_name || "there"
  //                     }, we were discussing ${QUESTIONNAIRE_DOMAINS[
  //                       parsedState.currentDomainIndex
  //                     ].description.toLowerCase()} and about to move to ${nextDomain.description.toLowerCase()}. Would you like to continue where you left off?`,
  //                     isUser: false,
  //                     timestamp: new Date(),
  //                   },
  //                 ]);
  //                 return;
  //               }
  //             }
  //           }

  //           // For a regular question, use the domain context
  //           const savedState = await AsyncStorage.getItem(
  //             `questionnaire_state_${user?.user_id}`
  //           );
  //           if (savedState) {
  //             const parsedState = JSON.parse(savedState);
  //             const currentDomain =
  //               QUESTIONNAIRE_DOMAINS[parsedState.currentDomainIndex];

  //             if (currentDomain) {
  //               setMessages([
  //                 {
  //                   id: Date.now().toString(),
  //                   type: "text",
  //                   content: `Hey ${
  //                     user?.user_name || "there"
  //                   }, you have an unfinished questionnaire about ${currentDomain.description.toLowerCase()}. Would you like to continue where you left off?`,
  //                   isUser: false,
  //                   timestamp: new Date(),
  //                 },
  //               ]);
  //               return;
  //             }
  //           }
  //         }
  //       } catch (error) {
  //         console.error("Error getting last question:", error);
  //       }

  //       // Fallback message if we can't determine the context
  //       setMessages([
  //         {
  //           id: Date.now().toString(),
  //           type: "text",
  //           content: `Hey ${
  //             user?.user_name || "there"
  //           }, you have an unfinished questionnaire. Would you like to continue where you left off?`,
  //           isUser: false,
  //           timestamp: new Date(),
  //         },
  //       ]);
  //       return;
  //     }
  //   };

  //   checkQuestionnaireStatus();
  // }, [
  //   questionnaireManager,
  //   messages,
  //   user,
  //   checkQuestionnaireCompletionStatus,
  // ]);

  // Fetch health data when component mounts
  useEffect(() => {
    fetchAndUpdateHealthData();
  }, []);

  // Auto-scroll to bottom when messages change or when typing indicator appears
  useEffect(() => {
    if (scrollViewRef.current && (messages.length > 0 || isTyping)) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Animate the typing indicator
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        })
      ).start();
    } else {
      loadingAnimation.setValue(0);
    }
  }, [isTyping, loadingAnimation]);

  // Add useEffect to load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, []);

  // Add useEffect to save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  const systemPrompt = `${systemPrompts}`;

  const fetchAndUpdateHealthData = async () => {
    if (user && user.user_id) {
      try {
        const { healthStats: newHealthStats, healthData: newHealthData } = await fetchHealthData(user.user_id);
        
        // Update state with the new health data
        setHealthStats(newHealthStats);
        setHealthData(newHealthData);
        console.log("Health stats fetched and updated successfully");
      } catch (error) {
        console.error("Error fetching health data:", error);
      }
    } else {
      console.log("No user ID available");
    }
  };

  const sendToAPI = async (
    messageContent: string,
    messageType: "text" | "audio"
  ) => {
    try {
      // Correct Gemini API endpoint
      const apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      // Your API key should be stored in an environment variable in production
      const apiKey = process.env.GEMINI_API; // Replace with your actual API key

      // Create enhanced prompt with health data if available
      let enhancedPrompt = systemPrompt;

      if (healthData) {
        enhancedPrompt += `\n\nUser's health data:\n`;

        if (healthStats.steps) {
          enhancedPrompt += `- Steps: Today: ${
            healthStats.steps.today
          }, Weekly average: ${healthStats.steps.avgWeekly.toFixed(
            0
          )}, Monthly average: ${healthStats.steps.avgMonthly.toFixed(0)}\n`;
        }

        if (healthStats.water) {
          enhancedPrompt += `- Water: Today: ${
            healthStats.water.today
          } glasses, Weekly average: ${healthStats.water.avgWeekly.toFixed(
            1
          )} glasses, Monthly average: ${healthStats.water.avgMonthly.toFixed(
            1
          )} glasses\n`;
        }

        if (healthStats.weight && healthStats.weight.avgWeekly > 0) {
          enhancedPrompt += `- Weight: Current: ${healthStats.weight.today} ${
            healthStats.weight.unit
          }, Weekly average: ${healthStats.weight.avgWeekly.toFixed(1)} ${
            healthStats.weight.unit
          }, Monthly average: ${healthStats.weight.avgMonthly.toFixed(1)} ${
            healthStats.weight.unit
          }\n`;
        }

        if (healthStats.heart && healthStats.heart.avgWeekly > 0) {
          enhancedPrompt += `- Heart rate: Current: ${
            healthStats.heart.today
          } bpm, Weekly average: ${healthStats.heart.avgWeekly.toFixed(
            0
          )} bpm, Monthly average: ${healthStats.heart.avgMonthly.toFixed(
            0
          )} bpm\n`;
        }

        if (healthStats.sleep && healthStats.sleep.avgWeekly > 0) {
          enhancedPrompt += `- Sleep: Last night: ${healthStats.sleep.today.toFixed(
            1
          )} hours, Weekly average: ${healthStats.sleep.avgWeekly.toFixed(
            1
          )} hours, Monthly average: ${healthStats.sleep.avgMonthly.toFixed(
            1
          )} hours\n`;
        }

        enhancedPrompt += `\nPlease answer the user's question about their health metrics using this data. Be specific and encouraging.`;
      }

      // Create the parts array with the system prompt
      const parts = [
        {
          text: enhancedPrompt,
        },
      ];

      // Add conversation history - limit to last 10 messages to avoid token limits
      const recentMessages = messages.slice(-20);

      for (const msg of recentMessages) {
        // Skip audio messages as they don't have text content we can send
        if (msg.type === "text") {
          parts.push({
            text: msg.isUser
              ? `User: ${msg.content}`
              : `Assistant: ${msg.content}`,
          });
        }
      }

      // Add the current message
      parts.push({
        text: `User: ${messageContent}`,
      });

      const requestBody = {
        contents: [
          {
            parts: parts,
          },
        ],
        generationConfig: {
          temperature: 0.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      };

      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to send message to Gemini API: ${response.status}`
        );
      }

      const data = await response.json();

      // Extract the response text from Gemini's response format
      let responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't process your request at this time.";

      responseText = responseText.replace(/\*/g, "");
      return {
        response: responseText,
      };
    } catch (error) {
      console.error("Error sending message to Gemini API:", error);
      return {
        response:
          "I'm having trouble connecting right now. Please try again later.",
      };
    }
  };

  const speakResponse = (text: string) => {
    // This function would normally use text-to-speech
    // For now, we'll just log the response
    console.log("Speaking response:", text);
  };


  const extractMetricFromText = (text: string, metricType: string) => {
    // Generic number extraction regex
    const numberRegex = /(\d+(?:\.\d+)?)/g;

    // Extract all numbers from the text
    const numbers = text.match(numberRegex);

    if (!numbers || numbers.length === 0) {
      return null;
    }

    // Different metrics might need different parsing logic
    switch (metricType) {
      case "weight":
        // Find unit - kg or lbs
        const unit = /\b(kg|kgs|kilograms|lbs|pounds)\b/i.test(text)
          ? text.match(/\b(kg|kgs|kilograms)\b/i)
            ? "kg"
            : "lbs"
          : "kg"; // Default to kg

        return {
          value: parseFloat(numbers[0]),
          unit: unit,
        };

      case "water":
        // Find if talking about glasses or ml
        const isGlasses = /\b(glass|glasses|cup|cups)\b/i.test(text);
        return {
          value: parseFloat(numbers[0]),
          isGlasses: isGlasses,
        };

      case "steps":
        return {
          value: parseInt(numbers[0], 10),
        };

      case "heart":
        return {
          value: parseInt(numbers[0], 10),
        };

      case "sleep":
        // Extract sleep start and end times
        // Look for patterns like "from 10:30 pm to 6:45 am" or "10pm to 6am"
        const sleepPattern =
          /(?:from|at)?\s*(\d+(?::\d+)?\s*(?:am|pm)?).*?(?:to|until|till)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i;
        const sleepMatch = text.match(sleepPattern);

        if (sleepMatch && sleepMatch[1] && sleepMatch[2]) {
          return {
            sleepStart: sleepMatch[1].trim(),
            sleepEnd: sleepMatch[2].trim(),
          };
        }
        return null;

      default:
        return {
          value: parseFloat(numbers[0]),
        };
    }
  };

  const handleLogRequest = async (query: string): Promise<boolean> => {
    // Create a helper function to add messages to the chat
    const addResponseMessage = (content: string) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    };
  
    // Call the utility function with the necessary parameters
    const result = await detectAndHandleLogRequest(
      query,
      user.user_id,
      extractMetricFromText,
      fetchAndUpdateHealthData,
      addResponseMessage
    );
  
    return result.handled;
  };

  const handleGoalRequest = async (query: string): Promise<boolean> => {
    // Create a helper function to add messages to the chat
    const addResponseMessage = (content: string) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    };
  
    // Call the utility function with the necessary parameters
    const result = await detectAndHandleGoalRequest(
      query,
      user.user_id,
      extractMetricFromText,
      fetchAndUpdateHealthData,
      addResponseMessage
    );
  
    return result.handled;
  };

  const handleProcessUserQuery = async (query: string) => {
    // Create a function for the RAG service call
    const callRagService = async (query: string, conversationHistory: any[] = []) => {
      try {

        console.log(`Calling RAG service with query: "${query}"`);
        
        const response = await axios.post(`${RAG_SERVICE_URL}/${user?.user_id}`, {
          query: query,
          conversationHistory: conversationHistory
        });
        
        if (response.status === 200 && response.data.success) {
          console.log("RAG service responded successfully");
          return response.data;
        } else {
          console.error("RAG service error:", response.data);
          return null;
        }
      } catch (error: any) {
        console.error("Error calling RAG service:", error.message);
        
        // Add enhanced error logging
        if (error.response) {
          // The server responded with a status code outside of 2xx
          console.error("RAG service error status:", error.response.status);
          console.error("RAG service error data:", error.response.data);
          console.error("RAG service error headers:", error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error("RAG service no response received:", error.request);
        } else {
          // Something happened in setting up the request
          console.error("RAG service error details:", error.stack);
        }
        
        // Log the request that was sent
        try {
          console.error("Request that caused error:", {
            url: `${RAG_SERVICE_URL}/${user?.user_id}`,
            payload: {
              query: query,
              conversationHistory: conversationHistory?.length || 0 // Just log length to avoid huge logs
            }
          });
        } catch (logError) {
          console.error("Error while logging request details:", logError);
        }
        
        return null;
      }
    };
  
    // Call the utility function with all the necessary dependencies
    await processUserQuery({
      query,
      userId: user.user_id,
      messages,
      healthStats,
      questionnaireManager,
      callbacks: {
        setIsProcessing,
        setMessages,
        handleLogRequest,
        handleGoalRequest,
        speakResponse,
        sendToAPI,
        callRagService
      }
    });
  };

  const sendMessage = async (messageContent: string = inputText) => {
    if (messageContent.trim()) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        type: "text",
        content: messageContent,
        isUser: true,
        timestamp: new Date(),
      };
  
      // Update messages state with the new message
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages as Message[]);
      setInputText("");
      setIsTyping(true);
      setIsAssistantResponding(true);
  
      // Only process as questionnaire response when the questionnaire is active and not paused
      if (questionnaireManager.isActive && !questionnaireManager.isPaused && !questionnaireManager.isCompleted) {
        const handled = await questionnaireManager.handleUserResponse(messageContent);
        if (handled) {
          setIsTyping(false);
          setIsAssistantResponding(false);
          return; // Exit if questionnaire handled the response
        }
      }
      
      // Otherwise, process as a regular chat message
      await handleProcessUserQuery(messageContent);
      setIsTyping(false);
      setIsAssistantResponding(false);
    }
  };

  const handleAudioSent = (
    audioUri: string,
    transcript?: string,
    assistantResponse?: string
  ) => {
    console.log("handleAudioSent called with:", {
      audioUri,
      transcript,
      assistantResponse,
    });

    // Add the user's audio message to the chat
    if (audioUri) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          type: "audio",
          content: audioUri,
          isUser: true,
          timestamp: new Date(),
        },
      ]);
    }

    // Process the transcript if available
    if (transcript) {
      setIsTyping(true);
      setIsAssistantResponding(true);

      // Check for log/goal requests with the same processing logic as text
      // This ensures consistent handling between voice and text
      handleProcessUserQuery(transcript).then(() => {
      setIsTyping(false);
      setIsAssistantResponding(false);
    });
    }
  };

  const handleOptionPress = (optionText: string) => {
    setInputText(optionText); // Update the inputText with the selected option
    sendMessage(optionText);
  };

  const clearChatHistory = async () => {
    try {
      // Clear chat history from AsyncStorage
      await AsyncStorage.removeItem("chatHistory");

      // Clear messages from state
      setMessages([]);

      // Reset questionnaire state in AsyncStorage
      await AsyncStorage.removeItem(`conversation_context_${user?.user_id}`);
      await AsyncStorage.removeItem(`questionnaire_completed_${user?.user_id}`);
      await AsyncStorage.removeItem(`questionnaire_state_${user?.user_id}`);
      await AsyncStorage.removeItem(`last_question_${user?.user_id}`);
      await AsyncStorage.removeItem(`intro_shown_${user?.user_id}`);

      console.log("Chat history cleared successfully");

      // Show confirmation to the user with option to start questionnaire
      Alert.alert(
        "Chat History Cleared",
        "Your conversation history has been deleted. Would you like to start the health questionnaire now?",
        [
          {
            text: "Yes",
            onPress: () => {
              // Start the questionnaire
              questionnaireManager.startQuestionnaire();
            },
          },
          { text: "Not now" },
        ]
      );
    } catch (error) {
      console.error("Error clearing chat history:", error);
      Alert.alert("Error", "Failed to clear chat history. Please try again.");
    }
  };

  const renderTypingIndicator = () => {
    const dot1Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    });

    const dot2Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 1, 0.3],
    });

    const dot3Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 0.3, 1],
    });

    return (
      <View style={styles.messageRow}>
        <Image
          source={{uri : user?.avatar_url}}
          style={styles.doulaAvatar}
        />
        <View style={styles.typingIndicator}>
          <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    );
  };

  // Function to save messages to AsyncStorage
  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      // We need to convert Date objects to strings before storing
      const serializedMessages = messagesToSave.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));

      await AsyncStorage.setItem(
        "chatHistory",
        JSON.stringify(serializedMessages)
      );
      console.log("Messages saved to storage");
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  };

    // Calculate progress percentage based on completed questions
  const calculateProgress = () => {
    if (!questionnaireManager.isActive) return 0;
    
    // Get total questions across all domains
    const totalQuestions = QUESTIONNAIRE_DOMAINS.reduce(
      (sum, domain) => sum + domain.questions.length, 
      0
    );
    
    // Get completed questions count
    const completedCount = questionnaireManager.context?.responses?.length || 0;
    
    return Math.min(Math.round((completedCount / totalQuestions) * 100), 100);
  };

  const savePauseState = async (paused: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(`questionnaire_paused_${user?.user_id}`, paused ? "true" : "false")
      console.log(`Saved pause state: ${paused}`)
    } catch (error: unknown) {
      console.error("Error saving pause state:", error)
    }
  }

  const getCurrentDomainTitle = () => {
    const domainIndex = getCurrentDomainIndex();
    const domain = QUESTIONNAIRE_DOMAINS[domainIndex];
    return domain ? domain.description : "Getting to Know You";
  };

  // Handle pause/resume button press
  const handlePauseResumeToggle = async () => {
    if (questionnaireManager.isPaused) {
      // Resume questionnaire
      await questionnaireManager.resumeQuestionnaire();

    } else {
      // Pause and save progress to database
      const context = await questionnaireManager.pauseQuestionnaire();
      
      // Save responses to database
      try {
        // Get the current responses from context
        const responses = context?.responses || [];
        
        // Submit each response to database
        for (const response of responses) {
          await axios.post(
            `https://crosscare-backends.onrender.com/api/user/${user?.user_id}/domain`,
            {
              domainId: response.domainId,
              questionId: response.questionId,
              response: response.response,
              flag: response.flag,
              timestamp: response.timestamp.toISOString()
            }
          );
        }
        console.log("Saved questionnaire responses to database");
      } catch (error) {
        console.error("Error saving responses to database:", error);
      }
    }
  };

  // Function to load messages from AsyncStorage
  const loadMessages = async () => {
    try {
      // First check if questionnaire is completed
      const isCompleted = await checkQuestionnaireCompletionStatus();

      const savedMessages = await AsyncStorage.getItem("chatHistory");

      if (savedMessages) {
        // Parse the JSON and convert timestamp strings back to Date objects
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        // If we have messages, load them
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
          console.log(
            "Loaded messages from AsyncStorage, count:",
            parsedMessages.length
          );
        } else {
          console.log("No messages found in saved chat history");
        }
      } else {
        console.log("No saved messages found in AsyncStorage");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={"white"} />

        {/* Header */}
        {fromModal && (
          <View style={styles.header}>
            {/* {fromModal && ( */}
            <View style={{
              flexDirection: "row",
              gap:20,
              alignItems:'center'
            }}>

            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#434343" />
            </TouchableOpacity>
            {/* )} */}
            <Text style={styles.headerTitle}>Ask Your Doula</Text>
            </View>
            <View style={{ flexDirection: "row" }}>{}
              <TouchableOpacity
                onPress={clearChatHistory}
                style={{ marginRight: 12 }}
              >
                <Feather name="trash-2" size={20} color={messages.length > 0 ? "#434343" : "#f5f5f5"} />
              </TouchableOpacity>
              {/* <TouchableOpacity>
                <Feather name="more-vertical" size={20} color="#E5E5E5" />
              </TouchableOpacity> */}
            </View>
          </View>
        )}

        {!questionnaireManager.isCompleted && (
          <View style={styles.questionnaireStatusContainer}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.questionnaireStatusTitle}>
                Questionnaire Status - {getCurrentDomainTitle()}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.pauseButton,
                questionnaireManager.isPaused && styles.resumeButton
              ]}
              onPress={handlePauseResumeToggle}
            >
              <Text style={[
                styles.pauseButtonText,
                questionnaireManager.isPaused && styles.resumeButtonText
              ]}>
                {questionnaireManager.isPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${calculateProgress()}%` }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Chat Container */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => {
            if (messages.length > 0 || isTyping) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={
                    user?.avatar_url
                      ? { uri: user.avatar_url } // If avatar_url exists, use the URI
                      : require('../../assets/images/hairs/h1/face/c1.png') // Fallback to local image if no avatar_url
                  }
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.greeting}>
                <Text>👋 Hi, </Text>
                <Text style={styles.name}>{user.user_name}</Text>
                <Text>!</Text>
              </Text>

              <Text style={styles.title}>
                I'm your Digital <Text style={styles.highlight}>Doula</Text>
              </Text>

              <Text style={styles.subtitle}>How can I assist you today?</Text>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.isUser
                      ? styles.userMessageRow
                      : styles.doulaMessageRow,
                  ]}
                >
                  {!message.isUser && (
                    <Image
                      source={{
    uri: user?.avatar_url || 'https://tskzddfyjazcirdvloch.supabase.co/storage/v1/object/public/cross-care/avatars/avatar-660e8400-e29b-41d4-a716-446655440014-46d376a4-820f-45d8-82cb-82766db041fa.jpg'
  }}
                      style={styles.doulaAvatar}
                    />
                  )}

                  {message.type === "text" ? (
                    <View
                      style={[
                        styles.messageBubble,
                        message.isUser ? styles.userBubble : styles.doulaBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.isUser
                            ? styles.userMessageText
                            : styles.doulaMessageText,
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  ) : (
                    <AudioMessage
                      audioUri={message.content}
                      isUser={message.isUser}
                    />
                  )}

                {message.isUser && (
                  <>
                    {user?.user_photo ? (
                      <Image
                        source={{ uri: user.user_photo }}
                        style={styles.userAvatar}
                      />
                    ) : (
                      <>
                      <View style={{
                        borderWidth: 1.44,
                        borderRadius: 25,
                        borderColor: "#FDE8F8",
                        boxShadow: "0px 0px 0.72px 0px rgba(0, 0, 0, 0.30);",
                      }}>

                        <User  width={36} height={36}/>
                      </View>
                      </>
                    )}
                  </>
                )}
                </View>
              ))}

              {isTyping && renderTypingIndicator()}
            </View>
          )}
        </ScrollView>

        {/* Options and Input Section */}
        <View
          style={{
            flexDirection: "column",
            gap: 10,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsContainer}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress("Show my health stats")}
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>Health Stats</Text>
            </TouchableOpacity>

            {/* Standard advice options */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                handleOptionPress(
                  "What foods should I eat during my third trimester?"
                )
              }
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>Nutrition Advice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                handleOptionPress("What exercises are safe during pregnancy?")
              }
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>Exercise Tips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress("How do I create a birth plan?")}
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>Birth Planning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                handleOptionPress("Is it safe to travel during pregnancy?")
              }
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>Travel Safety</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ask me anything or log your health data..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={(text) => setInputText(text)}
                onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)}
                editable={!isAssistantResponding}
              />
              <VoiceRecorder
                onSendAudio={handleAudioSent}
                systemPrompt={systemPrompt}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isTyping}
            >
              <Feather name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#434343",
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  // Add these to your styles
  questionnaireStatusContainer: {
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statusTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questionnaireStatusTitle: {
    fontSize: 14,
    fontFamily: "DMSans500",
    color: "#94588D",
  },
  pauseButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FBBBE9",
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  pauseButtonText: {
    color: "#F76CCF",
    fontSize: 12,
    fontFamily: "DMSans500",
  },
  resumeButton: {
    backgroundColor: "#F76CCF",
    borderColor: "#F989D9",
  },
  resumeButtonText: {
    color: "#FFF",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F76CCF",
    borderRadius: 4,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 30,
  },
  messagesContainer: {
    width: "100%",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  doulaMessageRow: {
    justifyContent: "flex-start",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#FEF0FA",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: "#FBBBE9",
    marginRight: 8,
  },
  doulaBubble: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter400",
  },
  userMessageText: {
    color: "#E162BC",
  },
  doulaMessageText: {
    color: "#434343",
  },
  doulaAvatar: {
    width: 36,
    height: 36,
    borderWidth: 1.44,
    borderColor: "#FDE8F8",
    borderRadius: 18,
    boxShadow: "0px 0px 0.72px 0px rgba(0, 0, 0, 0.30);",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderWidth: 1.44,
    borderColor: "#FDE8F8",
    borderRadius: 18,
    boxShadow: "0px 0px 0.72px 0px rgba(0, 0, 0, 0.30);",
  },
  typingIndicator: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
    padding: 12,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 70,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E162BC",
    marginHorizontal: 4,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderWidth: 3,
    borderColor: "#FDD1F0",
    borderRadius: 50,
    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.30);",
    overflow: "hidden",
    backgroundColor: "#FF80AB",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  greeting: {
    marginTop: 16,
    fontSize: 18,
  },
  name: {
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 8,
  },
  highlight: {
    color: "#F66DCE",
  },
  subtitle: {
    fontSize: 12,
    color: "#7B7B7B",
    fontFamily: "DMSans400",
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    backgroundColor: "#FFF8FD",
    borderColor: "#FBBBE9",
  },
  optionText: {
    color: "#F76CCF",
    fontSize: 12,
    fontFamily: "Inter400",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: "auto",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 50,
    paddingLeft: 16,
    paddingRight: 0,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans400",
    fontSize: 12,
    // height: 48,
    height:'100%'
  },
  micButton: {
    padding: 4,
    // paddingLeft,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F76CCF",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F989D9",
    alignItems: "center",
    marginLeft: 8,
    boxShadow:
      "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
  },
  sendButtonDisabled: {
    opacity: 0.5,
    
  },
});


