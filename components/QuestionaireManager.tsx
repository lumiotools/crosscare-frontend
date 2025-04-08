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
  const user = useSelector((state: any) => state.user)

  // Use refs to track sent messages and prevent duplicates
  const sentMessages = useRef(new Set()).current
  const isStartingQuestionnaire = useRef(false)

  // Load questionnaire state from AsyncStorage on component mount
  useEffect(() => {
    loadQuestionnaireState()
  }, [])

  // Save questionnaire state to AsyncStorage whenever it changes
  useEffect(() => {
    saveQuestionnaireState()
  }, [state])

  // Handle the intro sequence
  useEffect(() => {
    if (state.isActive && !state.isCompleted && introStep < 4 && !hasStartedQuestionnaire) {
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

          // Send the first question only if we haven't already
          if (!sentMessages.has("first_question")) {
            sendNextQuestion()
          }
        }, 1500)

        return () => clearTimeout(timer)
      }
    }
  }, [state.isActive, introStep])

  // Monitor for domain/question changes to send next question
  useEffect(() => {
    if (state.isActive && !state.isCompleted && introStep >= 4 && hasStartedQuestionnaire) {
      // Only send the next question if we're not in the intro sequence
      // and we've already started the questionnaire (prevents duplicate first question)
      if (state.currentQuestionIndex > 0 || state.currentDomainIndex > 0) {
        sendNextQuestion()
      }
    }
  }, [state.currentDomainIndex, state.currentQuestionIndex])

  const loadQuestionnaireState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(`questionnaire_state_${userId}`)
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        // Convert string timestamps back to Date objects
        parsedState.responses = parsedState.responses.map((response: any) => ({
          ...response,
          timestamp: new Date(response.timestamp),
        }))
        setState(parsedState)

        // If we're loading a paused state, skip the intro sequence
        if (parsedState.isPaused) {
          setIntroStep(4) // Skip intro sequence
          setHasStartedQuestionnaire(true)
        }
      }
    } catch (error) {
      console.error("Error loading questionnaire state:", error)
    }
  }

  const saveQuestionnaireState = async () => {
    try {
      await AsyncStorage.setItem(`questionnaire_state_${userId}`, JSON.stringify(state))
    } catch (error) {
      console.error("Error saving questionnaire state:", error)
    }
  }

  const startQuestionnaire = () => {
    // Prevent multiple starts
    if (isStartingQuestionnaire.current) return
    isStartingQuestionnaire.current = true

    // Clear sent messages tracking
    sentMessages.clear()

    setState({
      ...initialQuestionnaireState,
      isActive: true,
    })
    setIntroStep(0) // Start from the first intro message
    setHasStartedQuestionnaire(false)

    // Reset the flag after a delay
    setTimeout(() => {
      isStartingQuestionnaire.current = false
    }, 2000)
  }

  const sendNextQuestion = () => {
    // Debug log to track when this function is called
    console.log("sendNextQuestion called", {
      introStep,
      hasStartedQuestionnaire,
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
      onQuestionReady("Would you like to keep going, or shall we pause and continue another time?")
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
          onQuestionReady(
            "I've saved our progress. We can continue this conversation whenever you're ready. Just let me know.",
          )
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
    // let // = false

    // Domain I: Housing & Environment
    if (currentDomain.id === "domain-1") {
      // Question 1: Housing situation
      if (
        currentQuestion.id === "q1-1" &&
        /friend|roommate|temporary|shelter|homeless|couch|staying with/i.test(response)
      ) {
        flag = "Housing instability / temporary housing"
        // = true
      }

      // Question 2: Worried about losing housing
      else if (currentQuestion.id === "q1-2" && /yes|yeah|definitely|worried|concerned|might|could/i.test(response)) {
        flag = "Housing insecurity"
        // = true
      }

      // Question 3: Utility companies
      else if (
        currentQuestion.id === "q1-3" &&
        /yes|yeah|they have|received notice|shut off|disconnect|threatened/i.test(response)
      ) {
        flag = "Utilities support needed"
        // = true
      }

      // Question 4: Transportation issues
      else if (
        currentQuestion.id === "q1-4" &&
        /yes|yeah|sometimes|often|missed|hard|difficult|can't|cannot|no car|no bus/i.test(response)
      ) {
        flag = "Transportation barrier"
        // = true
      }

      // Question 5: Feel safe at home
      else if (currentQuestion.id === "q1-5" && /no|not really|sometimes|not always|unsafe|scared/i.test(response)) {
        flag = "Home safety concern"
        // = true
      }

      // Question 6: Neighborhood concerns
      else if (
        currentQuestion.id === "q1-6" &&
        /yes|yeah|not safe|dangerous|crime|violence|worried|concerned/i.test(response)
      ) {
        flag = "Neighborhood safety concern"
        // = true
      }
    }

    // Domain II: Safety & Demographics
    else if (currentDomain.id === "domain-2") {
      // Questions 1-2: Race/ethnicity and Hispanic/Latino - no flags

      // Question 3: Been hurt or threatened
      if (currentQuestion.id === "q2-3" && /yes|yeah|hit|hurt|threatened|abused|violence/i.test(response)) {
        flag = "Interpersonal violence"
        // = true
      }

      // Question 4: Afraid of partner
      else if (currentQuestion.id === "q2-4" && /yes|yeah|sometimes|afraid|scared|fear/i.test(response)) {
        flag = "Urgent safety referral"
        // = true
      }

      // Question 5: Financial abuse
      else if (
        currentQuestion.id === "q2-5" &&
        /yes|yeah|sometimes|took|stolen|withheld|controls|won't let me/i.test(response)
      ) {
        flag = "Financial abuse"
        // = true
      }
    }

    // Domain III: Education & Employment
    else if (currentDomain.id === "domain-3") {
      // Question 1: Education level - no flag
      if (currentQuestion.id === "q3-1" && /school|college/i.test(response)) {
        flag = ""
        // = true
      }

      // Question 2: Work status

      if (
        currentQuestion.id === "q3-2" &&
        /unemployed|not working|looking|laid off|fired|between jobs/i.test(response)
      ) {
        flag = "Employment support needed"
        // = true
      }

      // Question 3: Affording basic needs
      else if (
        currentQuestion.id === "q3-3" &&
        /yes|yeah|hard|difficult|struggle|can't afford|cannot afford/i.test(response)
      ) {
        flag = "Financial strain"
        // = true
      }

      // Question 4: Help finding job
      else if (currentQuestion.id === "q3-4" && /yes|yeah|would like|need help|looking/i.test(response)) {
        flag = "Referral to workforce navigator"
        // = true
      }

      // Question 5: Help with school/training
      else if (currentQuestion.id === "q3-5" && /yes|yeah|interested|would like|need help/i.test(response)) {
        flag = "Education support"
        // = true
      }

      // Question 6: Daycare needs
      else if (
        currentQuestion.id === "q3-6" &&
        /yes|yeah|need|better|affordable|quality|childcare|daycare/i.test(response)
      ) {
        flag = "Childcare need"
        // = true
      }
    }

    // Domain IV: Food & Physical Activity
    else if (currentDomain.id === "domain-4") {
      // Question 1: Worried about running out of food
      if (currentQuestion.id === "q4-1" && /yes|yeah|worried|concerned|sometimes|often/i.test(response)) {
        flag = "Food insecurity"
        // = true
      }

      // Question 2: Food not lasting
      else if (currentQuestion.id === "q4-2" && /yes|yeah|sometimes|often|ran out|not enough/i.test(response)) {
        flag = "Food insecurity"
        // = true
      }

      // Question 3: Access to healthy food
      else if (
        currentQuestion.id === "q4-3" &&
        /no|not really|hard|difficult|expensive|can't afford|limited/i.test(response)
      ) {
        flag = "Healthy food access"
        // = true
      }

      // Question 4: Exercise frequency
      else if (
        currentQuestion.id === "q4-4" &&
        /never|rarely|once|twice|not much|not often|don't exercise/i.test(response)
      ) {
        flag = "Physical activity support"
        // = true
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
        // = true
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
        // = true
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

  // Fix for the duplicate "thank you" message issue
  // In the completeQuestionnaire function, we need to ensure the thank you message
  // is only sent once from here, and not from the parent component

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
        onQuestionReady(
          "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you.",
        )
      }
    } catch (error: any) {
      console.error("Error submitting questionnaire responses:", error.message)

      // Even if there's an API error, we still want to show the thank you message
      const thankYouKey = "thank_you_message"
      if (!sentMessages.has(thankYouKey)) {
        sentMessages.add(thankYouKey)
        onQuestionReady(
          "Thank you for sharing this information with me. Understanding these aspects of your life helps me provide better support and connect you with resources that can address any challenges you're facing. Remember, you're not alone, and there are organizations ready to assist you.",
        )
      }
    }

    // Notify parent component AFTER everything is done
    onQuestionnaireComplete()
  }

  // Fix the typo in the function name
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

  // Replace the checkForPausedQuestionnaire method with this improved version
const checkForPausedQuestionnaire = async () => {
  try {
    // Get the saved state
    const savedStateJson = await AsyncStorage.getItem(`questionnaire_state_${userId}`);
    if (!savedStateJson) {
      return false;
    }
    
    const savedState = JSON.parse(savedStateJson);
    
    // Check if it's marked as paused
    if (savedState.isPaused) {
      console.log("Found paused questionnaire state:", {
        domainIndex: savedState.currentDomainIndex,
        questionIndex: savedState.currentQuestionIndex
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking for paused questionnaire:", error);
    return false;
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

  // Improved resumeQuestionnaire function to properly resume from where the user left off
  // Replace the entire resumeQuestionnaire function with this improved version:
  const resumeQuestionnaire = async () => {
    console.log("Resuming questionnaire");
  
    try {
      // Clear sent messages tracking to avoid duplicate messages
      sentMessages.clear();
  
      // Load the saved state from AsyncStorage
      const savedStateJson = await AsyncStorage.getItem(`questionnaire_state_${userId}`);
      if (!savedStateJson) {
        console.error("No saved state found for resuming");
        return;
      }
  
      const savedState = JSON.parse(savedStateJson);
      console.log("Loaded saved state:", savedState);
  
      // Convert string timestamps back to Date objects
      savedState.responses = savedState.responses.map((response: any) => ({
        ...response,
        timestamp: new Date(response.timestamp),
      }));
  
      // Skip intro sequence - critical for resuming correctly
      setIntroStep(4);
      setHasStartedQuestionnaire(true);
      
      // Set state with saved values - don't reset indices
      setState({
        ...savedState,
        isPaused: false,
        isActive: true
      });
  
      // Add confirmation message
      onQuestionReady("I've found where we left off. Let's continue.");
      
      // Wait before continuing to ensure the message is seen
      setTimeout(() => {
        // Check if we were at the end of a domain asking to continue or pause
        if (savedState.currentQuestionIndex >= QUESTIONNAIRE_DOMAINS[savedState.currentDomainIndex].questions.length) {
          console.log("Resuming at domain continuation point");
          const continueKey = `continue_${savedState.currentDomainIndex}`;
          sentMessages.add(continueKey);
          onQuestionReady("Would you like to keep going to the next section, or shall we pause again?");
        } else {
          // Otherwise, send the current question where they left off
          console.log("Resuming at specific question");
          const currentDomain = QUESTIONNAIRE_DOMAINS[savedState.currentDomainIndex];
          const currentQuestion = currentDomain.questions[savedState.currentQuestionIndex];
          
          if (currentQuestion) {
            // Mark the question as sent to prevent duplicates
            const questionKey = `question_${currentDomain.id}_${currentQuestion.id}`;
            sentMessages.add(questionKey);
            
            // Send the question with appropriate formatting
            onQuestionReady(formatQuestionConversationally(currentDomain, currentQuestion));
          }
        }
      }, 1500);
    } catch (error) {
      console.error("Error resuming questionnaire:", error);
    }
  }

  // Add this helper function to find the last answered question and continue from there
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
    isQuestionnaireCompleted, // Export the new method
    resumeQuestionnaire,
  }
}

export default QuestionnaireManager

