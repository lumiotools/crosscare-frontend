"use client"

import { useEffect, useState, useRef } from "react"
import {
  QUESTIONNAIRE_DOMAINS,
  type QuestionnaireResponse,
  type QuestionnaireState,
  initialQuestionnaireState,
} from "../constants/questionaireData"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { useSelector } from "react-redux"

interface QuestionnaireManagerProps {
  userId: string
  onQuestionReady: (question: string) => void
  onQuestionnaireComplete: () => void
  onResponseSaved: (response: QuestionnaireResponse) => void
}

const QuestionnaireManager = ({
  userId,
  onQuestionReady,
  onQuestionnaireComplete,
  onResponseSaved,
}: QuestionnaireManagerProps) => {
  const [state, setState] = useState<QuestionnaireState>(initialQuestionnaireState)
  const [introStep, setIntroStep] = useState(0) // Track which intro message we're on
  const [hasStartedQuestionnaire, setHasStartedQuestionnaire] = useState(false)
  const [hasAskedForTime, setHasAskedForTime] = useState(false) // Track if we've asked "Do you have a few minutes?"
  const [userWantsToStart, setUserWantsToStart] = useState(false) // Track user's response to time question
  const user = useSelector((state: any) => state.user)

  // Use refs to track sent messages and prevent duplicates
  const sentMessages = useRef(new Set()).current
  const isStartingQuestionnaire = useRef(false)

  // Add a new state variable to track if intro has been shown before
  const [hasSeenIntro, setHasSeenIntro] = useState(false)

  // Add a ref to store the last question sent
  const lastQuestionSent = useRef({
    domainId: "",
    questionId: "",
    questionText: "",
  })

  // Add a function to save the last question sent
  const saveLastQuestion = async (domainId: string, questionId: string, questionText: string) => {
    try {
      const lastQuestion = {
        domainId,
        questionId,
        questionText,
      }

      lastQuestionSent.current = lastQuestion
      await AsyncStorage.setItem(`last_question_${userId}`, JSON.stringify(lastQuestion))
      console.log("Saved last question:", lastQuestion)
    } catch (error) {
      console.error("Error saving last question:", error)
    }
  }

  // Load questionnaire state from AsyncStorage on component mount
  useEffect(() => {
    loadQuestionnaireState()
  }, [])

  // Save questionnaire state to AsyncStorage whenever it changes
  useEffect(() => {
    saveQuestionnaireState()
  }, [state])

  // Replace the checkIfIntroShown function with this improved version
  const checkIfIntroShown = async () => {
    try {
      console.log("Checking if intro has been shown for user:", userId)
      const introShown = await AsyncStorage.getItem(`intro_shown_${userId}`)
      console.log("Intro shown value from AsyncStorage:", introShown)

      if (introShown === "true") {
        console.log("User has already seen intro, skipping to questions")
        setHasSeenIntro(true)

        // Skip intro by setting the step to 4
        setIntroStep(4)

        // Important: Mark questionnaire as started
        setHasStartedQuestionnaire(true)

        // Set the questionnaire to active state if it wasn't already
        setState((prevState) => ({
          ...prevState,
          isActive: true,
        }))

        return true // Return true to indicate intro has been shown
      }
      return false // Return false to indicate intro has not been shown
    } catch (error) {
      console.error("Error checking if intro has been shown:", error)
      return false
    }
  }

  // Also update the loadQuestionnaireState function to ensure intro messages don't show again
  const loadQuestionnaireState = async () => {
    try {
      console.log("Loading questionnaire state for user:", userId)

      // First check if there's a paused questionnaire
      const savedState = await AsyncStorage.getItem(`questionnaire_state_${userId}`)
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        // Convert string timestamps back to Date objects
        parsedState.responses = parsedState.responses.map((response: any) => ({
          ...response,
          timestamp: new Date(response.timestamp),
        }))

        // Set the state with the saved values
        setState(parsedState)

        // If we're loading a paused state, skip the intro sequence
        if (parsedState.isPaused) {
          console.log("Found paused questionnaire, skipping intro")
          setIntroStep(4) // Skip intro sequence
          setHasStartedQuestionnaire(true)
          setHasSeenIntro(true) // Mark intro as seen when resuming a paused questionnaire
          setHasAskedForTime(true) // Skip the "Do you have a few minutes?" question
          setUserWantsToStart(true) // Assume user wants to start since they've already started before

          // CRITICAL: Also ensure the intro_shown flag is set in AsyncStorage
          await AsyncStorage.setItem(`intro_shown_${userId}`, "true")

          // Load the last question sent if available
          const lastQuestionJson = await AsyncStorage.getItem(`last_question_${userId}`)
          if (lastQuestionJson) {
            lastQuestionSent.current = JSON.parse(lastQuestionJson)
            console.log("Loaded last question:", lastQuestionSent.current)
          }

          // Return early - we've loaded a saved state
          return
        }
      }

      // If no saved state or not paused, check if intro has been shown
      const introShown = await AsyncStorage.getItem(`intro_shown_${userId}`)
      if (introShown === "true") {
        console.log("User has already seen intro, skipping to questions")
        setHasSeenIntro(true)
        setIntroStep(4)
        setHasStartedQuestionnaire(true)
        setHasAskedForTime(true) // Skip the "Do you have a few minutes?" question
        setUserWantsToStart(true) // Assume user wants to start since they've already started before

        // Set the questionnaire to active state if it wasn't already
        setState((prevState) => ({
          ...prevState,
          isActive: true,
        }))
      }
    } catch (error) {
      console.error("Error loading questionnaire state:", error)
    }
  }

  // Replace the startQuestionnaireWithoutIntro function with this improved version
  const startQuestionnaireWithoutIntro = () => {
    console.log("Starting questionnaire without intro")

    // Clear sent messages tracking
    sentMessages.clear()

    // Set state to active and skip intro
    setState({
      ...initialQuestionnaireState,
      isActive: true,
    })

    // Skip intro steps
    setIntroStep(4)

    // Mark questionnaire as started
    setHasStartedQuestionnaire(true)

    // Mark intro as seen
    setHasSeenIntro(true)

    // Mark that we've asked for time and user wants to start
    setHasAskedForTime(true)
    setUserWantsToStart(true)

    // Send the first question after a short delay to ensure state updates have propagated
    setTimeout(() => {
      if (!sentMessages.has("first_question")) {
        console.log("Sending first question - no intro needed")
        sendNextQuestion()
      }
    }, 800) // Increased delay for more reliability
  }

  // Replace the intro sequence useEffect with this improved version
  useEffect(() => {
    // Only run this effect if the questionnaire is active and not completed
    if (!state.isActive || state.isCompleted) return

    console.log("Intro sequence effect running with:", {
      hasSeenIntro,
      introStep,
      hasStartedQuestionnaire,
      hasAskedForTime,
      userWantsToStart,
    })

    // First, ask if they have a few minutes if we haven't asked yet
    if (!hasAskedForTime) {
      const timeQuestion = `Hey ${user?.user_name || "there"}, do you have a few minutes?`

      if (!sentMessages.has("time_question")) {
        sentMessages.add("time_question")
        saveLastQuestion("time", "time_question", timeQuestion)
        onQuestionReady(timeQuestion)
        setHasAskedForTime(true)
      }
      return
    }

    // Only proceed if user has indicated they want to start
    if (!userWantsToStart) {
      return
    }

    // Case 1: First-time user who needs to see the intro
    if (!hasSeenIntro && introStep < 4 && !hasStartedQuestionnaire) {
      const introMessages = [
        // First message
        `Hello ${user?.user_name || "there"}, as your doula, I'm here to support you not just physically, but also emotionally and socially throughout your pregnancy and postpartum journey.`,

        // Second message
        "Many factors in our daily lives—like where we live, access to food, transportation, and support systems—can significantly impact our health and well-being.",

        // Third message
        "To provide you with the best possible support, I'd like to ask a few questions about your living situation, access to resources, and any challenges you might be facing. This will help us identify any additional support or services that could be beneficial for you during this time. Please know that this conversation is confidential, and you are not obligated to answer anything that makes you uncomfortable. My goal is to understand your needs better and connect you with helpful resources.",
      ]

      if (introStep < 3) {
        // Send the current intro message if not already sent
        const messageKey = `intro_${introStep}`
        if (!sentMessages.has(messageKey)) {
          sentMessages.add(messageKey)
          onQuestionReady(introMessages[introStep])
        }

        // Schedule the next intro message with a delay
        const timer = setTimeout(() => {
          setIntroStep((prevStep) => prevStep + 1)
        }, 1500)

        return () => clearTimeout(timer)
      } else if (introStep === 3) {
        // Start the actual questionnaire after a delay
        const timer = setTimeout(() => {
          setHasStartedQuestionnaire(true)
          setIntroStep(4) // Mark intro as complete

          // Mark intro as shown in AsyncStorage - CRITICAL FIX
          // Make sure this completes before moving on
          AsyncStorage.setItem(`intro_shown_${userId}`, "true")
            .then(() => {
              console.log("Saved intro_shown flag to AsyncStorage")
              setHasSeenIntro(true) // Update state to reflect the change

              // Send the first question only if we haven't already
              if (!sentMessages.has("first_question")) {
                sendNextQuestion()
              }
            })
            .catch((error) => console.error("Error saving intro shown status:", error))
        }, 1500)

        return () => clearTimeout(timer)
      }
    }
    // Case 2: Returning user who has seen the intro
    else if (hasSeenIntro && !hasStartedQuestionnaire) {
      // If user has seen intro but questionnaire hasn't started yet, start it directly
      console.log("User has seen intro, starting questionnaire directly")
      setHasStartedQuestionnaire(true)

      // Send the first question if not already sent
      setTimeout(() => {
        if (!sentMessages.has("first_question")) {
          console.log("Sending first question for returning user")
          sendNextQuestion()
        }
      }, 500)
    }
  }, [
    state.isActive,
    state.isCompleted,
    introStep,
    hasSeenIntro,
    hasStartedQuestionnaire,
    hasAskedForTime,
    userWantsToStart,
  ])

  // Monitor for domain/question changes to send next question
  useEffect(() => {
    if (state.isActive && !state.isCompleted && hasStartedQuestionnaire && userWantsToStart) {
      // Only proceed if we're past the intro step
      if (introStep >= 4) {
        // Only send the next question if we're not at the first question of the first domain
        // This prevents duplicate questions when first starting
        if (state.currentQuestionIndex > 0 || state.currentDomainIndex > 0) {
          sendNextQuestion()
        }
      }
    }
  }, [state.currentDomainIndex, state.currentQuestionIndex, hasStartedQuestionnaire, introStep, userWantsToStart])

  const saveQuestionnaireState = async () => {
    try {
      await AsyncStorage.setItem(`questionnaire_state_${userId}`, JSON.stringify(state))
    } catch (error) {
      console.error("Error saving questionnaire state:", error)
    }
  }

  // Replace the startQuestionnaire function with this improved version
  const startQuestionnaire = () => {
    // Prevent multiple starts
    if (isStartingQuestionnaire.current) return
    isStartingQuestionnaire.current = true

    console.log("Starting questionnaire, checking intro status...")

    // Check if user has seen intro before deciding whether to show intro
    AsyncStorage.getItem(`intro_shown_${userId}`)
      .then((introShown) => {
        console.log("Intro shown status:", introShown)

        // Clear sent messages tracking
        sentMessages.clear()

        // Set state to active
        setState({
          ...initialQuestionnaireState,
          isActive: true,
        })

        // Always start by asking if they have a few minutes
        setHasAskedForTime(false)
        setUserWantsToStart(false)

        if (introShown === "true") {
          // Skip intro if already seen, but still ask if they have time
          console.log("User has seen intro before, will skip to questions after time confirmation")
          setHasSeenIntro(true)
          setIntroStep(4)
          setHasStartedQuestionnaire(false)
        } else {
          // Show intro for first-time users after time confirmation
          console.log("First time user, will show intro after time confirmation")
          setHasSeenIntro(false)
          setIntroStep(0)
          setHasStartedQuestionnaire(false)
        }

        // Reset the flag after a delay
        setTimeout(() => {
          isStartingQuestionnaire.current = false
        }, 2000)
      })
      .catch((error) => {
        console.error("Error checking intro status:", error)
        // Default to showing intro if there's an error, but still ask for time
        setHasSeenIntro(false)
        setIntroStep(0)
        setHasStartedQuestionnaire(false)
        setHasAskedForTime(false)
        setUserWantsToStart(false)
        setState({
          ...initialQuestionnaireState,
          isActive: true,
        })
        isStartingQuestionnaire.current = false
      })
  }

  const sendNextQuestion = () => {
    // Debug log to track when this function is called
    console.log("sendNextQuestion called", {
      introStep,
      hasStartedQuestionnaire,
      hasSeenIntro,
      currentDomain: state.currentDomainIndex,
      currentQuestion: state.currentQuestionIndex,
    })

    // Make sure we have valid domain indices
    if (state.currentDomainIndex >= QUESTIONNAIRE_DOMAINS.length) {
      completeQuestionnaire()
      return
    }

    const currentDomain = QUESTIONNAIRE_DOMAINS[state.currentDomainIndex]
    if (!currentDomain) {
      completeQuestionnaire()
      return
    }

    // Check if we've reached the end of questions in this domain
    if (state.currentQuestionIndex >= currentDomain.questions.length) {
      // If we've completed all questions in this domain, ask if they want to continue
      askToContinue()
      return
    }

    const currentQuestion = currentDomain.questions[state.currentQuestionIndex]
    if (!currentQuestion) {
      // This shouldn't happen if the above check works, but just in case
      askToContinue()
      return
    }

    // Create a unique key for this question to prevent duplicates
    const questionKey = `question_${currentDomain.id}_${currentQuestion.id}`

    // Only send if we haven't sent this question before
    if (!sentMessages.has(questionKey)) {
      sentMessages.add(questionKey)

      // Format the question with a conversational tone
      const formattedQuestion = formatQuestionConversationally(currentDomain, currentQuestion)

      // Save the last question sent
      saveLastQuestion(currentDomain.id, currentQuestion.id, formattedQuestion)

      // Send the question
      onQuestionReady(formattedQuestion)

      // Mark first question as sent
      if (state.currentDomainIndex === 0 && state.currentQuestionIndex === 0) {
        sentMessages.add("first_question")
      }
    }
  }

  const askToContinue = () => {
    const continueKey = `continue_${state.currentDomainIndex}`
    if (!sentMessages.has(continueKey)) {
      sentMessages.add(continueKey)

      // Get the next domain name for better context
      const nextDomainIndex = state.currentDomainIndex + 1
      let continueMessage = "Would you like to keep going, or shall we pause and continue another time?"

      if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
        const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex]
        continueMessage = `Would you like to keep going to the next section about ${nextDomain.description.toLowerCase()}, or shall we pause and continue another time?`
      }

      // Save this as the last question
      saveLastQuestion("continue", `continue_${state.currentDomainIndex}`, continueMessage)

      // Send the message
      onQuestionReady(continueMessage)
    }
  }

  const formatQuestionConversationally = (domain: any, question: any) => {
    // Add domain intro if it's the first question in the domain
    if (state.currentQuestionIndex === 0) {
      return `Now I'd like to ask you about ${domain.description.toLowerCase()}. ${question.text}`
    }

    // For subsequent questions, just ask the question with a conversational lead-in
    const conversationalLeadIns = [
      "Could you tell me, ",
      "I'd like to know, ",
      "Please share with me, ",
      "Would you mind telling me, ",
      "I'm wondering, ",
      "",
    ]

    const leadIn = conversationalLeadIns[Math.floor(Math.random() * conversationalLeadIns.length)]
    return `${leadIn}${question.text}`
  }

  const handleUserResponse = (response: string) => {
    if (!state.isActive || state.isCompleted) return false

    // Handle the "Do you have a few minutes?" question
    if (hasAskedForTime && !userWantsToStart) {
      // Check for positive responses
      if (/yes|yeah|sure|ok|okay|go ahead|proceed|continue|start/i.test(response)) {
        setUserWantsToStart(true)
        return true
      }

      // Check for negative responses
      if (/no|nope|not now|later|busy|can't|cannot|don't have time/i.test(response)) {
        // Send a polite response and mark questionnaire as paused
        const noTimeKey = "no_time_response"
        if (!sentMessages.has(noTimeKey)) {
          sentMessages.add(noTimeKey)
          const noTimeMessage =
            "No problem! We can continue this conversation whenever you have more time. Just let me know when you're ready."

          // Save this as the last message
          saveLastQuestion("pause", noTimeKey, noTimeMessage)

          onQuestionReady(noTimeMessage)

          // Mark as paused
          setState((prevState) => ({
            ...prevState,
            isPaused: true,
          }))
        }
        return true
      }

      // If response is unclear, assume they want to continue
      setUserWantsToStart(true)
      return true
    }

    // Check if this is a response to the "continue or pause" question
    if (state.currentQuestionIndex >= QUESTIONNAIRE_DOMAINS[state.currentDomainIndex].questions.length) {
      // If they want to continue
      if (/continue|keep going|yes|sure|okay|go on|proceed/i.test(response)) {
        moveToNextDomain()
        return true
      }

      // If they want to pause
      if (/pause|stop|later|another time|not now|no/i.test(response)) {
        // Save the current state but mark as paused
        setState((prevState) => ({
          ...prevState,
          isPaused: true,
        }))

        const pauseKey = `pause_${state.currentDomainIndex}`
        if (!sentMessages.has(pauseKey)) {
          sentMessages.add(pauseKey)
          const pauseMessage =
            "I've saved our progress. We can continue this conversation whenever you're ready. Just let me know."

          // Save this as the last message
          saveLastQuestion("pause", pauseKey, pauseMessage)

          onQuestionReady(pauseMessage)
        }
        return true
      }

      // If response is unclear, assume they want to continue
      moveToNextDomain()
      return true
    }

    const currentDomain = QUESTIONNAIRE_DOMAINS[state.currentDomainIndex]
    const currentQuestion = currentDomain.questions[state.currentQuestionIndex]

    // Initialize flag with any existing flag from the question
    let flag = currentQuestion.flag || ""

    // Domain I: Housing & Environment
    if (currentDomain.id === "domain-1") {
      // Question 1: Housing situation
      if (
        currentQuestion.id === "q1-1" &&
        /friend|roommate|temporary|shelter|homeless|couch|staying with/i.test(response)
      ) {
        flag = "Housing instability / temporary housing"
      }

      // Question 2: Worried about losing housing
      else if (currentQuestion.id === "q1-2" && /yes|yeah|definitely|worried|concerned|might|could/i.test(response)) {
        flag = "Housing insecurity"
      }

      // Question 3: Utility companies
      else if (
        currentQuestion.id === "q1-3" &&
        /yes|yeah|they have|received notice|shut off|disconnect|threatened/i.test(response)
      ) {
        flag = "Utilities support needed"
      }

      // Question 4: Transportation issues
      else if (
        currentQuestion.id === "q1-4" &&
        /yes|yeah|sometimes|often|missed|hard|difficult|can't|cannot|no car|no bus/i.test(response)
      ) {
        flag = "Transportation barrier"
      }

      // Question 5: Feel safe at home
      else if (currentQuestion.id === "q1-5" && /no|not really|sometimes|not always|unsafe|scared/i.test(response)) {
        flag = "Home safety concern"
      }

      // Question 6: Neighborhood concerns
      else if (
        currentQuestion.id === "q1-6" &&
        /yes|yeah|not safe|dangerous|crime|violence|worried|concerned/i.test(response)
      ) {
        flag = "Neighborhood safety concern"
      }
    }

    // Domain II: Safety & Demographics
    else if (currentDomain.id === "domain-2") {
      // Questions 1-2: Race/ethnicity and Hispanic/Latino - no flags

      // Question 3: Been hurt or threatened
      if (currentQuestion.id === "q2-3" && /yes|yeah|hit|hurt|threatened|abused|violence/i.test(response)) {
        flag = "Interpersonal violence"
      }

      // Question 4: Afraid of partner
      else if (currentQuestion.id === "q2-4" && /yes|yeah|sometimes|afraid|scared|fear/i.test(response)) {
        flag = "Urgent safety referral"
      }

      // Question 5: Financial abuse
      else if (
        currentQuestion.id === "q2-5" &&
        /yes|yeah|sometimes|took|stolen|withheld|controls|won't let me/i.test(response)
      ) {
        flag = "Financial abuse"
      }
    }

    // Domain III: Education & Employment
    else if (currentDomain.id === "domain-3") {
      // Question 1: Education level - no flag
      if (currentQuestion.id === "q3-1" && /school|college/i.test(response)) {
        flag = ""
      }

      // Question 2: Work status
      if (
        currentQuestion.id === "q3-2" &&
        /unemployed|not working|looking|laid off|fired|between jobs/i.test(response)
      ) {
        flag = "Employment support needed"
      }

      // Question 3: Affording basic needs
      else if (
        currentQuestion.id === "q3-3" &&
        /yes|yeah|hard|difficult|struggle|can't afford|cannot afford/i.test(response)
      ) {
        flag = "Financial strain"
      }

      // Question 4: Help finding job
      else if (currentQuestion.id === "q3-4" && /yes|yeah|would like|need help|looking/i.test(response)) {
        flag = "Referral to workforce navigator"
      }

      // Question 5: Help with school/training
      else if (currentQuestion.id === "q3-5" && /yes|yeah|interested|would like|need help/i.test(response)) {
        flag = "Education support"
      }

      // Question 6: Daycare needs
      else if (
        currentQuestion.id === "q3-6" &&
        /yes|yeah|need|better|affordable|quality|childcare|daycare/i.test(response)
      ) {
        flag = "Childcare need"
      }
    }

    // Domain IV: Food & Physical Activity
    else if (currentDomain.id === "domain-4") {
      // Question 1: Worried about running out of food
      if (currentQuestion.id === "q4-1" && /yes|yeah|worried|concerned|sometimes|often/i.test(response)) {
        flag = "Food insecurity"
      }

      // Question 2: Food not lasting
      else if (currentQuestion.id === "q4-2" && /yes|yeah|sometimes|often|ran out|not enough/i.test(response)) {
        flag = "Food insecurity"
      }

      // Question 3: Access to healthy food
      else if (
        currentQuestion.id === "q4-3" &&
        /no|not really|hard|difficult|expensive|can't afford|limited/i.test(response)
      ) {
        flag = "Healthy food access"
      }

      // Question 4: Exercise frequency
      else if (
        currentQuestion.id === "q4-4" &&
        /never|rarely|once|twice|not much|not often|don't exercise/i.test(response)
      ) {
        flag = "Physical activity support"
      }
    }

    // Domain V: Home Environment
    else if (currentDomain.id === "domain-5") {
      // Question 1: Home issues
      if (
        currentQuestion.id === "q5-1" &&
        /yes|yeah|mold|leak|pest|bug|rat|roach|mouse|heat|cooling|broken|unsafe/i.test(response)
      ) {
        flag = "Environmental hazard, refer to housing services"
      }
    }

    // Domain VI: Language & Communication
    else if (currentDomain.id === "domain-6") {
      // Question 1: Preferred language - no flag

      // Question 2: Help reading medical materials
      if (
        currentQuestion.id === "q6-2" &&
        /yes|yeah|sometimes|often|need help|difficult|hard to understand/i.test(response)
      ) {
        flag = "Health literacy / translation support"
      }
    }

    // Save the response with potentially updated flag
    const questionnaireResponse: QuestionnaireResponse = {
      questionId: currentQuestion.id,
      domainId: currentDomain.id,
      response,
      flag,
      timestamp: new Date(),
    }

    // Update state with the new response
    const updatedResponses = [...state.responses, questionnaireResponse]
    setState((prevState) => ({
      ...prevState,
      responses: updatedResponses,
    }))

    // Notify parent component
    onResponseSaved(questionnaireResponse)

    // Move to the next question
    moveToNextQuestion()

    // Return true to indicate this was handled as a questionnaire response
    return true
  }

  const moveToNextQuestion = () => {
    const currentDomain = QUESTIONNAIRE_DOMAINS[state.currentDomainIndex]

    if (state.currentQuestionIndex < currentDomain.questions.length - 1) {
      // Move to the next question in the current domain
      setState((prevState) => ({
        ...prevState,
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
      }))
    } else {
      // We've reached the end of the domain, ask if they want to continue
      setState((prevState) => ({
        ...prevState,
        currentQuestionIndex: prevState.currentQuestionIndex + 1, // Set to a value beyond the questions array length
      }))
    }
  }

  const moveToNextDomain = () => {
    // Check if we're at the last domain
    if (state.currentDomainIndex >= QUESTIONNAIRE_DOMAINS.length - 1) {
      // All domains completed
      completeQuestionnaire()
      return
    }

    // Move to the first question of the next domain
    setState((prevState) => ({
      ...prevState,
      currentDomainIndex: prevState.currentDomainIndex + 1,
      currentQuestionIndex: 0,
    }))
  }

  const completeQuestionnaire = async () => {
    // Mark questionnaire as completed first
    setState((prevState) => ({
      ...prevState,
      isActive: false,
      isCompleted: true,
    }))

    // Submit all responses to the backend
    try {
      console.log("Sending questionnaire responses to backend")
      await submitResponsesToBackend()

      // Save completion status
      await AsyncStorage.setItem(`questionnaire_completed_${userId}`, "true")

      // Only send thank you message AFTER successful API submission
      const thankYouKey = "thank_you_message"
      if (!sentMessages.has(thankYouKey)) {
        sentMessages.add(thankYouKey)
        const thankYouMessage =
          "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you."

        // Save as last message
        saveLastQuestion("complete", thankYouKey, thankYouMessage)

        onQuestionReady(thankYouMessage)
      }
    } catch (error: any) {
      console.error("Error submitting questionnaire responses:", error.message)

      // Even if there's an API error, we still want to show the thank you message
      const thankYouKey = "thank_you_message"
      if (!sentMessages.has(thankYouKey)) {
        sentMessages.add(thankYouKey)
        const thankYouMessage =
          "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you."

        // Save as last message
        saveLastQuestion("complete", thankYouKey, thankYouMessage)

        onQuestionReady(thankYouMessage)
      }
    }

    // Notify parent component AFTER everything is done
    onQuestionnaireComplete()
  }

  const submitResponsesToBackend = async () => {
    try {
      // Format the responses for the API
      const formattedResponses = state.responses.map((response) => ({
        domainId: response.domainId,
        questionId: response.questionId,
        response: response.response,
        flag: response.flag,
        timestamp: response.timestamp.toISOString(),
      }))

      console.log("Submitting responses to backend:", formattedResponses)

      // Send individual responses to ensure each is saved correctly
      for (const responseData of formattedResponses) {
        const response = await axios.post(
          `https://crosscare-backends.onrender.com/api/user/${user?.user_id}/domain`,
          responseData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
        console.log(`Response saved for question ${responseData.questionId}:`, response.status)
      }

      console.log("All responses submitted successfully")
    } catch (error: any) {
      console.error("Error submitting responses to backend:", error)

      // Show more detailed error information
      if (error.response) {
        console.error("Error status:", error.response.status)
        console.error("Error data:", JSON.stringify(error.response.data))
      } else if (error.request) {
        console.error("No response received:", error.request)
      } else {
        console.error("Error message:", error.message)
      }

      // Mark questionnaire as completed anyway to prevent restart issues
      await AsyncStorage.setItem(`questionnaire_completed_${userId}`, "true")
      console.log("Marked questionnaire as completed despite API error")

      throw error
    }
  }

  const checkForPausedQuestionnaire = async () => {
    try {
      // Get the saved state
      const savedStateJson = await AsyncStorage.getItem(`questionnaire_state_${userId}`)
      if (!savedStateJson) {
        return false
      }

      const savedState = JSON.parse(savedStateJson)

      // Check if it's marked as paused
      if (savedState.isPaused) {
        console.log("Found paused questionnaire state:", {
          domainIndex: savedState.currentDomainIndex,
          questionIndex: savedState.currentQuestionIndex,
        })
        return true
      }

      return false
    } catch (error) {
      console.error("Error checking for paused questionnaire:", error)
      return false
    }
  }

  // Add a new method to check if questionnaire is completed
  const isQuestionnaireCompleted = async () => {
    try {
      const completedStatus = await AsyncStorage.getItem(`questionnaire_completed_${userId}`)
      return completedStatus === "true"
    } catch (error) {
      console.error("Error checking questionnaire completion status:", error)
      return false
    }
  }

  // Replace the entire resumeQuestionnaire function with this improved version
  const resumeQuestionnaire = async () => {
    console.log("Resuming questionnaire")

    try {
      // Clear sent messages tracking to avoid duplicate messages
      sentMessages.clear()

      // Load the saved state from AsyncStorage
      const savedStateJson = await AsyncStorage.getItem(`questionnaire_state_${userId}`)
      if (!savedStateJson) {
        console.error("No saved state found for resuming")
        return
      }

      const savedState = JSON.parse(savedStateJson)
      console.log("Loaded saved state for resuming:", savedState)

      // Convert string timestamps back to Date objects
      savedState.responses = savedState.responses.map((response: any) => ({
        ...response,
        timestamp: new Date(response.timestamp),
      }))

      // CRITICAL: Mark intro as seen in AsyncStorage to prevent intro from showing again
      await AsyncStorage.setItem(`intro_shown_${userId}`, "true")

      // Skip intro sequence - critical for resuming correctly
      setIntroStep(4)
      setHasStartedQuestionnaire(true)
      setHasSeenIntro(true) // Always mark intro as seen when resuming
      setHasAskedForTime(true) // Skip the "Do you have a few minutes?" question
      setUserWantsToStart(true) // Assume user wants to start since they're resuming

      // Set state with saved values - don't reset indices and unpause it
      setState({
        ...savedState,
        isPaused: false,
        isActive: true,
      })

      // Load the last question sent if available
      const lastQuestionJson = await AsyncStorage.getItem(`last_question_${userId}`)
      let lastQuestion = null

      if (lastQuestionJson) {
        lastQuestion = JSON.parse(lastQuestionJson)
        console.log("Loaded last question for resuming:", lastQuestion)
      }

      // Wait before continuing to ensure the message is seen
      setTimeout(() => {
        // Check if we were at the end of a domain asking to continue or pause
        if (savedState.currentQuestionIndex >= QUESTIONNAIRE_DOMAINS[savedState.currentDomainIndex].questions.length) {
          console.log("Resuming at domain continuation point")
          const continueKey = `continue_${savedState.currentDomainIndex}`
          sentMessages.add(continueKey)

          // Get the next domain name for better context
          const nextDomainIndex = savedState.currentDomainIndex + 1
          let continueMessage = "Would you like to keep going to the next section, or shall we pause again?"

          if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
            const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex]
            continueMessage = `Would you like to keep going to the next section about ${nextDomain.description.toLowerCase()}, or shall we pause again?`
          }

          // If we have the exact last question, use that instead
          if (lastQuestion && lastQuestion.domainId === "continue") {
            continueMessage = lastQuestion.questionText
          }

          onQuestionReady(continueMessage)
        } else {
          // Otherwise, send the current question where they left off
          console.log("Resuming at specific question")
          const currentDomain = QUESTIONNAIRE_DOMAINS[savedState.currentDomainIndex]
          const currentQuestion = currentDomain.questions[savedState.currentQuestionIndex]

          if (currentQuestion) {
            // Mark the question as sent to prevent duplicates
            const questionKey = `question_${currentDomain.id}_${currentQuestion.id}`
            sentMessages.add(questionKey)

            // If we have the exact last question, use that instead
            if (
              lastQuestion &&
              lastQuestion.domainId === currentDomain.id &&
              lastQuestion.questionId === currentQuestion.id
            ) {
              onQuestionReady(lastQuestion.questionText)
            } else {
              // Otherwise format and send the question
              const formattedQuestion = formatQuestionConversationally(currentDomain, currentQuestion)
              onQuestionReady(formattedQuestion)
            }
          }
        }
      }, 1500)
    } catch (error) {
      console.error("Error resuming questionnaire:", error)
    }
  }

  // Helper function to find the last answered question and continue from there
  const findLastAnsweredQuestionAndContinue = (parsedState: QuestionnaireState) => {
    try {
      if (parsedState.responses.length > 0) {
        const lastResponse = parsedState.responses[parsedState.responses.length - 1]
        console.log("Last answered question:", lastResponse.questionId, "in domain:", lastResponse.domainId)

        // Find the domain index
        const domainIndex = QUESTIONNAIRE_DOMAINS.findIndex((d) => d.id === lastResponse.domainId)
        if (domainIndex >= 0) {
          // Find the question index
          const questionIndex = QUESTIONNAIRE_DOMAINS[domainIndex].questions.findIndex(
            (q) => q.id === lastResponse.questionId,
          )

          if (questionIndex >= 0 && questionIndex < QUESTIONNAIRE_DOMAINS[domainIndex].questions.length - 1) {
            // Move to the next question in the same domain
            const nextQuestionIndex = questionIndex + 1
            setState((prevState) => ({
              ...prevState,
              currentDomainIndex: domainIndex,
              currentQuestionIndex: nextQuestionIndex,
              isPaused: false,
              isActive: true,
            }))

            const nextQuestion = QUESTIONNAIRE_DOMAINS[domainIndex].questions[nextQuestionIndex]
            onQuestionReady(
              `Let's continue where we left off. ${formatQuestionConversationally(QUESTIONNAIRE_DOMAINS[domainIndex], nextQuestion)}`,
            )
          } else {
            // Move to the next domain
            const nextDomainIndex = domainIndex + 1
            if (nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
              setState((prevState) => ({
                ...prevState,
                currentDomainIndex: nextDomainIndex,
                currentQuestionIndex: 0,
                isPaused: false,
                isActive: true,
              }))

              const nextDomain = QUESTIONNAIRE_DOMAINS[nextDomainIndex]
              const firstQuestion = nextDomain.questions[0]
              onQuestionReady(`Let's continue with ${nextDomain.description.toLowerCase()}. ${firstQuestion.text}`)
            } else {
              // We've completed all domains
              completeQuestionnaire()
            }
          }
        } else {
          // Couldn't find the domain, start from the beginning
          startQuestionnaire()
        }
      } else {
        // No responses yet, start from the beginning
        startQuestionnaire()
      }
    } catch (error) {
      console.error("Error in findLastAnsweredQuestionAndContinue:", error)
      startQuestionnaire()
    }
  }

  // Add this function to manually reset the intro shown status (for testing)
  const resetIntroStatus = async () => {
    try {
      await AsyncStorage.removeItem(`intro_shown_${userId}`)
      await AsyncStorage.removeItem(`last_question_${userId}`)
      console.log("Reset intro status for user:", userId)
      setHasSeenIntro(false)
    } catch (error) {
      console.error("Error resetting intro status:", error)
    }
  }

  // Update the return object to include the reset function
  return {
    startQuestionnaire,
    handleUserResponse,
    isActive: state.isActive,
    isCompleted: state.isCompleted,
    isPaused: state.isPaused,
    currentDomainIndex: state.currentDomainIndex,
    currentQuestionIndex: state.currentQuestionIndex,
    responses: state.responses,
    checkForPausedQuestionnaire,
    isQuestionnaireCompleted,
    resumeQuestionnaire,
    resetIntroStatus, // Add this for testing
  }
}

export default QuestionnaireManager
