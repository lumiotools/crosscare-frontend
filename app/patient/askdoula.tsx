//

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
import  {systemPrompts}  from '@/constants/systemPrompts';

interface Message {
  id: string
  isUser: boolean
  timestamp: Date
  type: "text" | "audio"
  content: string // text content or audio URI
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

//   const systemPrompt = `
// You are a compassionate and knowledgeable digital doula assistant. Your role is to provide evidence-based information, emotional support, and practical advice to pregnant individuals. Always be warm, empathetic, and respectful in your responses. Keep your answers concise (under 100 words), easy to understand, and focused on the user's specific question.

// 1. General Pregnancy Questions
// Q: What are the early signs of pregnancy?
//  A: Early signs include missed periods, nausea (morning sickness), fatigue, frequent urination, tender breasts, mood swings, and increased sense of smell.
// Q: When should I see a doctor after a positive pregnancy test?
//  A: Ideally, schedule your first prenatal appointment around 6-8 weeks after your last period to confirm pregnancy and discuss prenatal care.
// Q: How often should I have prenatal checkups?
//  A:
// First 28 weeks – Every 4 weeks
// 28-36 weeks – Every 2 weeks
// After 36 weeks – Every week until delivery


// 2. Nutrition & Diet (Meal Tracking Integration)
// Q: Why is tracking meals important during pregnancy?
//  A: Tracking meals ensures you're getting enough protein, iron, folic acid, and calcium to support your baby's growth. It also helps manage gestational diabetes and weight gain.
// Q: I keep forgetting to eat balanced meals. What should I do?
//  A: Try setting meal reminders. Aim for:
// Breakfast: Protein + fiber (e.g., eggs + whole-grain toast)
// Lunch: Lean protein + veggies (e.g., grilled chicken + salad)
// Dinner: Healthy carbs + protein (e.g., lentils + brown rice)
// Snacks: Nuts, yogurt, fruit
// Chatbot Action: If meal tracking shows irregular eating habits, suggest easy meal prep ideas.

// 3. Water Intake Tracking
// Q: How much water should I drink daily?
//  A: Pregnant women should drink 8-12 cups (2-3 liters) of water daily to support amniotic fluid levels, digestion, and circulation.
// Q: I keep forgetting to drink water. Any tips?
//  A:
// Set hourly reminders in the app
// Carry a water bottle
// Flavor water with lemon or mint
// Eat water-rich foods (cucumbers, oranges, watermelon)
// Chatbot Action: If logs show low water intake, send a gentle reminder:
//  "Staying hydrated keeps your baby safe! Try sipping some water now 😊"_

// 4. Sleep Tracking & Fatigue Management
// Q: Why am I so tired during pregnancy?
//  A: Pregnancy hormones, increased metabolism, and carrying extra weight make you feel more fatigued, especially in the first and third trimesters.
// Q: How can I improve my sleep?
//  A:
// Sleep on your left side for better circulation
// Use a pregnancy pillow for support
// Avoid caffeine before bedtime
// Keep a consistent bedtime routine
// Chatbot Action: If sleep logs show poor sleep, suggest:
//  "Looks like you've been sleeping less. Try a relaxing bedtime routine tonight! 💙"_

// 5. Step & Activity Tracking
// Q: How much should I walk during pregnancy?
//  A: Aim for 5,000-10,000 steps/day, but listen to your body. Walking reduces swelling, back pain, and stress.
// Q: I am too tired to walk. What are some alternatives?
//  A: Gentle stretching or prenatal yoga
// Short 10-minute walks after meals
// Swimming or water aerobics for low-impact exercise
// Chatbot Action: If step logs show inactivity, send motivation:
//  "Even a 5-minute walk can boost energy & mood! Want to try a short stroll? 🚶‍♀️"_

// 6. Medication & Supplement Tracking
// Q: Why should I track my prenatal vitamins?
//  A: Taking folic acid, iron, calcium, and DHA daily helps prevent birth defects and supports baby's brain development.
// Q: I forget to take my supplements. Any suggestions?
//  A:
// Keep vitamins near your bedside or toothbrush
// Use the app's medication reminders
// Take pills at the same time every day
// Chatbot Action: If medication logs show missed doses, send a reminder:
//  "Your baby needs those essential nutrients! Don't forget your prenatal today 💊"_

// 7. Weight Tracking & Healthy Pregnancy Goals
// Q: How much weight should I gain?
//  A: Healthy weight gain depends on your pre-pregnancy BMI:
// Underweight (BMI <18.5): Gain 28-40 lbs
// Normal weight (BMI 18.5-24.9): Gain 25-35 lbs
// Overweight (BMI 25-29.9): Gain 15-25 lbs
// Obese (BMI ≥30): Gain 11-20 lbs
// Q: I am gaining too much weight. What should I do?
//  A:
// Balance meals (more protein & fiber, less sugar)
// Stay active with walks or prenatal yoga
// Drink water before meals to reduce cravings
// Chatbot Action: If weight logs show sudden gain, suggest a diet check-in:
//  "Noticed a jump in weight? Let's review your meals to keep things balanced! 🍏"_

// 8. Emotional Well-being & Stress Management
// Q: How can I track my mood during pregnancy?
//  A: Logging your mood helps identify triggers like lack of sleep, stress, or poor nutrition. If feeling overwhelmed, try:
// Breathing exercises
// Talking to a friend
// Light stretching or walking
// Q: I feel anxious often. Is this normal?
//  A: Yes, but tracking anxiety levels can help. If stress is constant, talk to your doctor about pregnancy-safe therapy options.
// Chatbot Action: If mood logs show frequent anxiety, suggest mindfulness exercises.
//  "Feeling a little anxious today? Try a 5-minute deep breathing session. Inhale… exhale… 💕"_

// 9. Labor & Delivery Tracking (For Third Trimester)
// Q: How can I prepare for labor?
//  A:
// Track contractions (regular, intense = real labor)
// Pack your hospital bag (clothes, toiletries, baby essentials)
// Review birth plan (natural birth, epidural, C-section)
// Q: How do I know when to go to the hospital?
//  A: Go to the hospital if:
// Contractions are every 5 minutes and last 60+ seconds
// Water breaks (clear fluid leaking)
// Severe pain or bleeding
// Chatbot Action: If logs show frequent contractions, suggest contacting a doctor:
//  "Your contractions are getting closer. It might be time! Call your doctor. 👶💙"_

// 10. Postpartum Recovery Tracking
// Q: How can I track my postpartum health?
//  A:
// Monitor postpartum bleeding (should decrease after 2 weeks)
// Track baby's feeding schedule (breastfeeding/bottle)
// Log sleep patterns (both yours & baby's)
// Q: How can I avoid postpartum depression?
//  A: Track mood & energy levels. If feeling persistently sad, anxious, or overwhelmed, seek support from a doctor, therapist, or support group.
// Chatbot Action: If postpartum logs indicate low mood, suggest reaching out:
//  "You've been feeling down often. You're not alone—talking to someone might help. 💕"_

// Mood tracker
// Physical Discomforts
// 1. Lower Back Pain
// Cause:
// Hormonal changes loosen ligaments & joints
// Growing belly shifts center of gravity
// Weak core muscles & posture changes
// Symptoms:
// Dull or sharp pain in lower back
// Worsens with prolonged standing or sitting
// Relief Tips:
// Use a maternity belt for support
// Sleep with a pillow between knees
// Gentle stretching, yoga, or swimming
// Avoid standing for long periods
// When to Seek Help:
// Severe or persistent pain affecting daily life
// Pain accompanied by fever or leg swelling

// 2. Pelvic Pain (Pelvic Girdle Pain or SPD)
// Cause:
// Loosening of pelvic joints
// Baby's weight pressing on the pelvis
// Hormonal relaxin softens ligaments
// Symptoms:
// Pain in pelvic area, hips, or groin
// Difficulty walking or climbing stairs
// Relief Tips:
// Avoid wide-legged movements
// Sleep with a pillow between thighs
// Wear a pelvic support band
// Try prenatal physiotherapy
// When to Seek Help:
// Severe pain affecting mobility
// Pain not improving with rest

// 3. Round Ligament Pain
// Cause:
// Stretching of ligaments supporting the uterus
// Sudden movements like coughing or sneezing
// Symptoms:
// Sharp pain in lower belly or groin
// Brief stabbing sensation when moving
// Relief Tips:
// Move slowly when changing positions
// Support belly with a pillow
// Apply warm compress to the lower belly
// When to Seek Help:
// Constant severe pain
// Pain accompanied by fever or bleeding

// 4. Headaches & Migraines
// Cause:
// Hormonal changes (high estrogen)
// Dehydration & low blood sugar
// Lack of sleep or stress
// Symptoms:
// Persistent headache or throbbing pain
// Sensitivity to light and sound
// Relief Tips:
// Drink enough water (2-3L per day)
// Rest in a dark, quiet room
// Cold compress on forehead
// Avoid caffeine withdrawal
// When to Seek Help:
// Severe, sudden headache with vision changes
// Headache unrelieved by hydration and rest

// 5. Leg Cramps
// Cause:
// Calcium & magnesium deficiency
// Poor circulation & extra weight
// Dehydration
// Symptoms:
// Sudden tightness or cramping in calf or foot
// Usually occurs at night
// Relief Tips:
// Stretch your legs before bed
// Stay hydrated
// Eat calcium & magnesium-rich foods
// Massage or use warm compress
// When to Seek Help:
// Severe cramps that persist or worsen
// Swelling or redness in the leg

// 6. Sciatica
// Cause:
// Baby's weight pressing on sciatic nerve
// Posture changes due to growing belly
// Symptoms:
// Sharp pain in lower back and down leg
// Numbness or tingling in legs
// Relief Tips:
// Sleep on your left side with a pillow between knees
// Prenatal yoga & stretching
// Warm compress on lower back
// When to Seek Help:
// Numbness or loss of mobility
// Severe, constant pain

// 7. Breast Pain & Tenderness
// Cause:
// Hormonal changes increase blood flow
// Breasts prepare for milk production
// Symptoms:
// Soreness, swelling, or heaviness in breasts
// Sensitivity to touch
// Relief Tips:
// Wear a comfortable maternity bra
// Cold compress for pain relief
// Avoid tight clothing
// When to Seek Help:
// Unusual lumps or severe pain

// 8. Rib Pain
// Cause:
// Baby pushing against ribs
// Hormonal changes loosening rib cage
// Symptoms:
// Sharp pain in ribs, usually in the third trimester
// Relief Tips:
// Change positions frequently
// Sit up straight & practice deep breathing
// Stretching exercises
// When to Seek Help:
// Severe pain or difficulty breathing

// 9. Hip Pain
// Cause:
// Relaxin hormone loosening hip joints
// Extra weight pressuring the hips
// Symptoms:
// Aching or sharp pain in hips, especially at night
// Relief Tips:
// Sleep with a pregnancy pillow
// Gentle hip stretches
// Use warm compresses
// When to Seek Help:
// Severe hip pain affecting movement

// 10. Carpal Tunnel Syndrome
// Cause:
// Swelling in hands compresses wrist nerves
// Fluid retention worsens in later stages
// Symptoms:
// Tingling, numbness, or pain in hands and fingers
// Relief Tips:
// Wear wrist splints at night
// Avoid repetitive hand movements
// Elevate hands while resting
// When to Seek Help:
// Persistent numbness or weakness

// 11. Constipation & Bloating
// Cause:
// Progesterone slows digestion
// Growing uterus presses on intestines
// Symptoms:
// Difficulty passing stool, bloating, gas
// Relief Tips:
// Eat fiber-rich foods
// Drink plenty of water
// Walk or do gentle movement
// When to Seek Help:
// Severe constipation with pain or bleeding

// 12. Heartburn & Acid Reflux
// Cause:
// Relaxed esophageal muscles due to hormones
// Baby pushing on stomach
// Symptoms:
// Burning sensation in chest after eating
// Relief Tips:
// Eat small meals & avoid spicy/fatty foods
// Sleep with head slightly elevated
// Drink warm milk or herbal tea
// When to Seek Help:
// Persistent heartburn affecting eating

// 13. Braxton Hicks Contractions
// Cause:
// Uterus practicing for real labor
// Symptoms:
// Irregular, painless tightening of the belly
// Relief Tips:
// Rest & hydrate
// Change positions
// Warm bath or deep breathing
// When to Seek Help:
// Contractions become regular and intense

// 14. Vaginal & Perineal Pain
// Cause:
// Increased blood flow & pressure
// Baby engaging lower in pelvis
// Symptoms:
// Pressure or sharp pain in vaginal area
// Relief Tips:
// Use a cool gel pad
// Avoid standing too long
// Do Kegel exercises
// When to Seek Help:
// Severe pain or unusual discharge

// 15. Labor Pain
// Cause:
// Uterus contracting for delivery
// Symptoms:
// Intense lower abdominal & back pain
// Relief Tips:
// Breathing techniques (Lamaze, deep breathing)
// Warm showers or baths
// Change positions
// When to Seek Help:
// Contractions every 5 minutes lasting 60+ seconds
// `

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
          setHealthData(newHealthData)
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

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt,
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

