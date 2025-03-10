import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import * as Speech from "expo-speech";

const API_URL = "32c98a69-6de8-4f7c-af3e-eb341e6d56b3"; // Replace with your actual backend URL

const VoiceChat = () => {
  const transcriptRef = useRef("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to speak and analyze response
  const startSpeaking = async () => {
    const text = "Hello, how can I assist you today?"; // Example input
    transcriptRef.current = text; // Store text in ref
    Speech.speak(text, { language: "en-US" });

    analyzeTranscript();
  };

  // Function to analyze transcript
  const analyzeTranscript = async () => {
    console.log("Current Transcript:", transcriptRef.current);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/data3/analyze-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptRef.current }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Analysis Response:", data);

      setResponseText(data.message || "No response received."); // Handle API response
      Speech.speak(data.message || "I didn't get that.");
    } catch (error) {
      console.error("Error analyzing transcript:", error);
      setResponseText("Error processing your request.");
    }

    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* Button to start speaking */}
      <TouchableOpacity
        onPress={startSpeaking}
        style={{
          backgroundColor: "#6200ea",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 16 }}>Talk to AI</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#6200ea" />}

      {/* Display AI Response */}
      {responseText && (
        <Text style={{ marginTop: 20, fontSize: 18, color: "blue" }}>
          {responseText}
        </Text>
      )}
    </View>
  );
};

export default VoiceChat;
