export interface ProcessUserQueryParams {
    query: string;
    userId: string;
    messages: any[];
    healthStats: any;
    questionnaireManager: {
      isActive: boolean;
      handleUserResponse: (query: string) => Promise<boolean> | boolean;
      startQuestionnaire: () => void;
      resumeQuestionnaire: () => Promise<void> | void;
      isCompleted?: boolean;
    };
    callbacks: {
      setIsProcessing: (value: boolean) => void;
      setMessages: (updater: (prevMessages: any[]) => any[]) => void;
      handleLogRequest: (query: string) => Promise<boolean>;
      handleGoalRequest: (query: string) => Promise<boolean>;
      speakResponse: (text: string) => void;
      sendToAPI: (messageContent: string, messageType: 'text' | 'audio') => Promise<{ response: string }>;
      callRagService?: (query: string, conversationHistory: any[]) => Promise<any>;
    };
  }

export const processUserQuery = async ({
  query,
  userId,
  messages,
  healthStats,
  questionnaireManager,
  callbacks
}: ProcessUserQueryParams): Promise<void> => {
  try {
    console.log("processUserQuery started with:", query);
    callbacks.setIsProcessing(true);

    // Check if this is a response to the "continue paused questionnaire" question
    if (messages.length > 0 && !messages[messages.length - 1].isUser) {
      // Look for specific continuation patterns
      const lastMessage = messages[messages.length - 1].content;

      // Check if the last message is asking about continuing
      const continuationPrompts = [
        /continue this conversation/i,
        /continue where you left off/i,
        /unfinished questionnaire/i,
        /we can continue/i,
        /ready. Just let me know/i,
        /would you like to continue/i,
      ];

      const isContinuationPrompt = continuationPrompts.some((pattern) =>
        pattern.test(lastMessage)
      );

      if (isContinuationPrompt) {
        console.log("Detected continuation prompt response");

        // Check for positive responses
        const positiveResponses = [
          /^yes$/i,
          /^yeah$/i,
          /^sure$/i,
          /^ok$/i,
          /^okay$/i,
          /^continue$/i,
          /^let's continue$/i,
          /^ready$/i,
          /^resume$/i,
          /^let's go$/i,
          /^go$/i,
        ];

        if (positiveResponses.some((pattern) => pattern.test(query.trim()))) {
          console.log("User wants to resume questionnaire");

          // Add user's message to the chat
          callbacks.setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: Date.now().toString(),
              type: "text",
              content: query,
              isUser: true,
              timestamp: new Date(),
            },
          ]);

          // Add a single confirmation message
          callbacks.setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: "Great! Let's pick up where we left off.",
              isUser: false,
              timestamp: new Date(),
            },
          ]);

          // Use a slight delay before resuming
          setTimeout(() => {
            questionnaireManager.resumeQuestionnaire();
          }, 800);

          callbacks.setIsProcessing(false);
          return;
        }
      }
    }

    // First check if this is a questionnaire response
    if (questionnaireManager.isActive) {
        try {
          const wasHandledAsQuestionnaireResponse = await questionnaireManager.handleUserResponse(query);
          if (wasHandledAsQuestionnaireResponse) {
            callbacks.setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.error("Error handling questionnaire response:", error);
        }
      }

    // Check if this is a request to start the questionnaire
    if (
      /start questionnaire|begin questionnaire|take questionnaire|health assessment|assessment/i.test(
        query
      )
    ) {
      questionnaireManager.startQuestionnaire();
      callbacks.setIsProcessing(false);
      return;
    }

    // First check if this is a log request
    const wasHandledAsLogRequest = await callbacks.handleLogRequest(query);

    if (wasHandledAsLogRequest) {
      callbacks.setIsProcessing(false);
      return;
    }

    // Then check if this is a goal setting request
    const wasHandledAsGoalRequest = await callbacks.handleGoalRequest(query);

    if (wasHandledAsGoalRequest) {
      callbacks.setIsProcessing(false);
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
        !/sleep duration/i.test(query));

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
    });

    // Handle comprehensive health stats query
    if (isComprehensiveQuery) {
      console.log("Detected comprehensive health stats query");

      // Format a comprehensive health stats response
      let statsMessage = "Here's a summary of your health statistics:\n\n";

      // Determine time period to report
      let reportPeriod = "weekly"; // Default to weekly
      if (isTodayQuery) reportPeriod = "today";
      if (isMonthlyQuery) reportPeriod = "monthly";

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

      // Add a note if some metrics are missing
      if (
        healthStats.heart.avgWeekly === 0 ||
        healthStats.sleep.avgWeekly === 0
      ) {
        statsMessage +=
          "\nSome metrics have no data. Regular tracking will provide more complete insights.";
      }

      // Speak the response
      callbacks.speakResponse(statsMessage);

      // Add the response to messages
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: statsMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      callbacks.setIsProcessing(false);
      return; // Exit early since we've handled this specific query
    }

    // Handle specific metric queries
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
        // Default to weekly if no time period specified
        waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(
          1
        )} glasses per day over the past week. Today you've had ${
          healthStats.water.today
        } glasses.`;
      }

      waterMessage += " Staying hydrated is important for your pregnancy!";
      // Speak the response
      callbacks.speakResponse(waterMessage);

      // Add the response to messages
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: waterMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      callbacks.setIsProcessing(false);
      return;
    }

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
        callbacks.speakResponse(noDataMessage);

        // Add the response to messages
        callbacks.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: noDataMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        callbacks.setIsProcessing(false);
        return;
      }

      let weightMessage = "";

      if (isMonthlyQuery) {
        weightMessage = `Your average weight is ${healthStats.weight.avgMonthly.toFixed(
          1
        )} ${healthStats.weight.unit} over the past month.`;
      } else {
        // Default to weekly average for "what is avg weight" queries
        weightMessage = `Your average weight is ${healthStats.weight.avgWeekly.toFixed(
          1
        )} ${healthStats.weight.unit} over the past week.`;
      }

      callbacks.speakResponse(weightMessage);

      // Add the response to messages
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: weightMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      callbacks.setIsProcessing(false);
      return;
    }

    // Steps queries
    if (isStepsQuery) {
      let stepsMessage = "";

      if (isTodayQuery) {
        stepsMessage = `You've taken ${healthStats.steps.today} steps today.`;
      } else if (isWeeklyQuery || isAverageQuery) {
        stepsMessage = `Your average daily step count is ${healthStats.steps.avgWeekly.toFixed(
          0
        )} steps over the past week. Your total steps this week were ${
          healthStats.steps.weekly
        }.`;
      } else if (isMonthlyQuery) {
        stepsMessage = `Your average daily step count is ${healthStats.steps.avgMonthly.toFixed(
          0
        )} steps over the past month. Your total steps this month were ${
          healthStats.steps.monthly
        }.`;
      } else {
        // Default to weekly if no time period specified
        stepsMessage = `Your average daily step count is ${healthStats.steps.avgWeekly.toFixed(
          0
        )} steps over the past week. Today you've taken ${
          healthStats.steps.today
        } steps.`;
      }

      stepsMessage +=
        " Regular walking is excellent exercise during pregnancy!";

      callbacks.speakResponse(stepsMessage);

      // Add the response to messages
      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: stepsMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      callbacks.setIsProcessing(false);
      return;
    }

    // Heart rate queries
    if (isHeartQuery) {
      if (
        healthStats.heart.avgWeekly === 0 &&
        healthStats.heart.today === 0
      ) {
        const noDataMessage =
          "I don't have enough heart rate data to calculate statistics. Please log your heart rate regularly for better tracking.";
        callbacks.speakResponse(noDataMessage);

        callbacks.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            type: "text",
            content: noDataMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ]);

        callbacks.setIsProcessing(false);
        return;
      }

      let heartMessage = "";

      if (isTodayQuery) {
        heartMessage = `Your heart rate today is ${healthStats.heart.today} bpm.`;
      } else if (isWeeklyQuery || isAverageQuery) {
        heartMessage = `Your average heart rate is ${healthStats.heart.avgWeekly.toFixed(
          0
        )} bpm over the past week.`;
      } else if (isMonthlyQuery) {
        heartMessage = `Your average heart rate is ${healthStats.heart.avgMonthly.toFixed(
          0
        )} bpm over the past month.`;
      } else {
        heartMessage = `Your current heart rate is ${
          healthStats.heart.today
        } bpm, and your weekly average is ${healthStats.heart.avgWeekly.toFixed(
          0
        )} bpm.`;
      }

      callbacks.speakResponse(heartMessage);

      callbacks.setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          type: "text",
          content: heartMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      callbacks.setIsProcessing(false);
      return;
    }

    // Format conversation history for RAG
    const recentMessages = messages
      .slice(-6) // Last 6 messages for context
      .filter(msg => msg.type === "text") // Only text messages
      .map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }));

    // Try to use RAG service if available
    if (callbacks.callRagService) {
      try {
        const ragResponse = await callbacks.callRagService(query, recentMessages);
        
        if (ragResponse && ragResponse.success) {
          // Use the response from RAG service
          const assistantMessage = ragResponse.response;
          callbacks.speakResponse(assistantMessage);

          // Add the response to messages
          callbacks.setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: (Date.now() + 1).toString(),
              type: "text",
              content: assistantMessage,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          
          callbacks.setIsProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Error with RAG service, falling back to API:", error);
      }
    }

    // Fall back to Gemini API
    const apiResponse = await callbacks.sendToAPI(query, "text");
    
    if (apiResponse) {
      const assistantMessage = apiResponse.response;
      callbacks.speakResponse(assistantMessage);

      // Add the response to messages
      callbacks.setMessages((prevMessages) => [
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

    callbacks.setIsProcessing(false);
  } catch (error: any) {
    console.error("Error in processUserQuery:", error.message);
    console.error("Error stack:", error.stack);
    callbacks.setIsProcessing(false);
    
    // Add error message to chat
    callbacks.setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: (Date.now() + 1).toString(),
        type: "text",
        content: "I'm sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }
};