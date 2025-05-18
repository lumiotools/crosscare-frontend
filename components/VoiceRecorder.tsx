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
import * as FileSystem from 'expo-file-system';
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import axios from "axios";
import { systemPrompts } from "@/constants/systemPrompts";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

interface VoiceRecorderProps {
  onSendAudio: (
    audioUri: string,
    transcript?: string,
    assistantResponse?: string
  ) => void;
  systemPrompt?: string;
  apiKey?: string;
  isMuted?: boolean;
  isSpeaking?: boolean
  setIsSpeaking?: React.Dispatch<React.SetStateAction<boolean>>
  isProcessing?: boolean
  setIsProcessing?: React.Dispatch<React.SetStateAction<boolean>>
}
interface FormatTimeProps {
  seconds: number;
}

export default function VoiceRecorder({
  onSendAudio,
  systemPrompt = systemPrompts,
  apiKey = "AIzaSyD0ISmMWP4_yDqEvlrjpNJB8TnuJBkhZPs",
  isMuted,
  isSpeaking,
  setIsSpeaking,
  isProcessing,
  setIsProcessing,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  // const [isProcessing, setIsProcessing] = useState(false);
  // const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUri, setAudioUri] = useState("");
  const [femaleVoice, setFemaleVoice] = useState<Speech.Voice | null>(null);
  const [localMuted, setLocalMuted] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [useElevenLabs, setUseElevenLabs] = useState(true)


    const { t, i18n } = useTranslation()
    const currentLanguage = i18n.language

  // Use either external or local mute state
  const effectiveMuted = isMuted !== undefined ? isMuted : localMuted

  useEffect(() => {
    const loadMuteState = async () => {
      try {
        const savedMuteState = await AsyncStorage.getItem("isMuted")
        if (savedMuteState !== null) {
          setLocalMuted(savedMuteState === "true")
        }
      } catch (error) {
        console.error("Error loading mute state:", error)
      }
    }

    loadMuteState()
  }, [])

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
        if(setIsProcessing) setIsProcessing(true);
        await processAudioWithDeepgram(uri);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      // Reset states even on error
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      isUnloading.current = false;
      if(setIsProcessing) setIsProcessing(false);
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
        "https://api.deepgram.com/v1/listen?smart_format=true&language=multi&model=nova-3",
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
          if (setIsSpeaking) setIsSpeaking(true)

          // Send the transcript to Gemini API and speak the response
          // await processUserInput(transcriptText);
          // await processUserQuery(transcriptText);
        } else {
          throw new Error("No transcript returned from Deepgram API");
        }
      } else {
        throw new Error("Invalid response format or missing transcript data");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      if(setIsProcessing) setIsProcessing(false);
      Alert.alert(
        "Speech Recognition Error",
        "I'm having trouble understanding. Please try again."
      );
    }
  };

  // const speakResponse = (text: string) => {
  //   // Check if muted - if so, don't speak but still process
  //   if (effectiveMuted) {
  //     console.log("Voice is muted, not speaking response:", text)
  //     setIsProcessing(false)
  //     return
  //   }

  //   // If speech is already happening, stop it before starting new speech
  //   if (isSpeaking) {
  //     Speech.stop()
  //     console.log("Speech interrupted.")
  //   }

  //   setIsSpeaking(true)

  //   // Use Eleven Labs if enabled, otherwise use device TTS
  //   if (useElevenLabs) {
  //     generateAndPlayElevenLabsAudio(text).catch((error) => {
  //       console.error("Error with Eleven Labs, falling back to device TTS:", error)
  //       fallbackToDeviceTTS(text)
  //     })
  //   } else {
  //     fallbackToDeviceTTS(text)
  //   }
  // }

  // const fallbackToDeviceTTS = (text: string) => {
  //   // Create speech options with the female voice if available
  //   const speechOptions: Speech.SpeechOptions = {
  //     language: currentLanguage,
  //     pitch: 1.0,
  //     rate: 0.9,
  //     onDone: () => {
  //       setIsSpeaking(false)
  //       setIsProcessing(false)
  //     },
  //     onStopped: () => {
  //       setIsSpeaking(false)
  //       setIsProcessing(false)
  //     },
  //     onError: (error) => {
  //       console.error("Speech error:", error)
  //       setIsSpeaking(false)
  //       setIsProcessing(false)
  //     },
  //   }

  //   // Add the voice if we found a female one
  //   if (femaleVoice) {
  //     speechOptions.voice = femaleVoice.identifier
  //   }

  //   // Start speaking the text
  //   Speech.speak(text, speechOptions)
  // }

  // const generateAndPlayElevenLabsAudio = async (text: string) => {
  //   try {
  //     setIsSpeaking(true)

  //     // Replace with your Eleven Labs API key
  //     const apiKey = "sk_db1991883b2abe5401ed25c8fe0d9e82d69f251467b0909e"

  //     // Validate text is not empty
  //     if (!text || text.trim() === "") {
  //       throw new Error("Cannot generate audio for empty text")
  //     }

  //     // Define verified voice IDs from Eleven Labs for different languages
  //    // Define verified voice IDs from Eleven Labs for different languages
  //     const voiceMap: Record<string, string> = {
  //       en: "21m00Tcm4TlvDq8ikWAM", // Rachel (female English)
  //       es: "EXAVITQu4vr4xnSDxMaL", // Nicole (Spanish female)
  //       fr: "jsCqWAovK2LkecY7zXl4", // Piaf (French female)
  //       pt: "TxGEqnHWrfWFTfGW9XjX", // Luana (Portuguese female)
  //       de: "mXhBjGSy3mMDSNrNwwYP", // Freya (German female)
  //       it: "Knk5QlQkSAd4CUlQHbWV", // Bella (Italian female)
  //       pl: "uWG77CZTYfPZutKWEgwk", // Zofia (Polish female)
  //       hi: "pNInz6obpgDQGcFmaJgB", // Elli (Hindi female)
  //       ja: "VR6AewLTigWG4xSOukaG", // Oren (Japanese female)
  //       ko: "z9fAnlkpzviPz146aGWa", // Gam (Korean female)
  //     }

  //     // Get the voice ID based on language, default to English if not found
  //     const languageCode = currentLanguage.split("-")[0]

  //     const voiceId =  "21m00Tcm4TlvDq8ikWAM"// Default to English Rachel voice if language not found


  //     // Log detailed information for debugging
  //     console.log(`Language setting: "${currentLanguage}, ${languageCode}"`)
  //     console.log(`Voice map:`, JSON.stringify(voiceMap))
  //     console.log(`Selected voice ID: "${voiceId}"`)
  //     console.log(
  //       `Text to be spoken (length: ${text.length}): "${text}${text.length > 50 ? "..." : ""}"`,
  //     )

  //     // Prepare request data
  //     const requestData = {
  //       text,
  //       model_id: "eleven_multilingual_v2", // Use multilingual model for better language support
  //       voice_settings: {
  //         stability: 0.5,
  //         similarity_boost: 0.75,
  //       },
  //     }

  //     console.log("Sending request to Eleven Labs API...")
  //     console.log("Request data:", JSON.stringify(requestData, null, 2))

  //     const response = await axios({
  //       method: "POST",
  //       url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  //       headers: {
  //         "Content-Type": "application/json",
  //         "xi-api-key": apiKey,
  //       },
  //       data: requestData,
  //       responseType: "arraybuffer",
  //       validateStatus: (status) => status < 500, // Don't throw on 4xx errors so we can log them
  //     })

  //     // Check for error responses
  //     if (response.status !== 200) {
  //       // Convert arraybuffer to text for error messages
  //       const errorText = new TextDecoder().decode(response.data)
  //       console.error(`Eleven Labs API error (${response.status}):`, errorText)

  //       let errorMessage = "Error generating audio"

  //       // Try to parse the error message if it's JSON
  //       try {
  //         const errorJson = JSON.parse(errorText)
  //         errorMessage = errorJson.detail?.message || errorJson.message || errorJson.error || errorText
  //       } catch (e) {
  //         // If not JSON, use the raw text
  //         errorMessage = errorText
  //       }

  //       throw new Error(`Eleven Labs API error (${response.status}): ${errorMessage}`)
  //     }

  //     console.log("Received successful response from Eleven Labs API")

  //     // Unload any existing sound
  //     if (sound) {
  //       await sound.unloadAsync()
  //     }

  //     // Create a file URI for the audio in the temporary directory
  //     const fileUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.mp3`

  //     // Write the audio data to a file
  //     await FileSystem.writeAsStringAsync(fileUri, arrayBufferToBase64(response.data), {
  //       encoding: FileSystem.EncodingType.Base64,
  //     })

  //     // Create and play the sound
  //     const { sound: newSound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true })

  //     setSound(newSound)

  //     // Add event listener for when playback finishes
  //     newSound.setOnPlaybackStatusUpdate((status) => {
  //       if (status.isLoaded && status.didJustFinish) {
  //         setIsSpeaking(false)
  //         setIsProcessing(false)
  //       }
  //     })
  //   } catch (error) {
  //     console.error("Error generating or playing Eleven Labs audio:", error)

  //     // More detailed error logging
  //     if (axios.isAxiosError(error)) {
  //       if (error.response) {
  //         // The request was made and the server responded with a status code
  //         // that falls out of the range of 2xx
  //         console.error("Eleven Labs API error response status:", error.response.status)

  //         // Try to get more details from the response
  //         if (error.response.data) {
  //           if (typeof error.response.data === "string") {
  //             console.error("Error response data:", error.response.data)
  //           } else if (error.response.data instanceof ArrayBuffer) {
  //             // Convert ArrayBuffer to string
  //             const decoder = new TextDecoder()
  //             const errorText = decoder.decode(error.response.data)
  //             console.error("Error response data (ArrayBuffer):", errorText)

  //             // Try to parse as JSON
  //             try {
  //               const errorJson = JSON.parse(errorText)
  //               console.error("Parsed error data:", errorJson)
  //             } catch (e) {
  //               // Not JSON, already logged as text
  //             }
  //           } else {
  //             console.error("Error response data:", JSON.stringify(error.response.data, null, 2))
  //           }
  //         }

  //         // Check for specific error conditions
  //         if (error.response.status === 400) {
  //           console.error("Bad request to Eleven Labs API. Common causes include:")
  //           console.error("- Invalid API key")
  //           console.error("- Invalid voice ID")
  //           console.error("- Text content issues (empty, too long, or contains unsupported characters)")
  //           console.error("- Invalid model ID")
  //         } else if (error.response.status === 401) {
  //           console.error("Unauthorized. Check your Eleven Labs API key.")
  //         } else if (error.response.status === 404) {
  //           console.error("Voice ID not found. Check your voice ID.")
  //         }
  //       } else if (error.request) {
  //         // The request was made but no response was received
  //         console.error("No response received from Eleven Labs API:", error.request)
  //       } else {
  //         // Something happened in setting up the request that triggered an Error
  //         console.error("Error setting up Eleven Labs API request:", error.message)
  //       }
  //     }

  //     setIsSpeaking(false)
  //     setIsProcessing(false)

  //     // Fallback to device TTS if Eleven Labs fails
  //     console.log("Falling back to device TTS...")
  //     fallbackToDeviceTTS(text)
  //   }
  // }

  // // Helper function to convert ArrayBuffer to Base64
  // const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  //   let binary = ""
  //   const bytes = new Uint8Array(buffer)
  //   const len = bytes.byteLength
  //   for (let i = 0; i < len; i++) {
  //     binary += String.fromCharCode(bytes[i])
  //   }
  //   return btoa(binary)
  // }

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

