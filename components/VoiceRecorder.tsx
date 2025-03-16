import { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import axios from "axios";
import { systemPrompts } from "@/constants/systemPrompts";
import { useSelector } from "react-redux";

interface VoiceRecorderProps {
  onSendAudio: (
    audioUri: string,
    transcript?: string,
    assistantResponse?: string
  ) => void;
  systemPrompt?: string;
  apiKey?: string;
}
interface FormatTimeProps {
  seconds: number;
}

export default function VoiceRecorder({
  onSendAudio,
  systemPrompt = systemPrompts,
  apiKey = "AIzaSyD0ISmMWP4_yDqEvlrjpNJB8TnuJBkhZPs",
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUri, setAudioUri] = useState("");
  const [femaleVoice, setFemaleVoice] = useState<Speech.Voice | null>(null);

  // Use a ref to track if recording is being unloaded to prevent double unloading
  const isUnloading = useRef(false);
  const progressWidth = useRef(new Animated.Value(0)).current;

  const user = useSelector((state: any) => state.user);

  // Get available voices when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        // console.log("Available voices:", voices)

        // Find a female voice - look for voices with "female" in the identifier or name
        // or common female voice identifiers
        const femaleVoices = voices.filter(
          (voice) =>
            voice.identifier.toLowerCase().includes("female") ||
            (voice.name && voice.name.toLowerCase().includes("female")) ||
            voice.identifier.toLowerCase().includes("samantha") ||
            voice.identifier.toLowerCase().includes("karen") ||
            voice.identifier.toLowerCase().includes("victoria") ||
            voice.identifier.toLowerCase().includes("tessa") ||
            voice.identifier.toLowerCase().includes("moira") ||
            voice.identifier.toLowerCase().includes("kyoko") ||
            voice.identifier.toLowerCase().includes("ava")
        );

        if (femaleVoices.length > 0) {
          // console.log("Selected female voice:", femaleVoices[0])
          setFemaleVoice(femaleVoices[0]);
        } else {
          // console.log("No female voice found, using default")
        }
      } catch (error) {
        console.error("Error loading voices:", error);
      }
    };

    loadVoices();
  }, []);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Only attempt cleanup if we're recording and not already unloading
      if (recording && !isUnloading.current) {
        cleanupRecording();
      }

      // Clear timer if it exists
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }

      // Stop any ongoing speech
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [recording, recordingTimer, isSpeaking]);

  // Animate progress bar
  useEffect(() => {
    if (isRecording) {
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 60000, // 60 seconds max recording
        useNativeDriver: false,
      }).start();
    } else {
      progressWidth.setValue(0);
    }
  }, [isRecording, progressWidth]);

  const formatTime = ({ seconds }: FormatTimeProps): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Safe cleanup function that won't try to unload twice
  const cleanupRecording = async () => {
    try {
      if (recording && !isUnloading.current) {
        isUnloading.current = true;
        await recording.stopAndUnloadAsync();
        isUnloading.current = false;
      }
    } catch (error) {
      console.log("Cleanup recording error (safe to ignore):", error);
      isUnloading.current = false;
    }
  };

  const startRecording = async () => {
    try {
      // Reset unloading flag
      isUnloading.current = false;

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant microphone permission to record audio."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setTranscript(""); // Clear any previous transcript

      const timer = setInterval(() => {
        setRecordingDuration((duration) => duration + 1);
      }, 1000);
      setRecordingTimer(timer);
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      // If no recording or already unloading, exit early
      if (!recording || isUnloading.current) return;

      // Set flag to prevent double unloading
      isUnloading.current = true;

      // Clear timer first
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      // Get URI before stopping (some implementations need this)
      const uri = recording.getURI();
      setAudioUri(uri || "");

      // Stop and unload
      await recording.stopAndUnloadAsync();

      // Reset states
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      isUnloading.current = false;

      // Process the audio with Deepgram instead of just sending the URI
      if (uri) {
        setIsProcessing(true);
        await processAudioWithDeepgram(uri);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      // Reset states even on error
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      isUnloading.current = false;
      setIsProcessing(false);
    }
  };

  const processAudioWithDeepgram = async (audioUri: string) => {
    try {
      console.log("Processing audio with Deepgram...");

      // Convert URI to Blob
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();

      if (!audioBlob) {
        throw new Error("Failed to convert audio to Blob");
      }

      console.log("Audio Blob size:", audioBlob.size);

      // Send audio blob to Deepgram API
      const deepgramResponse = await fetch(
        "https://api.deepgram.com/v1/listen?smart_format=true&language=en&model=nova-3",
        {
          method: "POST",
          headers: {
            Authorization: "Token d7916ca82390f587e38b1a754aa6bc098e14004f", // Replace with your Deepgram API key
            "Content-Type": "audio/wav",
          },
          body: audioBlob,
        }
      );

      if (!deepgramResponse.ok) {
        throw new Error(`Deepgram API error: ${deepgramResponse.status}`);
      }

      const data = await deepgramResponse.json();
      console.log("Deepgram response:", data);

      if (
        data.results &&
        data.results.channels &&
        data.results.channels.length > 0
      ) {
        const transcriptText =
          data.results.channels[0].alternatives[0].transcript;

        if (transcriptText) {
          console.log("Transcript:", transcriptText);
          setTranscript(transcriptText);

          // Send the audio URI to the parent component
          // We're passing the transcript as a hidden property for processing
          // but it won't be displayed separately
          onSendAudio(audioUri, transcriptText);

          // Send the transcript to Gemini API and speak the response
          await processUserInput(transcriptText);
          await processUserQuery(transcriptText);
        } else {
          throw new Error("No transcript returned from Deepgram API");
        }
      } else {
        throw new Error("Invalid response format or missing transcript data");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setIsProcessing(false);
      Alert.alert(
        "Speech Recognition Error",
        "I'm having trouble understanding. Please try again."
      );
    }
  };

  const wordToNumberMap = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
    "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70,
    "eighty": 80, "ninety": 90, "hundred": 100, "half": 0.5, "quarter": 0.25
};

const wordsToNumber = (words: string): number | null => {
    const parts = words.split(/[-\s]+/); // Split by space or hyphen
    let total = 0;
    let current = 0;

    for (const word of parts) {
        if (wordToNumberMap[word as keyof typeof wordToNumberMap] !== undefined) {
            let num = wordToNumberMap[word as keyof typeof wordToNumberMap];
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
    return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|half|quarter)([-\s]?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety))?\b/gi, (match) => {
        const num = wordsToNumber(match.toLowerCase());
        return num !== null ? num.toString() : match;
    });
};

