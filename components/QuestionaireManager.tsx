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

// Track awarded badges to prevent duplicate requests
const awardedTriviaBadges = new Set<string>()

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
  console.log(user)
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

  // Add a state to track if we're waiting for a domain transition confirmation
  const [waitingForDomainTransition, setWaitingForDomainTransition] = useState(false)
  const [nextDomainIndex, setNextDomainIndex] = useState(-1)

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

  // Map domain IDs to badge numbers for the API
  const awardTriviaBadge = async (userId: string): Promise<any> => {
    try {
      // Don't make duplicate requests for the same user
      if (awardedTriviaBadges.has(userId)) {
        console.log(`Trivia Queen badge already requested for user ${userId}`)
        return null
      }

      console.log(`Attempting to award Trivia Queen badge to user ${userId}`)

      // Validate userId
      if (!userId || userId.trim() === "") {
        console.error("Invalid userId provided")
        return null
      }

      // Get badge type from mapping
      const badgeType = "GETTING_TO_KNOW_YOU" // Hardcode for reliability

      // Prepare the data payload for the Trivia Queen badge
      const payload = {
        badgeType: badgeType,
        title: "Getting to know you",
        description: "On completing all domains of the Doula questionnaire",
      }

      console.log(`Badge award payload:`, payload)

      // Add to set to prevent duplicate requests
      awardedTriviaBadges.add(userId)

      // Make API call using fetch with error handling
      const response = await fetch(`https://crosscare-backends.onrender.com/api/user/${userId}/badges/award`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // Handle API error responses
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Badge award failed with status ${response.status}:`, errorText)
        return { success: false, message: errorText }
      }

      // Parse the JSON response
      const data = await response.json()
      console.log(`Badge award successful:`, data)
      return data
    } catch (error: any) {
      console.error("Error awarding Trivia Queen badge:", error.message || error)
      return { success: false, message: error.message || error }
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

    // Reset domain transition state
    setWaitingForDomainTransition(false)
    setNextDomainIndex(-1)

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
        `Hello ${
          user?.user_name || "there"
        }, as your doula, I'm here to support you not just physically, but also emotionally and socially throughout your pregnancy and postpartum journey.`,

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
    if (state.isActive && !state.isCompleted && !state.isPaused && hasStartedQuestionnaire && userWantsToStart) {
      // Only proceed if we're past the intro step
      if (introStep >= 4) {
        // Only send the next question if we're not at the first question of the first domain
        // This prevents duplicate questions when first starting
        if (state.currentQuestionIndex > 0 || state.currentDomainIndex > 0) {
          console.log("Sending next question due to state change")
          sendNextQuestion()
        }
      }
    }
  }, [
    state.currentDomainIndex,
    state.currentQuestionIndex,
    hasStartedQuestionnaire,
    introStep,
    userWantsToStart,
    state.isPaused,
  ])

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

    // Reset domain transition state
    setWaitingForDomainTransition(false)
    setNextDomainIndex(-1)

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
    // CRITICAL: First check if the questionnaire is paused
    if (state.isPaused) {
      console.log("Questionnaire is paused, not sending next question")
      return
    }

    // Debug log to track when this function is called
    console.log("sendNextQuestion called", {
      introStep,
      hasStartedQuestionnaire,
      hasSeenIntro,
      currentDomain: state.currentDomainIndex,
      currentQuestion: state.currentQuestionIndex,
      waitingForDomainTransition,
      nextDomainIndex,
    })

    // If we're waiting for domain transition confirmation, don't send a new question
    if (waitingForDomainTransition) {
      console.log("Waiting for domain transition confirmation, not sending next question")
      return
    }

    // Make sure we have valid domain indices
    if (state.currentDomainIndex >= QUESTIONNAIRE_DOMAINS.length) {
      completeQuestionnaire()
      return
    }

    const currentDomain = QUESTIONNAIRE_DOMAINS[state.currentDomainIndex]
    if (!currentDomain) {
      console.error("Invalid domain index:", state.currentDomainIndex)
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
      console.error("Invalid question index:", state.currentQuestionIndex, "for domain:", currentDomain.id)
      // This shouldn't happen if the above check works, but just in case
      askToContinue()
      return
    }

    // Create a unique key for this question to prevent duplicates
    const questionKey = `question_${currentDomain.id}_${currentQuestion.id}`

    // Only send if we haven't sent this question before
    if (!sentMessages.has(questionKey)) {
      sentMessages.add(questionKey)

      // If the current question has predefined options, format them as part of the question
      let formattedQuestion = formatQuestionConversationally(currentDomain, currentQuestion)
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        // Add options to the question text
        formattedQuestion += " " + currentQuestion.options.map((opt) => `"${opt}"`).join(" or ")
      }

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

      // Set the waiting for domain transition flag
      setWaitingForDomainTransition(true)
      setNextDomainIndex(state.currentDomainIndex + 1)

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
      // "Could you tell me, ",
      // "I'd like to know, ",
      // "Please share with me, ",
      // "Would you mind telling me, ",
      // "I'm wondering, ",
      "",
    ]

    const leadIn = conversationalLeadIns[Math.floor(Math.random() * conversationalLeadIns.length)]
    return `${leadIn}${question.text}`
  }

  // Completely rewritten handleUserResponse function with proper error handling
  const handleUserResponse = (response: string) => {
    try {
      console.log("Processing user response:", response)
      console.log("Current state:", {
        isActive: state.isActive,
        isCompleted: state.isCompleted,
        currentDomainIndex: state.currentDomainIndex,
        currentQuestionIndex: state.currentQuestionIndex,
        hasAskedForTime,
        userWantsToStart,
        waitingForDomainTransition,
        nextDomainIndex,
      })

      if (!state.isActive || state.isCompleted) {
        console.log("Questionnaire is not active or is completed, ignoring response")
        return false
      }

      // Handle the "Do you have a few minutes?" question
      if (hasAskedForTime && !userWantsToStart) {
        console.log("Processing response to 'Do you have a few minutes?' question")

        // Check for positive responses
        if (/yes|yeah|sure|ok|okay|go ahead|proceed|continue|start/i.test(response)) {
          console.log("User wants to start the questionnaire")
          setUserWantsToStart(true)
          return true
        }

        // Check for negative responses
        if (/no|nope|not now|later|busy|can't|cannot|don't have time/i.test(response)) {
          console.log("User doesn't want to start the questionnaire now")
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
        console.log("Unclear response to time question, assuming user wants to start")
        setUserWantsToStart(true)
        return true
      }

      // CRITICAL: Check if we're waiting for domain transition confirmation
      if (waitingForDomainTransition) {
        console.log("Processing response to domain transition question:", response)

        // Continue patterns - match phrases indicating the user wants to continue
        const continuePatterns = [
          /\b(?:yes|yeah|sure|ok|okay|yep|yup|fine|alright|absolutely|definitely)\b/i,
          /\b(?:i(?:'d| would| want| wanna)?|let(?:'s| us)?) (?:like to |want to |wanna |)(?:continue|proceed|go on|keep going|move forward|carry on)\b/i,
          /\b(?:i(?:'m| am)?) (?:ready|good to go|set|all set)\b/i,
          /\b(?:go|move|let's go|we can go) (?:on|ahead|forward|with it|with this)\b/i,
          /\b(?:continue|proceed|go|start|resume|let's do it)\b/i,
        ]

        // Pause patterns - more natural language friendly
        const pausePatterns = [
          /\b(?:no|nope|not now|later|busy|can't|cannot|don't have time|nah)\b/i,
          /\b(?:i(?:'d| would| want| don't want| can't| cannot)?|let(?:'s| us)?) (?:like to |want to |need to |prefer to |rather |)(?:pause|stop|wait|hold off|continue later|do this later)\b/i,
          /\b(?:i(?:'m| am)?) (?:busy|not ready|occupied|unavailable|tied up|in the middle of something)\b/i,
          /\b(?:another|different|some other|better) time\b/i,
          /\b(?:we can|let's|can we|could we|i(?:'d| would)) (?:do this|continue|finish|talk|chat|discuss this) (?:later|another time|some other time|when i have time|tomorrow|after|next time)\b/i,
          /\b(?:i need|let me take|give me) a (?:break|pause|moment|minute|sec|second)\b/i,
          /\b(?:can't|cannot|won't be able to) (?:continue|proceed|go on|keep going) (?:now|right now|at the moment|at this time)\b/i,
        ]

        // If they want to continue
        if (continuePatterns.some((pattern) => pattern.test(response.trim()))) {
          console.log("User wants to continue to the next domain")

          // Reset the waiting flag
          setWaitingForDomainTransition(false)

          // Check if we have a valid next domain index
          if (nextDomainIndex >= 0 && nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
            // Move to the next domain
            setState((prevState) => ({
              ...prevState,
              currentDomainIndex: nextDomainIndex,
              currentQuestionIndex: 0, // Start at the first question
            }))
          } else {
            // If we don't have a valid next domain index, just move to the next domain
            moveToNextDomain()
          }
          return true
        }

        // If they want to pause
        if (pausePatterns.some((pattern) => pattern.test(response.trim()))) {
          console.log("User wants to pause the questionnaire")

          // Reset the waiting flag
          setWaitingForDomainTransition(false)
          setNextDomainIndex(-1)

          // CRITICAL: Add a return statement here to prevent the next useEffect from firing
          // and immediately sending the next question
          setTimeout(() => {
            // Save the current state but mark as paused - do this in a timeout to ensure
            // it happens after the current execution cycle
            setState((prevState) => ({
              ...prevState,
              isPaused: true,
              isActive: false, // Also set isActive to false to completely stop the questionnaire
            }))
          }, 100)

          const pauseKey = `pause_${state.currentDomainIndex}`
          if (!sentMessages.has(pauseKey)) {
            sentMessages.add(pauseKey)
            const pauseMessage =
              "I've saved your progress. We can continue this conversation whenever you're ready. Just let me know when you want to resume."

            // Save this as the last message
            saveLastQuestion("pause", pauseKey, pauseMessage)

            onQuestionReady(pauseMessage)
          }
          return true
        }

        // If response is unclear, assume they want to continue
        console.log("Unclear response to continue/pause question, assuming user wants to continue")

        // Reset the waiting flag
        setWaitingForDomainTransition(false)

        // Check if we have a valid next domain index
        if (nextDomainIndex >= 0 && nextDomainIndex < QUESTIONNAIRE_DOMAINS.length) {
          // Move to the next domain
          setState((prevState) => ({
            ...prevState,
            currentDomainIndex: nextDomainIndex,
            currentQuestionIndex: 0, // Start at the first question
          }))
        } else {
          // If we don't have a valid next domain index, just move to the next domain
          moveToNextDomain()
        }
        return true
      }

      // Check if we're at the end of a domain (asking if they want to continue)
      // This is the critical check that needs to happen BEFORE trying to access currentQuestion
      const currentDomain = QUESTIONNAIRE_DOMAINS[state.currentDomainIndex]
      if (!currentDomain) {
        console.error("Invalid domain index:", state.currentDomainIndex)
        return false
      }

      // CRITICAL: Check if we're at the end of questions in this domain
      // This is where the error was happening - we need to check this BEFORE trying to access currentQuestion
      if (state.currentQuestionIndex >= currentDomain.questions.length) {
        console.log("At the end of domain questions, but not waiting for transition. This shouldn't happen.")
        // This shouldn't happen now that we're using the waitingForDomainTransition flag
        // But just in case, ask if they want to continue
        askToContinue()
        return true
      }

      // Now we can safely get the current question
      const currentQuestion = currentDomain.questions[state.currentQuestionIndex]
      if (!currentQuestion) {
        console.error("Invalid question index:", state.currentQuestionIndex, "for domain:", currentDomain.id)
        return false
      }

      console.log("Processing response to question:", currentQuestion.id)

      // Check if this question has follow-up logic
      if (currentQuestion.followUp && Object.keys(currentQuestion.followUp).length > 0) {
        // Clean and normalize the user's response for better matching
        const cleanedResponse = response.trim().toLowerCase()

        console.log("Checking follow-up logic for question:", currentQuestion.id, "with response:", cleanedResponse)
        console.log("Available follow-up options:", currentQuestion.followUp)

        // Debug log to help diagnose the issue
        console.log("Current question:", {
          id: currentQuestion.id,
          text: currentQuestion.text,
          options: currentQuestion.options,
          followUp: currentQuestion.followUp,
        })

        // Check for domain transition in followUp
        const hasDomainTransition = Object.values(currentQuestion.followUp).some(
          (value) => typeof value === "string" && value.startsWith("domain-"),
        )

        if (hasDomainTransition) {
          console.log("This question has domain transition in followUp")

          // Special case for wildcard follow-up (any response)
          if (currentQuestion.followUp["*"] && currentQuestion.followUp["*"].startsWith("domain-")) {
            const nextDomainId = currentQuestion.followUp["*"]
            console.log(`WILDCARD DOMAIN MATCH: Any response redirects to ${nextDomainId}`)

            // Extract the domain number (e.g., "domain-2" -> 1 for zero-based index)
            const domainNumber = Number.parseInt(nextDomainId.split("-")[1]) - 1

            if (domainNumber >= 0 && domainNumber < QUESTIONNAIRE_DOMAINS.length) {
              // Save the response
              const questionnaireResponse: QuestionnaireResponse = {
                questionId: currentQuestion.id,
                domainId: currentDomain.id,
                response: response,
                flag: currentQuestion.flag || "",
                timestamp: new Date(),
              }

              // Update state with the new response
              const updatedResponses = [...state.responses, questionnaireResponse]

              // Notify parent component
              onResponseSaved(questionnaireResponse)

              // Instead of immediately transitioning, ask if they want to continue
              setState((prevState) => ({
                ...prevState,
                responses: updatedResponses,
                // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
                currentQuestionIndex: currentDomain.questions.length,
              }))

              // Set the next domain index for when they confirm
              setNextDomainIndex(domainNumber)

              // Ask if they want to continue to the next domain
              askToContinue()

              return true
            }
          }

          // Check for specific option matches that lead to domain transitions
          if (currentQuestion.options && currentQuestion.options.length > 0) {
            for (const option of currentQuestion.options) {
              const normalizedOption = option.toLowerCase()

              // Check if the response matches this option
              if (cleanedResponse === normalizedOption || cleanedResponse.includes(normalizedOption)) {
                // Check if this option has a domain transition
                const nextQuestionId = currentQuestion.followUp[option]
                if (nextQuestionId && nextQuestionId.startsWith("domain-")) {
                  console.log(
                    `OPTION MATCH with DOMAIN TRANSITION: Response "${response}" matches "${option}", redirects to ${nextQuestionId}`,
                  )

                  // Extract domain number
                  const domainNumber = Number.parseInt(nextQuestionId.split("-")[1]) - 1

                  if (domainNumber >= 0 && domainNumber < QUESTIONNAIRE_DOMAINS.length) {
                    // Save the response
                    const questionnaireResponse: QuestionnaireResponse = {
                      questionId: currentQuestion.id,
                      domainId: currentDomain.id,
                      response: option, // Use the matched option for consistency
                      flag: currentQuestion.flag || "",
                      timestamp: new Date(),
                    }

                    // Update state with the new response
                    const updatedResponses = [...state.responses, questionnaireResponse]

                    // Notify parent component
                    onResponseSaved(questionnaireResponse)

                    // Instead of immediately transitioning, ask if they want to continue
                    setState((prevState) => ({
                      ...prevState,
                      responses: updatedResponses,
                      // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
                      currentQuestionIndex: currentDomain.questions.length,
                    }))

                    // Set the next domain index for when they confirm
                    setNextDomainIndex(domainNumber)

                    // Ask if they want to continue to the next domain
                    askToContinue()

                    return true
                  }
                }
              }
            }
          }

          // Special handling for Yes/No responses that lead to domain transitions
          const yesVariations = ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "correct", "right", "true"]
          const noVariations = ["no", "nope", "nah", "not really", "false", "incorrect", "wrong"]

          // Check for Yes variations
          if (currentQuestion.followUp["Yes"] || currentQuestion.followUp["YES"]) {
            const nextQuestionId = currentQuestion.followUp["Yes"] || currentQuestion.followUp["YES"]
            if (
              nextQuestionId.startsWith("domain-") &&
              yesVariations.some((v) => cleanedResponse === v || cleanedResponse.includes(v))
            ) {
              console.log(
                `YES MATCH with DOMAIN TRANSITION: Response "${response}" matches "Yes", redirects to ${nextQuestionId}`,
              )

              // Extract domain number
              const domainNumber = Number.parseInt(nextQuestionId.split("-")[1]) - 1

              if (domainNumber >= 0 && domainNumber < QUESTIONNAIRE_DOMAINS.length) {
                // Save the response
                const questionnaireResponse: QuestionnaireResponse = {
                  questionId: currentQuestion.id,
                  domainId: currentDomain.id,
                  response: "Yes", // Standardize the response
                  flag: currentQuestion.flag || "",
                  timestamp: new Date(),
                }

                // Update state with the new response
                const updatedResponses = [...state.responses, questionnaireResponse]

                // Notify parent component
                onResponseSaved(questionnaireResponse)

                // Instead of immediately transitioning, ask if they want to continue
                setState((prevState) => ({
                  ...prevState,
                  responses: updatedResponses,
                  // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
                  currentQuestionIndex: currentDomain.questions.length,
                }))

                // Set the next domain index for when they confirm
                setNextDomainIndex(domainNumber)

                // Ask if they want to continue to the next domain
                askToContinue()

                return true
              }
            }
          }

          // Check for No variations
          if (currentQuestion.followUp["No"] || currentQuestion.followUp["NO"]) {
            const nextQuestionId = currentQuestion.followUp["No"] || currentQuestion.followUp["NO"]
            if (
              nextQuestionId.startsWith("domain-") &&
              noVariations.some((v) => cleanedResponse === v || cleanedResponse.includes(v))
            ) {
              console.log(
                `NO MATCH with DOMAIN TRANSITION: Response "${response}" matches "No", redirects to ${nextQuestionId}`,
              )

              // Extract domain number
              const domainNumber = Number.parseInt(nextQuestionId.split("-")[1]) - 1

              if (domainNumber >= 0 && domainNumber < QUESTIONNAIRE_DOMAINS.length) {
                // Save the response
                const questionnaireResponse: QuestionnaireResponse = {
                  questionId: currentQuestion.id,
                  domainId: currentDomain.id,
                  response: "No", // Standardize the response
                  flag: currentQuestion.flag || "",
                  timestamp: new Date(),
                }

                // Update state with the new response
                const updatedResponses = [...state.responses, questionnaireResponse]

                // Notify parent component
                onResponseSaved(questionnaireResponse)

                // Instead of immediately transitioning, ask if they want to continue
                setState((prevState) => ({
                  ...prevState,
                  responses: updatedResponses,
                  // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
                  currentQuestionIndex: currentDomain.questions.length,
                }))

                // Set the next domain index for when they confirm
                setNextDomainIndex(domainNumber)

                // Ask if they want to continue to the next domain
                askToContinue()

                return true
              }
            }
          }
        }

        // Special handling for malformed domain transition IDs like "domain[q5-1]"
        const nextQuestionId = currentQuestion.followUp["*"]; // Ensure nextQuestionId is defined
        if (typeof nextQuestionId === "string" && nextQuestionId.startsWith("domain[")) {
          // Extract the domain number from the malformed format
          const match = nextQuestionId.match(/domain\[q(\d+)-\d+\]/)
          if (match && match[1]) {
            const domainNumber = Number.parseInt(match[1], 10) - 1
            console.log(`Fixing malformed domain transition: ${nextQuestionId} -> domain-${domainNumber + 1}`)

            if (domainNumber >= 0 && domainNumber < QUESTIONNAIRE_DOMAINS.length) {
              // Save the response
              const questionnaireResponse: QuestionnaireResponse = {
                questionId: currentQuestion.id,
                domainId: currentDomain.id,
                response:response, // Use matched option if available
                flag: currentQuestion.flag || "",
                timestamp: new Date(),
              }

              // Update state with the new response
              const updatedResponses = [...state.responses, questionnaireResponse]

              // Notify parent component
              onResponseSaved(questionnaireResponse)

              // Instead of immediately transitioning, ask if they want to continue
              setState((prevState) => ({
                ...prevState,
                responses: updatedResponses,
                // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
                currentQuestionIndex: currentDomain.questions.length,
              }))

              // Set the next domain index for when they confirm
              setNextDomainIndex(domainNumber)

              // Ask if they want to continue to the next domain
              askToContinue()

              return true
            }
          }
        }

        // Handle non-domain transition follow-ups

        // Special case for wildcard follow-up (any response)
        if (currentQuestion.followUp && currentQuestion.followUp["*"]) {
          const nextQuestionId = currentQuestion.followUp["*"]
          if (!nextQuestionId.startsWith("domain-")) {
            console.log(`WILDCARD MATCH: Any response redirects to ${nextQuestionId}`)

            // Find the target question by ID directly
            const targetQuestionIndex = currentDomain.questions.findIndex((q) => q.id === nextQuestionId)

            if (targetQuestionIndex !== -1) {
              console.log(
                `Found target question at index ${targetQuestionIndex}:`,
                currentDomain.questions[targetQuestionIndex],
              )

              // Save the response before moving to the follow-up
              const questionnaireResponse: QuestionnaireResponse = {
                questionId: currentQuestion.id,
                domainId: currentDomain.id,
                response: response,
                flag: currentQuestion.flag || "",
                timestamp: new Date(),
              }

              // Update state with the new response
              const updatedResponses = [...state.responses, questionnaireResponse]

              // Update state to jump to the follow-up question by ID
              setState((prevState) => ({
                ...prevState,
                responses: updatedResponses,
                currentQuestionIndex: targetQuestionIndex,
              }))

              // Notify parent component
              onResponseSaved(questionnaireResponse)

              // Return true to indicate this was handled
              return true
            }
          }
        }

        // First check for exact matches with the options
        if (currentQuestion.options && currentQuestion.options.length > 0) {
          for (const option of currentQuestion.options) {
            const normalizedOption = option.toLowerCase()

            // Check if the response exactly matches or contains the option
            if (cleanedResponse === normalizedOption || cleanedResponse.includes(normalizedOption)) {
              // If we have a follow-up defined for this option
              if (currentQuestion.followUp[option] && !currentQuestion.followUp[option].startsWith("domain-")) {
                const nextQuestionId = currentQuestion.followUp[option]
                console.log(
                  `OPTION MATCH: Response "${response}" matches "${option}", redirecting to ${nextQuestionId}`,
                )

                // Find the target question by ID directly
                const targetQuestionIndex = currentDomain.questions.findIndex((q) => q.id === nextQuestionId)

                if (targetQuestionIndex !== -1) {
                  console.log(
                    `Found target question at index ${targetQuestionIndex}:`,
                    currentDomain.questions[targetQuestionIndex],
                  )

                  // Save the response before moving to the follow-up
                  const questionnaireResponse: QuestionnaireResponse = {
                    questionId: currentQuestion.id,
                    domainId: currentDomain.id,
                    response: option, // Use the matched option for consistency
                    flag: currentQuestion.flag || "",
                    timestamp: new Date(),
                  }

                  // Update state with the new response
                  const updatedResponses = [...state.responses, questionnaireResponse]

                  // Update state to jump to the follow-up question by ID
                  setState((prevState) => ({
                    ...prevState,
                    responses: updatedResponses,
                    currentQuestionIndex: targetQuestionIndex, // Set to the exact index of the target question
                  }))

                  // Notify parent component
                  onResponseSaved(questionnaireResponse)

                  // Return true to indicate this was handled
                  return true
                } else {
                  console.error(`ERROR: Could not find target question with ID ${nextQuestionId}`)

                  // Check if this might be a malformed domain transition
                  if (nextQuestionId.includes("domain")) {
                    console.log("This appears to be a malformed domain transition. Attempting to handle it...")

                    // Try to extract domain number using various patterns
                    let domainNumber = -1

                    // Try pattern "domain[q5-1]" -> domain 5
                    const bracketMatch = nextQuestionId.match(/domain\[q(\d+)-\d+\]/)
                    if (bracketMatch && bracketMatch[1]) {
                      domainNumber = Number.parseInt(bracketMatch[1], 10) - 1
                    }

                    // Try pattern "domain5" -> domain 5
                    const directMatch = nextQuestionId.match(/domain(\d+)/)
                    if (directMatch && directMatch[1]) {
                      domainNumber = Number.parseInt(directMatch[1], 10) - 1
                    }

                    if (domainNumber >= 0 && domainNumber < QUESTIONNAIRE_DOMAINS.length) {
                      console.log(`Recovered from error: Redirecting to domain ${domainNumber + 1}`)

                      // Save the response
                      const questionnaireResponse: QuestionnaireResponse = {
                        questionId: currentQuestion.id,
                        domainId: currentDomain.id,
                        response: option,
                        flag: currentQuestion.flag || "",
                        timestamp: new Date(),
                      }

                      // Update state with the new response
                      const updatedResponses = [...state.responses, questionnaireResponse]

                      // Notify parent component
                      onResponseSaved(questionnaireResponse)

                      // Instead of immediately transitioning, ask if they want to continue
                      setState((prevState) => ({
                        ...prevState,
                        responses: updatedResponses,
                        // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
                        currentQuestionIndex: currentDomain.questions.length,
                      }))

                      // Set the next domain index for when they confirm
                      setNextDomainIndex(domainNumber)

                      // Ask if they want to continue to the next domain
                      askToContinue()

                      return true
                    }
                  }

                  // If we couldn't recover, just move to the next question in sequence
                  console.log("Could not recover from error. Moving to next question in sequence.")
                  moveToNextQuestion()
                  return true
                }
              }
            }
          }
        }

        // Special handling for Yes/No responses
        const yesVariations = ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "correct", "right", "true"]
        const noVariations = ["no", "nope", "nah", "not really", "false", "incorrect", "wrong"]

        // Check for Yes variations
        if (
          (currentQuestion.followUp["Yes"] || currentQuestion.followUp["YES"]) &&
          yesVariations.some((v) => cleanedResponse === v || cleanedResponse.includes(v))
        ) {
          const nextQuestionId = currentQuestion.followUp["Yes"] || currentQuestion.followUp["YES"]
          if (!nextQuestionId.startsWith("domain-")) {
            console.log(`YES MATCH: Response "${response}" matches "Yes", redirecting to ${nextQuestionId}`)

            // Find the target question by ID directly
            const targetQuestionIndex = currentDomain.questions.findIndex((q) => q.id === nextQuestionId)

            if (targetQuestionIndex !== -1) {
              console.log(
                `Found target question at index ${targetQuestionIndex}:`,
                currentDomain.questions[targetQuestionIndex],
              )

              // Save the response before moving to the follow-up
              const questionnaireResponse: QuestionnaireResponse = {
                questionId: currentQuestion.id,
                domainId: currentDomain.id,
                response: "Yes", // Standardize the response
                flag: currentQuestion.flag || "",
                timestamp: new Date(),
              }

              // Update state with the new response
              const updatedResponses = [...state.responses, questionnaireResponse]

              // Update state to jump to the follow-up question by ID
              setState((prevState) => ({
                ...prevState,
                responses: updatedResponses,
                currentQuestionIndex: targetQuestionIndex, // Set to the exact index of the target question
              }))

              // Notify parent component
              onResponseSaved(questionnaireResponse)

              // Return true to indicate this was handled
              return true
            }
          }
        }

        // Check for No variations
        if (
          (currentQuestion.followUp["No"] || currentQuestion.followUp["NO"]) &&
          noVariations.some((v) => cleanedResponse === v || cleanedResponse.includes(v))
        ) {
          const nextQuestionId = currentQuestion.followUp["No"] || currentQuestion.followUp["NO"]
          if (!nextQuestionId.startsWith("domain-")) {
            console.log(`NO MATCH: Response "${response}" matches "No", redirecting to ${nextQuestionId}`)

            // Find the target question by ID directly
            const targetQuestionIndex = currentDomain.questions.findIndex((q) => q.id === nextQuestionId)

            if (targetQuestionIndex !== -1) {
              console.log(
                `Found target question at index ${targetQuestionIndex}:`,
                currentDomain.questions[targetQuestionIndex],
              )

              // Save the response before moving to the follow-up
              const questionnaireResponse: QuestionnaireResponse = {
                questionId: currentQuestion.id,
                domainId: currentDomain.id,
                response: "No", // Standardize the response
                flag: currentQuestion.flag || "",
                timestamp: new Date(),
              }

              // Update state with the new response
              const updatedResponses = [...state.responses, questionnaireResponse]

              // Update state to jump to the follow-up question by ID
              setState((prevState) => ({
                ...prevState,
                responses: updatedResponses,
                currentQuestionIndex: targetQuestionIndex, // Set to the exact index of the target question
              }))

              // Notify parent component
              onResponseSaved(questionnaireResponse)

              // Return true to indicate this was handled
              return true
            }
          }
        }

        // For numeric options (like floor numbers)
        const numericMatch = cleanedResponse.match(/\b(\d+)(?:st|nd|rd|th)?\b/)
        if (numericMatch) {
          const extractedNumber = numericMatch[1]
          for (const [option, nextQuestionId] of Object.entries(currentQuestion.followUp)) {
            if (option.includes(extractedNumber) && !nextQuestionId.startsWith("domain-")) {
              console.log(`NUMERIC MATCH: Response "${response}" matches "${option}", redirecting to ${nextQuestionId}`)

              // Find the target question by ID directly
              const targetQuestionIndex = currentDomain.questions.findIndex((q) => q.id === nextQuestionId)

              if (targetQuestionIndex !== -1) {
                // Save the response before moving to the follow-up
                const questionnaireResponse: QuestionnaireResponse = {
                  questionId: currentQuestion.id,
                  domainId: currentDomain.id,
                  response: option,
                  flag: currentQuestion.flag || "",
                  timestamp: new Date(),
                }

                // Update state with the new response
                const updatedResponses = [...state.responses, questionnaireResponse]

                setState((prevState) => ({
                  ...prevState,
                  responses: updatedResponses,
                  currentQuestionIndex: targetQuestionIndex,
                }))

                // Notify parent component
                onResponseSaved(questionnaireResponse)

                return true
              }
            }
          }
        }

        // If we get here, no follow-up match was found
        console.log("No follow-up match found for response:", cleanedResponse)
      }

      // Process a regular response to a question
      console.log("Processing regular response to question")

      // Initialize flag with any existing flag from the question
      let flag = currentQuestion.flag || ""

      // Domain I: Housing & Environment
      if (currentDomain.id === "domain-1") {
        // Question about floor level
        if (
          currentQuestion.id === "q1-6" &&
          /[3-9]|[1-9][0-9]+/i.test(response) // Match any number 3 or higher
        ) {
          flag = "High floor without elevator - mobility concern"
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

      // Notify parent component
      onResponseSaved(questionnaireResponse)

      // Check if we need to move to the next domain (special case for domain transition)
      if (
        currentQuestion.id.includes("filter-info") ||
        currentQuestion.id.includes("no-filter-info") ||
        currentQuestion.id.includes("lead-info") ||
        currentQuestion.id.includes("exhaust-info") ||
        currentQuestion.id.includes("home-unsafe")
      ) {
        console.log("Special case: Moving to domain-2 after information question")

        // Instead of immediately transitioning, ask if they want to continue
        setState((prevState) => ({
          ...prevState,
          responses: updatedResponses,
          // Set currentQuestionIndex to a value beyond the questions array length to trigger askToContinue
          currentQuestionIndex: currentDomain.questions.length,
        }))

        // Set the next domain index for when they confirm
        setNextDomainIndex(1) // domain-2 is index 1

        // Ask if they want to continue to the next domain
        askToContinue()

        return true
      }

      // Move to the next question
      setState((prevState) => ({
        ...prevState,
        responses: updatedResponses,
      }))

      moveToNextQuestion()

      // Return true to indicate this was handled as a questionnaire response
      return true
    } catch (error) {
      // Log the error with detailed state information
      console.error("Error in handleUserResponse:", error)
      console.error("Current state when error occurred:", {
        currentDomainIndex: state.currentDomainIndex,
        currentQuestionIndex: state.currentQuestionIndex,
        response: response,
      })

      // Return false to indicate there was an error
      return false
    }
  }

  const moveToNextQuestion = () => {
    try {
      const currentDomain = QUESTIONNAIRE_DOMAINS[state.currentDomainIndex]
      if (!currentDomain) {
        console.error("Invalid domain index in moveToNextQuestion:", state.currentDomainIndex)
        return
      }

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
    } catch (error) {
      console.error("Error in moveToNextQuestion:", error)
    }
  }

  const moveToNextDomain = () => {
    try {
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

      // Reset domain transition state
      setWaitingForDomainTransition(false)
      setNextDomainIndex(-1)
    } catch (error) {
      console.error("Error in moveToNextDomain:", error)
    }
  }

  const completeQuestionnaire = async () => {
    try {
      // Mark questionnaire as completed first
      setState((prevState) => ({
        ...prevState,
        isActive: false,
        isCompleted: true,
      }))

      try {
        console.log("Awarding Trivia Queen badge for completing all domains")
        const badgeResult = await awardTriviaBadge(userId)
        console.log(`Trivia Queen badge award result:`, badgeResult)
      } catch (err) {
        console.error(`Error awarding Trivia Queen badge:`, err)
        // Continue with the rest of the function even if badge award fails
      }

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
    } catch (error) {
      console.error("Error in completeQuestionnaire:", error)
    }
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

      // Reset domain transition state
      setWaitingForDomainTransition(false)
      setNextDomainIndex(-1)

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
        if (savedState.currentQuestionIndex >= QUESTIONNAIRE_DOMAINS[savedState.currentDomainIndex]?.questions.length) {
          console.log("Resuming at domain continuation point")
          const continueKey = `continue_${savedState.currentDomainIndex}`
          sentMessages.add(continueKey)

          // Set the waiting for domain transition flag
          setWaitingForDomainTransition(true)
          setNextDomainIndex(savedState.currentDomainIndex + 1)

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
          if (!currentDomain) {
            console.error("Invalid domain index when resuming:", savedState.currentDomainIndex)
            return
          }

          const currentQuestion = currentDomain.questions[savedState.currentQuestionIndex]
          if (!currentQuestion) {
            console.error("Invalid question index when resuming:", savedState.currentQuestionIndex)
            return
          }

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
              `Let's continue where we left off. ${formatQuestionConversationally(
                QUESTIONNAIRE_DOMAINS[domainIndex],
                nextQuestion,
              )}`,
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

  // Add a new effect to immediately stop processing when paused
  useEffect(() => {
    if (state.isPaused) {
      console.log("Questionnaire is now paused, preventing further questions")
      // Clear any pending timers or operations that might send the next question
      sentMessages.add("paused_questionnaire")
    }
  }, [state.isPaused])

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