// const convertWordsToNumbers = (text: string): string => {
//     return text.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|half|quarter)([-\s]?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety))?\b/gi, (match) => {
//         const num = wordsToNumber(match.toLowerCase());
//         return num !== null ? num.toString() : match;
//     });
// };

// const processUserInput = async (userText: string) => {
//     console.log("Processing input:", userText);

//     // Convert words like "fifty-six kg" → "56 kg"
//     userText = convertWordsToNumbers(userText);
//     console.log("Converted input:", userText);

//     // Updated regex to capture water/weight inputs
//     const waterMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(ml|milliliters|liters|litres|l)/i);
//     const weightMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(kg|pounds)/i);

//     let logDetails = null;

//     if (waterMatch) {
//         let value = parseFloat(waterMatch[1]);
//         let unit = waterMatch[2].toLowerCase();

//         if (unit.startsWith("l")) {
//             value *= 1000;
//         }

//         logDetails = { category: "water", value, unit: "ml" };
//     } else if (weightMatch) {
//         let value = parseFloat(weightMatch[1]);
//         let unit = weightMatch[2].toLowerCase();

//         logDetails = { category: "weight", value, unit };
//     }

//     if (logDetails && logDetails.value > 0) {
//         console.log("✅ Extracted log:", logDetails);
//         await logData(logDetails);
//     } else {
//         console.log("❌ No valid data extracted.");
//     }
// };

