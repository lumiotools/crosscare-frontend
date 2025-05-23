import { useTranslation } from 'react-i18next';
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
      callRagService?: (query: string, conversationHistory: any[], currentLanguage: string) => Promise<any>;
    };
    shouldSpeak:boolean
  }

export const processUserQuery = async ({
  query,
  userId,
  messages,
  healthStats,
  questionnaireManager,
  callbacks
}: ProcessUserQueryParams): Promise<void> => {
  const {t} = useTranslation();
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
      /all stats|all metrics|health summary|overview|Show my health stats/i.test(query) ||
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
      let statsMessage = `${t('healthData.statsMessage')}:\n\n`;

      // Determine time period to report
      let reportPeriod = "weekly"; // Default to weekly
      if (isTodayQuery) reportPeriod = "today";
      if (isMonthlyQuery) reportPeriod = "monthly";

      // Water stats
      if (reportPeriod === "today") {
        statsMessage += `${t('water')}: ${healthStats.water.today} ${t('healthData.glasses')} ${t('healthData.today')}\n`;
      } else if (reportPeriod === "weekly") {
        statsMessage += `${t('water')}: ${healthStats.water.avgWeekly.toFixed(
          1
        )} ${t('healthData.glasses_per_day_weekly_avg')}\n`;
      } else {
        statsMessage += `${t('water')}: ${healthStats.water.avgMonthly.toFixed(
          1
        )} ${t('healthData.glasses_per_day_monthly_avg')}\n`;
      }

      // Steps stats
      if (reportPeriod === "today") {
        statsMessage += `${t('steps')}: ${healthStats.steps.today} ${t('healthData.steps_today')}\n`;
      } else if (reportPeriod === "weekly") {
        statsMessage += `${t('steps')}: ${healthStats.steps.avgWeekly.toFixed(
          0
        )} ${t('healthData.steps_per_day_weekly_avg')}\n`;
      } else {
        statsMessage += `${t('steps')}: ${healthStats.steps.avgMonthly.toFixed(
          0
        )} ${t('healthData.steps_per_day_monthly_avg')}\n`;
      }

      // Weight stats
      if (healthStats.weight.avgWeekly > 0) {
        if (reportPeriod === "today") {
          statsMessage += `${t('weight')}: ${healthStats.weight.today} ${healthStats.weight.unit} ${t('healthData.steps_today')}\n`;
        } else if (reportPeriod === "weekly") {
          statsMessage += `${t('weight')}: ${healthStats.weight.avgWeekly.toFixed(
            1
          )} ${healthStats.weight.unit} ${t('healthData.weekly_average')}\n`;
        } else {
          statsMessage += `${t('weight')}: ${healthStats.weight.avgMonthly.toFixed(
            1
          )} ${healthStats.weight.unit} ${t('healthData.monthly_average')}\n`;
        }
      }

      // Heart rate stats
      if (healthStats.heart.avgWeekly > 0) {
        if (reportPeriod === "today") {
          statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.today} ${t('healthData.bpm_today')}\n`;
        } else if (reportPeriod === "weekly") {
          statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.avgWeekly.toFixed(
            0
          )} ${t('healthData.bpm_weekly_avg')}\n`;
        } else {
          statsMessage += `${t('healthData.heart_rate')}: ${healthStats.heart.avgMonthly.toFixed(
            0
          )} ${t('healthData.bpm_monthly_avg')}\n`;
        }
      }

      // Sleep stats
      if (healthStats.sleep.avgWeekly > 0) {
        if (reportPeriod === "today") {
          statsMessage += `${t('sleep')}: ${healthStats.sleep.today.toFixed(
            1
          )} ${t('healthData.hours_today')}\n`;
        } else if (reportPeriod === "weekly") {
          statsMessage += `${t('sleep')}: ${healthStats.sleep.avgWeekly.toFixed(
            1
          )} ${t('healthData.hours_per_night_weekly_avg')}\n`;
        } else {
          statsMessage += `${t('sleep')}: ${healthStats.sleep.avgMonthly.toFixed(
            1
          )} ${t('healthData.hours_per_night_monthly_avg')}\n`;
        }
      }

      // Add a note if some metrics are missing
      if (
        healthStats.heart.avgWeekly === 0 ||
        healthStats.sleep.avgWeekly === 0
      ) {
        statsMessage +=
         `\n${t('healthData.message')}`;
      }

      // Speak the response
      callbacks.speakResponse(statsMessage);

      if(shouldSpeak){
          speakResponse(statsMessage);
        }

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
        waterMessage = `${t('healthData.youve_consumed')} ${healthStats.water.today} ${t('healthData.glasses_of_water_today')}`;
      } else if (isWeeklyQuery || isAverageQuery) {
        waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgWeekly.toFixed(
          1
        )} ${t('healthData.glasses_per_day_week')} ${
          healthStats.water.weekly
        } ${t('healthData.glasses')}.`;
      } else if (isMonthlyQuery) {
        waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgMonthly.toFixed(
          1
        )} ${t('healthData.glasses_per_day_month')} ${
          healthStats.water.monthly
        } ${t('healthData.glasses')}.`;
      } else {
        // Default to weekly if no time period specified
        waterMessage = `${t('healthData.average_water_consumption')} ${healthStats.water.avgWeekly.toFixed(
          1
        )} ${t('healthData.glasses_per_day_week_today')} ${
          healthStats.water.today
        } ${t('healthData.glasses')}.`;
      }

      waterMessage += `${t('healthData.hydration_reminder')}`;
      // Speak the response
      callbacks.speakResponse(waterMessage);
      if(shouldSpeak){
          speakResponse(waterMessage);
        }

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
         `${t('healthData.no_weight_data')}`;
            if(shouldSpeak){
              speakResponse(noDataMessage);
            }
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
        weightMessage = `${t('healthData.average_weight')} ${healthStats.weight.avgMonthly.toFixed(
          1
        )} ${healthStats.weight.unit} ${t('healthData.over_past_month')}`;
      } else {
        // Default to weekly average for "what is avg weight" queries
        weightMessage = `${t('healthData.average_weight')} ${healthStats.weight.avgWeekly.toFixed(
          1
        )} ${healthStats.weight.unit} ${t('healthData.over_past_week')}`;
      }

      if(shouldSpeak){
          speakResponse(weightMessage);
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
        stepsMessage = `${t('healthData.youve_taken')} ${healthStats.steps.today} ${t('healthData.steps_today1')}`;
      } else if (isWeeklyQuery || isAverageQuery) {
        stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgWeekly.toFixed(
          0
        )} ${t('healthData.steps_past_week')} ${
          healthStats.steps.weekly
        }.`;
      } else if (isMonthlyQuery) {
        stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgMonthly.toFixed(
          0
        )} ${t('healthData.steps_past_month')} ${
          healthStats.steps.monthly
        }.`;
      } else {
        // Default to weekly if no time period specified
        stepsMessage = `${t('healthData.average_daily_steps')} ${healthStats.steps.avgWeekly.toFixed(
          0
        )} ${t('healthData.steps_week_today')} ${
          healthStats.steps.today
        } ${t('steps')}`;
      }

      stepsMessage +=
          ` ${t('healthData.walking_encouragement')}`;

          if(shouldSpeak){
            callbacks.speakResponse(stepsMessage);
          }


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
            `${t('healthData.no_heart_data')}`;
            if(shouldSpeak){
              callbacks.speakResponse(noDataMessage);
            }

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
        heartMessage = `${t('healthData.heart_rate_today')} ${healthStats.heart.today} bpm.`;
      } else if (isWeeklyQuery || isAverageQuery) {
        heartMessage = `${t('healthData.average_heart_rate')} ${healthStats.heart.avgWeekly.toFixed(
          0
        )} bpm ${t('healthData.over_past_week')}`;
      } else if (isMonthlyQuery) {
        heartMessage = `${t('healthData.average_heart_rate')} ${healthStats.heart.avgMonthly.toFixed(
          0
        )} bpm ${t('healthData.over_past_month')}`;
      } else {
        heartMessage = `${t('healthData.current_heart_rate')} ${
          healthStats.heart.today
        } bpm, ${t('healthData.and_weekly_average_is')} ${healthStats.heart.avgWeekly.toFixed(
          0
        )} bpm.`;
      }

       if(shouldSpeak){
          callbacks.speakResponse(heartMessage);
        }


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
        const ragResponse = await callbacks.callRagService(query, recentMessages, currentLanguage);
        
        if (ragResponse && ragResponse.success) {
          // Use the response from RAG service
          const assistantMessage = ragResponse.response;
          if (shouldSpeak) {
               setIsProcessing(true);
           speakResponse(assistantMessage);
        }
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

      if (shouldSpeak) {
                 setIsProcessing(true);
                  speakResponse(assistantMessage);
            }

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
     if (shouldSpeak) {
      setIsProcessing(false);
    }
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
   finally {
    // Only reset isProcessing if it was a voice input
    if (shouldSpeak) {
      setIsProcessing(false);
    }
  }
};