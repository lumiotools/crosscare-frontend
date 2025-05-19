import { useEffect, useRef, useState } from "react";
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
} from "react-native";
import Markdown from 'react-native-markdown-display';
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import VoiceRecorder from "@/components/VoiceRecorder";
import AudioMessage from "@/components/AudioMessage";
import { useSelector } from "react-redux";
import axios from "axios";
import { systemPrompts } from "@/constants/systemPrompts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QUESTIONNAIRE_DOMAINS,
  type QuestionnaireResponse,
} from "@/constants/questionaireData";
import QuestionnaireManager from "@/components/QuestionaireManager";
import { useLocalSearchParams } from "expo-router";
import name from './profile-setting/name';
import { width, height } from '../../constants/helper';
import ProfileIcon from "@/assets/images/Svg/ProfileIcon";
import Person from "@/assets/images/Svg/Person";
import User from "@/assets/images/Svg/User";
import { useTranslation } from "react-i18next";
import * as Speech from 'expo-speech';


interface Message {
  id: string;
  type: "text" | "audio";
  isUser: boolean;
  timestamp: Date;
  content: string; // text content or audio URI
}

// Define regex patterns for more advanced pattern matching
const LOG_PATTERNS = {
  water: [
    /(?:log|record|track|add|drank|had|consumed).*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres).*?water/i,
    /my water intake (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:i\s+)?(?:drank|had|took|consumed)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
    // New patterns for incremental logging
    /(?:i\s+)?(?:drank|had|took|consumed)\s+(\d+(?:\.\d+)?)\s+(?:more|additional|extra)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
    /(?:add|log|record|track)\s+(\d+(?:\.\d+)?)\s+(?:more|additional|extra)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
    /(?:i\s+)?(?:just|now|recently)\s+(?:drank|had|took|consumed)\s+(?:another|an additional|an extra)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
  ],
  weight: [
    /(?:log|record|track|add|weigh|measure).*?(\d+(?:\.\d+)?).*?(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?).*?weight/i,
    /my weight (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
    /(?:i\s+)?(?:weigh|am|measure)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
  ],
  steps: [
    /(?:log|record|track|add|walk|measure).*?(\d+(?:\.\d+)?).*?(?:steps?|walked)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+steps/i,
    /(?:my steps?|my step count) (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)/i,
    /(?:i\s+)?(?:walked|did|took)\s+(\d+(?:\.\d+)?)\s+steps/i,
  ],
  heartRate: [
    /(?:log|record|track|add|measured).*?(\d+(?:\.\d+)?).*?(?:bpm|beats per minute|heart rate|pulse)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:bpm|beats per minute).*?(?:heart|pulse)/i,
    /my (?:heart rate|pulse) (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)/i,
    /(?:i\s+)?(?:have|had|measured)\s+(?:a\s+)?(?:heart rate|pulse|HR) of\s+(\d+(?:\.\d+)?)/i,
  ],
  sleep: [
    /(?:log|record|track|add).*?sleep.*?from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /(?:i\s+)?(?:slept|sleep).*?from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /(?:i\s+)?(?:went to bed|fell asleep).*?(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?(?:woke up|got up).*?(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /my sleep (?:yesterday|last night) was from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
  ],
};

const GOAL_PATTERNS = {
  water: [
    /(?:set|update|change).*?(?:water|hydration).*?goal.*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:goal|target) (?:is|to drink|for|of).*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:want|aim|going) to drink\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /my water goal (?:is|should be)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
  ],
  steps: [
    /(?:set|update|change).*?(?:steps?).*?goal.*?(\d+(?:\.\d+)?).*?(?:steps?)/i,
    /(?:step goal|step target|walking goal|walking target) (?:is|to reach|for|of).*?(\d+(?:\.\d+)?).*?(?:steps?)/i,
    /(?:want|aim|going) to (?:walk|reach|do)\s+(\d+(?:\.\d+)?)\s+steps/i,
    /my step goal (?:is|should be)\s+(\d+(?:\.\d+)?)/i,
  ],
};

// Function to check if the request is for an incremental update
function isIncrementalRequest(query: string) {
  const incrementalPatterns = [
    /(?:more|additional|extra|another)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:increase|increment|add to|on top of)/i,
  ];

  return incrementalPatterns.some((pattern) => pattern.test(query));
}