const processUserInput = async (userText: string) => {
    console.log("Processing input:", userText);

    // Convert words like "fifty-six kg" → "56 kg"
    userText = convertWordsToNumbers(userText);
    console.log("Converted input:", userText);

    // Updated regex to capture water/weight inputs
    const waterMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(ml|milliliters|liters|litres|l)/i);
    const weightMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(kg|pounds)/i);

    let logDetails = null;

    if (waterMatch) {
        let value = parseFloat(waterMatch[1]);
        let unit = waterMatch[2].toLowerCase();

        if (unit.startsWith("l")) {
            value *= 1000;
        }

        logDetails = { category: "water_intake", value, unit: "ml" };
    } else if (weightMatch) {
        let value = parseFloat(weightMatch[1]);
        let unit = weightMatch[2].toLowerCase();

        logDetails = { category: "weight", value, unit };
    }

    if (logDetails && logDetails.value > 0) {
        console.log("✅ Extracted log:", logDetails);
        await logData(logDetails);
    } else {
        console.log("❌ No valid data extracted.");
    }
};

const logData = async ({ category, value, unit }) => {
    const userId = user.user_id;
    const waterCount = value / 250;
    console.log(waterCount);

    try {
        let responseMessage = "";

        if (category === "water_intake") {
            await axios.post(`https://crosscare-backends.onrender.com/api/user/activity/${userId}/water`, { water: waterCount });
            console.log("✅ Water intake logged.");
            responseMessage = `I have logged your water intake of ${value} milliliters. Keep staying hydrated!`;
        } else if (category === "weight") {
            await axios.post(`https://crosscare-backends.onrender.com/api/user/activity/${userId}/weight`, { weight: value, weight_unit: unit });
            console.log("✅ Weight logged.");
            responseMessage = `Your weight of ${value} ${unit} has been recorded.`;
        }

        // Speak the response aloud
        // if (responseMessage) {
        //     speakResponse(responseMessage);
        // }
    } catch (error: any) {
        console.error("❌ Error logging:", error.response ? error.response.data : error.message);
    }
};


