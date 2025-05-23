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
  AppState,
  type AppStateStatus,
} from "react-native"
import Markdown from 'react-native-markdown-display';
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
import { BackHandler } from "react-native"
import { useTranslation } from "react-i18next";
import * as Speech from 'expo-speech';
import { GOAL_PATTERNS, isIncrementalRequest, LOG_PATTERNS } from "@/utils/DoulaChatUtils/doulaLogPatterns";

interface PauseStateStorage {
  paused: boolean
  userId: string | undefined
}


interface Message {
  id: string
  isUser: boolean
  timestamp: Date
  type: "text" | "audio"
  content: string // text content or audio URI
}

export default function askdoula() {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language
  const [messages, setMessages] = useState<Message[]>([]);
  const user = useSelector((state: any) => state.user);
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isRecording, setIsRecording] = useState(false);
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
  })

  const [isPaused, setIsPaused] = useState(false)
  const appState = useRef(AppState.currentState)
  const wasActiveRef = useRef(true)

  const params = useLocalSearchParams()
  const fromModal = params.from_modal === "true"
  const RAG_SERVICE_URL = "https://crosscare-rag.onrender.com/api/chat"
  const [isAssistantResponding, setIsAssistantResponding] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const scrollViewRef = useRef<ScrollView>(null)
  const loadingAnimation = useRef(new Animated.Value(0)).current

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
      ])
    },
    onQuestionnaireComplete: () => {
      // Questionnaire completion is handled internally by the ConversationalQuestionnaire
      // Any additional actions can be added here
      console.log("Questionnaire completed")
    },
    onResponseSaved: (response: QuestionnaireResponse) => {
      // You can do additional processing here if needed
      console.log("Response saved:", response)
    },
    // You need to add your OpenAI API key here
    openAIApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  })

  const checkQuestionnaireCompletionStatus = async () => {
    try {
      const completedStatus = await AsyncStorage.getItem(`questionnaire_completed_${user?.user_id}`)
      return completedStatus === "true"
    } catch (error) {
      console.error("Error checking questionnaire completion status:", error)
      return false
    }
  }

  // Replace the existing useEffect for checkQuestionnaireStatus with this:
  // useEffect(() => {
  //   const checkQuestionnaireStatus = async () => {
  //     try {
  //       // First check if questionnaire is already completed
  //       const isCompleted = await checkQuestionnaireCompletionStatus()
  //       console.log("Questionnaire completed status:", isCompleted)

  //       // If completed, don't do anything with the questionnaire
  //       if (isCompleted) {
  //         console.log("Questionnaire already completed, not starting again")

  //         // If we have no messages yet, add a welcome message
  //         if (messages.length === 0) {
  //           setMessages([
  //             {
  //               id: Date.now().toString(),
  //               type: "text",
  //               content: `Hello ${user?.user_name || "there"}! How can I help you today?`,
  //               isUser: false,
  //               timestamp: new Date(),
  //             },
  //           ])
  //         }
  //         return
  //       }

  //       // Check if there's a paused questionnaire
  //       const isPaused = await questionnaireManager.checkForPausedQuestionnaire()
  //       console.log("Paused questionnaire status:", isPaused)

  //       // If there's a paused questionnaire and no messages yet, ask if they want to continue
  //       if (isPaused && messages.length === 0) {
  //         console.log("Found paused questionnaire, asking to continue")

  //         // Get domain information to provide context
  //         try {
  //           const savedState = await AsyncStorage.getItem(`questionnaire_state_${user?.user_id}`)
  //           if (savedState) {
  //             const parsedState = JSON.parse(savedState)

  //             // Tell the user what domain we were in, and what's coming next
  //             const currentDomain = QUESTIONNAIRE_DOMAINS[parsedState.currentDomainIndex]

  //             // Check if we were at the end of the current domain
  //             if (parsedState.currentQuestionIndex >= currentDomain.questions.length) {
  //               const nextDomainIndex = parsedState.currentDomainIndex + 1
  //               if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
  //                 const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex]
  //                 setMessages([
  //                   {
  //                     id: Date.now().toString(),
  //                     type: "text",
  //                     content: `Hey ${user?.user_name || "there"}, you have an unfinished questionnaire. We were about to start discussing ${nextDomain.description.toLowerCase()}. Would you like to continue where you left off?`,
  //                     isUser: false,
  //                     timestamp: new Date(),
  //                   },
  //                 ])
  //                 return
  //               }
  //             }

  //             // If we weren't at the end, we were in the middle of a domain
  //             if (currentDomain) {
  //               setMessages([
  //                 {
  //                   id: Date.now().toString(),
  //                   type: "text",
  //                   content: `Hey ${user?.user_name || "there"}, you have an unfinished questionnaire about ${currentDomain.description.toLowerCase()}. Would you like to continue where you left off?`,
  //                   isUser: false,
  //                   timestamp: new Date(),
  //                 },
  //               ])
  //               return
  //             }
  //           }
  //         } catch (error) {
  //           console.error("Error getting saved questionnaire state:", error)
  //         }

  //         // Fallback message if we can't determine the domain
  //         setMessages([
  //           {
  //             id: Date.now().toString(),
  //             type: "text",
  //             content: `Hey ${user?.user_name || "there"}, you have an unfinished questionnaire. Would you like to continue where you left off?`,
  //             isUser: false,
  //             timestamp: new Date(),
  //           },
  //         ])
  //         return
  //       }

  //       // Only if NOT completed, NOT paused, and no messages, auto-start it
  //       if (!isPaused && messages.length === 0) {
  //         console.log("Starting new questionnaire")
  //         questionnaireManager.startQuestionnaire()
  //       }
  //     } catch (error) {
  //       console.error("Error checking questionnaire status:", error)
  //     }
  //   }

  //   // Only run this effect if we have a user ID
  //   if (user?.user_id) {
  //     checkQuestionnaireStatus()
  //   }
  // }, [user?.user_id])

  const [isMuted, setIsMuted] = useState(false)

  const userId = user?.user_id;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [])

  const contextSavingRef = useRef(false)
const isNavigatingAwayRef = useRef(false)