// const getSystemPrompt = (language: string) => {
//     // Map language codes to full language names
//     const languageNames: Record<string, string> = {
//       'en': 'English',
//       'es': 'Spanish',
//       'pt': 'Portuguese',
//       'ht': 'Haitian creole'
//     };
    
//     // Get base language code (e.g., 'es' from 'es-ES')
//     const baseLanguage = language.split('-')[0];
//     const languageName = languageNames[baseLanguage];
    
//     return `${systemPrompt}\n\nPlease respond in ${languageName}. Your response should be natural and conversational in ${languageName}.`;
//   };

// const logData = async ({ category, value, unit }) => {
//     const userId = user.user_id;
//     const waterCount = value / 250;
//     console.log(waterCount);

//     try {
//         let responseMessage = "";

//         if (category === "water") {
//             await axios.post(`https://crosscare-backends.onrender.com/api/user/activity/${userId}/water`, { water: waterCount });
//             console.log("✅ Water intake logged.");
//             responseMessage = `I have logged your water intake of ${value} milliliters. Keep staying hydrated!`;
//         } else if (category === "weight") {
//             await axios.post(`https://crosscare-backends.onrender.com/api/user/activity/${userId}/weight`, { weight: value, weight_unit: unit });
//             console.log("✅ Weight logged.");
//             responseMessage = `Your weight of ${value} ${unit} has been recorded.`;
//         }