const processUserQuery = async (query: string) => {
  try {
    console.log("processUserQuery started with:", query)

    // Always fetch health data regardless of query
    let healthData = null

    if (user && user.user_id) {
      console.log(`User ID available: ${user.user_id}`)
      try {
        const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}`
        console.log(`Making API call to: ${apiUrl}`)

        // Make the API call
        const response = await axios.get(apiUrl)

        console.log("API response status:", response.status)
        console.log("API response data type:", typeof response.data)
        console.log("API response is array:", Array.isArray(response.data) ? response.data.length : "N/A")
        console.log("API response length:", Array.isArray(response.data) ? response.data.length : "N/A")

        // Process the data if we got a response
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log("API data found. First record:", JSON.stringify(response.data[0], null, 2))

          // Sort by date (newest first)
          const sortedRecords = [...response.data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )

          console.log("Sorted records - count:", sortedRecords.length)

          // Get the most recent record
          const latestRecord = sortedRecords[0]
          console.log("Latest record details structure:", JSON.stringify(latestRecord.details || {}, null, 2))

          // Get the last 7 days of records
          const last7Days = sortedRecords.slice(0, 7)

          // Extract weight data - add detailed logging
          let currentWeight = 0
          let weightUnit = "kg"

          if (latestRecord.details && latestRecord.details.weight) {
            currentWeight = latestRecord.details.weight.value || 0
            weightUnit = latestRecord.details.weight.unit || "kg"
            console.log("Found weight data:", currentWeight, weightUnit)
          } else {
            console.log(
              "No weight data in latest record:",
              latestRecord.details ? "Has details but no weight" : "No details property",
            )
          }

          // Add direct access to properties for nested values
          const stepsToday =
            latestRecord.details && typeof latestRecord.details.steps === "number" ? latestRecord.details.steps : 0

          const waterToday =
            latestRecord.details && typeof latestRecord.details.water === "number" ? latestRecord.details.water : 0

          // Find previous weight record
          const prevWeightRecord = sortedRecords.find(
            (r) =>
              r !== latestRecord &&
              r.details &&
              r.details.weight &&
              typeof r.details.weight.value === "number" &&
              r.details.weight.value > 0,
          )

          // Create health data object with safer property access
          healthData = {
            steps: {
              today: stepsToday,
              weekly: last7Days.reduce(
                (sum, record) =>
                  sum + (record.details && typeof record.details.steps === "number" ? record.details.steps : 0),
                0,
              ),
            },
            water: {
              today: waterToday,
              weekly: last7Days.reduce(
                (sum, r) => sum + (r.details && typeof r.details.water === "number" ? r.details.water : 0),
                0,
              ),
            },
            weight: {
              current: currentWeight,
              unit: weightUnit,
              previous:
                prevWeightRecord && prevWeightRecord.details && prevWeightRecord.details.weight
                  ? prevWeightRecord.details.weight.value
                  : 0,
            },
          }

          console.log("Health data extracted successfully:", JSON.stringify(healthData, null, 2))
        } else {
          console.log("No valid data in API response")
        }
      } catch (error: any) {
        console.error("API call error:", error.message)
        console.error("Error stack:", error.stack)
        if (error.response) {
          console.error("API error response status:", error.response.status)
          console.error("API error response data:", JSON.stringify(error.response.data, null, 2))
        }
      }
    } else {
      console.log("No user ID available")
    }

    // Create enhanced prompt with health data if available
    let enhancedPrompt = systemPrompt

    if (healthData) {
      enhancedPrompt += `\n\nUser's health data:\n`

      if (healthData.steps) {
        enhancedPrompt += `- Steps: Today: ${healthData.steps.today}, Weekly total: ${healthData.steps.weekly}\n`
      }

      if (healthData.water) {
        enhancedPrompt += `- Water: Today: ${healthData.water.today} glasses, Weekly total: ${healthData.water.weekly} glasses\n`
      }

      if (healthData.weight && healthData.weight.current > 0) {
        enhancedPrompt += `- Weight: Current: ${healthData.weight.current} ${healthData.weight.unit}`
        if (healthData.weight.previous > 0) {
          const change = healthData.weight.current - healthData.weight.previous
          enhancedPrompt += `, Previous: ${healthData.weight.previous} ${healthData.weight.unit}, Change: ${change > 0 ? "+" : ""}${change} ${healthData.weight.unit}`
        }
        enhancedPrompt += `\n`
      }

      enhancedPrompt += `\nPlease answer the user's question about their health metrics using this data. Be specific and encouraging.`

      console.log("HEALTH DATA SUMMARY:")
      console.log(`- Steps today: ${healthData.steps.today}`)
      console.log(`- Water today: ${healthData.water.today} glasses`)
      console.log(`- Current weight: ${healthData.weight.current} ${healthData.weight.unit}`)
      console.log("Health data successfully added to prompt")
    } else {
      console.log("WARNING: No health data available to add to prompt")
    }

    console.log("Calling Gemini API")

    // Call Gemini API
    const response = await axios({
      method: "post",
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      params: {
        key: apiKey,
      },
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        contents: [
          {
            parts: [{ text: enhancedPrompt }, { text: query }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 1.0,
        },
      },
    })

    console.log("Gemini API response received")

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const assistantMessage = response.data.candidates[0].content.parts[0].text.trim()
      console.log("Assistant response:", assistantMessage)

      // Speak the response
      speakResponse(assistantMessage)

      // Send to parent component
      onSendAudio("", "", assistantMessage)
    } else {
      throw new Error("No valid response from Gemini API")
    }
  } catch (error: any) {
    console.error("Error in processUserQuery:", error.message)
    console.error("Error stack:", error.stack)
    setIsProcessing(false)
    Alert.alert("Error", "I couldn't process your request. Please try again.")
  }
}

  // const processUserQuery = async (query: string) => {
  //   try {
  //     console.log("Sending to Gemini API...");

  //     const response = await axios({
  //       method: "post",
  //       url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  //       params: {
  //         key: apiKey,
  //       },
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       data: {
  //         contents: [
  //           {
  //             parts: [{ text: systemPrompt }, { text: query }],
  //           },
  //         ],
  //         generationConfig: {
  //           maxOutputTokens: 100,
  //           temperature: 1.0, 
  //         },
  //       },
  //     });

  //     console.log("Gemini API response:", response.data);

  //     if (
  //       response.data &&
  //       response.data.candidates &&
  //       response.data.candidates.length > 0
  //     ) {
  //       const assistantMessage =
  //         response.data.candidates[0]?.content?.parts[0]?.text.trim();

  //       if (assistantMessage) {
  //         // Speak the response
  //         speakResponse(assistantMessage);

  //         // Send the assistant's response to the parent component
  //         // We're using a different approach here to avoid duplicate messages
  //         onSendAudio("", "", assistantMessage);
  //       } else {
  //         throw new Error("No valid content in response.");
  //       }
  //     } else {
  //       throw new Error("Invalid response structure or no candidates found.");
  //     }
  //   } catch (error) {
  //     console.error("Error getting response from Gemini API:", error);
  //     setIsProcessing(false);
  //     Alert.alert(
  //       "API Error",
  //       "Sorry, I'm having trouble connecting right now. Please try again later."
  //     );
  //   }
  // };

  const speakResponse = (text: string) => {
    setIsSpeaking(true);

    // Create speech options with the female voice if available
    const speechOptions: Speech.SpeechOptions = {
      language: "en",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        setIsProcessing(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
        setIsProcessing(false);
      },
      onError: (error) => {
        console.error("Speech error:", error);
        setIsSpeaking(false);
        setIsProcessing(false);
      },
    };

    // Add the voice if we found a female one
    if (femaleVoice) {
      speechOptions.voice = femaleVoice.identifier;
    }

    Speech.speak(text, speechOptions);
  };

  return (
    <View style={styles.container}>
      {isRecording ? (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {formatTime({ seconds: recordingDuration })}
          </Text>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={stopRecording}
            activeOpacity={0.8}
          >
            <MaterialIcons name="stop-circle" size={45} color="#883B72" />
          </TouchableOpacity>
        </View>
      ) : isProcessing ? (
        <View style={styles.processingContainer}>
          <Animated.View style={styles.processingIndicator} />
          <Text style={styles.processingText}>
            {isSpeaking ? "Speaking..." : "Processing..."}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.micButton}
          onPress={startRecording}
          activeOpacity={0.7}
        >
          <Feather name="mic" size={19} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    color: "#883B72",
    fontFamily: "Inter400",
  },
  micButton: {
    marginRight: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButton: {
    // Styles for the record button
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    gap: 8,
  },
  processingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E162BC",
    opacity: 0.7,
  },
  processingText: {
    fontSize: 12,
    color: "#883B72",
    fontFamily: "Inter400",
  },
});