// 3. ADD this comprehensive go back handler function
const handleGoBack = useCallback(async () => {
  try {
    console.log("Go back handler triggered - saving context before navigation")
    
    // Prevent multiple simultaneous saves
    if (contextSavingRef.current) {
      console.log("Context save already in progress, proceeding with navigation")
      router.back()
      return true
    }

    contextSavingRef.current = true
    isNavigatingAwayRef.current = true

    // Step 1: Check if questionnaire is active and needs saving
    const isQuestionnaireActive = questionnaireManager.isActive && 
                                 !questionnaireManager.isCompleted

    if (isQuestionnaireActive) {
      console.log("Active questionnaire detected - saving state before navigation")

      // Step 2: Save current conversation context
      const currentContext = questionnaireManager.context
      if (currentContext) {
        try {
          // Create a snapshot of the current state
          const contextSnapshot = {
            ...currentContext,
            isPaused: true, // Always pause when navigating away
            stage: questionnaireManager.isPaused ? currentContext.stage : "paused",
            lastSaved: new Date().toISOString(),
            navigationPaused: true // Flag to indicate paused due to navigation
          }

          // Convert dates to strings for storage
          if (contextSnapshot.responses) {
            contextSnapshot.responses = contextSnapshot.responses.map((r: any) => ({
              ...r,
              timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp
            }))
          }

          if (contextSnapshot.sensitiveDisclosures) {
            contextSnapshot.sensitiveDisclosures = contextSnapshot.sensitiveDisclosures.map((d: any) => ({
              ...d,
              timestamp: d.timestamp instanceof Date ? d.timestamp.toISOString() : d.timestamp
            }))
          }

          // Save to multiple storage keys for reliability
          const contextKey = `conversation_context_${user?.user_id}`
          const backupKey = `conversation_context_backup_${user?.user_id}`
          
          await Promise.all([
            AsyncStorage.setItem(contextKey, JSON.stringify(contextSnapshot)),
            AsyncStorage.setItem(backupKey, JSON.stringify(contextSnapshot)),
            AsyncStorage.setItem(`questionnaire_paused_${user?.user_id}`, 'true'),
            AsyncStorage.setItem(`questionnaire_navigation_paused_${user?.user_id}`, 'true'),
            AsyncStorage.setItem(`last_navigation_time_${user?.user_id}`, Date.now().toString())
          ])

          console.log("Context saved successfully before navigation:", {
            responses: contextSnapshot.responses?.length || 0,
            isPaused: contextSnapshot.isPaused,
            domainIndex: contextSnapshot.currentDomainIndex,
            questionIndex: contextSnapshot.currentQuestionIndex
          })

        } catch (contextError) {
          console.error("Error saving context:", contextError)
          // Continue with navigation even if context save fails
        }
      }

      // Step 3: Pause the questionnaire manager if it's not already paused
      if (!questionnaireManager.isPaused) {
        try {
          await questionnaireManager.pauseQuestionnaire()
          console.log("Questionnaire paused before navigation")
        } catch (pauseError) {
          console.error("Error pausing questionnaire:", pauseError)
        }
      }

      // Step 4: Save any unsaved responses to database
      if (currentContext?.responses?.length > 0) {
        try {
          console.log("Saving responses to database before navigation")
          
          // Save in background, don't wait for completion
          const savePromises = currentContext.responses.map(async (response: any) => {
            try {
              await axios.post(`https://crosscare-backends.onrender.com/api/user/${user?.user_id}/domain`, {
                domainId: response.domainId,
                questionId: response.questionId,
                response: response.response,
                flag: response.flag,
                timestamp: response.timestamp instanceof Date 
                  ? response.timestamp.toISOString() 
                  : response.timestamp,
              })
            } catch (error) {
              console.error(`Error saving response ${response.questionId}:`, error)
            }
          })

          // Don't wait for all saves to complete - let them run in background
          Promise.all(savePromises).then(() => {
            console.log("All responses saved to database")
          }).catch((error) => {
            console.error("Some responses failed to save:", error)
          })

        } catch (saveError) {
          console.error("Error initiating response save:", saveError)
        }
      }
    }

    // Step 5: Save current chat messages
    if (messages.length > 0) {
      try {
        const serializedMessages = messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        }))
        
        await AsyncStorage.setItem("chatHistory", JSON.stringify(serializedMessages))
        await AsyncStorage.setItem("chatHistory_backup", JSON.stringify(serializedMessages))
        console.log("Chat messages saved before navigation")
      } catch (messageError) {
        console.error("Error saving messages:", messageError)
      }
    }

    // Step 6: Update UI state for navigation
    setIsPaused(true)

    console.log("All context saved successfully - proceeding with navigation")

  } catch (error) {
    console.error("Error in go back handler:", error)
  } finally {
    contextSavingRef.current = false
    
    // Always proceed with navigation, even if save fails
    router.back()
  }

  return true // Indicate we handled the back press
}, [questionnaireManager, messages, user?.user_id, router])


