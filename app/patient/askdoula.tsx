import { useEffect, useRef, useState } from "react"
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
import { router } from "expo-router"
import VoiceRecorder from "@/components/VoiceRecorder"
import AudioMessage from "@/components/AudioMessage"
import { useSelector } from "react-redux"
import axios from "axios"
import { systemPrompts } from '@/constants/systemPrompts';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string
  isUser: boolean
  timestamp: Date
  type: "text" | "audio"
  content: string // text content or audio URI
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
    /(?:i\s+)?(?:just|now|recently)\s+(?:drank|had|took|consumed)\s+(?:another|an additional|an extra)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i
  ],
  weight: [
    /(?:log|record|track|add|weigh|measure).*?(\d+(?:\.\d+)?).*?(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?).*?weight/i,
    /my weight (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
    /(?:i\s+)?(?:weigh|am|measure)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?)/i
  ],
  steps: [
    /(?:log|record|track|add|walk|measure).*?(\d+(?:\.\d+)?).*?(?:steps?|walked)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+steps/i,
    /(?:my steps?|my step count) (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)/i,
    /(?:i\s+)?(?:walked|did|took)\s+(\d+(?:\.\d+)?)\s+steps/i
  ],
  heartRate: [
    /(?:log|record|track|add|measured).*?(\d+(?:\.\d+)?).*?(?:bpm|beats per minute|heart rate|pulse)/i,
    /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:bpm|beats per minute).*?(?:heart|pulse)/i,
    /my (?:heart rate|pulse) (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)/i,
    /(?:i\s+)?(?:have|had|measured)\s+(?:a\s+)?(?:heart rate|pulse|HR) of\s+(\d+(?:\.\d+)?)/i
  ],
  sleep: [
    /(?:log|record|track|add).*?sleep.*?from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /(?:i\s+)?(?:slept|sleep).*?from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /(?:i\s+)?(?:went to bed|fell asleep).*?(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?(?:woke up|got up).*?(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    /my sleep (?:yesterday|last night) was from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i
  ]
};

const GOAL_PATTERNS = {
  water: [
    /(?:set|update|change).*?(?:water|hydration).*?goal.*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:goal|target) (?:is|to drink|for|of).*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:want|aim|going) to drink\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /my water goal (?:is|should be)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i
  ],
  steps: [
    /(?:set|update|change).*?(?:steps?).*?goal.*?(\d+(?:\.\d+)?).*?(?:steps?)/i,
    /(?:step goal|step target|walking goal|walking target) (?:is|to reach|for|of).*?(\d+(?:\.\d+)?).*?(?:steps?)/i,
    /(?:want|aim|going) to (?:walk|reach|do)\s+(\d+(?:\.\d+)?)\s+steps/i,
    /my step goal (?:is|should be)\s+(\d+(?:\.\d+)?)/i
  ]
};

// Function to check if the request is for an incremental update
function isIncrementalRequest(query: string) {
  const incrementalPatterns = [
    /(?:more|additional|extra|another)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    /(?:increase|increment|add to|on top of)/i
  ];
  
  return incrementalPatterns.some(pattern => pattern.test(query));
}

