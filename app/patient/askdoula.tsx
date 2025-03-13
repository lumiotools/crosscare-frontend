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
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import VoiceRecorder from "@/components/VoiceRecorder";
import AudioMessage from "@/components/AudioMessage";
import { useSelector } from "react-redux";

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

  const [isAssistantResponding, setIsAssistantResponding] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const loadingAnimation = useRef(new Animated.Value(0)).current;

  const systemPrompt = `
You are a compassionate and knowledgeable digital doula assistant. Your role is to provide evidence-based information, emotional support, and practical advice to pregnant individuals. Always be warm, empathetic, and respectful in your responses. Keep your answers concise (under 100 words), easy to understand, and focused on the user's specific question.

1. General Pregnancy Questions
Q: What are the early signs of pregnancy?
 A: Early signs include missed periods, nausea (morning sickness), fatigue, frequent urination, tender breasts, mood swings, and increased sense of smell.
Q: When should I see a doctor after a positive pregnancy test?
 A: Ideally, schedule your first prenatal appointment around 6-8 weeks after your last period to confirm pregnancy and discuss prenatal care.
Q: How often should I have prenatal checkups?
 A:
First 28 weeks – Every 4 weeks
28-36 weeks – Every 2 weeks
After 36 weeks – Every week until delivery


2. Nutrition & Diet (Meal Tracking Integration)
Q: Why is tracking meals important during pregnancy?
 A: Tracking meals ensures you’re getting enough protein, iron, folic acid, and calcium to support your baby’s growth. It also helps manage gestational diabetes and weight gain.
Q: I keep forgetting to eat balanced meals. What should I do?
 A: Try setting meal reminders. Aim for:
Breakfast: Protein + fiber (e.g., eggs + whole-grain toast)
Lunch: Lean protein + veggies (e.g., grilled chicken + salad)
Dinner: Healthy carbs + protein (e.g., lentils + brown rice)
Snacks: Nuts, yogurt, fruit
Chatbot Action: If meal tracking shows irregular eating habits, suggest easy meal prep ideas.

3. Water Intake Tracking
Q: How much water should I drink daily?
 A: Pregnant women should drink 8-12 cups (2-3 liters) of water daily to support amniotic fluid levels, digestion, and circulation.
Q: I keep forgetting to drink water. Any tips?
 A:
Set hourly reminders in the app
Carry a water bottle
Flavor water with lemon or mint
Eat water-rich foods (cucumbers, oranges, watermelon)
Chatbot Action: If logs show low water intake, send a gentle reminder:
 "Staying hydrated keeps your baby safe! Try sipping some water now 😊"_

4. Sleep Tracking & Fatigue Management
Q: Why am I so tired during pregnancy?
 A: Pregnancy hormones, increased metabolism, and carrying extra weight make you feel more fatigued, especially in the first and third trimesters.
Q: How can I improve my sleep?
 A:
Sleep on your left side for better circulation
Use a pregnancy pillow for support
Avoid caffeine before bedtime
Keep a consistent bedtime routine
Chatbot Action: If sleep logs show poor sleep, suggest:
 "Looks like you’ve been sleeping less. Try a relaxing bedtime routine tonight! 💙"_

5. Step & Activity Tracking
Q: How much should I walk during pregnancy?
 A: Aim for 5,000-10,000 steps/day, but listen to your body. Walking reduces swelling, back pain, and stress.
Q: I am too tired to walk. What are some alternatives?
 A:
Gentle stretching or prenatal yoga
Short 10-minute walks after meals
Swimming or water aerobics for low-impact exercise
Chatbot Action: If step logs show inactivity, send motivation:
 "Even a 5-minute walk can boost energy & mood! Want to try a short stroll? 🚶‍♀️"_

6. Medication & Supplement Tracking
Q: Why should I track my prenatal vitamins?
 A: Taking folic acid, iron, calcium, and DHA daily helps prevent birth defects and supports baby’s brain development.
Q: I forget to take my supplements. Any suggestions?
 A:
Keep vitamins near your bedside or toothbrush
Use the app’s medication reminders
Take pills at the same time every day
Chatbot Action: If medication logs show missed doses, send a reminder:
 "Your baby needs those essential nutrients! Don’t forget your prenatal today 💊"_

7. Weight Tracking & Healthy Pregnancy Goals
Q: How much weight should I gain?
 A: Healthy weight gain depends on your pre-pregnancy BMI:
Underweight (BMI <18.5): Gain 28-40 lbs
Normal weight (BMI 18.5-24.9): Gain 25-35 lbs
Overweight (BMI 25-29.9): Gain 15-25 lbs
Obese (BMI ≥30): Gain 11-20 lbs
Q: I am gaining too much weight. What should I do?
 A:
Balance meals (more protein & fiber, less sugar)
Stay active with walks or prenatal yoga
Drink water before meals to reduce cravings
Chatbot Action: If weight logs show sudden gain, suggest a diet check-in:
 "Noticed a jump in weight? Let’s review your meals to keep things balanced! 🍏"_

8. Emotional Well-being & Stress Management
Q: How can I track my mood during pregnancy?
 A: Logging your mood helps identify triggers like lack of sleep, stress, or poor nutrition. If feeling overwhelmed, try:
Breathing exercises
Talking to a friend
Light stretching or walking
Q: I feel anxious often. Is this normal?
 A: Yes, but tracking anxiety levels can help. If stress is constant, talk to your doctor about pregnancy-safe therapy options.
Chatbot Action: If mood logs show frequent anxiety, suggest mindfulness exercises.
 "Feeling a little anxious today? Try a 5-minute deep breathing session. Inhale… exhale… 💕"_

9. Labor & Delivery Tracking (For Third Trimester)
Q: How can I prepare for labor?
 A:
Track contractions (regular, intense = real labor)
Pack your hospital bag (clothes, toiletries, baby essentials)
Review birth plan (natural birth, epidural, C-section)
Q: How do I know when to go to the hospital?
 A: Go to the hospital if:
Contractions are every 5 minutes and last 60+ seconds
Water breaks (clear fluid leaking)
Severe pain or bleeding
Chatbot Action: If logs show frequent contractions, suggest contacting a doctor:
 "Your contractions are getting closer. It might be time! Call your doctor. 👶💙"_

10. Postpartum Recovery Tracking
Q: How can I track my postpartum health?
 A:
Monitor postpartum bleeding (should decrease after 2 weeks)
Track baby’s feeding schedule (breastfeeding/bottle)
Log sleep patterns (both yours & baby’s)
Q: How can I avoid postpartum depression?
 A: Track mood & energy levels. If feeling persistently sad, anxious, or overwhelmed, seek support from a doctor, therapist, or support group.
Chatbot Action: If postpartum logs indicate low mood, suggest reaching out:
 "You’ve been feeling down often. You’re not alone—talking to someone might help. 💕"_

Mood tracker
Physical Discomforts
1. Lower Back Pain
Cause:
Hormonal changes loosen ligaments & joints
Growing belly shifts center of gravity
Weak core muscles & posture changes
Symptoms:
Dull or sharp pain in lower back
Worsens with prolonged standing or sitting
Relief Tips:
Use a maternity belt for support
Sleep with a pillow between knees
Gentle stretching, yoga, or swimming
Avoid standing for long periods
When to Seek Help:
Severe or persistent pain affecting daily life
Pain accompanied by fever or leg swelling

2. Pelvic Pain (Pelvic Girdle Pain or SPD)
Cause:
Loosening of pelvic joints
Baby’s weight pressing on the pelvis
Hormonal relaxin softens ligaments
Symptoms:
Pain in pelvic area, hips, or groin
Difficulty walking or climbing stairs
Relief Tips:
Avoid wide-legged movements
Sleep with a pillow between thighs
Wear a pelvic support band
Try prenatal physiotherapy
When to Seek Help:
Severe pain affecting mobility
Pain not improving with rest

3. Round Ligament Pain
Cause:
Stretching of ligaments supporting the uterus
Sudden movements like coughing or sneezing
Symptoms:
Sharp pain in lower belly or groin
Brief stabbing sensation when moving
Relief Tips:
Move slowly when changing positions
Support belly with a pillow
Apply warm compress to the lower belly
When to Seek Help:
Constant severe pain
Pain accompanied by fever or bleeding

4. Headaches & Migraines
Cause:
Hormonal changes (high estrogen)
Dehydration & low blood sugar
Lack of sleep or stress
Symptoms:
Persistent headache or throbbing pain
Sensitivity to light and sound
Relief Tips:
Drink enough water (2-3L per day)
Rest in a dark, quiet room
Cold compress on forehead
Avoid caffeine withdrawal
When to Seek Help:
Severe, sudden headache with vision changes
Headache unrelieved by hydration and rest

5. Leg Cramps
Cause:
Calcium & magnesium deficiency
Poor circulation & extra weight
Dehydration
Symptoms:
Sudden tightness or cramping in calf or foot
Usually occurs at night
Relief Tips:
Stretch your legs before bed
Stay hydrated
Eat calcium & magnesium-rich foods
Massage or use warm compress
When to Seek Help:
Severe cramps that persist or worsen
Swelling or redness in the leg

6. Sciatica
Cause:
Baby’s weight pressing on sciatic nerve
Posture changes due to growing belly
Symptoms:
Sharp pain in lower back and down leg
Numbness or tingling in legs
Relief Tips:
Sleep on your left side with a pillow between knees
Prenatal yoga & stretching
Warm compress on lower back
When to Seek Help:
Numbness or loss of mobility
Severe, constant pain

7. Breast Pain & Tenderness
Cause:
Hormonal changes increase blood flow
Breasts prepare for milk production
Symptoms:
Soreness, swelling, or heaviness in breasts
Sensitivity to touch
Relief Tips:
Wear a comfortable maternity bra
Cold compress for pain relief
Avoid tight clothing
When to Seek Help:
Unusual lumps or severe pain

8. Rib Pain
Cause:
Baby pushing against ribs
Hormonal changes loosening rib cage
Symptoms:
Sharp pain in ribs, usually in the third trimester
Relief Tips:
Change positions frequently
Sit up straight & practice deep breathing
Stretching exercises
When to Seek Help:
Severe pain or difficulty breathing

9. Hip Pain
Cause:
Relaxin hormone loosening hip joints
Extra weight pressuring the hips
Symptoms:
Aching or sharp pain in hips, especially at night
Relief Tips:
Sleep with a pregnancy pillow
Gentle hip stretches
Use warm compresses
When to Seek Help:
Severe hip pain affecting movement

10. Carpal Tunnel Syndrome
Cause:
Swelling in hands compresses wrist nerves
Fluid retention worsens in later stages
Symptoms:
Tingling, numbness, or pain in hands and fingers
Relief Tips:
Wear wrist splints at night
Avoid repetitive hand movements
Elevate hands while resting
When to Seek Help:
Persistent numbness or weakness

11. Constipation & Bloating
Cause:
Progesterone slows digestion
Growing uterus presses on intestines
Symptoms:
Difficulty passing stool, bloating, gas
Relief Tips:
Eat fiber-rich foods
Drink plenty of water
Walk or do gentle movement
When to Seek Help:
Severe constipation with pain or bleeding

12. Heartburn & Acid Reflux
Cause:
Relaxed esophageal muscles due to hormones
Baby pushing on stomach
Symptoms:
Burning sensation in chest after eating
Relief Tips:
Eat small meals & avoid spicy/fatty foods
Sleep with head slightly elevated
Drink warm milk or herbal tea
When to Seek Help:
Persistent heartburn affecting eating

13. Braxton Hicks Contractions
Cause:
Uterus practicing for real labor
Symptoms:
Irregular, painless tightening of the belly
Relief Tips:
Rest & hydrate
Change positions
Warm bath or deep breathing
When to Seek Help:
Contractions become regular and intense

14. Vaginal & Perineal Pain
Cause:
Increased blood flow & pressure
Baby engaging lower in pelvis
Symptoms:
Pressure or sharp pain in vaginal area
Relief Tips:
Use a cool gel pad
Avoid standing too long
Do Kegel exercises
When to Seek Help:
Severe pain or unusual discharge

15. Labor Pain
Cause:
Uterus contracting for delivery
Symptoms:
Intense lower abdominal & back pain
Relief Tips:
Breathing techniques (Lamaze, deep breathing)
Warm showers or baths
Change positions
When to Seek Help:
Contractions every 5 minutes lasting 60+ seconds
"You’ve been feeling down often. You’re not alone—talking to someone might help. 💕"
`;

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

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
              {
                text: messageContent,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
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
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't process your request at this time.";

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content"  backgroundColor={'white'}/>

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