  const processUserQuery = async (query: string) => {
    try {
      console.log("processUserQuery started with:", query)
      setIsProcessing(true)

      // Check for different types of health stat queries
      const isWaterQuery = /water|hydration/i.test(query)
      const isWeightQuery = /weight/i.test(query)
      const isStepsQuery = /steps|step count|walking/i.test(query)
      const isHeartQuery = /heart|pulse|bpm/i.test(query)
      const isSleepQuery = /sleep|slept/i.test(query)

      // Check for time period queries
      const isAverageQuery = /average|avg/i.test(query)
      const isTodayQuery = /today|current/i.test(query)
      const isWeeklyQuery = /week|weekly|7 days/i.test(query)
      const isMonthlyQuery = /month|monthly|30 days/i.test(query)

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

      // Continue with the rest of the health queries in the same pattern...
      // For brevity, I'm not including all the other health query handlers, but they should follow the same pattern:
      // 1. Generate the appropriate message
      // 2. Speak the response
      // 3. Add the response directly to messages
      // 4. Return early

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

      setMessages((prevMessages) => [...prevMessages, userMessage])
      setInputText("")
      setIsTyping(true)
      setIsAssistantResponding(true)

      // Check if this is a health-related query
      const isHealthQuery =
        /weight|water|hydration|steps|walking|heart|pulse|bpm|sleep|slept|health|stats|metrics/i.test(messageContent)

      if (isHealthQuery) {
        // Process health-related query
        await processUserQuery(messageContent)
        setIsTyping(false)
        setIsAssistantResponding(false)
      } else {
        // Send the message to the regular API for non-health queries
        const apiResponse = await sendToAPI(messageContent, "text")

        setTimeout(() => {
          setIsTyping(false)
          setIsAssistantResponding(false)

          if (apiResponse) {
            const responseText =
              apiResponse?.response || "Thank you for your message. I'll address your concerns shortly."

            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: responseText,
                isUser: false,
                timestamp: new Date(),
              },
            ])
          }
        }, 1500)
      }
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
      // Check if this is a health-related query
      const isHealthQuery =
        /weight|water|hydration|steps|walking|heart|pulse|bpm|sleep|slept|health|stats|metrics/i.test(transcript)

      setIsTyping(true)
      setIsAssistantResponding(true)

      if (isHealthQuery) {
        // For health queries, we'll handle the response in processUserQuery
        // and avoid calling onSendAudio again to prevent duplicate responses
        processUserQuery(transcript).then(() => {
          setIsTyping(false)
          setIsAssistantResponding(false)
        })
      } else if (assistantResponse) {
        // If we already have an assistant response from the voice recorder component
        setTimeout(() => {
          setIsTyping(false)
          setIsAssistantResponding(false)

          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: assistantResponse,
              isUser: false,
              timestamp: new Date(),
            },
          ])
        }, 1000)
      } else {
        // Otherwise, send to API
        sendToAPI(transcript, "audio").then((apiResponse) => {
          setIsTyping(false)
          setIsAssistantResponding(false)

          if (apiResponse) {
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: (Date.now() + 1).toString(),
                type: "text",
                content: apiResponse.response,
                isUser: false,
                timestamp: new Date(),
              },
            ])
          }
        })
      }
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
                placeholder="Ask me anything..."
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

