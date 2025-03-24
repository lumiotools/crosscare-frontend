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
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import VoiceRecorder from "@/components/VoiceRecorder";
import AudioMessage from "@/components/AudioMessage";
import { useSelector } from "react-redux";
import { systemPrompts } from "@/constants/systemPrompts";
import axios from "axios";

interface Message {
  id: string;
  isUser: boolean;
  timestamp: Date;
  type: "text" | "audio";
  content: string; // text content or audio URI
}

interface HealthRecord {
  date: string;
  details: {
    water: number;
    waterGoal: number;
    heart: number;
    sleep: {
      start: string | null;
      end: string | null;
    };
    steps: number;
    stepsGoal: number;
    weight: {
      value: number;
      unit: string;
    };
  };
}

export default function askdoula() {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const user = useSelector((state: any) => state.user);
  const [healthData, setHealthData] = useState<{
    steps: { today: number; weekly: number };
    water: { today: number; weekly: number };
    weight: { current: number; unit: string; previous: number };
  } | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  const [healthStats, setHealthStats] = useState({
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
  });

  const [isAssistantResponding, setIsAssistantResponding] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const loadingAnimation = useRef(new Animated.Value(0)).current;

  const wordToNumberMap = {
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
    half: 0.5,
    quarter: 0.25,
  };

  const wordsToNumber = (words: string): number | null => {
    const parts = words.split(/[-\s]+/); // Split by space or hyphen

    let total = 0;
    let current = 0;

    for (const word of parts) {
      if (wordToNumberMap[word as keyof typeof wordToNumberMap] !== undefined) {
        const num = wordToNumberMap[word as keyof typeof wordToNumberMap];

        if (num === 100) {
          current *= 100; // Handle "one hundred", "two hundred", etc.
        } else {
          current += num;
        }
      } else if (current > 0) {
        total += current;
        current = 0;
      }
    }

    total += current;
    return total > 0 ? total : null;
  };

  const convertWordsToNumbers = (text: string): string => {
    return text.replace(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|half|quarter)([-\s]?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety))?\b/gi,
      (match) => {
        const num = wordsToNumber(match.toLowerCase());

        return num !== null ? num.toString() : match;
      }
    );
  };

  const processUserInput = async (userText: string) => {
    console.log("Processing input:", userText);

    // Convert words like "fifty-six kg" → "56 kg"
    userText = convertWordsToNumbers(userText);

    console.log("Converted input:", userText);

    // Updated regex to capture water/weight inputs
    const waterMatch = userText.match(
      /([\d]+(?:\.\d+)?)\s*(ml|milliliters|liters|litres|l)/i
    );
    const glassesMatch = userText.match(
      /([\d]+(?:\.\d+)?)\s*(glass|glasses|cup|cups)/i
    );
    const weightMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(kg|pounds|lbs)/i);
    const stepsMatch = userText.match(
      /(?:log|set|record)\s*(?:step\s*goal|steps\s*goal)\s*(?:to\s*)?([\d]+(?:\.\d+)?)/i
    );

    const sleepMatch = userText.match(
      /set reminder from (\d{1,2}:\d{2}\s*(AM|PM)) to (\d{1,2}:\d{2}\s*(AM|PM))/i
    );

    let logDetails = null;

    if (waterMatch) {
      let value = Number.parseFloat(waterMatch[1]);
      const unit = waterMatch[2].toLowerCase();

      if (unit.startsWith("l")) {
        value *= 1000; // Convert liters to milliliters
      }

      logDetails = {
        category: "water_intake",
        value,
        unit: "ml",
      };
    } else if (glassesMatch) {
      const value = Number.parseFloat(glassesMatch[1]);
      // Assuming 1 glass = 250ml
      logDetails = {
        category: "water_intake",
        value: value * 250,
        unit: "ml",
      };
    } else if (weightMatch) {
      const value = Number.parseFloat(weightMatch[1]);
      const unit = weightMatch[2].toLowerCase().startsWith("lb")
        ? "pounds"
        : weightMatch[2].toLowerCase();

      logDetails = {
        category: "weight",
        value,
        unit,
      };
    } else if (stepsMatch) {
      const value = Number.parseFloat(stepsMatch[1]);

      logDetails = {
        category: "steps_goal", // Changed to "steps_goal" category
        value,
        unit: "steps", // No need for units other than "steps"
      };
    } else if (sleepMatch) {
      const sleepStart = sleepMatch[1]; // Extracted sleep start time (e.g., "10:00 PM")
      const sleepEnd = sleepMatch[3]; // Extracted sleep end time (e.g., "07:00 AM")

      const currentDate = new Date().toISOString().split("T")[0];

      const sleepReminderData = {
        date: currentDate, // Use today's date
        sleepStart, // The start time of the sleep
        sleepEnd, // The end time of the sleep
      };

      console.log(sleepReminderData);

      logDetails = {
        category: "reminder", // Category for sleep reminder
        value: sleepReminderData,
        unit: "hours",
      };
    }

    if (
      logDetails &&
      typeof logDetails.value === "number" &&
      logDetails.value > 0
    ) {
      console.log("✅ Extracted log:", logDetails);
      await logData(logDetails);
      return true;
    } else {
      console.log("❌ No valid data extracted.");
      return false;
    }
  };

  const logData = async ({
    category,
    value,
    unit,
  }: {
    category: string;
    value: number | string | object;
    unit: string;
  }) => {
    const userId = user.user_id;

    try {
      let responseMessage = "";

      if (category === "water_intake") {
        const waterCount = Number(value) / 250; // Convert to glasses

        await axios.post(
          `https://crosscare-backends.onrender.com/api/user/activity/${userId}/water`,
          { water: waterCount }
        );

        console.log("✅ Water intake logged:", waterCount, "glasses");

        // Format response based on whether input was in ml or glasses
        if (unit === "ml") {
          responseMessage = `I have logged your water intake of ${value} milliliters (${waterCount.toFixed(
            1
          )} glasses). Keep staying hydrated!
          `;
        } else {
          responseMessage = `I have logged your water intake of ${waterCount.toFixed(
            1
          )} glasses. Keep staying hydrated!`;
        }
      } else if (category === "weight") {
        await axios.post(
          `https://crosscare-backends.onrender.com/api/user/activity/${userId}/weight`,
          { weight: value, weight_unit: unit }
        );

        console.log("✅ Weight logged:", value, unit);

        responseMessage = `Your weight of ${value} ${unit} has been recorded.`;
      } else if (category === "steps_goal") {
        const response = await axios.post(
          `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`,
          { stepsGoal: value }
        );

        console.log("✅ Steps goal logged:", value);

        responseMessage = `Your steps goal of ${value} steps has been recorded.`;
      } else if (category === "reminder") {
        // API request for setting sleep reminder
        const sleepData = value as {
          date: string;
          sleepStart: string;
          sleepEnd: string;
        };

        console.log(sleepData);
        await axios.post(
          `https://crosscare-backends.onrender.com/api/user/activity/${userId}/sleep`,
          sleepData
        );

        console.log("✅ Sleep reminder set:", sleepData);

        responseMessage = `Your sleep reminder is set from ${sleepData.sleepStart} to ${sleepData.sleepEnd}.`;
      }

      // Add the response to messages
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: responseMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      // Speak the response
      speakResponse(responseMessage);

      // Refresh health data after logging
      setTimeout(() => {
        fetchHealthData();
      }, 1000);

      return true;
    } catch (error: any) {
      console.error(
        "❌ Error logging:",
        error.response ? error.response.data : error.message
      );

      // Add error message to chat
      const errorMessage =
        "Sorry, there was an error saving your data. Please try again.";

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: errorMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      speakResponse(errorMessage);

      return false;
    }
  };

  useEffect(() => {
    if (user && user.user_id) {
      // Only fetch health data when user is available
      console.log("Fetching health data for user:", user.user_id);
      fetchHealthData();
    } else {
      console.log("User data is not available yet.");
    }
  }, [user]);

  const fetchHealthData = async () => {
    if (user.user_id) {
      try {
        // Use the specified endpoint format
        const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}`;

        console.log(`Making API call to: ${apiUrl}`);

        // Make the API call
        const response = await axios.get(apiUrl);

        // Process the data if we got a response
        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          console.log(
            "API data found. First record:",
            JSON.stringify(response.data[0], null, 2)
          );

          // Sort by date (newest first)
          const sortedRecords = [...response.data].sort(
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
          const weeklyWaterRecords = last7Days.filter(
            (r) =>
              r.details?.water &&
              typeof r.details.water === "number" &&
              r.details.water > 0
          );
          const weeklyStepsRecords = last7Days.filter(
            (r) =>
              r.details?.steps &&
              typeof r.details.steps === "number" &&
              r.details.steps > 0
          );
          const weeklyHeartRecords = last7Days.filter(
            (r) =>
              r.details?.heart &&
              typeof r.details.heart === "number" &&
              r.details.heart > 0
          );
          const weeklySleepRecords = last7Days.filter(
            (r) => calculateSleepDuration(r) > 0
          );
          const weeklyWeightRecords = last7Days.filter(
            (r) =>
              r.details?.weight?.value &&
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
          const monthlyWaterRecords = last30Days.filter(
            (r) =>
              r.details?.water &&
              typeof r.details.water === "number" &&
              r.details.water > 0
          );
          const monthlyStepsRecords = last30Days.filter(
            (r) =>
              r.details?.steps &&
              typeof r.details.steps === "number" &&
              r.details.steps > 0
          );
          const monthlyHeartRecords = last30Days.filter(
            (r) =>
              r.details?.heart &&
              typeof r.details.heart === "number" &&
              r.details.heart > 0
          );
          const monthlySleepRecords = last30Days.filter(
            (r) => calculateSleepDuration(r) > 0
          );
          const monthlyWeightRecords = last30Days.filter(
            (r) =>
              r.details?.weight?.value &&
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
              r.details?.weight?.value &&
              typeof r.details.weight.value === "number" &&
              r.details.weight.value > 0
          );

          if (prevWeightRecord && prevWeightRecord.details?.weight) {
            newHealthData.weight.previous =
              prevWeightRecord.details.weight.value;
          }

          // Update state with the new health data
          setHealthStats(newHealthStats);
          setHealthData(newHealthData);

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

      let enhancedPrompt = systemPrompts;

      if (healthData) {
        enhancedPrompt += `\n\nUser's health data:\n`;

        if (healthStats.steps) {
          enhancedPrompt += `
- Steps: Today: ${
            healthStats.steps.today
          }, Weekly average: ${healthStats.steps.avgWeekly.toFixed(
            0
          )}, Monthly average: ${healthStats.steps.avgMonthly.toFixed(0)}
`;
        }

        if (healthStats.water) {
          enhancedPrompt += `
- Water: Today: ${
            healthStats.water.today
          } glasses, Weekly average: ${healthStats.water.avgWeekly.toFixed(
            1
          )} glasses, Monthly average: ${healthStats.water.avgMonthly.toFixed(
            1
          )} glasses
`;
        }

        if (healthStats.weight && healthStats.weight.avgWeekly > 0) {
          enhancedPrompt += `
- Weight: Current: ${healthStats.weight.today} ${
            healthStats.weight.unit
          }, Weekly average: ${healthStats.weight.avgWeekly.toFixed(1)} ${
            healthStats.weight.unit
          }, Monthly average: ${healthStats.weight.avgMonthly.toFixed(1)} ${
            healthStats.weight.unit
          }
`;
        }

        if (healthStats.heart && healthStats.heart.avgWeekly > 0) {
          enhancedPrompt += `
- Heart rate: Current: ${
            healthStats.heart.today
          } bpm, Weekly average: ${healthStats.heart.avgWeekly.toFixed(
            0
          )} bpm, Monthly average: ${healthStats.heart.avgMonthly.toFixed(
            0
          )} bpm
`;
        }

        if (healthStats.sleep && healthStats.sleep.avgWeekly > 0) {
          enhancedPrompt += `
- Sleep: Last night: ${healthStats.sleep.today.toFixed(
            1
          )} hours, Weekly average: ${healthStats.sleep.avgWeekly.toFixed(
            1
          )} hours, Monthly average: ${healthStats.sleep.avgMonthly.toFixed(
            1
          )} hours
`;
        }

        enhancedPrompt += `\nPlease answer the user's question about their health metrics using this data. Be specific and encouraging.`;
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: systemPrompts,
              },
              {
                text: messageContent,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1.0,
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

  const getDataForDate = (date: string, metric: string) => {
    console.log("Looking for date:", date)
    console.log(
      "Available health records:",
      healthRecords.map((r) => r.date),
    )

    const record = healthRecords.find((r) => r.date === date)

    console.log("Found record:", record ? "Yes" : "No")

    if (!record) {
      return null
    }

    let value = null
    switch (metric) {
      case "weight":
        value = record.details?.weight?.value || null
        break
      case "steps":
        value = record.details?.steps || null
        break
      case "water":
        value = record.details?.water || null
        break
      case "heart":
        value = record.details?.heart || null
        break
      case "sleep":
        if (record.details?.sleep?.start && record.details?.sleep?.end) {
          const start = new Date(record.details.sleep.start)
          const end = new Date(record.details.sleep.end)
          value = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert ms to hours
        }
        break
    }

    console.log(`Value for ${metric} on ${date}:`, value)
    return value
  }

  // Function to get data for a specific day of the week
  const getDataForDayOfWeek = (dayName: string, metric: string) => {
    // Convert day name to day number (0 = Sunday, 1 = Monday, etc.)
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    const dayNumber = dayMap[dayName.toLowerCase()]
    console.log("Looking for day:", dayName, "Day number:", dayNumber)

    if (dayNumber === undefined) {
      console.log("Invalid day name")
      return null
    }

    // Get the current date
    const today = new Date()
    console.log("Today:", today.toISOString(), "Day of week:", today.getDay())

    const currentDayNumber = today.getDay()

    // Calculate how many days ago the requested day was
    let daysAgo = currentDayNumber - dayNumber
    if (daysAgo < 0) {
      daysAgo += 7 // If the day is in the future (next week), get last week's day
    }
    console.log("Days ago:", daysAgo)

    // Calculate the date for the requested day
    const targetDate = new Date()
    targetDate.setDate(today.getDate() - daysAgo)
    console.log("Target date:", targetDate.toISOString())

    // Format the date as YYYY-MM-DD
    const formattedDate = targetDate.toISOString().split("T")[0]
    console.log("Formatted date:", formattedDate)

    // Log all available dates for debugging
    console.log(
      "All available dates:",
      healthRecords.map((r) => r.date),
    )

    // Try multiple date formats and partial matches
    let value = null

    // First try exact match
    let record = healthRecords.find((r) => r.date === formattedDate)

    // If no exact match, try date that starts with our formatted date
    if (!record) {
      record = healthRecords.find((r) => r.date.startsWith(formattedDate))
    }

    // If still no match, try more flexible matching (e.g., different format but same day)
    if (!record) {
      // Try to match just the day part regardless of format
      const targetDay = targetDate.getDate()
      const targetMonth = targetDate.getMonth() + 1
      const targetYear = targetDate.getFullYear()

      record = healthRecords.find((r) => {
        try {
          const recordDate = new Date(r.date)
          return (
            recordDate.getDate() === targetDay &&
            recordDate.getMonth() + 1 === targetMonth &&
            recordDate.getFullYear() === targetYear
          )
        } catch (e) {
          return false
        }
      })
    }

    console.log("Found record:", record ? "Yes" : "No")

    if (record) {
      switch (metric) {
        case "weight":
          value = record.details?.weight?.value || null
          break
        case "steps":
          value = record.details?.steps || null
          break
        case "water":
          value = record.details?.water || null
          break
        case "heart":
          value = record.details?.heart || null
          break
        case "sleep":
          if (record.details?.sleep?.start && record.details?.sleep?.end) {
            const start = new Date(record.details.sleep.start)
            const end = new Date(record.details.sleep.end)
            value = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert ms to hours
          }
          break
      }
    }

    console.log(`Value for ${metric} on ${dayName}:`, value)
    return value
  }

  const processUserQuery = async (query: string) => {
    try {
      console.log("processUserQuery started with:", query);
      setIsProcessing(true);

      const dayOfWeekMatch = query.match(
        /on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
      );
      const lastDayOfWeekMatch = query.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
      const specificDateMatch = query.match(/on\s+(\d{4}-\d{2}-\d{2})/i);

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
          /heart|water|steps|sleep|weight/i.test(query));

      console.log("Query analysis:", {
        dayOfWeekMatch,
        specificDateMatch,
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

      if (dayOfWeekMatch && isWeightQuery) {
        const dayOfWeek = dayOfWeekMatch[1].toLowerCase();
        let metric = "";

        if (isStepsQuery) metric = "steps";
        else if (isWaterQuery) metric = "water";
        else if (isWeightQuery) metric = "weight";
        else if (isHeartQuery) metric = "heart";
        else if (isSleepQuery) metric = "sleep";

        if (metric) {
          const value = getDataForDayOfWeek(dayOfWeek, 'weight');

          if (value !== null) {
            let responseMessage = "";

            if (metric === "steps") {
              responseMessage = `On ${dayOfWeek}, you walked ${value} steps.`;
            } else if (metric === "water") {
              responseMessage = `On ${dayOfWeek}, you drank ${value} glasses of water.`;
            } else if (metric === "weight") {
              responseMessage = `On ${dayOfWeek}, your weight was ${value} ${healthStats.weight.unit}.`;
            } else if (metric === "heart") {
              responseMessage = `On ${dayOfWeek}, your heart rate was ${value} bpm.`;
            } else if (metric === "sleep") {
              responseMessage = `On ${dayOfWeek}, you slept for ${value.toFixed(
                1
              )} hours.`;
            }

            speakResponse(responseMessage);

            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: responseMessage,
                isUser: false,
                timestamp: new Date(),
              },
            ]);

            setIsProcessing(false);
            return;
          } else {
            const noDataMessage = `I don't have any ${metric} data for ${dayOfWeek}.`;

            speakResponse(noDataMessage);

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
        }
      }

      // Handle specific date queries
      if (specificDateMatch && isWeightQuery) {
        const specificDate = specificDateMatch[1];
        let metric = "";

        if (isStepsQuery) metric = "steps";
        else if (isWaterQuery) metric = "water";
        else if (isWeightQuery) metric = "weight";
        else if (isHeartQuery) metric = "heart";
        else if (isSleepQuery) metric = "sleep";

        if (metric) {
          const value = getDataForDate(specificDate, "weight");

          if (value !== null) {
            let responseMessage = "";

            if (metric === "steps") {
              responseMessage = `On ${specificDate}, you walked ${value} steps.`;
            } else if (metric === "water") {
              responseMessage = `On ${specificDate}, you drank ${value} glasses of water.`;
            } else if (metric === "weight") {
              responseMessage = `On ${specificDate}, your weight was ${value} ${healthStats.weight.unit}.`;
            } else if (metric === "heart") {
              responseMessage = `On ${specificDate}, your heart rate was ${value} bpm.`;
            } else if (metric === "sleep") {
              responseMessage = `On ${specificDate}, you slept for ${value.toFixed(
                1
              )} hours.`;
            }

            speakResponse(responseMessage);

            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: responseMessage,
                isUser: false,
                timestamp: new Date(),
              },
            ]);

            setIsProcessing(false);
            return;
          } else {
            const noDataMessage = `I don't have any ${metric} data for ${specificDate}.`;

            speakResponse(noDataMessage);

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
        }
      }

      // Handle comprehensive health stats query
      if (isComprehensiveQuery) {
        console.log("Detected comprehensive health stats query");

        let statsMessage = ""; // Start with an empty message
        let reportPeriod = "weekly"; // Default to weekly

        if (isTodayQuery) reportPeriod = "today";
        if (isMonthlyQuery) reportPeriod = "monthly";

        // Check if it's specifically a weight query
        const isWeightQueryOnly = /average\s*weight|avg\s*weight/i.test(query);
        const isWaterQueryOnly = /average\s*water|avg\s*water/i.test(query);
        const isStepsQueryOnly = /average\s*steps|avg\s*steps/i.test(query);
        const isHeartRateQueryOnly =
          /average\s*heart\s*rate|avg\s*heart\s*rate/i.test(query);
        const isSleepQueryOnly = /average\s*sleep|avg\s*sleep/i.test(query);

        // If it's only a weight query, we only append the weight info
        if (isWeightQueryOnly) {
          if (healthStats.weight.avgWeekly > 0) {
            if (reportPeriod === "today") {
              statsMessage = `Your weight is ${healthStats.weight.today} ${healthStats.weight.unit} today.`;
            } else if (reportPeriod === "weekly") {
              statsMessage = `Your average weight is ${healthStats.weight.avgWeekly.toFixed(
                1
              )} ${healthStats.weight.unit} (weekly average).`;
            } else {
              statsMessage = `Your average weight is ${healthStats.weight.avgMonthly.toFixed(
                1
              )} ${healthStats.weight.unit} (monthly average).`;
            }
          } else {
            statsMessage =
              "I don't have enough weight data to calculate statistics. Please log your weight regularly.";
          }
        }

        // If it's only a water query, we only append the water info
        else if (isWaterQueryOnly) {
          if (reportPeriod === "today") {
            statsMessage = `You drank ${healthStats.water.today} glasses of water today.`;
          } else if (reportPeriod === "weekly") {
            statsMessage = `Your average water intake is ${healthStats.water.avgWeekly.toFixed(
              1
            )} glasses per day (weekly average).`;
          } else {
            statsMessage = `Your average water intake is ${healthStats.water.avgMonthly.toFixed(
              1
            )} glasses per day (monthly average).`;
          }
        }

        // If it's only a steps query, we only append the steps info
        else if (isStepsQueryOnly) {
          if (reportPeriod === "today") {
            statsMessage = `You walked ${healthStats.steps.today} steps today.`;
          } else if (reportPeriod === "weekly") {
            statsMessage = `Your average steps are ${healthStats.steps.avgWeekly.toFixed(
              0
            )} steps per day (weekly average).`;
          } else {
            statsMessage = `Your average steps are ${healthStats.steps.avgMonthly.toFixed(
              0
            )} steps per day (monthly average).`;
          }
        }

        // If it's only a heart rate query, we only append the heart rate info
        else if (isHeartRateQueryOnly) {
          if (reportPeriod === "today") {
            statsMessage = `Your heart rate is ${healthStats.heart.today} bpm today.`;
          } else if (reportPeriod === "weekly") {
            statsMessage = `Your average heart rate is ${healthStats.heart.avgWeekly.toFixed(
              0
            )} bpm (weekly average).`;
          } else {
            statsMessage = `Your average heart rate is ${healthStats.heart.avgMonthly.toFixed(
              0
            )} bpm (monthly average).`;
          }
        }

        // If it's only a sleep query, we only append the sleep info
        else if (isSleepQueryOnly) {
          if (reportPeriod === "today") {
            statsMessage = `You slept ${healthStats.sleep.today.toFixed(
              1
            )} hours today.`;
          } else if (reportPeriod === "weekly") {
            statsMessage = `Your average sleep is ${healthStats.sleep.avgWeekly.toFixed(
              1
            )} hours per night (weekly average).`;
          } else {
            statsMessage = `Your average sleep is ${healthStats.sleep.avgMonthly.toFixed(
              1
            )} hours per night (monthly average).`;
          }
        }

        // If it's not just one specific metric, provide the full summary
        else {
          statsMessage = "Here's a summary of your health statistics:\n\n";

          // Water stats
          if (reportPeriod === "today") {
            statsMessage += `Water: ${healthStats.water.today} glasses today\n`;
          } else if (reportPeriod === "weekly") {
            statsMessage += `Water: ${healthStats.water.avgWeekly.toFixed(
              1
            )} glasses per day (weekly average)\n`;
          } else {
            statsMessage += `Water: ${healthStats.water.avgMonthly.toFixed(
              1
            )} glasses per day (monthly average)\n`;
          }

          // Steps stats
          if (reportPeriod === "today") {
            statsMessage += `Steps: ${healthStats.steps.today} steps today\n`;
          } else if (reportPeriod === "weekly") {
            statsMessage += `Steps: ${healthStats.steps.avgWeekly.toFixed(
              0
            )} steps per day (weekly average)\n`;
          } else {
            statsMessage += `Steps: ${healthStats.steps.avgMonthly.toFixed(
              0
            )} steps per day (monthly average)\n`;
          }

          // Weight stats
          if (healthStats.weight.avgWeekly > 0) {
            if (reportPeriod === "today") {
              statsMessage += `Weight: ${healthStats.weight.today} ${healthStats.weight.unit} today\n`;
            } else if (reportPeriod === "weekly") {
              statsMessage += `Weight: ${healthStats.weight.avgWeekly.toFixed(
                1
              )} ${healthStats.weight.unit} (weekly average)\n`;
            } else {
              statsMessage += `Weight: ${healthStats.weight.avgMonthly.toFixed(
                1
              )} ${healthStats.weight.unit} (monthly average)\n`;
            }
          }

          // Heart rate stats
          if (healthStats.heart.avgWeekly > 0) {
            if (reportPeriod === "today") {
              statsMessage += `Heart rate: ${healthStats.heart.today} bpm today\n`;
            } else if (reportPeriod === "weekly") {
              statsMessage += `Heart rate: ${healthStats.heart.avgWeekly.toFixed(
                0
              )} bpm (weekly average)\n`;
            } else {
              statsMessage += `Heart rate: ${healthStats.heart.avgMonthly.toFixed(
                0
              )} bpm (monthly average)\n`;
            }
          }

          // Sleep stats
          if (healthStats.sleep.avgWeekly > 0) {
            if (reportPeriod === "today") {
              statsMessage += `Sleep: ${healthStats.sleep.today.toFixed(
                1
              )} hours today\n`;
            } else if (reportPeriod === "weekly") {
              statsMessage += `Sleep: ${healthStats.sleep.avgWeekly.toFixed(
                1
              )} hours per night (weekly average)\n`;
            } else {
              statsMessage += `Sleep: ${healthStats.sleep.avgMonthly.toFixed(
                1
              )} hours per night (monthly average)\n`;
            }
          }
        }

        // Add a note if some metrics are missing
        if (
          healthStats.heart.avgWeekly === 0 ||
          healthStats.sleep.avgWeekly === 0
        ) {
          statsMessage +=
            "\nSome metrics have no data. Regular tracking will provide more complete insights.";
        }

        // Speak the response
        speakResponse(statsMessage);

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
        return;
      }

      // Handle specific metric queries (example for water query)
      if (isWaterQuery) {
        let waterMessage = "";

        if (isTodayQuery) {
          waterMessage = `You've consumed ${healthStats.water.today} glasses of water today.`;
        } else if (isWeeklyQuery || isAverageQuery) {
          waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(
            1
          )} glasses per day over the past week. Your total weekly consumption was ${
            healthStats.water.weekly
          } glasses.`;
        } else if (isMonthlyQuery) {
          waterMessage = `Your average water consumption is ${healthStats.water.avgMonthly.toFixed(
            1
          )} glasses per day over the past month. Your total monthly consumption was ${
            healthStats.water.monthly
          } glasses.`;
        } else {
          waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(
            1
          )} glasses per day over the past week. Today you've had ${
            healthStats.water.today
          } glasses.`;
        }

        waterMessage += " Staying hydrated is important for your pregnancy!";

        // Speak the response
        speakResponse(waterMessage);

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

      // Handle specific weight query
      if (
        isWeightQuery &&
        /^what('s| is) (my |the )?(avg|average) weight/i.test(query)
      ) {
        if (
          healthStats.weight.avgWeekly === 0 &&
          healthStats.weight.today === 0
        ) {
          const noDataMessage =
            "I don't have enough weight data to calculate statistics. Please log your weight regularly to track your pregnancy progress.";
          speakResponse(noDataMessage);

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
          weightMessage = `Your average weight is ${healthStats.weight.avgMonthly.toFixed(
            1
          )} ${healthStats.weight.unit} over the past month.`;
        } else {
          weightMessage = `Your average weight is ${healthStats.weight.avgWeekly.toFixed(
            1
          )} ${healthStats.weight.unit} over the past week.`;
        }

        speakResponse(weightMessage);

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

      // For non-health specific queries, use the regular API
      const apiResponse = await sendToAPI(query, "text");

      if (apiResponse) {
        const assistantMessage = apiResponse.response;
        speakResponse(assistantMessage);

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

      setIsProcessing(false);
    } catch (error: any) {
      console.error("Error in processUserQuery:", error.message);
      console.error("Error stack:", error.stack);

      setIsProcessing(false);
      Alert.alert(
        "Error",
        "I couldn't process your request. Please try again."
      );
    }
  };

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

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInputText("");
      setIsTyping(true);
      setIsAssistantResponding(true);

      // First check if this is a logging command
      const isLoggingCommand =
        /log|record|track|add|my weight is|i weigh|i drank|i had|glasses|cups/i.test(
          messageContent
        );

      if (isLoggingCommand) {
        const wasLogged = await processUserInput(messageContent);

        if (wasLogged) {
          setIsTyping(false);
          setIsAssistantResponding(false);
          return;
        }
      }

      // Check if this is a health-related query
      const isHealthQuery =
        /weight|water|hydration|steps|walking|heart|pulse|bpm|sleep|slept|health|stats|metrics/i.test(
          messageContent
        );

      if (isHealthQuery) {
        // Process health-related query
        await processUserQuery(messageContent);
        setIsTyping(false);
        setIsAssistantResponding(false);
      } else {
        // Send the message to the API
        const apiResponse = await sendToAPI(messageContent, "text");

        setTimeout(() => {
          setIsTyping(false);
          setIsAssistantResponding(false);

          if (apiResponse) {
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content:
                  apiResponse?.response ||
                  "Thank you for your message. I'll address your concerns shortly.",
                isUser: false,
                timestamp: new Date(),
              },
            ]);
          }
        }, 1500);
      }
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

    // Only add the audio message if we have a valid URI
    if (audioUri) {
      // Add audio message only - we don't add the transcript as a separate message
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

      // Show typing indicator for the assistant response
      setIsTyping(true);
      setIsAssistantResponding(true);
    }

    // If we have an assistant response, add it after a delay
    if (assistantResponse) {
      console.log("Adding assistant response to messages:", assistantResponse);

      // Show typing indicator briefly if not already showing
      if (!isTyping) {
        setIsTyping(true);
        setIsAssistantResponding(true);
      }

      setTimeout(() => {
        setIsTyping(false);
        setIsAssistantResponding(false);

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: assistantResponse,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }, 1000);
    } else if (audioUri) {
      // If we have an audio but no assistant response yet,
      // the assistant response will come in a separate call
      setTimeout(() => {
        if (isAssistantResponding) {
          setIsTyping(false);
          setIsAssistantResponding(false);
        }
      }, 5000); // Timeout in case the assistant response never comes
    }
  };

  const handleOptionPress = (optionText: string) => {
    setInputText(optionText); // Update the inputText with the selected option

    sendMessage(optionText);
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
          source={require("../../assets/images/doulaImg.png")}
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

  const [language, setLanguage] = useState("en");

  const handleLanguageChange = () => {
    // Toggle between English and Spanish
    setLanguage((prevLanguage) => (prevLanguage === "en" ? "es" : "en"));
    console.log("Selected language:", language === "en" ? "English" : "Spanish");
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
          <TouchableOpacity style={{
            flexDirection:'row',
            gap:5,
            alignItems:'center',
            borderWidth:1,
            borderColor:'#FF80AB',
            paddingHorizontal:5,
            paddingVertical:4,
            borderRadius:20,
          }} onPress={handleLanguageChange}>
            <Ionicons name='language-outline' size={15} color="#FF80AB" />
            <Text>{language === 'en' ? "en" : "es"}</Text>
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
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require("../../assets/images/doulaImg.png")}
                  style={styles.profileImage}
                />
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
                  style={[
                    styles.messageRow,
                    message.isUser
                      ? styles.userMessageRow
                      : styles.doulaMessageRow,
                  ]}
                >
                  {!message.isUser && (
                    <Image
                      source={require("../../assets/images/doulaImg.png")}
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
                    <Image
                      source={require("../../assets/images/doulaImg.png")}
                      style={styles.userAvatar}
                    />
                  )}
                </View>
              ))}

              {isTyping && renderTypingIndicator()}

              {/* Add extra padding at the bottom for better scrolling */}
              {/* <View style={{ height: 20 }} /> */}
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
                placeholder="Ask me anything..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={(text) => setInputText(text)}
                onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)}
                editable={!isAssistantResponding}
              />
              <VoiceRecorder
                onSendAudio={handleAudioSent}
                systemPrompt={systemPrompts}
                language={language}
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
    boxShadow:
      "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