export default function askdoula() {
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const user = useSelector((state: any) => state.user)
  const [healthData, setHealthData] = useState(null)
  const [healthStats, setHealthStats] = useState({
    water: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
    steps: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
    weight: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0, unit: "kg" },
    heart: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
    sleep: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
  })

  const [isAssistantResponding, setIsAssistantResponding] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const scrollViewRef = useRef<ScrollView>(null)
  const loadingAnimation = useRef(new Animated.Value(0)).current

  // Fetch health data when component mounts
  useEffect(() => {
    fetchHealthData()
  }, [])

  // Auto-scroll to bottom when messages change or when typing indicator appears
  useEffect(() => {
    if (scrollViewRef.current && (messages.length > 0 || isTyping)) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages, isTyping])

  // Animate the typing indicator
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

  const systemPrompt = `${systemPrompts}`

  const fetchHealthData = async () => {
    if (user && user.user_id) {
      try {
        // Use the specified endpoint format
        const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}`
        console.log(`Making API call to: ${apiUrl}`)

        // Make the API call
        const response = await axios.get(apiUrl)

        // Process the data if we got a response
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log("API data found. First record:", JSON.stringify(response.data[0], null, 2))

          // Sort by date (newest first)
          const sortedRecords = [...response.data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )

          // Get the most recent record
          const latestRecord = sortedRecords[0]

          // Get the last 7 days of records for weekly stats
          const last7Days = sortedRecords.slice(0, 7)

          // Get the last 30 days of records for monthly stats
          const last30Days = sortedRecords.slice(0, 30)

          // Calculate sleep duration in hours for a record
          const calculateSleepDuration = (record: any) => {
            if (record.details && record.details.sleep && record.details.sleep.start && record.details.sleep.end) {
              const start = new Date(record.details.sleep.start)
              const end = new Date(record.details.sleep.end)
              return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert ms to hours
            }
            return 0
          }

          // Create a new stats object to update state
          const newHealthStats = {
            water: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
            steps: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
            weight: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0, unit: "kg" },
            heart: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
            sleep: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
          }

          // TODAY'S STATS
          newHealthStats.water.today = latestRecord.details?.water || 0
          newHealthStats.steps.today = latestRecord.details?.steps || 0
          newHealthStats.heart.today = latestRecord.details?.heart || 0
          newHealthStats.sleep.today = calculateSleepDuration(latestRecord)
          if (latestRecord.details?.weight?.value) {
            newHealthStats.weight.today = latestRecord.details.weight.value
            newHealthStats.weight.unit = latestRecord.details.weight.unit || "kg"
          }

          // WEEKLY STATS
          // Filter records with valid data for each metric
          const weeklyWaterRecords = last7Days.filter(
            (r) => r.details && typeof r.details.water === "number" && r.details.water > 0,
          )
          const weeklyStepsRecords = last7Days.filter(
            (r) => r.details && typeof r.details.steps === "number" && r.details.steps > 0,
          )
          const weeklyHeartRecords = last7Days.filter(
            (r) => r.details && typeof r.details.heart === "number" && r.details.heart > 0,
          )
          const weeklySleepRecords = last7Days.filter((r) => calculateSleepDuration(r) > 0)
          const weeklyWeightRecords = last7Days.filter(
            (r) =>
              r.details && r.details.weight && typeof r.details.weight.value === "number" && r.details.weight.value > 0,
          )

          // Calculate totals
          newHealthStats.water.weekly = weeklyWaterRecords.reduce((sum, r) => sum + r.details.water, 0)
          newHealthStats.steps.weekly = weeklyStepsRecords.reduce((sum, r) => sum + r.details.steps, 0)
          newHealthStats.heart.weekly = weeklyHeartRecords.reduce((sum, r) => sum + r.details.heart, 0)
          newHealthStats.sleep.weekly = weeklySleepRecords.reduce((sum, r) => sum + calculateSleepDuration(r), 0)
          newHealthStats.weight.weekly = weeklyWeightRecords.reduce((sum, r) => sum + r.details.weight.value, 0)

          // Calculate averages
          newHealthStats.water.avgWeekly =
            weeklyWaterRecords.length > 0 ? newHealthStats.water.weekly / weeklyWaterRecords.length : 0
          newHealthStats.steps.avgWeekly =
            weeklyStepsRecords.length > 0 ? newHealthStats.steps.weekly / weeklyStepsRecords.length : 0
          newHealthStats.heart.avgWeekly =
            weeklyHeartRecords.length > 0 ? newHealthStats.heart.weekly / weeklyHeartRecords.length : 0
          newHealthStats.sleep.avgWeekly =
            weeklySleepRecords.length > 0 ? newHealthStats.sleep.weekly / weeklySleepRecords.length : 0
          newHealthStats.weight.avgWeekly =
            weeklyWeightRecords.length > 0 ? newHealthStats.weight.weekly / weeklyWeightRecords.length : 0

          // MONTHLY STATS
          // Filter records with valid data for each metric
          const monthlyWaterRecords = last30Days.filter(
            (r) => r.details && typeof r.details.water === "number" && r.details.water > 0,
          )
          const monthlyStepsRecords = last30Days.filter(
            (r) => r.details && typeof r.details.steps === "number" && r.details.steps > 0,
          )
          const monthlyHeartRecords = last30Days.filter(
            (r) => r.details && typeof r.details.heart === "number" && r.details.heart > 0,
          )
          const monthlySleepRecords = last30Days.filter((r) => calculateSleepDuration(r) > 0)
          const monthlyWeightRecords = last30Days.filter(
            (r) =>
              r.details && r.details.weight && typeof r.details.weight.value === "number" && r.details.weight.value > 0,
          )

          // Calculate totals
          newHealthStats.water.monthly = monthlyWaterRecords.reduce((sum, r) => sum + r.details.water, 0)
          newHealthStats.steps.monthly = monthlyStepsRecords.reduce((sum, r) => sum + r.details.steps, 0)
          newHealthStats.heart.monthly = monthlyHeartRecords.reduce((sum, r) => sum + r.details.heart, 0)
          newHealthStats.sleep.monthly = monthlySleepRecords.reduce((sum, r) => sum + calculateSleepDuration(r), 0)
          newHealthStats.weight.monthly = monthlyWeightRecords.reduce((sum, r) => sum + r.details.weight.value, 0)

          // Calculate averages
          newHealthStats.water.avgMonthly =
            monthlyWaterRecords.length > 0 ? newHealthStats.water.monthly / monthlyWaterRecords.length : 0
          newHealthStats.steps.avgMonthly =
            monthlyStepsRecords.length > 0 ? newHealthStats.steps.monthly / monthlyStepsRecords.length : 0
          newHealthStats.heart.avgMonthly =
            monthlyHeartRecords.length > 0 ? newHealthStats.heart.monthly / monthlyHeartRecords.length : 0
          newHealthStats.sleep.avgMonthly =
            monthlySleepRecords.length > 0 ? newHealthStats.sleep.monthly / monthlySleepRecords.length : 0
          newHealthStats.weight.avgMonthly =
            monthlyWeightRecords.length > 0 ? newHealthStats.weight.monthly / monthlyWeightRecords.length : 0

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
          }

          // Find previous weight record for backward compatibility
          const prevWeightRecord = sortedRecords.find(
            (r) =>
              r !== latestRecord &&
              r.details &&
              r.details.weight &&
              typeof r.details.weight.value === "number" &&
              r.details.weight.value > 0,
          )

          if (prevWeightRecord && prevWeightRecord.details && prevWeightRecord.details.weight) {
            newHealthData.weight.previous = prevWeightRecord.details.weight.value
          }

          // Update state with the new health data
          setHealthStats(newHealthStats)
          setHealthData(newHealthData as any)
          console.log("Health stats calculated successfully:", JSON.stringify(newHealthStats, null, 2))
        } else {
          console.log("No valid data in API response")
        }
      } catch (error: any) {
        console.error("API call error:", error.message)
        if (error.response) {
          console.error("API error response status:", error.response.status)
          console.error("API error response data:", JSON.stringify(error.response.data, null, 2))
        }
      }
    } else {
      console.log("No user ID available")
    }
  }

  const sendToAPI = async (messageContent: string, messageType: "text" | "audio") => {
    try {
      // Correct Gemini API endpoint
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

      // Your API key should be stored in an environment variable in production
      const apiKey = "AIzaSyD0ISmMWP4_yDqEvlrjpNJB8TnuJBkhZPs" // Replace with your actual API key

      // Create enhanced prompt with health data if available
      let enhancedPrompt = systemPrompt

      if (healthData) {
        enhancedPrompt += `\n\nUser's health data:\n`

        if (healthStats.steps) {
          enhancedPrompt += `- Steps: Today: ${healthStats.steps.today}, Weekly average: ${healthStats.steps.avgWeekly.toFixed(0)}, Monthly average: ${healthStats.steps.avgMonthly.toFixed(0)}\n`
        }

        if (healthStats.water) {
          enhancedPrompt += `- Water: Today: ${healthStats.water.today} glasses, Weekly average: ${healthStats.water.avgWeekly.toFixed(1)} glasses, Monthly average: ${healthStats.water.avgMonthly.toFixed(1)} glasses\n`
        }

        if (healthStats.weight && healthStats.weight.avgWeekly > 0) {
          enhancedPrompt += `- Weight: Current: ${healthStats.weight.today} ${healthStats.weight.unit}, Weekly average: ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit}, Monthly average: ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit}\n`
        }

        if (healthStats.heart && healthStats.heart.avgWeekly > 0) {
          enhancedPrompt += `- Heart rate: Current: ${healthStats.heart.today} bpm, Weekly average: ${healthStats.heart.avgWeekly.toFixed(0)} bpm, Monthly average: ${healthStats.heart.avgMonthly.toFixed(0)} bpm\n`
        }

        if (healthStats.sleep && healthStats.sleep.avgWeekly > 0) {
          enhancedPrompt += `- Sleep: Last night: ${healthStats.sleep.today.toFixed(1)} hours, Weekly average: ${healthStats.sleep.avgWeekly.toFixed(1)} hours, Monthly average: ${healthStats.sleep.avgMonthly.toFixed(1)} hours\n`
        }

        enhancedPrompt += `\nPlease answer the user's question about their health metrics using this data. Be specific and encouraging.`
      }

      // Create the parts array with the system prompt
      const parts = [
        {
          text: enhancedPrompt,
        }
      ];

      // Add conversation history - limit to last 10 messages to avoid token limits
      const recentMessages = messages.slice(-20);
      
      for (const msg of recentMessages) {
        // Skip audio messages as they don't have text content we can send
        if (msg.type === "text") {
          parts.push({
            text: msg.isUser ? `User: ${msg.content}` : `Assistant: ${msg.content}`
          });
        }
      }

      // Add the current message
      parts.push({
        text: `User: ${messageContent}`
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
      }

      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process your request at this time."

      return {
        response: responseText,
      }
    } catch (error) {
      console.error("Error sending message to Gemini API:", error)
      return {
        response: "I'm having trouble connecting right now. Please try again later.",
      }
    }
  }

  const speakResponse = (text: string) => {
    // This function would normally use text-to-speech
    // For now, we'll just log the response
    console.log("Speaking response:", text)
  }

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
          type: 'water',
          value,
          isGlasses,
          isIncremental
        };
      }
    }
    
    // Check for weight logs
    for (const pattern of LOG_PATTERNS.weight) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const unit = /\b(kg|kgs|kilograms)\b/i.test(query) ? "kg" : "lbs";
        return {
          type: 'weight',
          value,
          unit
        };
      }
    }
    
    // Check for steps logs
    for (const pattern of LOG_PATTERNS.steps) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: 'steps',
          value
        };
      }
    }
    
    // Check for heart rate logs
    for (const pattern of LOG_PATTERNS.heartRate) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: 'heart',
          value
        };
      }
    }
    
    // Check for sleep logs
    for (const pattern of LOG_PATTERNS.sleep) {
      const match = query.match(pattern);
      if (match && match[1] && match[2]) {
        // We need both start and end time
        return {
          type: 'sleep',
          sleepStart: match[1],
          sleepEnd: match[2]
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
          type: 'water',
          value,
          isGlasses
        };
      }
    }
    
    // Check for step goals
    for (const pattern of GOAL_PATTERNS.steps) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: 'steps',
          value
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
      case 'weight':
        // Find unit - kg or lbs
        const unit = /\b(kg|kgs|kilograms|lbs|pounds)\b/i.test(text) 
          ? (text.match(/\b(kg|kgs|kilograms)\b/i) ? "kg" : "lbs")
          : "kg"; // Default to kg
        
        return {
          value: parseFloat(numbers[0]),
          unit: unit
        };
        
      case 'water':
        // Find if talking about glasses or ml
        const isGlasses = /\b(glass|glasses|cup|cups)\b/i.test(text);
        return {
          value: parseFloat(numbers[0]),
          isGlasses: isGlasses
        };
        
      case 'steps':
        return {
          value: parseInt(numbers[0], 10)
        };
        
      case 'heart':
        return {
          value: parseInt(numbers[0], 10)
        };
        
      case 'sleep':
        // Extract sleep start and end times
        // Look for patterns like "from 10:30 pm to 6:45 am" or "10pm to 6am"
        const sleepPattern = /(?:from|at)?\s*(\d+(?::\d+)?\s*(?:am|pm)?).*?(?:to|until|till)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i;
        const sleepMatch = text.match(sleepPattern);
        
        if (sleepMatch && sleepMatch[1] && sleepMatch[2]) {
          return {
            sleepStart: sleepMatch[1].trim(),
            sleepEnd: sleepMatch[2].trim()
          };
        }
        return null;
        
      default:
        return {
          value: parseFloat(numbers[0])
        };
    }
  };

  const detectAndHandleLogRequest = async (query: string) => {
    // First try pattern-based recognition
    const patternMatch = detectLogRequestWithPatterns(query);
    
    if (patternMatch) {
      let endpoint = '';
      let requestData = {};
      let successMessage = '';
      
      try {
        if (patternMatch.type === 'water') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/water`;
          
          const waterValue = patternMatch.isGlasses 
            ? patternMatch.value 
            : Math.round(patternMatch.value / 250);
          
          const isIncrement = patternMatch.isIncremental || false;
          
          requestData = { 
            water: waterValue,
            isIncrement: isIncrement
          };
          
          const incrementText = isIncrement ? " more" : "";
          successMessage = `I've logged ${patternMatch.isGlasses ? patternMatch.value + incrementText + ' glasses' : patternMatch.value + incrementText + 'ml'} of water for you.`;
          
          console.log("Water logging request:", { waterValue, isIncrement });
        } 
        else if (patternMatch.type === 'weight') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/weight`;
          requestData = { 
            weight: patternMatch.value, 
            weight_unit: patternMatch.unit 
          };
          successMessage = `I've logged your weight of ${patternMatch.value} ${patternMatch.unit}.`;
        }
        else if (patternMatch.type === 'steps') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { steps: patternMatch.value };
          successMessage = `I've logged ${patternMatch.value} steps for you.`;
        }
        else if (patternMatch.type === 'heart') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/heart`;
          requestData = { heartRate: patternMatch.value };
          successMessage = `I've logged your heart rate of ${patternMatch.value} bpm.`;
        }
        else if (patternMatch.type === 'sleep') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/sleep`;
          
          // Format times to ensure they have AM/PM
          const formatTime = (timeStr) => {
            let formattedTime = timeStr.trim();
            
            // Convert am/pm to uppercase AM/PM
            if (formattedTime.toLowerCase().endsWith('am')) {
              formattedTime = formattedTime.slice(0, -2) + 'AM';
            } else if (formattedTime.toLowerCase().endsWith('pm')) {
              formattedTime = formattedTime.slice(0, -2) + 'PM';
            } 
            // Add AM/PM if missing
            else if (!formattedTime.toUpperCase().endsWith('AM') && !formattedTime.toUpperCase().endsWith('PM')) {
              const hour = parseInt(formattedTime.split(':')[0]);
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
          const today = new Date().toISOString().split('T')[0];
          
          requestData = { 
            date: today,
            sleepStart: sleepStart, 
            sleepEnd: sleepEnd 
          };
          successMessage = `I've logged your sleep from ${sleepStart} to ${sleepEnd}.`;
        }
        
        // If we have valid data and an endpoint, make the API call
        if (endpoint) {
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
            content: "I'm sorry, I couldn't log that health information. Please try again or use the tracking screens.",
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
    let endpoint = '';
    let requestData = {};
    let successMessage = '';
    
    try {
      if (isWaterLog) {
        extractedData = extractMetricFromText(query, 'water');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/water`;
          
          // If the user specified glasses, send that value directly
          // Otherwise, convert ml to glasses (assuming 250ml per glass)
          const waterValue = extractedData.isGlasses 
            ? extractedData.value 
            : Math.round(extractedData.value ?? 0 / 250);
          
          requestData = { water: waterValue };
          successMessage = `I've logged ${extractedData.isGlasses ? extractedData.value + ' glasses' : extractedData.value + 'ml'} of water for you.`;
        }
      } 
      else if (isWeightLog) {
        extractedData = extractMetricFromText(query, 'weight');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/weight`;
          requestData = { 
            weight: extractedData.value, 
            weight_unit: extractedData.unit 
          };
          successMessage = `I've logged your weight of ${extractedData.value} ${extractedData.unit}.`;
        }
      }
      else if (isStepsLog) {
        extractedData = extractMetricFromText(query, 'steps');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { steps: extractedData.value };
          successMessage = `I've logged ${extractedData.value} steps for you.`;
        }
      }
      else if (isHeartLog) {
        extractedData = extractMetricFromText(query, 'heart');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/heart`;
          requestData = { heartRate: extractedData.value };
          successMessage = `I've logged your heart rate of ${extractedData.value} bpm.`;
        }
      }
      else if (isSleepLog) {
        extractedData = extractMetricFromText(query, 'sleep');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/sleep`;
          
          // Format times to ensure they have AM/PM
          const formatTime = (timeStr: string) => {
            // Ensure time has AM/PM
            if (!timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
              // Make assumption based on typical sleep patterns
              const hour = parseInt(timeStr.split(':')[0]);
              // Assume hours 7-11 are AM, 12 and 1-6 are PM, and after midnight is AM
              if (hour >= 7 && hour <= 11) {
                return timeStr + " AM";
              } else {
                return timeStr + " PM";
              }
            }
            return timeStr;
          };
          
          const sleepStart = formatTime(extractedData.sleepStart || '');
          const sleepEnd = formatTime(extractedData.sleepEnd || '');
          
          // Get today's date in ISO format (YYYY-MM-DD)
          const today = new Date().toISOString().split('T')[0];
          
          requestData = { 
            date: today,
            sleepStart: sleepStart, 
            sleepEnd: sleepEnd 
          };
          successMessage = `I've logged your sleep from ${sleepStart} to ${sleepEnd}.`;
        } else {
          // If we couldn't extract specific sleep times, provide guidance
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: "To log sleep, please specify your sleep start and end times. For example, 'I slept from 10:30 PM to 6:45 AM' or 'Log my sleep from 11 PM to 7 AM'.",
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
          content: "I'm sorry, I couldn't log that health information. Please try again or use the tracking screens.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      
      return true;
    }
    
    return false; // Not handled as a log request
  };

  const detectAndHandleGoalRequest = async (query: string) => {
    // First try pattern-based recognition
    const patternMatch = detectGoalRequestWithPatterns(query);
    
    if (patternMatch) {
      let endpoint = '';
      let requestData = {};
      let successMessage = '';
      
      try {
        if (patternMatch.type === 'water') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterGoal`;
          
          const waterGoal = patternMatch.isGlasses 
            ? patternMatch.value 
            : Math.round(patternMatch.value / 250);
          
          requestData = { waterGoal: waterGoal };
          successMessage = `I've set your water intake goal to ${waterGoal} glasses per day.`;
        } 
        else if (patternMatch.type === 'steps') {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { stepsGoal: patternMatch.value };
          successMessage = `I've set your step goal to ${patternMatch.value} steps per day.`;
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
            content: "I'm sorry, I couldn't set that health goal. Please try again or use the tracking screens.",
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
    let endpoint = '';
    let requestData = {};
    let successMessage = '';
    
    try {
      if (isWaterGoal) {
        extractedData = extractMetricFromText(query, 'water');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterGoal`;
          
          // If the user specified glasses, use that value directly
          // Otherwise, convert ml to glasses (assuming 250ml per glass)
          const waterGoal = extractedData.isGlasses 
            ? extractedData.value 
            : Math.round(extractedData.value / 250);
          
          requestData = { waterGoal: waterGoal };
          successMessage = `I've set your water intake goal to ${waterGoal} glasses per day.`;
        }
      } 
      else if (isStepsGoal) {
        extractedData = extractMetricFromText(query, 'steps');
        
        if (extractedData) {
          endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`;
          requestData = { stepsGoal: extractedData.value };
          successMessage = `I've set your step goal to ${extractedData.value} steps per day.`;
        }
      }
      
      // If we have valid data and an endpoint, make the API call
      if (extractedData && endpoint) {
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
          content: "I'm sorry, I couldn't set that health goal. Please try again or use the tracking screens.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      
      return true;
    }
    
    return false; // Not handled as a goal request
  };

  const processUserQuery = async (query: string) => {
    try {
      console.log("processUserQuery started with:", query);
      setIsProcessing(true);
      
      // First check if this is a log request
      const wasHandledAsLogRequest = await detectAndHandleLogRequest(query);
      
      if (wasHandledAsLogRequest) {
        setIsProcessing(false);
        return;
      }
      
      // Then check if this is a goal setting request
      const wasHandledAsGoalRequest = await detectAndHandleGoalRequest(query);
      
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
        /all stats|all metrics|health summary|overview/i.test(query) ||
        (/avg|average/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) weight/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) sleep/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) heart/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) water/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) steps/i.test(query) &&
          !/sleep duration/i.test(query))

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
      })

      // Handle comprehensive health stats query
      if (isComprehensiveQuery) {
        console.log("Detected comprehensive health stats query")

        // Format a comprehensive health stats response
        let statsMessage = "Here's a summary of your health statistics:\n\n"

        // Determine time period to report
        let reportPeriod = "weekly" // Default to weekly
        if (isTodayQuery) reportPeriod = "today"
        if (isMonthlyQuery) reportPeriod = "monthly"

        // Water stats
        if (reportPeriod === "today") {
          statsMessage += `Water: ${healthStats.water.today} glasses today\n`
        } else if (reportPeriod === "weekly") {
          statsMessage += `Water: ${healthStats.water.avgWeekly.toFixed(1)} glasses per day (weekly average)\n`
        } else {
          statsMessage += `Water: ${healthStats.water.avgMonthly.toFixed(1)} glasses per day (monthly average)\n`
        }

        // Steps stats
        if (reportPeriod === "today") {
          statsMessage += `Steps: ${healthStats.steps.today} steps today\n`
        } else if (reportPeriod === "weekly") {
          statsMessage += `Steps: ${healthStats.steps.avgWeekly.toFixed(0)} steps per day (weekly average)\n`
        } else {
          statsMessage += `Steps: ${healthStats.steps.avgMonthly.toFixed(0)} steps per day (monthly average)\n`
        }

        // Weight stats
        if (healthStats.weight.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `Weight: ${healthStats.weight.today} ${healthStats.weight.unit} today\n`
          } else if (reportPeriod === "weekly") {
            statsMessage += `Weight: ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit} (weekly average)\n`
          } else {
            statsMessage += `Weight: ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit} (monthly average)\n`
          }
        }

        // Heart rate stats
        if (healthStats.heart.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `Heart rate: ${healthStats.heart.today} bpm today\n`
          } else if (reportPeriod === "weekly") {
            statsMessage += `Heart rate: ${healthStats.heart.avgWeekly.toFixed(0)} bpm (weekly average)\n`
          } else {
            statsMessage += `Heart rate: ${healthStats.heart.avgMonthly.toFixed(0)} bpm (monthly average)\n`
          }
        }

        // Sleep stats
        if (healthStats.sleep.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `Sleep: ${healthStats.sleep.today.toFixed(1)} hours today\n`
          } else if (reportPeriod === "weekly") {
            statsMessage += `Sleep: ${healthStats.sleep.avgWeekly.toFixed(1)} hours per night (weekly average)\n`
          } else {
            statsMessage += `Sleep: ${healthStats.sleep.avgMonthly.toFixed(1)} hours per night (monthly average)\n`
          }
        }

        // Add a note if some metrics are missing
        if (healthStats.heart.avgWeekly === 0 || healthStats.sleep.avgWeekly === 0) {
          statsMessage += "\nSome metrics have no data. Regular tracking will provide more complete insights."
        }

        // Speak the response
        speakResponse(statsMessage)

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
        ])

        setIsProcessing(false)
        return // Exit early since we've handled this specific query
      }

      // Handle specific metric queries
      if (isWaterQuery) {
        let waterMessage = ""

        if (isTodayQuery) {
          waterMessage = `You've consumed ${healthStats.water.today} glasses of water today.`
        } else if (isWeeklyQuery || isAverageQuery) {
          waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(1)} glasses per day over the past week. Your total weekly consumption was ${healthStats.water.weekly} glasses.`
        } else if (isMonthlyQuery) {
          waterMessage = `Your average water consumption is ${healthStats.water.avgMonthly.toFixed(1)} glasses per day over the past month. Your total monthly consumption was ${healthStats.water.monthly} glasses.`
        } else {
          // Default to weekly if no time period specified
          waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(1)} glasses per day over the past week. Today you've had ${healthStats.water.today} glasses.`
        }

        waterMessage += " Staying hydrated is important for your pregnancy!"
        // Speak the response
        speakResponse(waterMessage)

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
        ])

        setIsProcessing(false)
        return
      }

      if (isWeightQuery && /^what('s| is) (my |the )?(avg|average) weight/i.test(query)) {
        if (healthStats.weight.avgWeekly === 0 && healthStats.weight.today === 0) {
          const noDataMessage =
            "I don't have enough weight data to calculate statistics. Please log your weight regularly to track your pregnancy progress."
          speakResponse(noDataMessage)

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
          ])

          setIsProcessing(false)
          return
        }

        let weightMessage = ""

        if (isMonthlyQuery) {
          weightMessage = `Your average weight is ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit} over the past month.`
        } else {
          // Default to weekly average for "what is avg weight" queries
          weightMessage = `Your average weight is ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit} over the past week.`
        }

        speakResponse(weightMessage)

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
        ])

        setIsProcessing(false)
        return
      }

      // Steps queries
      if (isStepsQuery) {
        let stepsMessage = ""

        if (isTodayQuery) {
          stepsMessage = `You've taken ${healthStats.steps.today} steps today.`
        } else if (isWeeklyQuery || isAverageQuery) {
          stepsMessage = `Your average daily step count is ${healthStats.steps.avgWeekly.toFixed(0)} steps over the past week. Your total steps this week were ${healthStats.steps.weekly}.`
        } else if (isMonthlyQuery) {
          stepsMessage = `Your average daily step count is ${healthStats.steps.avgMonthly.toFixed(0)} steps over the past month. Your total steps this month were ${healthStats.steps.monthly}.`
        } else {
          // Default to weekly if no time period specified
          stepsMessage = `Your average daily step count is ${healthStats.steps.avgWeekly.toFixed(0)} steps over the past week. Today you've taken ${healthStats.steps.today} steps.`
        }

        stepsMessage += " Regular walking is excellent exercise during pregnancy!"
        
        speakResponse(stepsMessage)

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
        ])

        setIsProcessing(false)
        return
      }

      // Heart rate queries
      if (isHeartQuery) {
        if (healthStats.heart.avgWeekly === 0 && healthStats.heart.today === 0) {
          const noDataMessage = "I don't have enough heart rate data to calculate statistics. Please log your heart rate regularly for better tracking."
          speakResponse(noDataMessage)

          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: noDataMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ])

          setIsProcessing(false)
          return
        }

        let heartMessage = ""

        if (isTodayQuery) {
          heartMessage = `Your heart rate today is ${healthStats.heart.today} bpm.`
        } else if (isWeeklyQuery || isAverageQuery) {
          heartMessage = `Your average heart rate is ${healthStats.heart.avgWeekly.toFixed(0)} bpm over the past week.`
        } else if (isMonthlyQuery) {
          heartMessage = `Your average heart rate is ${healthStats.heart.avgMonthly.toFixed(0)} bpm over the past month.`
        } else {
          heartMessage = `Your current heart rate is ${healthStats.heart.today} bpm, and your weekly average is ${healthStats.heart.avgWeekly.toFixed(0)} bpm.`
        }

        speakResponse(heartMessage)

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: heartMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ])

        setIsProcessing(false)
        return
      }

      // For non-health specific queries, use the regular API
      const apiResponse = await sendToAPI(query, "text")

      if (apiResponse) {
        const assistantMessage = apiResponse.response
        speakResponse(assistantMessage)

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
        ])
      }

      setIsProcessing(false)
    } catch (error: any) {
      console.error("Error in processUserQuery:", error.message)
      console.error("Error stack:", error.stack)
      setIsProcessing(false)
      Alert.alert("Error", "I couldn't process your request. Please try again.")
    }
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

      // Update messages state with the new message
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages as Message[]);
      setInputText("")
      setIsTyping(true)
      setIsAssistantResponding(true)

      // Process the query - our new implementation will check for log/goal requests first
      await processUserQuery(messageContent);
      setIsTyping(false);
      setIsAssistantResponding(false);
    }
  }

  const handleAudioSent = (audioUri: string, transcript?: string, assistantResponse?: string) => {
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
      setIsTyping(true)
      setIsAssistantResponding(true)

      // Check for log/goal requests with the same processing logic as text
      // This ensures consistent handling between voice and text
      processUserQuery(transcript).then(() => {
        setIsTyping(false)
        setIsAssistantResponding(false)
      })
    }
  }

  const handleOptionPress = (optionText: string) => {
    setInputText(optionText) // Update the inputText with the selected option
    sendMessage(optionText)
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
        <Image source={require("../../assets/images/doulaImg.png")} style={styles.doulaAvatar} />
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
      const serializedMessages = messagesToSave.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      
      await AsyncStorage.setItem('chatHistory', JSON.stringify(serializedMessages));
      console.log('Messages saved to storage');
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  // Function to load messages from AsyncStorage
  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('chatHistory');
      
      if (savedMessages) {
        // Parse the JSON and convert timestamp strings back to Date objects
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(parsedMessages);
        console.log('Loaded', parsedMessages.length, 'messages from storage');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#434343" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ask Your Doula</Text>
          <TouchableOpacity>
            <Feather name="more-vertical" size={20} color="#E5E5E5" />
          </TouchableOpacity>
        </View>

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
                <Image source={require("../../assets/images/doulaImg.png")} style={styles.profileImage} />
              </View>

              <Text style={styles.greeting}>
                <Text>👋 Hi </Text>
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
                  style={[styles.messageRow, message.isUser ? styles.userMessageRow : styles.doulaMessageRow]}
                >
                  {!message.isUser && (
                    <Image source={require("../../assets/images/doulaImg.png")} style={styles.doulaAvatar} />
                  )}

                  {message.type === "text" ? (
                    <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.doulaBubble]}>
                      <Text
                        style={[styles.messageText, message.isUser ? styles.userMessageText : styles.doulaMessageText]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  ) : (
                    <AudioMessage audioUri={message.content} isUser={message.isUser} />
                  )}

                  {message.isUser && (
                    <Image source={require("../../assets/images/doulaImg.png")} style={styles.userAvatar} />
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
              onPress={() => handleOptionPress("What foods should I eat during my third trimester?")}
              disabled={isAssistantResponding}
            >
              <Text style={styles.optionText}>Nutrition Advice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress("What exercises are safe during pregnancy?")}
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
              onPress={() => handleOptionPress("Is it safe to travel during pregnancy?")}
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
              <VoiceRecorder onSendAudio={handleAudioSent} systemPrompt={systemPrompt} />
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
    borderWidth: 4,
    borderColor: "#FDE8F8",
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
    fontSize: 16,
  },
  name: {
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  highlight: {
    color: "#FF80AB",
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
    height: "100%",
  },
  micButton: {
    padding: 4,
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
})