export default function askdoula() {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language
  
  
  const [messages, setMessages] = useState<Message[]>([]);
  const user = useSelector((state: any) => state.user);
  const [healthData, setHealthData] = useState(null);
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
  });

  const params = useLocalSearchParams();
  const fromModal = params.from_modal === "true";

  // Check if back button should be shown
  // const shouldShowBackButton = !hideBackButtonPaths.includes(path);

  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const loadingAnimation = useRef(new Animated.Value(0)).current;

  // Questionnaire state
  const [showStartQuestionnaire, setShowStartQuestionnaire] = useState(false);

  // Initialize questionnaire manager
  const questionnaireManager = QuestionnaireManager({
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
      // Send a completion message
      // setMessages((prevMessages) => [
      //   ...prevMessages,
      //   {
      //     id: Date.now().toString(),
      //     type: "text",
      //     content:
      //       "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you.",
      //     isUser: false,
      //     timestamp: new Date(),
      //   },
      // ])
    },
    onResponseSaved: (response: QuestionnaireResponse) => {
      // You can do additional processing here if needed
      console.log("Response saved:", response);
    },
  });

  // useEffect(() => {
  //   if (messages.length === 0 && questionnaireManager.isActive) {
  //     // Add welcome message
  //     setMessages([
  //       {
  //         id: Date.now().toString(),
  //         type: "text",
  //         content: `Hello ${user?.user_name || "there"}!  as your doula, I'm here to support you not just physically, but also emotionally and socially throughout your pregnancy and postpartum journey.`,
  //         isUser: false,
  //         timestamp: new Date(),
  //       },
  //     ])
  //   }
  // }, [questionnaireManager.isActive, messages.length])

  // Check if we should show the questionnaire option

  // Replace the existing useEffect for checkQuestionnaireStatus with this:

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
    const checkQuestionnaireStatus = async () => {
      const isPaused = await questionnaireManager.checkForPausedQuestionnaire();

      // In the useEffect for checkQuestionnaireStatus, modify the paused questionnaire section
      // If there's a paused questionnaire and no messages yet, ask if they want to continue
      if (isPaused && messages.length === 0) {
        console.log("Found paused questionnaire, asking to continue");

        // Try to load the last question that was asked
        try {
          const lastQuestionJson = await AsyncStorage.getItem(
            `last_question_${user?.user_id}`
          );
          if (lastQuestionJson) {
            const lastQuestion = JSON.parse(lastQuestionJson);
            console.log(
              "Found last question for paused questionnaire:",
              lastQuestion
            );

            // If the last message was a pause confirmation, use a different message to resume
            if (lastQuestion.domainId === "pause") {
              setMessages([
                {
                  id: Date.now().toString(),
                  type: "text",
                  content: `Hey ${
                    user?.user_name || "there"
                  }, you have an unfinished questionnaire. Would you like to continue where you left off?`,
                  isUser: false,
                  timestamp: new Date(),
                },
              ]);
              return;
            }

            // If it was a domain continuation question, use that context
            if (lastQuestion.domainId === "continue") {
              const savedState = await AsyncStorage.getItem(
                `questionnaire_state_${user?.user_id}`
              );
              if (savedState) {
                const parsedState = JSON.parse(savedState);
                const nextDomainIndex = parsedState.currentDomainIndex + 1;

                if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
                  const nextDomain =
                    QUESTIONNAIRE_DOMAINS[parsedState.currentDomainIndex];
                  setMessages([
                    {
                      id: Date.now().toString(),
                      type: "text",
                      content: `Hey ${
                        user?.user_name || "there"
                      }, we were discussing ${QUESTIONNAIRE_DOMAINS[
                        parsedState.currentDomainIndex
                      ].description.toLowerCase()} and about to move to ${nextDomain.description.toLowerCase()}. Would you like to continue where you left off?`,
                      isUser: false,
                      timestamp: new Date(),
                    },
                  ]);
                  return;
                }
              }
            }

            // For a regular question, use the domain context
            const savedState = await AsyncStorage.getItem(
              `questionnaire_state_${user?.user_id}`
            );
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              const currentDomain =
                QUESTIONNAIRE_DOMAINS[parsedState.currentDomainIndex];

              if (currentDomain) {
                setMessages([
                  {
                    id: Date.now().toString(),
                    type: "text",
                    content: `Hey ${
                      user?.user_name || "there"
                    }, you have an unfinished questionnaire about ${currentDomain.description.toLowerCase()}. Would you like to continue where you left off?`,
                    isUser: false,
                    timestamp: new Date(),
                  },
                ]);
                return;
              }
            }
          }
        } catch (error) {
          console.error("Error getting last question:", error);
        }

        // Fallback message if we can't determine the context
        setMessages([
          {
            id: Date.now().toString(),
            type: "text",
            content: `Hey ${
              user?.user_name || "there"
            }, you have an unfinished questionnaire. Would you like to continue where you left off?`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        return;
      }
    };

    checkQuestionnaireStatus();
  }, [
    questionnaireManager,
    messages,
    user,
    checkQuestionnaireCompletionStatus,
  ]);

  // Fetch health data when component mounts
  useEffect(() => {
    fetchHealthData();
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

  const getLanguageName = (langCode: string) => {
    const languages = {
      en: "English",
      es: "Spanish",
      pt: "Portuguese",
      ht: "Haitian Creole",
    }
    return languages[langCode as keyof typeof languages] || "English"
  }

  const fetchHealthData = async () => {
    if (user && user.user_id) {
      try {
        // Use the specified endpoint format
        const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}`;
        console.log(`Making API call to: ${apiUrl}`);

        // Make the API call
        const response = await axios.get(apiUrl);
        const apiData = response.data.activities 



        // Process the data if we got a response
        if (
          apiData &&
          Array.isArray(apiData) &&
          apiData.length > 0
        ) {
          console.log(
            "API data found. First record:",
            JSON.stringify(apiData[0], null, 2)
          );

          // Sort by date (newest first)
          const sortedRecords = [...apiData].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );


          // Get the most recent record
          const latestRecord = sortedRecords[0];

          // Get the last 7 days of records for weekly stats
          const last7Days = sortedRecords.slice(0, 7);

          // Get the last 30 days of records for monthly stats
          const last30Days = sortedRecords.slice(0, 30);

          // Calculate sleep duration in hours for a record
          const calculateSleepDuration = (record: any) => {
            if (
              record.details &&
              record.details.sleep &&
              record.details.sleep.start &&
              record.details.sleep.end
            ) {
              const start = new Date(record.details.sleep.start);
              const end = new Date(record.details.sleep.end);
              return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert ms to hours
            }
            return 0;
          };

          // Create a new stats object to update state
          const newHealthStats = {
            water: {
              today: 0,
              weekly: 0,
              monthly: 0,
              avgWeekly: 0,
              avgMonthly: 0,
            },
            steps: {
              today: 0,
              weekly: 0,
              monthly: 0,
              avgWeekly: 0,
              avgMonthly: 0,
            },
            weight: {
              today: 0,
              weekly: 0,
              monthly: 0,
              avgWeekly: 0,
              avgMonthly: 0,
              unit: "kg",
            },
            heart: {
              today: 0,
              weekly: 0,
              monthly: 0,
              avgWeekly: 0,
              avgMonthly: 0,
            },
            sleep: {
              today: 0,
              weekly: 0,
              monthly: 0,
              avgWeekly: 0,
              avgMonthly: 0,
            },
          };

          // TODAY'S STATS
          newHealthStats.water.today = latestRecord.details?.water || 0;
          newHealthStats.steps.today = latestRecord.details?.steps || 0;
          newHealthStats.heart.today = latestRecord.details?.heart || 0;
          newHealthStats.sleep.today = calculateSleepDuration(latestRecord);
          if (latestRecord.details?.weight?.value) {
            newHealthStats.weight.today = latestRecord.details.weight.value;
            newHealthStats.weight.unit =
              latestRecord.details.weight.unit || "kg";
          }

          // WEEKLY STATS
          // Filter records with valid data for each metric
          const weeklyWaterRecords = last7Days.filter(
            (r) =>
              r.details &&
              typeof r.details.water === "number" &&
              r.details.water > 0
          );
          const weeklyStepsRecords = last7Days.filter(
            (r) =>
              r.details &&
              typeof r.details.steps === "number" &&
              r.details.steps > 0
          );
          const weeklyHeartRecords = last7Days.filter(
            (r) =>
              r.details &&
              typeof r.details.heart === "number" &&
              r.details.heart > 0
          );
          const weeklySleepRecords = last7Days.filter(
            (r) => calculateSleepDuration(r) > 0
          );
          const weeklyWeightRecords = last7Days.filter(
            (r) =>
              r.details &&
              r.details.weight &&
              typeof r.details.weight.value === "number" &&
              r.details.weight.value > 0
          );

          // Calculate totals
          newHealthStats.water.weekly = weeklyWaterRecords.reduce(
            (sum, r) => sum + r.details.water,
            0
          );
          newHealthStats.steps.weekly = weeklyStepsRecords.reduce(
            (sum, r) => sum + r.details.steps,
            0
          );
          newHealthStats.heart.weekly = weeklyHeartRecords.reduce(
            (sum, r) => sum + r.details.heart,
            0
          );
          newHealthStats.sleep.weekly = weeklySleepRecords.reduce(
            (sum, r) => sum + calculateSleepDuration(r),
            0
          );
          newHealthStats.weight.weekly = weeklyWeightRecords.reduce(
            (sum, r) => sum + r.details.weight.value,
            0
          );

          // Calculate averages
          newHealthStats.water.avgWeekly =
            weeklyWaterRecords.length > 0
              ? newHealthStats.water.weekly / weeklyWaterRecords.length
              : 0;
          newHealthStats.steps.avgWeekly =
            weeklyStepsRecords.length > 0
              ? newHealthStats.steps.weekly / weeklyStepsRecords.length
              : 0;
          newHealthStats.heart.avgWeekly =
            weeklyHeartRecords.length > 0
              ? newHealthStats.heart.weekly / weeklyHeartRecords.length
              : 0;
          newHealthStats.sleep.avgWeekly =
            weeklySleepRecords.length > 0
              ? newHealthStats.sleep.weekly / weeklySleepRecords.length
              : 0;
          newHealthStats.weight.avgWeekly =
            weeklyWeightRecords.length > 0
              ? newHealthStats.weight.weekly / weeklyWeightRecords.length
              : 0;

          // MONTHLY STATS
          // Filter records with valid data for each metric
          const monthlyWaterRecords = last30Days.filter(
            (r) =>
              r.details &&
              typeof r.details.water === "number" &&
              r.details.water > 0
          );
          const monthlyStepsRecords = last30Days.filter(
            (r) =>
              r.details &&
              typeof r.details.steps === "number" &&
              r.details.steps > 0
          );
          const monthlyHeartRecords = last30Days.filter(
            (r) =>
              r.details &&
              typeof r.details.heart === "number" &&
              r.details.heart > 0
          );
          const monthlySleepRecords = last30Days.filter(
            (r) => calculateSleepDuration(r) > 0
          );
          const monthlyWeightRecords = last30Days.filter(
            (r) =>
              r.details &&
              r.details.weight &&
              typeof r.details.weight.value === "number" &&
              r.details.weight.value > 0
          );

          // Calculate totals
          newHealthStats.water.monthly = monthlyWaterRecords.reduce(
            (sum, r) => sum + r.details.water,
            0
          );
          newHealthStats.steps.monthly = monthlyStepsRecords.reduce(
            (sum, r) => sum + r.details.steps,
            0
          );
          newHealthStats.heart.monthly = monthlyHeartRecords.reduce(
            (sum, r) => sum + r.details.heart,
            0
          );
          newHealthStats.sleep.monthly = monthlySleepRecords.reduce(
            (sum, r) => sum + calculateSleepDuration(r),
            0
          );
          newHealthStats.weight.monthly = monthlyWeightRecords.reduce(
            (sum, r) => sum + r.details.weight.value,
            0
          );

          // Calculate averages
          newHealthStats.water.avgMonthly =
            monthlyWaterRecords.length > 0
              ? newHealthStats.water.monthly / monthlyWaterRecords.length
              : 0;
          newHealthStats.steps.avgMonthly =
            monthlyStepsRecords.length > 0
              ? newHealthStats.steps.monthly / monthlyStepsRecords.length
              : 0;
          newHealthStats.heart.avgMonthly =
            monthlyHeartRecords.length > 0
              ? newHealthStats.heart.monthly / monthlyHeartRecords.length
              : 0;
          newHealthStats.sleep.avgMonthly =
            monthlySleepRecords.length > 0
              ? newHealthStats.sleep.monthly / monthlySleepRecords.length
              : 0;
          newHealthStats.weight.avgMonthly =
            monthlyWeightRecords.length > 0
              ? newHealthStats.weight.monthly / monthlyWeightRecords.length
              : 0;

          // Create health data object with safer property access (for backward compatibility)
          const newHealthData = {
            steps: {
              today: newHealthStats.steps.today,
              weekly: newHealthStats.steps.weekly,
            },
            water: {
              today: newHealthStats.water.today,
              weekly: newHealthStats.water.weekly,
            },
            weight: {
              current: latestRecord.details?.weight?.value || 0,
              unit: latestRecord.details?.weight?.unit || "kg",
              previous: 0,
            },
          };

          // Find previous weight record for backward compatibility
          const prevWeightRecord = sortedRecords.find(
            (r) =>
              r !== latestRecord &&
              r.details &&
              r.details.weight &&
              typeof r.details.weight.value === "number" &&
              r.details.weight.value > 0
          );

          if (
            prevWeightRecord &&
            prevWeightRecord.details &&
            prevWeightRecord.details.weight
          ) {
            newHealthData.weight.previous =
              prevWeightRecord.details.weight.value;
          }

          // Update state with the new health data
          setHealthStats(newHealthStats);
          setHealthData(newHealthData as any);
          console.log(
            "Health stats calculated successfully:",
            JSON.stringify(newHealthStats, null, 2)
          );
        } else {
          console.log("No valid data in API response");
        }
      } catch (error: any) {
        console.error("API call error:", error.message);
        if (error.response) {
          console.error("API error response status:", error.response.status);
          console.error(
            "API error response data:",
            JSON.stringify(error.response.data, null, 2)
          );
        }
      }
    } else {
      console.log("No user ID available");
    }
  };


const generateTranslation = async (text: string, targetLanguage: string) => {
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const apiKey = "AIzaSyD0ISmMWP4_yDqEvlrjpNJB8TnuJBkhZPs"; // Replace with your actual API key

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


  const sendToAPI = async (
    messageContent: string,
    messageType: "text" | "audio"
  ) => {
    try {
      // Correct Gemini API endpoint
      const apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      // Your API key should be stored in an environment variable in production
      const apiKey = "AIzaSyD0ISmMWP4_yDqEvlrjpNJB8TnuJBkhZPs"; // Replace with your actual API key

      // const currentLanguage = ;

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
      console.log('Response Text', responseText)
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

  // const speakResponse = (text: string) => {
  //   // This function would normally use text-to-speech
  //   // For now, we'll just log the response
  //   if (!isMuted) {
  //     console.log("Speaking response:", text)
  //     // Here you would normally call your text-to-speech implementation
  //   } else {
  //     console.log("Voice is muted, not speaking response")
  //   }
  // }

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [femaleVoice, setFemaleVoice] = useState<Speech.Voice | null>(null);
  const [localMuted, setLocalMuted] = useState(false)
  const effectiveMuted = isMuted !== undefined ? isMuted : localMuted

  useEffect(() => {
    return () => {
        // Cleanup speech when component unmounts
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        }
    };
}, [isSpeaking]);

  const speakResponse = (text: string) => {
      // Check if muted - if so, don't speak but still process
      if (effectiveMuted) {
        console.log("Voice is muted, not speaking response:", text)
        setIsProcessing(false)
        setIsSpeaking(false);
        return
      }
  
      // If speech is already happening, stop it before starting new speech
      if (isSpeaking) {
        Speech.stop();
        console.log("Speech interrupted.");
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
        },
        onStopped: () => {
          setIsSpeaking(false)
          setIsProcessing(false)
        },
        onError: (error) => {
          console.error("Speech error:", error)
          setIsSpeaking(false)
          setIsProcessing(false)
        },
      }
  
      // Add the voice if we found a female one
      if (femaleVoice) {
        speechOptions.voice = femaleVoice.identifier
      }
  
      // Start speaking the text
      Speech.speak(text, speechOptions)
  }

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

  // Function to detect log requests using our more advanced patterns
  function detectLogRequestWithPatterns(query: string) {
    
    // Check for water intake logs
    for (const pattern of LOG_PATTERNS.water) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const isGlasses = /glass|glasses|cup|cups/i.test(query);
        const isIncremental = isIncrementalRequest(query);

        return {
          type: "water",
          value,
          isGlasses,
          isIncremental,
        };
      }
    }

    // Check for weight logs
    for (const pattern of LOG_PATTERNS.weight) {
      const match = query.match(pattern);
      console.log("Testing pattern:", pattern, "Match:", match);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const unit = /\b(kg|kgs|kilograms)\b/i.test(query) ? "kg" : "lbs";
        console.log("Weight log detected:", { value, unit });
        return {
          type: "weight",
          value,
          unit,
        };
      }
    }

    // Check for steps logs
    for (const pattern of LOG_PATTERNS.steps) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: "steps",
          value,
        };
      }
    }

    // Check for heart rate logs
    for (const pattern of LOG_PATTERNS.heartRate) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: "heart",
          value,
        };
      }
    }

    // Check for sleep logs
    for (const pattern of LOG_PATTERNS.sleep) {
      const match = query.match(pattern);
      if (match && match[1] && match[2]) {
        // We need both start and end time
        return {
          type: "sleep",
          sleepStart: match[1],
          sleepEnd: match[2],
        };
      }
    }

    return null;
  }

  // Function to detect goal requests using our more advanced patterns
  function detectGoalRequestWithPatterns(query: string) {
    // Check for water intake goals
    for (const pattern of GOAL_PATTERNS.water) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const isGlasses = /glass|glasses|cup|cups/i.test(query);
        return {
          type: "water",
          value,
          isGlasses,
        };
      }
    }

    // Check for step goals
    for (const pattern of GOAL_PATTERNS.steps) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: "steps",
          value,
        };
      }
    }

    return null;
  }

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

  const detectAndHandleLogRequest = async (query: string, shouldSpeak: boolean) => {
    // First try pattern-based recognition
    const patternMatch = detectLogRequestWithPatterns(query);

    if (patternMatch) {
      let endpoint = "";
      let requestData = {};
      let successMessage = "";

      try {
        if (patternMatch.type === "water") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/water`;

          const waterValue = patternMatch.isGlasses
            ? patternMatch.value
            : Math.round((patternMatch.value ?? 0) / 250);

          const isIncrement = patternMatch.isIncremental || false;

          requestData = {
            water: waterValue,
            isIncrement: isIncrement,
          };

          const incrementText = isIncrement ? ` ${t('healthData.more')}` : "";
          successMessage = `${t('healthData.ive_logged')} ${
            patternMatch.isGlasses
              ? patternMatch.value + incrementText + ` ${t('healthData.glasses')}`
              : patternMatch.value + incrementText + "ml"
          } ${t('healthData.of_water_for_you')}`;

          console.log("Water logging request:", { waterValue, isIncrement });
        } else if (patternMatch.type === "weight") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/weight`;
          requestData = {
            weight: patternMatch.value,
            weight_unit: patternMatch.unit,
          };
          successMessage = `${t('healthData.logged_weight')} ${patternMatch.value} ${patternMatch.unit}.`;
        } else if (patternMatch.type === "steps") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { steps: patternMatch.value };
          successMessage = `${t('healthData.ive_logged')} ${patternMatch.value} ${t('healthData.steps_for_you')}`;
        } else if (patternMatch.type === "heart") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/heart`;
          requestData = { heartRate: patternMatch.value };
          successMessage = `${t('healthData.logged_heart_rate')} ${patternMatch.value} bpm.`;
        } else if (patternMatch.type === "sleep") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/sleep`;

          // Format times to ensure they have AM/PM
          const formatTime = (timeStr) => {
            let formattedTime = timeStr.trim();

            // Convert am/pm to uppercase AM/PM
            if (formattedTime.toLowerCase().endsWith("am")) {
              formattedTime = formattedTime.slice(0, -2) + "AM";
            } else if (formattedTime.toLowerCase().endsWith("pm")) {
              formattedTime = formattedTime.slice(0, -2) + "PM";
            }
            // Add AM/PM if missing
            else if (
              !formattedTime.toUpperCase().endsWith("AM") &&
              !formattedTime.toUpperCase().endsWith("PM")
            ) {
              const hour = parseInt(formattedTime.split(":")[0]);
              // Assume hours 7-11 are AM, 12 and 1-6 are PM, and others are AM
              if (hour >= 7 && hour <= 11) {
                formattedTime += " AM";
              } else {
                formattedTime += " PM";
              }
            }

            return formattedTime;
          };

          const sleepStart = formatTime(patternMatch.sleepStart);
          const sleepEnd = formatTime(patternMatch.sleepEnd);

          // Get today's date in ISO format (YYYY-MM-DD)
          const today = new Date().toISOString().split("T")[0];

          requestData = {
            date: today,
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
          };
          successMessage = `${t('healthData.logged_sleep_from')} ${sleepStart} ${t('healthData.to')} ${sleepEnd}.`;
        }


        // If we have valid data and an endpoint, make the API call
        if (endpoint) {
          console.log("Logging health metric:", { endpoint, requestData });

          const response = await axios.post(endpoint, requestData);

          if (response.status >= 200 && response.status < 300) {
            // Success - refresh health data
            await fetchHealthData();

            if(shouldSpeak){
              speakResponse(successMessage);
            }

            // Add response message
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: successMessage,
                isUser: false,
                timestamp: new Date(),
              },
            ]);

            return true;
          } else {
            throw new Error(`API returned status ${response.status}`);
          }
        }
      } catch (error) {
        console.error("Error logging health metric:", error);

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content:
              t('healthData.log_error'),
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }

      return true; // We had a pattern match, even if the API call failed
    }

    // If pattern matching failed, check if this is a log request with generic indicators
    const isLogRequest = /log|record|track|add|set|update/i.test(query);

    if (!isLogRequest) {
      return false; // Not a log request
    }

    // Determine what metric is being logged
    const isWaterLog = /water|hydration|glass|glasses|drink/i.test(query);
    const isWeightLog = /weight|weigh/i.test(query);
    const isStepsLog = /steps|walked|walking/i.test(query);
    const isHeartLog = /heart|pulse|bpm/i.test(query);
    const isSleepLog = /sleep|slept|bed time|bedtime|woke up/i.test(query);

    // Extract the metric
    let extractedData = null;
    let endpoint = "";
    let requestData = {};
    let successMessage = "";

    try {
      if (isWaterLog) {
        extractedData = extractMetricFromText(query, "water");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/water`;

          // If the user specified glasses, send that value directly
          // Otherwise, convert ml to glasses (assuming 250ml per glass)
          const waterValue = extractedData.isGlasses
            ? extractedData.value
            : Math.round(extractedData.value ?? 0 / 250);

          requestData = { water: waterValue };
          successMessage = `${t('healthData.ive_logged')} ${
            extractedData.isGlasses
              ? extractedData.value + ` ${t('healthData.glasses')}`
              : extractedData.value + "ml"
          } ${t('healthData.of_water_for_you')}`;
        }
      } else if (isWeightLog) {
        extractedData = extractMetricFromText(query, "weight");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/weight`;
          requestData = {
            weight: extractedData.value,
            weight_unit: extractedData.unit,
          };
          successMessage = `${t('healthData.logged_weight')} ${extractedData.value} ${extractedData.unit}.`;
        }
      } else if (isStepsLog) {
        extractedData = extractMetricFromText(query, "steps");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { steps: extractedData.value };
          successMessage = `${t('healthData.ive_logged')} ${extractedData.value} ${t('healthData.steps_for_you')}`;
        }
      } else if (isHeartLog) {
        extractedData = extractMetricFromText(query, "heart");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/heart`;
          requestData = { heartRate: extractedData.value };
          successMessage = `${t('healthData.logged_heart_rate')} ${extractedData.value} bpm.`;
        }
      } else if (isSleepLog) {
        extractedData = extractMetricFromText(query, "sleep");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/sleep`;

          // Format times to ensure they have AM/PM
          const formatTime = (timeStr: string) => {
            // Ensure time has AM/PM
            if (
              !timeStr.toLowerCase().includes("am") &&
              !timeStr.toLowerCase().includes("pm")
            ) {
              // Make assumption based on typical sleep patterns
              const hour = parseInt(timeStr.split(":")[0]);
              // Assume hours 7-11 are AM, 12 and 1-6 are PM, and after midnight is AM
              if (hour >= 7 && hour <= 11) {
                return timeStr + " AM";
              } else {
                return timeStr + " PM";
              }
            }
            return timeStr;
          };

          const sleepStart = formatTime(extractedData.sleepStart || "");
          const sleepEnd = formatTime(extractedData.sleepEnd || "");

          // Get today's date in ISO format (YYYY-MM-DD)
          const today = new Date().toISOString().split("T")[0];

          requestData = {
            date: today,
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
          };
          successMessage = `I've logged your sleep from ${sleepStart} to ${sleepEnd}.`;
        } else {
          // If we couldn't extract specific sleep times, provide guidance
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content:
               t('healthData.sleep_log_instruction'),
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          return true;
        }
      }

      // If we have valid data and an endpoint, make the API call
      if (extractedData && endpoint) {
        console.log("Logging health metric:", { endpoint, requestData });

        const response = await axios.post(endpoint, requestData);

        if (response.status >= 200 && response.status < 300) {
          // Success - refresh health data
          await fetchHealthData();

          // Add response message
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: successMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);

          return true;
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error logging health metric:", error);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content:
            "I'm sorry, I couldn't log that health information. Please try again or use the tracking screens.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      return true;
    }

    return false; // Not handled as a log request
  };

  const detectAndHandleGoalRequest = async (query: string, shouldSpeak: boolean) => {
    // First try pattern-based recognition
    const patternMatch = detectGoalRequestWithPatterns(query);

    if (patternMatch) {
      let endpoint = "";
      let requestData = {};
      let successMessage = "";

      try {
        if (patternMatch.type === "water") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterGoal`;

          const waterGoal = patternMatch.isGlasses
            ? patternMatch.value
            : Math.round(patternMatch.value / 250);

          requestData = { waterGoal: waterGoal };
          successMessage = `${t('healthData.water_goal_set')} ${waterGoal} ${t('healthData.glasses_per_day')}`;
        } else if (patternMatch.type === "steps") {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { stepsGoal: patternMatch.value };
          successMessage = `${t('healthData.steps_goal_set')} ${patternMatch.value} ${t('healthData.steps_per_day')}`;
        }

        // If we have valid data and an endpoint, make the API call
        if (endpoint) {
          console.log("Setting health goal:", { endpoint, requestData });

          const response = await axios.post(endpoint, requestData);

          if (response.status >= 200 && response.status < 300) {
            // Success - refresh health data
            await fetchHealthData();

            // Add response message
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: successMessage,
                isUser: false,
                timestamp: new Date(),
              },
            ]);

            return true;
          } else {
            throw new Error(`API returned status ${response.status}`);
          }
        }
      } catch (error) {
        console.error("Error setting health goal:", error);

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content:
             t('healthData.goal_set_error'),
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }

      return true; // We had a pattern match, even if the API call failed
    }

    // Check if this is a goal setting request with generic indicators
    const isGoalRequest = /goal|target|aim|set goal/i.test(query);

    if (!isGoalRequest) {
      return false; // Not a goal request
    }

    // Determine what type of goal is being set
    const isWaterGoal = /water|hydration|glass|glasses/i.test(query);
    const isStepsGoal = /steps|walking|step goal/i.test(query);

    // Extract the goal value
    let extractedData = null;
    let endpoint = "";
    let requestData = {};
    let successMessage = "";

    try {
      if (isWaterGoal) {
        extractedData = extractMetricFromText(query, "water");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterGoal`;

          // If the user specified glasses, use that value directly
          // Otherwise, convert ml to glasses (assuming 250ml per glass)
          const waterGoal = extractedData.isGlasses
            ? extractedData.value
            : Math.round((extractedData.value ?? 0) / 250);

          requestData = { waterGoal: waterGoal };
          successMessage = `${t('healthData.water_goal_set')} ${waterGoal} ${t('healthData.glasses_per_day')}`;
        }
      } else if (isStepsGoal) {
        extractedData = extractMetricFromText(query, "steps");

        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { stepsGoal: extractedData.value };
          successMessage = `${t('healthData.steps_goal_set')} ${extractedData.value} ${t('healthData.steps_per_day')}`;
        }
      }

      // If we have valid data and an endpoint, make the API call
      if (extractedData && endpoint) {
        console.log("Setting health goal:", { endpoint, requestData });

        const response = await axios.post(endpoint, requestData);

        if (response.status >= 200 && response.status < 300) {
          // Success - refresh health data
          await fetchHealthData();


          if(shouldSpeak){
            speakResponse(successMessage);
          }

          // Add response message
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: successMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);

          return true;
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error setting health goal:", error);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content:
            t('healthData.goal_set_error'),
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      return true;
    }

    return false; // Not handled as a goal request
  };



  const processUserQuery = async (query: string, shouldSpeak:boolean) => {
    try {
      console.log("processUserQuery started with:", query);
     
      console.log(shouldSpeak,"Should Speaking")

      // Check if this is a response to the "continue paused questionnaire" question
      if (messages.length > 0 && !messages[messages.length - 1].isUser) {
        // Look for specific continuation patterns
        const lastMessage = messages[messages.length - 1].content;

        // Check if the last message is asking about continuing
        const continuationPrompts = [
          /continue this conversation/i,
          /continue where you left off/i,
          /unfinished questionnaire/i,
          /we can continue/i,
          /ready. Just let me know/i,
          /would you like to continue/i,
        ];

        const isContinuationPrompt = continuationPrompts.some((pattern) =>
          pattern.test(lastMessage)
        );

        if (isContinuationPrompt) {
          console.log("Detected continuation prompt response");

          // Check for positive responses
          const positiveResponses = [
            /^yes$/i,
            /^yeah$/i,
            /^sure$/i,
            /^ok$/i,
            /^okay$/i,
            /^continue$/i,
            /^let's continue$/i,
            /^ready$/i,
            /^resume$/i,
            /^let's go$/i,
            /^go$/i,
          ];

          if (positiveResponses.some((pattern) => pattern.test(query.trim()))) {
            console.log("User wants to resume questionnaire");

            // Add user's message to the chat
            const userMessage: Message = {
              id: Date.now().toString(),
              type: "text",
              content: query,
              isUser: true,
              timestamp: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, userMessage]);

            // Add a single confirmation message
            const confirmationMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: "Great! Let's pick up where we left off.",
              isUser: false,
              timestamp: new Date(),
            };
            setMessages((prevMessages) => [
              ...prevMessages,
              confirmationMessage,
            ]);

            // Use a slight delay before resuming
            setTimeout(() => {
              questionnaireManager.resumeQuestionnaire();
            }, 800);

            setIsProcessing(false);
            return;
          }
        }
      }

      // First check if this is a questionnaire response
      if (questionnaireManager.isActive) {
        const wasHandledAsQuestionnaireResponse =
          questionnaireManager.handleUserResponse(query);
        if (wasHandledAsQuestionnaireResponse) {
          setIsProcessing(false);
          return;
        }
      }

      // Check if this is a request to start the questionnaire
      if (
        /start questionnaire|begin questionnaire|take questionnaire|health assessment|assessment/i.test(
          query
        )
      ) {
        questionnaireManager.startQuestionnaire();
        setIsProcessing(false);
        return;
      }

       // First check if this is a log request
      const wasHandledAsLogRequest = await detectAndHandleLogRequest(query, shouldSpeak);

      if (wasHandledAsLogRequest) {
        setIsProcessing(false);
        return;
      }

      // Then check if this is a goal setting request
      const wasHandledAsGoalRequest = await detectAndHandleGoalRequest(query, shouldSpeak);

      if (wasHandledAsGoalRequest) {
        setIsProcessing(false);
        return;
      }

      // Check for different types of health stat queries
      const isWaterQuery = /water|hydration/i.test(query);
      const isWeightQuery = /weight/i.test(query);
      const isStepsQuery = /steps|step count|walking/i.test(query);
      const isHeartQuery = /heart|pulse|bpm/i.test(query);
      const isSleepQuery = /sleep|slept/i.test(query);

      // Check for time period queries
      const isAverageQuery = /average|avg/i.test(query);
      const isTodayQuery = /today|current/i.test(query);
      const isWeeklyQuery = /week|weekly|7 days/i.test(query);
      const isMonthlyQuery = /month|monthly|30 days/i.test(query);

      // Check for comprehensive stats query
      const isComprehensiveQuery =
        /all stats|all metrics|health summary|overview|Show my health stats/i.test(query) ||
        (/avg|average/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) weight/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) sleep/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) heart/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) water/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) steps/i.test(query) &&
          !/sleep duration/i.test(query));

      console.log("Query analysis:", {
        isWaterQuery,
        isWeightQuery,
        isStepsQuery,
        isHeartQuery,
        isSleepQuery,
        isAverageQuery,
        isTodayQuery,
        isWeeklyQuery,
        isMonthlyQuery,
        isComprehensiveQuery,
      });

      // Handle comprehensive health stats query
      if (isComprehensiveQuery) {
        console.log("Detected comprehensive health stats query");

        // Format a comprehensive health stats response
        let statsMessage = `${t('healthData.statsMessage')}:\n\n`;

        // Determine time period to report
        let reportPeriod = "weekly"; // Default to weekly
        if (isTodayQuery) reportPeriod = "today";
        if (isMonthlyQuery) reportPeriod = "monthly";

        // Water stats
        if (reportPeriod === "today") {
          statsMessage += `${t('water')}: ${healthStats.water.today} ${t('healthData.glasses')} ${t('healthData.today')}\n`;
        } else if (reportPeriod === "weekly") {
          statsMessage += `${t('water')}: ${healthStats.water.avgWeekly.toFixed(
            1
          )} ${t('healthData.glasses_per_day_weekly_avg')}\n`;
        } else {
          statsMessage += `${t('water')}: ${healthStats.water.avgMonthly.toFixed(
            1
          )} ${t('healthData.glasses_per_day_monthly_avg')}\n`;
        }

        // Steps stats
        if (reportPeriod === "today") {
          statsMessage += `${t('steps')}: ${healthStats.steps.today} ${t('healthData.steps_today')}\n`;
        } else if (reportPeriod === "weekly") {
          statsMessage += `${t('steps')}: ${healthStats.steps.avgWeekly.toFixed(
            0
          )} ${t('healthData.steps_per_day_weekly_avg')}\n`;
        } else {
          statsMessage += `${t('steps')}: ${healthStats.steps.avgMonthly.toFixed(
            0
          )} ${t('healthData.steps_per_day_monthly_avg')}\n`;
        }

        // Weight stats
        if (healthStats.weight.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `${t('weight')}: ${healthStats.weight.today} ${healthStats.weight.unit} ${t('healthData.steps_today')}\n`;
          } else if (reportPeriod === "weekly") {
            statsMessage += `${t('weight')}: ${healthStats.weight.avgWeekly.toFixed(
              1
            )} ${healthStats.weight.unit} ${t('healthData.weekly_average')}\n`;
          } else {
            statsMessage += `${t('weight')}: ${healthStats.weight.avgMonthly.toFixed(
              1
            )} ${healthStats.weight.unit} ${t('healthData.monthly_average')}\n`;
          }
        }

        // Heart rate stats
        if (healthStats.heart.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.today} ${t('healthData.bpm_today')}\n`;
          } else if (reportPeriod === "weekly") {
            statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.avgWeekly.toFixed(
              0
            )} ${t('healthData.bpm_weekly_avg')}\n`;
          } else {
            statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.avgMonthly.toFixed(
              0
            )} ${t('healthData.bpm_monthly_avg')}\n`;
          }
        }

        // Sleep stats
        if (healthStats.sleep.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `${t('sleep')}: ${healthStats.sleep.today.toFixed(
              1
            )} ${t('healthData.hours_today')}\n`;
          } else if (reportPeriod === "weekly") {
            statsMessage += `${t('sleep')}: ${healthStats.sleep.avgWeekly.toFixed(
              1
            )} ${t('healthData.hours_per_night_weekly_avg')}\n`;
          } else {
            statsMessage += `${t('sleep')}: ${healthStats.sleep.avgMonthly.toFixed(
              1
            )} ${t('healthData.hours_per_night_monthly_avg')}\n`;
          }
        }

        // Add a note if some metrics are missing
        if (
          healthStats.heart.avgWeekly === 0 ||
          healthStats.sleep.avgWeekly === 0
        ) {
          statsMessage +=
            `\n${t('healthData.message')}`;
        }

        // Speak the response
        if(shouldSpeak){
          speakResponse(statsMessage);
        }

        // Add the response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: statsMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        setIsProcessing(false);
        return; // Exit early since we've handled this specific query
      }

      // Handle specific metric queries
      if (isWaterQuery) {
        let waterMessage = "";

        if (isTodayQuery) {
          waterMessage = `${t('healthData.youve_consumed')} ${healthStats.water.today} ${t('healthData.glasses_of_water_today')}`;
        } else if (isWeeklyQuery || isAverageQuery) {
          waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgWeekly.toFixed(
            1
          )} ${t('healthData.glasses_per_day_week')} ${
            healthStats.water.weekly
          } ${t('healthData.glasses')}.`;
        } else if (isMonthlyQuery) {
          waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgMonthly.toFixed(
            1
          )}  ${t('healthData.glasses_per_day_month')} ${
            healthStats.water.monthly
          } ${t('healthData.glasses')}.`;
        } else {
          // Default to weekly if no time period specified
          waterMessage = ` ${t('healthData.average_water_consumption')} ${healthStats.water.avgWeekly.toFixed(
            1
          )}  ${t('healthData.glasses_per_day_week_today')} ${
            healthStats.water.today
          }  ${t('healthData.glasses')}.`;
        }

        waterMessage += `${t('healthData.hydration_reminder')}`;
        // Speak the response
        if(shouldSpeak){
          speakResponse(waterMessage);
        }

        // Add the response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: waterMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        setIsProcessing(false);
        return;
      }

      if (
        isWeightQuery &&
        /^what('s| is) (my |the )?(avg|average) weight/i.test(query)
      ) {
        if (
          healthStats.weight.avgWeekly === 0 &&
          healthStats.weight.today === 0
        ) {
          const noDataMessage =
            `${t('healthData.no_weight_data')}`;
            if(shouldSpeak){
              speakResponse(noDataMessage);
            }

          // Add the response to messages
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: noDataMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);

          setIsProcessing(false);
          return;
        }

        let weightMessage = "";

        if (isMonthlyQuery) {
          weightMessage = `${t('healthData.average_weight')} ${healthStats.weight.avgMonthly.toFixed(
            1
          )} ${healthStats.weight.unit} ${t('healthData.over_past_month')}`;
        } else {
          // Default to weekly average for "what is avg weight" queries
          weightMessage = `${t('healthData.average_weight')} ${healthStats.weight.avgWeekly.toFixed(
            1
          )} ${healthStats.weight.unit} ${t('healthData.over_past_week')}`;
        }

        if(shouldSpeak){
          speakResponse(weightMessage);
        }

        // Add the response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: weightMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        setIsProcessing(false);
        return;
      }

      // Steps queries
      if (isStepsQuery) {
        let stepsMessage = "";

        if (isTodayQuery) {
          stepsMessage = `${t('healthData.youve_taken')} ${healthStats.steps.today} ${t('healthData.steps_today1')}`;
        } else if (isWeeklyQuery || isAverageQuery) {
          stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgWeekly.toFixed(
            0
          )} ${t('healthData.steps_past_week')} ${
            healthStats.steps.weekly
          }.`;
        } else if (isMonthlyQuery) {
          stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgMonthly.toFixed(
            0
          )} ${t('healthData.steps_past_month')} ${
            healthStats.steps.monthly
          }.`;
        } else {
          // Default to weekly if no time period specified
          stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgWeekly.toFixed(
            0
          )} ${t('healthData.steps_week_today')} ${
            healthStats.steps.today
          } ${t('steps')}`;
        }

        stepsMessage +=
          ` ${t('healthData.walking_encouragement')}`;

          if(shouldSpeak){
            speakResponse(stepsMessage);
          }


        // Add the response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: stepsMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        setIsProcessing(false);
        return;
      }

      // Heart rate queries
      if (isHeartQuery) {
        if (
          healthStats.heart.avgWeekly === 0 &&
          healthStats.heart.today === 0
        ) {
          const noDataMessage =
            `${t('healthData.no_heart_data')}`;
            if(shouldSpeak){
              speakResponse(noDataMessage);
            }

          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: noDataMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);

          setIsProcessing(false);
          return;
        }

        let heartMessage = "";

        if (isTodayQuery) {
          heartMessage = `${t('healthData.heart_rate_today')} ${healthStats.heart.today} bpm.`;
        } else if (isWeeklyQuery || isAverageQuery) {
          heartMessage = `${t('healthData.average_heart_rate')} ${healthStats.heart.avgWeekly.toFixed(
            0
          )} bpm ${t('healthData.over_past_week')}`;
        } else if (isMonthlyQuery) {
          heartMessage = `${t('healthData.average_heart_rate')} ${healthStats.heart.avgMonthly.toFixed(
            0
          )} bpm ${t('healthData.over_past_month')}`;
        } else {
          heartMessage = `${t('healthData.current_heart_rate')} ${
            healthStats.heart.today
          } bpm, ${t('healthData.and_weekly_average_is')} ${healthStats.heart.avgWeekly.toFixed(
            0
          )} bpm.`;
        }

        if(shouldSpeak){
          speakResponse(heartMessage);
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: heartMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        setIsProcessing(false);
        return;
      }

      // New function to call the RAG service
      const callRagService = async (query: string, conversationHistory: any[] = []) => {
        try {
          // Replace with your actual Render URL once deployed
          const RAG_SERVICE_URL = "https://crosscare-rag.onrender.com/api/chat";
          
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
          return null;
        }
      };
      

      // After checking for health-specific queries (like isWaterQuery, isStepsQuery etc.)
      // Format conversation history for RAG
      const recentMessages = messages
      .slice(-6) // Last 6 messages for context
      .filter(msg => msg.type === "text") // Only text messages
      .map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }));

    // Try to use RAG service first
    try {
        const ragResponse = await callRagService(query, recentMessages);
      
      if (ragResponse && ragResponse.success) {
        // Use the response from RAG service
        const assistantMessage = ragResponse.response;

        // console.log(`Generating translation to ${currentLanguage}`);
        // assistantMessage = await generateTranslation(assistantMessage, currentLanguage);

        console.log('Akks', assistantMessage);
          if (shouldSpeak) {
               setIsProcessing(true);
           speakResponse(assistantMessage);
        }


        // Add the response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: assistantMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Fall back to Gemini if RAG fails
        console.log("RAG service failed, falling back to Gemini");
        const apiResponse = await sendToAPI(query, "text");

        if (apiResponse) {
          const assistantMessage = apiResponse.response;
        

          // const translationResult = await generateTranslation(assistantMessage, currentLanguage);
          //   const translatedText = translationResult.response;
          //   console.log(translatedText);
          
            if (shouldSpeak) {
                 setIsProcessing(true);
                  speakResponse(assistantMessage);
            }

          // Add the response to messages
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: assistantMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error with RAG service, falling back to Gemini:", error);
      // Fall back to Gemini API
      const apiResponse = await sendToAPI(query, "text");
      
      if (apiResponse) {
        const assistantMessage = apiResponse.response;

      //       const translationResult = await generateTranslation(assistantMessage, currentLanguage);
      // const translatedText = translationResult.response;
      // console.log(translatedText);

          if (shouldSpeak) {
               setIsProcessing(true);
           speakResponse(assistantMessage);
        }



        // Add the response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: assistantMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
      
    }
    setIsProcessing(false);

    } catch (error: any) {
      console.error("Error in processUserQuery:", error.message);
      console.error("Error stack:", error.stack);
      if (shouldSpeak) {
      setIsProcessing(false);
    }
      Alert.alert(
        "Error",
        "I couldn't process your request. Please try again."
      );
    }
     finally {
    // Only reset isProcessing if it was a voice input
    if (shouldSpeak) {
      setIsProcessing(false);
    }
  }
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

      Speech.stop();

      // Update messages state with the new message
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages as Message[]);
      setInputText("");
      setIsTyping(true);
      setIsAssistantResponding(true);

      // Process the query - our new implementation will check for log/goal requests first
      await processUserQuery(messageContent, false);
      setIsTyping(false);
      setIsAssistantResponding(false);
    }
  };

  const handleAudioSent = async (
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
      setIsSpeaking(true);

      // await processUserQuery(transcript);

      // Get the translation result
      // const translationResult = await generateTranslation(transcript, currentLanguage);
      // const translatedText = translationResult.response;
      // console.log(translatedText);

      // Process the translated text
       try {
             const processedTranscript = wordsToNumbers(transcript);
      console.log("Processed transcript:", processedTranscript);

       const translationResult = await generateTranslation(processedTranscript, 'en');
      const translatedText = translationResult.response;

      // Pass the processed transcript to processUserQuery
      await processUserQuery(translatedText, true);
        } finally {
            setIsTyping(false);
            setIsAssistantResponding(false);
        }
    }

      if(assistantResponse){
          speakResponse(assistantResponse);
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
      await AsyncStorage.removeItem(`questionnaire_completed_${user?.user_id}`);
      await AsyncStorage.removeItem(`questionnaire_state_${user?.user_id}`);
      await AsyncStorage.removeItem(`intro_shown_${user?.user_id}`);

      console.log("Chat history cleared successfully");

      // Show confirmation to the user with option to start questionnaire
      Alert.alert(
        t('askDoula.title1'),
        t('askDoula.message'),
        [
          {
            text: t('askDoula.yes'),
            onPress: () => {
              // Start the questionnaire
              questionnaireManager.startQuestionnaire();
            },
          },
          { text: t('askDoula.no') },
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

  // Function to load messages from AsyncStorage
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
                      {!message.isUser && (
                        <TouchableOpacity style={styles.bubbleMuteButton} onPress={toggleMute}>
                          <Ionicons name={isMuted ? "volume-mute" : "volume-medium"} size={16} color="#E162BC" />
                        </TouchableOpacity>
                      )}
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
    boxShadow:
      "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