//         // Speak the response aloud
//         if (responseMessage) {
//             speakResponse(responseMessage);
//         }
//     } catch (error: any) {
//         console.error("❌ Error logging:", error.response ? error.response.data : error.message);
//     }
// };



  // const processUserQuery = async (query: string) => {
  //   try {
  //     console.log("Sending to Gemini API...");
  //     const languagePrompt = getSystemPrompt(currentLanguage);
  //     // console.log("Using language prompt:", languagePrompt);

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
  //             parts: [{ text: languagePrompt }, { text: query }],
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

//   const speakResponse = (text: string) => {
//     // Check if muted - if so, don't speak but still process
//     if (effectiveMuted) {
//       console.log("Voice is muted, not speaking response:", text)
//       setIsProcessing(false)
//       return
//     }

//     // If speech is already happening, stop it before starting new speech
//     if (isSpeaking) {
//       Speech.stop();
//       console.log("Speech interrupted.");
//     }

//     setIsSpeaking(true)

//     // Create speech options with the female voice if available
//     const speechOptions: Speech.SpeechOptions = {
//       language: currentLanguage,
//       pitch: 1.0,
//       rate: 0.9,
//       onDone: () => {
//         setIsSpeaking(false)
//         setIsProcessing(false)
//       },
//       onStopped: () => {
//         setIsSpeaking(false)
//         setIsProcessing(false)
//       },
//       onError: (error) => {
//         console.error("Speech error:", error)
//         setIsSpeaking(false)
//         setIsProcessing(false)
//       },
//     }

//     // Add the voice if we found a female one
//     if (femaleVoice) {
//       speechOptions.voice = femaleVoice.identifier
//     }

//     // Start speaking the text
//     Speech.speak(text, speechOptions)
// }



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