useEffect(() => {
  const backAction = () => {
    handleGoBack()
    return true // Prevent default back action
  }

  const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)

  return () => backHandler.remove()
}, [handleGoBack])

  // Handle app state changes (active, background, inactive)
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log(`App state changed from ${appState.current} to ${nextAppState}`)

    // If app is going to background and questionnaire is active but not paused
    if (
      appState.current.match(/active/) &&
      (nextAppState === "background" || nextAppState === "inactive") &&
      questionnaireManager.isActive &&
      !questionnaireManager.isPaused &&
      !questionnaireManager.isCompleted
    ) {
      console.log("App going to background - auto-pausing questionnaire")
      wasActiveRef.current = true

      await AsyncStorage.setItem(`questionnaire_auto_paused_${user?.user_id}`, 'true')
      await AsyncStorage.setItem(`questionnaire_paused_${user?.user_id}`, 'true')

      // Auto-pause the questionnaire
      await handlePauseResumeToggle()
    }

    // If app is coming back to foreground and was auto-paused
    if (
      (appState.current === "background" || appState.current === "inactive") &&
      nextAppState === "active" &&
      wasActiveRef.current
    ) {
      console.log("App returning to foreground - questionnaire was auto-paused")
      wasActiveRef.current = false

      setIsPaused(true)

      // Don't auto-resume, but update UI to show the resume button
      await loadPauseState()
    }

    appState.current = nextAppState
  }

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


  // useEffect(() => {
  //   const checkQuestionnaireStatus = async () => {
  //     const isPaused = await questionnaireManager.checkForPausedQuestionnaire();

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

   const getLanguageName = (langCode: string) => {
    const languages = {
      en: "English",
      es: "Spanish",
      pt: "Portuguese",
      ht: "Haitian Creole",
    }
    return languages[langCode as keyof typeof languages] || "English"
  }

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

  // Auto-scroll to bottom when messages change or when typing indicator appears
  useEffect(() => {
    if (scrollViewRef.current && (messages.length > 0 || isTyping)) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ).start()
    } else {
      loadingAnimation.setValue(0)
    }
  }, [isTyping, loadingAnimation])


  // const fetchHealthData = async () => {
  //   if (user && user.user_id) {
  //     try {
  //       // Use the specified endpoint format
  //       const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}`;
  //       console.log(`Making API call to: ${apiUrl}`);

  //       // Make the API call
  //       const response = await axios.get(apiUrl);
  //       const apiData = response.data.activities 



  //       // Process the data if we got a response
  //       if (
  //         apiData &&
  //         Array.isArray(apiData) &&
  //         apiData.length > 0
  //       ) {
  //         console.log(
  //           "API data found. First record:",
  //           JSON.stringify(apiData[0], null, 2)
  //         );

  //         // Sort by date (newest first)
  //         const sortedRecords = [...apiData].sort(
  //           (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  //         );


  //         // Get the most recent record
  //         const latestRecord = sortedRecords[0];

  //         // Get the last 7 days of records for weekly stats
  //         const last7Days = sortedRecords.slice(0, 7);

  //         // Get the last 30 days of records for monthly stats
  //         const last30Days = sortedRecords.slice(0, 30);

  //         // Calculate sleep duration in hours for a record
  //         const calculateSleepDuration = (record: any) => {
  //           if (
  //             record.details &&
  //             record.details.sleep &&
  //             record.details.sleep.start &&
  //             record.details.sleep.end
  //           ) {
  //             const start = new Date(record.details.sleep.start);
  //             const end = new Date(record.details.sleep.end);
  //             return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert ms to hours
  //           }
  //           return 0;
  //         };

  //         // Create a new stats object to update state
  //         const newHealthStats = {
  //           water: {
  //             today: 0,
  //             weekly: 0,
  //             monthly: 0,
  //             avgWeekly: 0,
  //             avgMonthly: 0,
  //           },
  //           steps: {
  //             today: 0,
  //             weekly: 0,
  //             monthly: 0,
  //             avgWeekly: 0,
  //             avgMonthly: 0,
  //           },
  //           weight: {
  //             today: 0,
  //             weekly: 0,
  //             monthly: 0,
  //             avgWeekly: 0,
  //             avgMonthly: 0,
  //             unit: "kg",
  //           },
  //           heart: {
  //             today: 0,
  //             weekly: 0,
  //             monthly: 0,
  //             avgWeekly: 0,
  //             avgMonthly: 0,
  //           },
  //           sleep: {
  //             today: 0,
  //             weekly: 0,
  //             monthly: 0,
  //             avgWeekly: 0,
  //             avgMonthly: 0,
  //           },
  //         };

  //         // TODAY'S STATS
  //         newHealthStats.water.today = latestRecord.details?.water || 0;
  //         newHealthStats.steps.today = latestRecord.details?.steps || 0;
  //         newHealthStats.heart.today = latestRecord.details?.heart || 0;
  //         newHealthStats.sleep.today = calculateSleepDuration(latestRecord);
  //         if (latestRecord.details?.weight?.value) {
  //           newHealthStats.weight.today = latestRecord.details.weight.value;
  //           newHealthStats.weight.unit =
  //             latestRecord.details.weight.unit || "kg";
  //         }

  //         // WEEKLY STATS
  //         // Filter records with valid data for each metric
  //         const weeklyWaterRecords = last7Days.filter(
  //           (r) =>
  //             r.details &&
  //             typeof r.details.water === "number" &&
  //             r.details.water > 0
  //         );
  //         const weeklyStepsRecords = last7Days.filter(
  //           (r) =>
  //             r.details &&
  //             typeof r.details.steps === "number" &&
  //             r.details.steps > 0
  //         );
  //         const weeklyHeartRecords = last7Days.filter(
  //           (r) =>
  //             r.details &&
  //             typeof r.details.heart === "number" &&
  //             r.details.heart > 0
  //         );
  //         const weeklySleepRecords = last7Days.filter(
  //           (r) => calculateSleepDuration(r) > 0
  //         );
  //         const weeklyWeightRecords = last7Days.filter(
  //           (r) =>
  //             r.details &&
  //             r.details.weight &&
  //             typeof r.details.weight.value === "number" &&
  //             r.details.weight.value > 0
  //         );

  //         // Calculate totals
  //         newHealthStats.water.weekly = weeklyWaterRecords.reduce(
  //           (sum, r) => sum + r.details.water,
  //           0
  //         );
  //         newHealthStats.steps.weekly = weeklyStepsRecords.reduce(
  //           (sum, r) => sum + r.details.steps,
  //           0
  //         );
  //         newHealthStats.heart.weekly = weeklyHeartRecords.reduce(
  //           (sum, r) => sum + r.details.heart,
  //           0
  //         );
  //         newHealthStats.sleep.weekly = weeklySleepRecords.reduce(
  //           (sum, r) => sum + calculateSleepDuration(r),
  //           0
  //         );
  //         newHealthStats.weight.weekly = weeklyWeightRecords.reduce(
  //           (sum, r) => sum + r.details.weight.value,
  //           0
  //         );

  //         // Calculate averages
  //         newHealthStats.water.avgWeekly =
  //           weeklyWaterRecords.length > 0
  //             ? newHealthStats.water.weekly / weeklyWaterRecords.length
  //             : 0;
  //         newHealthStats.steps.avgWeekly =
  //           weeklyStepsRecords.length > 0
  //             ? newHealthStats.steps.weekly / weeklyStepsRecords.length
  //             : 0;
  //         newHealthStats.heart.avgWeekly =
  //           weeklyHeartRecords.length > 0
  //             ? newHealthStats.heart.weekly / weeklyHeartRecords.length
  //             : 0;
  //         newHealthStats.sleep.avgWeekly =
  //           weeklySleepRecords.length > 0
  //             ? newHealthStats.sleep.weekly / weeklySleepRecords.length
  //             : 0;
  //         newHealthStats.weight.avgWeekly =
  //           weeklyWeightRecords.length > 0
  //             ? newHealthStats.weight.weekly / weeklyWeightRecords.length
  //             : 0;

  //         // MONTHLY STATS
  //         // Filter records with valid data for each metric
  //         const monthlyWaterRecords = last30Days.filter(
  //           (r) =>
  //             r.details &&
  //             typeof r.details.water === "number" &&
  //             r.details.water > 0
  //         );
  //         const monthlyStepsRecords = last30Days.filter(
  //           (r) =>
  //             r.details &&
  //             typeof r.details.steps === "number" &&
  //             r.details.steps > 0
  //         );
  //         const monthlyHeartRecords = last30Days.filter(
  //           (r) =>
  //             r.details &&
  //             typeof r.details.heart === "number" &&
  //             r.details.heart > 0
  //         );
  //         const monthlySleepRecords = last30Days.filter(
  //           (r) => calculateSleepDuration(r) > 0
  //         );
  //         const monthlyWeightRecords = last30Days.filter(
  //           (r) =>
  //             r.details &&
  //             r.details.weight &&
  //             typeof r.details.weight.value === "number" &&
  //             r.details.weight.value > 0
  //         );

  //         // Calculate totals
  //         newHealthStats.water.monthly = monthlyWaterRecords.reduce(
  //           (sum, r) => sum + r.details.water,
  //           0
  //         );
  //         newHealthStats.steps.monthly = monthlyStepsRecords.reduce(
  //           (sum, r) => sum + r.details.steps,
  //           0
  //         );
  //         newHealthStats.heart.monthly = monthlyHeartRecords.reduce(
  //           (sum, r) => sum + r.details.heart,
  //           0
  //         );
  //         newHealthStats.sleep.monthly = monthlySleepRecords.reduce(
  //           (sum, r) => sum + calculateSleepDuration(r),
  //           0
  //         );
  //         newHealthStats.weight.monthly = monthlyWeightRecords.reduce(
  //           (sum, r) => sum + r.details.weight.value,
  //           0
  //         );

  //         // Calculate averages
  //         newHealthStats.water.avgMonthly =
  //           monthlyWaterRecords.length > 0
  //             ? newHealthStats.water.monthly / monthlyWaterRecords.length
  //             : 0;
  //         newHealthStats.steps.avgMonthly =
  //           monthlyStepsRecords.length > 0
  //             ? newHealthStats.steps.monthly / monthlyStepsRecords.length
  //             : 0;
  //         newHealthStats.heart.avgMonthly =
  //           monthlyHeartRecords.length > 0
  //             ? newHealthStats.heart.monthly / monthlyHeartRecords.length
  //             : 0;
  //         newHealthStats.sleep.avgMonthly =
  //           monthlySleepRecords.length > 0
  //             ? newHealthStats.sleep.monthly / monthlySleepRecords.length
  //             : 0;
  //         newHealthStats.weight.avgMonthly =
  //           monthlyWeightRecords.length > 0
  //             ? newHealthStats.weight.monthly / monthlyWeightRecords.length
  //             : 0;

  //         // Create health data object with safer property access (for backward compatibility)
  //         const newHealthData = {
  //           steps: {
  //             today: newHealthStats.steps.today,
  //             weekly: newHealthStats.steps.weekly,
  //           },
  //           water: {
  //             today: newHealthStats.water.today,
  //             weekly: newHealthStats.water.weekly,
  //           },
  //           weight: {
  //             current: latestRecord.details?.weight?.value || 0,
  //             unit: latestRecord.details?.weight?.unit || "kg",
  //             previous: 0,
  //           },
  //         };

  //         // Find previous weight record for backward compatibility
  //         const prevWeightRecord = sortedRecords.find(
  //           (r) =>
  //             r !== latestRecord &&
  //             r.details &&
  //             r.details.weight &&
  //             typeof r.details.weight.value === "number" &&
  //             r.details.weight.value > 0
  //         );

  //         if (
  //           prevWeightRecord &&
  //           prevWeightRecord.details &&
  //           prevWeightRecord.details.weight
  //         ) {
  //           newHealthData.weight.previous =
  //             prevWeightRecord.details.weight.value;
  //         }

  //         // Update state with the new health data
  //         setHealthStats(newHealthStats);
  //         setHealthData(newHealthData as any);
  //         console.log(
  //           "Health stats calculated successfully:",
  //           JSON.stringify(newHealthStats, null, 2)
  //         );
  //       } else {
  //         console.log("No valid data in API response");
  //       }
  //     } catch (error: any) {
  //       console.error("API call error:", error.message);
  //       if (error.response) {
  //         console.error("API error response status:", error.response.status);
  //         console.error(
  //           "API error response data:",
  //           JSON.stringify(error.response.data, null, 2)
  //         );
  //       }
  //     }
  //   } else {
  //     console.log("No user ID available")
  //   }
  // };

  useFocusEffect(
    useCallback(() => {
      // This will run when the screen comes into focus
      console.log("Screen focused, reloading context if needed")
      loadMessages()

      // If questionnaireManager exists, make sure it's properly initialized
      // No need to call questionnaireManager.loadConversationState here, as it does not exist.
    }, []),
  )

  const generateTranslation = async (text: string, targetLanguage: string) => {
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const apiKey = "AIzaSyDa4LHDX8SHeXNeKr6sZP5TCIrEIPnkjSU"; // Replace with your actual API key

  // Prepare the request body for translation
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Translate the following text to ${getLanguageName(targetLanguage)} without any explanations or additional context. Only return the translated text:\n\n"${text}"`,  // Adjust the structure of the prompt
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.0, // Ensuring deterministic output
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
    },
  };

  // Use fetch instead of axios
  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": targetLanguage, // Use target language here
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

    responseText = responseText.replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Translation:?\s*/i, '') // Remove "Translation:" prefix
      .trim();// Clean up unwanted characters
    console.log('Response Text:', responseText);

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

  // Add useEffect to save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages)
    }
  }, [messages])


 const fetchAndUpdateHealthData = async () => {
    if (user && user.user_id) {
      try {
        const { healthStats: newHealthStats, healthData: newHealthData } = await fetchHealthData(user.user_id)

        // Update state with the new health data
        setHealthStats(newHealthStats)
        setHealthData(newHealthData)
        console.log("Health stats fetched and updated successfully")
      } catch (error) {
        console.error("Error fetching health data:", error)
      }
    } else {
      console.log("No user ID available")
    }
  }

  // Fetch health data when component mounts
  useEffect(() => {
    fetchAndUpdateHealthData()
  }, [])

  const sendToAPI = async (messageContent: string, messageType: "text" | "audio") => {
    try {
      // Correct Gemini API endpoint
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

      // Your API key should be stored in an environment variable in production
      const apiKey = process.env.GEMINI_API // Replace with your actual API key

      // Create enhanced prompt with health data if available
      let enhancedPrompt = systemPrompt;

      // Add explicit language instruction at the beginning
      enhancedPrompt = `IMPORTANT: Always respond in ${currentLanguage} language only with the specific and accurate response`

      if (healthData) {
        enhancedPrompt += `\n\n${t('healthData.userhealth')}\n`;

        if (healthStats.steps) {
          enhancedPrompt += `- ${t('steps')}: ${t('healthData.today1')}: ${
            healthStats.steps.today
          }, ${t('healthData.weekly_averages')}: ${healthStats.steps.avgWeekly.toFixed(
            0
          )}, ${t('healthData.monthly_averages')}: ${healthStats.steps.avgMonthly.toFixed(0)}\n`;
        }

        if (healthStats.water) {
          enhancedPrompt += `- ${t('water')}: ${t('healthData.today1')}: ${
            healthStats.water.today
          } ${t('healthData.glasses')}, ${t('healthData.weekly_averages')}: ${healthStats.water.avgWeekly.toFixed(
            1
          )} ${t('healthData.glasses')}, ${t('healthData.monthly_averages')}: ${healthStats.water.avgMonthly.toFixed(
            1
          )} ${t('healthData.glasses')}\n`;
        }

        if (healthStats.weight && healthStats.weight.avgWeekly > 0) {
          enhancedPrompt += `- ${t('healthData.weight')}: ${t('healthData.current')}: ${healthStats.weight.today} ${
            healthStats.weight.unit
          }, ${t('healthData.weekly_average')}: ${healthStats.weight.avgWeekly.toFixed(1)} ${
            healthStats.weight.unit
          }, ${t('healthData.monthly_average1')}: ${healthStats.weight.avgMonthly.toFixed(1)} ${
            healthStats.weight.unit
          }\n`;
        }

        if (healthStats.heart && healthStats.heart.avgWeekly > 0) {
          enhancedPrompt += `- ${t('healthData.heart_rate')}: ${t('healthData.current')}: ${
            healthStats.heart.today
          } bpm, ${t('healthData.weekly_averages')}: ${healthStats.heart.avgWeekly.toFixed(
            0
          )} bpm, ${t('healthData.monthly_averages')}: ${healthStats.heart.avgMonthly.toFixed(
            0
          )} bpm\n`;
        }

        if (healthStats.sleep && healthStats.sleep.avgWeekly > 0) {
          enhancedPrompt += `- ${t('healthData.sleep')}: ${t('healthData.last_night')}: ${healthStats.sleep.today.toFixed(
            1
          )} ${t('healthData.hours')}, ${t('healthData.weekly_averages')}: ${healthStats.sleep.avgWeekly.toFixed(
            1
          )} ${t('healthData.hours')}, ${t('healthData.monthly_averages')}: ${healthStats.sleep.avgMonthly.toFixed(
            1
          )} ${t('healthData.hours')}\n`;
        }

        enhancedPrompt += `\nPlease answer the user's question about their health metrics using this data. Be specific and encouraging.`
      }

      // Create the parts array with the system prompt
      const parts = [
        {
          text: enhancedPrompt,
        },
      ]

      // Add conversation history - limit to last 10 messages to avoid token limits
      const recentMessages = messages.slice(-20)

      for (const msg of recentMessages) {
        // Skip audio messages as they don't have text content we can send
        if (msg.type === "text") {
          parts.push({
            text: msg.isUser
              ? `User ${msg.content}`
              : `${msg.content}`,
          });
        }
      }

      // Add the current message
      parts.push({
        text: `${messageContent}`
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

      console.log("Current Language: ", currentLanguage);

      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Accept-Language": currentLanguage,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("API Error:", errorData)
        throw new Error(`Failed to send message to Gemini API: ${response.status}`)
      }

      const data = await response.json()

      // Extract the response text from Gemini's response format
      let responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process your request at this time."

      responseText = responseText.replace(/\*/g, "");
      console.log('Response Text', responseText)
      return {
        response: responseText,
      }
    } catch (error) {
      console.error("Error sending message to Gemini API:", error)
      return {
        response:
          "I'm having trouble connecting right now. Please try again later.",
      };
    }
  };

  const speakResponse = (text: string) => {
    // Check if muted - if so, don't speak but still process
    if (effectiveMuted) {
      console.log("Voice is muted, not speaking response:", text)
      setIsProcessing(false)
      setIsSpeaking(false)
      return
    }

    // If speech is already happening, stop it before starting new speech
    if (isSpeaking) {
      Speech.stop()
      console.log("Speech interrupted.")
    }

    setIsSpeaking(true)

    // Create speech options with the female voice if available
    const speechOptions: Speech.SpeechOptions = {
      language: currentLanguage,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false)
        setIsProcessing(false)
        setSpeakingMessageId(null)
      },
      onStopped: () => {
        setIsSpeaking(false)
        setIsProcessing(false)
        setSpeakingMessageId(null)
      },
      onError: (error) => {
        console.error("Speech error:", error)
        setIsSpeaking(false)
        setIsProcessing(false)
        setSpeakingMessageId(null)
      },
    }

    // Add the voice if we found a female one
    if (femaleVoice) {
      speechOptions.voice = femaleVoice.identifier
    }

    // Start speaking the text
    Speech.speak(text, speechOptions)
  }

   const [isSpeaking, setIsSpeaking] = useState(false);
  const [femaleVoice, setFemaleVoice] = useState<Speech.Voice | null>(null);
  const [localMuted, setLocalMuted] = useState(false)
  const effectiveMuted = isMuted !== undefined ? isMuted : localMuted

  useEffect(() => {
    return () => {
      // Cleanup speech when component unmounts
      if (isSpeaking) {
        Speech.stop()
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      }
    }
  }, [isSpeaking])

  const wordsToNumbers = (text: string): string => {
  const numberWords: { [key: string]: number } = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
  };

  const tokens = text.toLowerCase().split(/\s+/);
  let result = 0;
  let current = 0;

  tokens.forEach((token) => {
    if (numberWords[token] !== undefined) {
      current += numberWords[token];
    } else if (token === "hundred" && current !== 0) {
      current *= 100;
    } else if (token === "thousand" && current !== 0) {
      current *= 1000;
      result += current;
      current = 0;
    } else {
      result += current;
      current = 0;
    }
  });

  result += current;
  return text.replace(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/gi, result.toString());
};


  const extractMetricFromText = (text: string, metricType: string) => {
    // Generic number extraction regex
    const numberRegex = /(\d+(?:\.\d+)?)/g

    // Extract all numbers from the text
    const numbers = text.match(numberRegex)

    if (!numbers || numbers.length === 0) {
      return null
    }

    // Different metrics might need different parsing logic
    switch (metricType) {
      case "weight":
        // Find unit - kg or lbs
        const unit = /\b(kg|kgs|kilograms|lbs|pounds)\b/i.test(text)
          ? text.match(/\b(kg|kgs|kilograms)\b/i)
            ? "kg"
            : "lbs"
          : "kg" // Default to kg

        return {
          value: Number.parseFloat(numbers[0]),
          unit: unit,
        }

      case "water":
        // Find if talking about glasses or ml
        const isGlasses = /\b(glass|glasses|cup|cups)\b/i.test(text)
        return {
          value: Number.parseFloat(numbers[0]),
          isGlasses: isGlasses,
        }

      case "steps":
        return {
          value: Number.parseInt(numbers[0], 10),
        }

      case "heart":
        return {
          value: Number.parseInt(numbers[0], 10),
        }

      case "sleep":
        // Extract sleep start and end times
        // Look for patterns like "from 10:30 pm to 6:45 am" or "10pm to 6am"
        const sleepPattern =
          /(?:from|at)?\s*(\d+(?::\d+)?\s*(?:am|pm)?).*?(?:to|until|till)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i
        const sleepMatch = text.match(sleepPattern)

        if (sleepMatch && sleepMatch[1] && sleepMatch[2]) {
          return {
            sleepStart: sleepMatch[1].trim(),
            sleepEnd: sleepMatch[2].trim(),
          }
        }
        return null

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
      ])
    }

    // Call the utility function with the necessary parameters
    const result = await detectAndHandleLogRequest(
      query,
      user.user_id,
      extractMetricFromText,
      fetchAndUpdateHealthData,
      addResponseMessage,
    )

    return result.handled
  }


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
      ])
    }

    // Call the utility function with the necessary parameters
    const result = await detectAndHandleGoalRequest(
      query,
      user.user_id,
      extractMetricFromText,
      fetchAndUpdateHealthData,
      addResponseMessage,
    )

    return result.handled
  }



  const handleProcessUserQuery = async (query: string) => {
    // Create a function for the RAG service call
    const callRagService = async (query: string, conversationHistory: any[] = []) => {
      try {
        console.log(`Calling RAG service with query: "${query}"`)

        const response = await axios.post(`${RAG_SERVICE_URL}/${user?.user_id}`, {
          query: query,
          conversationHistory: conversationHistory,
          currentLanguage: currentLanguage,
        })

        if (response.status === 200 && response.data.success) {
          console.log("RAG service responded successfully")
          return response.data
        } else {
          console.error("RAG service error:", response.data)
          return null
        }
      } catch (error: any) {
        console.error("Error calling RAG service:", error.message)

        // Add enhanced error logging
        if (error.response) {
          // The server responded with a status code outside of 2xx
          console.error("RAG service error status:", error.response.status)
          console.error("RAG service error data:", error.response.data)
          console.error("RAG service error headers:", error.response.headers)
        } else if (error.request) {
          // The request was made but no response was received
          console.error("RAG service no response received:", error.request)
        } else {
          // Something happened in setting up the request
          console.error("RAG service error details:", error.stack)
        }

        // Log the request that was sent
        try {
          console.error("Request that caused error:", {
            url: `${RAG_SERVICE_URL}/${user?.user_id}`,
            payload: {
              query: query,
              conversationHistory: conversationHistory?.length || 0, // Just log length to avoid huge logs
              currentLanguage: currentLanguage,
            },
          })
        } catch (logError) {
          console.error("Error while logging request details:", logError)
        }

        return null
      }
    }
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
        callRagService,
      },
      shouldSpeak
    })
  }

  const sendMessage = async (messageContent: string = inputText) => {
    if (messageContent.trim()) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        type: "text",
        content: messageContent,
        isUser: true,
        timestamp: new Date(),
      }

         Speech.stop();
      // Update messages state with the new message
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages as Message[])
      setInputText("")
      setIsTyping(true)
      setIsAssistantResponding(true)

      const updatedProgress = await getProgressFromStorage()
      setProgress(updatedProgress)

      // Only process as questionnaire response when the questionnaire is active and not paused
      if (questionnaireManager.isActive && !questionnaireManager.isPaused && !questionnaireManager.isCompleted) {
        const handled = await questionnaireManager.handleUserResponse(messageContent)
        if (handled) {
          setIsTyping(false)
          setIsAssistantResponding(false)
          return // Exit if questionnaire handled the response
        }
      }

      // Otherwise, process as a regular chat message
      await handleProcessUserQuery(messageContent)
      setIsTyping(false)
      setIsAssistantResponding(false)
    }
  }

  const loadPauseState = async () => {
    try {
      // First check dedicated storage
      const state = await AsyncStorage.getItem(`questionnaire_paused_${user?.user_id}`)
      if (state !== null) {
        const isPaused = state === "true"
        console.log(`Loaded pause state from dedicated storage: ${isPaused}`)
        return isPaused
      }

      // Fall back to context if dedicated storage doesn't have the value
      const contextString = await AsyncStorage.getItem(`conversation_context_${user?.user_id}`)
      if (contextString) {
        const context = JSON.parse(contextString)
        const isPaused = context?.isPaused || false
        console.log(`Loaded pause state from context: ${isPaused}`)
        return isPaused
      }

      console.log("No pause state found, defaulting to false")
      return false
    } catch (error) {
      console.error("Error loading pause state:", error)
      return false
    }
  }




  const handleAudioSent = async (
    audioUri: string,
    transcript?: string,
    assistantResponse?: string
  ) => {
    console.log("handleAudioSent called with:", {
      audioUri,
      transcript,
      assistantResponse,
    })

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
      ])
    }

 
   

    // Process the transcript if available
    if (transcript) {
      setIsTyping(true);
      setIsAssistantResponding(true);
  setIsSpeaking(true);

  
      // Check for log/goal requests with the same processing logic as text
      // This ensures consistent handling between voice and text
      try {
             const processedTranscript = wordsToNumbers(transcript);
      console.log("Processed transcript:", processedTranscript);

       const translationResult = await generateTranslation(processedTranscript, 'en');
      const translatedText = translationResult.response;

      // Pass the processed transcript to processUserQuery
      await handleProcessUserQuery(transcript, true);
        } finally {
            setIsTyping(false);
            setIsAssistantResponding(false);
        }
    }

      if(assistantResponse){
          speakResponse(assistantResponse);
      }
  }

  const handleOptionPress = (optionText: string) => {
    setInputText(optionText) // Update the inputText with the selected option
    sendMessage(optionText)
  }

  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - reloading pause state and progress")

      const refreshState = async () => {
        // First load the pause state
        const paused = await loadPauseState()
        console.log(`Loaded pause state on focus: ${paused}`)
        setIsPaused(paused)

        // Then load progress
        const storedProgress = await getProgressFromStorage()
        setProgress(storedProgress)

        // Debug log
        console.log(`Screen focused: isPaused=${paused}, progress=${storedProgress}%`)
      }

      refreshState()

      return () => {
        // Nothing to clean up
      }
    }, []),
  )

  const clearChatHistory = async () => {
    try {
      // Clear chat history from AsyncStorage
      await AsyncStorage.removeItem("chatHistory")

      // Clear messages from state
      setMessages([])

      // Reset questionnaire state in AsyncStorage
      await AsyncStorage.removeItem(`conversation_context_${user?.user_id}`)
      await AsyncStorage.removeItem(`questionnaire_completed_${user?.user_id}`)
      await AsyncStorage.removeItem(`questionnaire_state_${user?.user_id}`)
      await AsyncStorage.removeItem(`last_question_${user?.user_id}`)
      await AsyncStorage.removeItem(`intro_shown_${user?.user_id}`)

      console.log("Chat history cleared successfully")

      // Show confirmation to the user with option to start questionnaire
      Alert.alert(
        t('askDoula.title1'),
        t('askDoula.message'),
        [
          {
            text: t('askDoula.yes'),
            onPress: () => {
              // Start the questionnaire
              questionnaireManager.startQuestionnaire()
            },
          },
          { text: t('askDoula.no') },
        ]
      );
    } catch (error) {
      console.error("Error clearing chat history:", error)
      Alert.alert("Error", "Failed to clear chat history. Please try again.")
    }
  }

  const renderTypingIndicator = () => {
    const dot1Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    })

    const dot2Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 1, 0.3],
    })

    const dot3Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 0.3, 1],
    })

    return (
      <View style={styles.messageRow}>
        <Image source={{ uri: user?.avatar_url }} style={styles.doulaAvatar} />
        <View style={styles.typingIndicator}>
          <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    )
  }

  // Function to save messages to AsyncStorage
  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      // We need to convert Date objects to strings before storing
      const serializedMessages = messagesToSave.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }))

      await AsyncStorage.setItem("chatHistory", JSON.stringify(serializedMessages))
      console.log("Messages saved to storage")
    } catch (error) {
      console.error("Error saving messages:", error)
    }
  }

  // Calculate progress percentage based on completed questions
  const savePauseState = async (paused: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(`questionnaire_paused_${user?.user_id}`, paused ? "true" : "false")
      console.log(`Saved pause state: ${paused}`)
    } catch (error: unknown) {
      console.error("Error saving pause state:", error)
    }
  }

  const getCurrentDomainTitle = () => {
    const domainIndex = getCurrentDomainIndex()
    const domain = QUESTIONNAIRE_DOMAINS[domainIndex]
    return domain ? domain.description : "Getting to Know You"
  }

    const [isContextLoaded, setIsContextLoaded] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // Handle pause/resume button press
  const handlePauseResumeToggle = async () => {
    try {
      if (isPaused) {
        // Resume questionnaire
        console.log("Resuming questionnaire")

        // Update local state first for immediate UI feedback
        setIsPaused(false)

        // Save the pause state to dedicated storage
        await savePauseState(false)

        // Also update the context
        const contextString = await AsyncStorage.getItem(`conversation_context_${user?.user_id}`)
        if (contextString) {
          const context = JSON.parse(contextString)
          context.isPaused = false
          await AsyncStorage.setItem(`conversation_context_${user?.user_id}`, JSON.stringify(context))
        }

        // Resume in the questionnaire manager
        await questionnaireManager.resumeQuestionnaire()
      } else {
        // Pause questionnaire
        console.log("Pausing questionnaire")

        // Update local state first for immediate UI feedback
        setIsPaused(true)

        // Save the pause state to dedicated storage
        await savePauseState(true)

        // Pause in the questionnaire manager and get context
        const context = await questionnaireManager.pauseQuestionnaire()

        // Make sure the context has isPaused set to true
        if (context) {
          context.isPaused = true
          await AsyncStorage.setItem(`conversation_context_${user?.user_id}`, JSON.stringify(context))
        }

        // Save responses to database
        try {
          // Get the current responses from context
          const responses = context?.responses || []
          console.log("this is the responses:", responses)

          // Submit each response to database
          for (const response of responses) {
            await axios.post(`https://crosscare-backends.onrender.com/api/user/${user?.user_id}/domain`, {
              domainId: response.domainId,
              questionId: response.questionId,
              response: response.response,
              flag: response.flag,
              timestamp: response.timestamp.toISOString(),
            })
          }
          console.log("Saved questionnaire responses to database")
        } catch (error) {
          console.error("Error saving responses to database:", error)
        }
      }

      // Update progress after state change
      const updatedProgress = await getProgressFromStorage()
      setProgress(updatedProgress)
    } catch (error) {
      console.error("Error in pause/resume toggle:", error)
      // Revert state if there was an error
      setIsPaused(!isPaused)
    }
  }

  // Function to load messages from AsyncStorage
  const loadMessages = async () => {
    try {
      // First check if questionnaire is completed
      const isCompleted = await checkQuestionnaireCompletionStatus()

      const savedMessages = await AsyncStorage.getItem("chatHistory")

      if (questionnaireManager && questionnaireManager.context) {
        try {
          // Force the questionnaire manager to reload its context
          const savedQContext = await AsyncStorage.getItem(`conversation_context_${user?.user_id}`)
          if (savedQContext) {
            console.log("Reloading questionnaire context for progress bar")
            // This will trigger the next step in your existing code that handles context loading
            setForceUpdate((prev) => prev + 1)
          }
        } catch (qError) {
          console.error("Error refreshing questionnaire context:", qError)
        }
      }

      if (savedMessages) {
        // Parse the JSON and convert timestamp strings back to Date objects
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))

        // If we have messages, load them
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages)
          console.log("Loaded messages from AsyncStorage, count:", parsedMessages.length)
        } else {
          console.log("No messages found in saved chat history")
        }
      } else {
        console.log("No saved messages found in AsyncStorage")
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  };

  useEffect(() => {
    const loadMuteState = async () => {
      try {
        const savedMuteState = await AsyncStorage.getItem("isMuted")
        if (savedMuteState !== null) {
          setIsMuted(savedMuteState === "true")
        }
      } catch (error) {
        console.error("Error loading mute state:", error)
      }
    }

    loadMuteState()
  }, [])

  useEffect(() => {
    const saveMuteState = async () => {
      try {
        await AsyncStorage.setItem("isMuted", isMuted.toString())
      } catch (error) {
        console.error("Error saving mute state:", error)
      }
    }

    saveMuteState()
  }, [isMuted])

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

 const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    setIsProcessing(false);
    
    // Stop any ongoing speech when muting
    if (newMuteState && isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
    }
}; 

 const speakMessage = (messageId: string, messageContent: string) => {
    // If this message is already being spoken, stop it
    if (speakingMessageId === messageId) {
      Speech.stop()
      setIsSpeaking(false)
      setSpeakingMessageId(null)
      return
    }

    // If another message is being spoken, stop it first
    if (isSpeaking) {
      Speech.stop()
    }

    // If muted, unmute first
    if (isMuted) {
      setIsMuted(false)
    }

    // Set the speaking state and ID before starting speech
    setIsSpeaking(true)
    setSpeakingMessageId(messageId)

    const speechOptions: Speech.SpeechOptions = {
      language: currentLanguage,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      },
      onStopped: () => {
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      },
      onError: (error) => {
        console.error("Speech error:", error)
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      },
    }

    // Add the voice if we found a female one
    if (femaleVoice) {
      speechOptions.voice = femaleVoice.identifier
    }

    // Start speaking the text
    Speech.speak(messageContent, speechOptions)
  }

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
            <Text style={styles.headerTitle}>{t('askDoula.title')}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              {}
              <TouchableOpacity onPress={clearChatHistory} style={{ marginRight: 12 }}>
                <Feather name="trash-2" size={20} color={messages.length > 0 ? "#434343" : "#f5f5f5"} />
              </TouchableOpacity>
              {/* <TouchableOpacity>
                <Feather name="more-vertical" size={20} color="#E5E5E5" />
              </TouchableOpacity> */}
            </View>
          </View>
        )}

        {(questionnaireManager.isActive || questionnaireManager.isPaused || !questionnaireManager.isCompleted) && (
          <View style={styles.questionnaireStatusContainer}>
            <View style={styles.statusTextContainer}>
              <Text style={styles.questionnaireStatusTitle}>Questionnaire Status - {getCurrentDomainTitle()}</Text>
              <TouchableOpacity
                style={[styles.pauseButton, isPaused && styles.resumeButton]}
                onPress={handlePauseResumeToggle}
              >
                <Text style={[styles.pauseButtonText, isPaused && styles.resumeButtonText]}>
                  {isPaused ? "Resume" : "Pause"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
              <Text style={[styles.progressText, { left: `${progress}%` }]}>{progress}%</Text>
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
              scrollViewRef.current?.scrollToEnd({ animated: true })
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
                      : require("../../assets/images/hairs/h1/face/c1.png") // Fallback to local image if no avatar_url
                  }
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.greeting}>
                <Text>👋 {t('askDoula.hi')}, </Text>
                <Text style={styles.name}>{user.user_name}</Text>
                <Text>!</Text>
              </Text>

              <Text style={styles.title}>
                {t('askDoula.description')} <Text style={styles.highlight}>Doula</Text>
              </Text>

              <Text style={styles.subtitle}>{t('askDoula.subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[styles.messageRow, message.isUser ? styles.userMessageRow : styles.doulaMessageRow]}
                >
                  {!message.isUser && (
                    <Image
                      source={{
                        uri:
                          user?.avatar_url ||
                          "https://tskzddfyjazcirdvloch.supabase.co/storage/v1/object/public/cross-care/avatars/avatar-660e8400-e29b-41d4-a716-446655440014-46d376a4-820f-45d8-82cb-82766db041fa.jpg",
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

                       {/* {message.isUser ? (
      <Text
        style={[
          styles.messageText,
          styles.userMessageText,
        ]}
      >
        {message.content}
      </Text>
          ) : (
      <Markdown
        style={{
          body: styles.doulaMessageText, // Customize markdown text style
        }}
      >
        {message.content}
      </Markdown>
    )} */}
                    </View>
                  ) : (
                    <AudioMessage audioUri={message.content} isUser={message.isUser} />
                  )}

                  {message.isUser && (
                    <>
                      {user?.user_photo ? (
                        <Image source={{ uri: user.user_photo }} style={styles.userAvatar} />
                      ) : (
                        <>
                          <View
                            style={{
                              borderWidth: 1.44,
                              borderRadius: 25,
                              borderColor: "#FDE8F8",
                              boxShadow: "0px 0px 0.72px 0px rgba(0, 0, 0, 0.30);",
                            }}
                          >
                            <User width={36} height={36} />
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
              onPress={() => handleOptionPress(t('options.healthStats1'))}
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>{t('options.healthStats')}</Text>
            </TouchableOpacity>

            {/* Standard advice options */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                handleOptionPress(
                  t('options.nutritionAdvice1')
                )
              }
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>{t('options.nutritionAdvice')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                handleOptionPress(t('options.exerciseTips1'))
              }
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>{t('options.exerciseTips')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress(t('options.birthPlanning1'))}
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>{t('options.birthPlanning')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() =>
                handleOptionPress(t('options.travelSafety1'))
              }
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>{t('options.travelSafety')}</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={t('inputPlaceholder')}
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={(text) => setInputText(text)}
                onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)}
                editable={!isAssistantResponding}
              />
              <VoiceRecorder
                onSendAudio={handleAudioSent}
                systemPrompt={systemPrompt}
                isMuted={isMuted}
                isSpeaking={isSpeaking}
                setIsSpeaking={setIsSpeaking}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isTyping}
            >
              <Feather name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
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
    fontSize: 12,
    fontFamily: "DMSans500",
    color: "rgba(136, 59, 114, 1)",
    maxWidth: "90%",
  },
  pauseButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FBBBE9",
  },
  pauseButtonText: {
    color: "rgba(247, 108, 207, 1)",
    fontSize: 10,
    fontFamily: "DMSans500",
  },
  resumeButton: {
    backgroundColor: "rgba(247, 108, 207, 1)",
    borderColor: "#F989D9",
  },
  resumeButtonText: {
    color: "#FFF",
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F76CCF",
    borderRadius: 10,
  },
  progressText: {
    position: "absolute",
    right: 8,
    color: "rgba(136, 59, 114, 1)",
    fontSize: 12,
    fontFamily: "DMSans500",
    flex: 1,
    // alignSelf: "center",
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
    height: "100%",
  },
  micButton: {
    padding: 4,
    // paddingLeft,
  },
  bubbleMuteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
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
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});