import axios from "axios";
import { detectGoalRequestWithPatterns } from "./goalRequestWithPatterns";
import { useTranslation } from 'react-i18next';

// Define the function parameters and return type
export interface GoalRequestResult {
  handled: boolean;
  message?: string;
}

export const detectAndHandleGoalRequest = async (
  query: string,
  userId: string,
  extractMetricFromText: (text: string, metricType: string) => any,
  updateHealthData: () => Promise<void>,
  addResponseMessage: (content: string) => void
): Promise<GoalRequestResult> => {
  // First try pattern-based recognition
  const {t} = useTranslation();
  const patternMatch = detectGoalRequestWithPatterns(query);

  if (patternMatch) {
    let endpoint = "";
    let requestData = {};
    let successMessage = "";

    try {
      if (patternMatch.type === "water") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/waterGoal`;

        const waterGoal = patternMatch.isGlasses
          ? patternMatch.value
          : Math.round(patternMatch.value / 250);

        requestData = { waterGoal: waterGoal };
        successMessage = `${t('healthData.water_goal_set')} ${waterGoal} ${t('healthData.glasses_per_day')}`;
      } else if (patternMatch.type === "steps") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`;
        requestData = { stepsGoal: patternMatch.value };
        successMessage = `${t('healthData.steps_goal_set')} ${patternMatch.value} ${t('healthData.steps_per_day')}`;
      }

      // If we have valid data and an endpoint, make the API call
      if (endpoint) {
        console.log("Setting health goal:", { endpoint, requestData });

        const response = await axios.post(endpoint, requestData);

        if (response.status >= 200 && response.status < 300) {
          // Success - refresh health data
          await updateHealthData();

          // Add response message
          addResponseMessage(successMessage);

          return { handled: true };
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error setting health goal:", error);
      
      addResponseMessage(
        t('healthData.goal_set_error')
      );
    }

    return { handled: true }; // We had a pattern match, even if the API call failed
  }

  // Check if this is a goal setting request with generic indicators
  const isGoalRequest = /goal|target|aim|set goal/i.test(query);

  if (!isGoalRequest) {
    return { handled: false }; // Not a goal request
  }

  // Determine what type of goal is being set
  const isWaterGoal = /water|hydration|glass|glasses/i.test(query);
  const isStepsGoal = /steps|walking|step goal/i.test(query);

  // Extract the goal value
  let extractedData = null;
  let endpoint = "";
  let requestData = {};
  let successMessage = "";

  try {
    if (isWaterGoal) {
      extractedData = extractMetricFromText(query, "water");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/waterGoal`;

        // If the user specified glasses, use that value directly
        // Otherwise, convert ml to glasses (assuming 250ml per glass)
        const waterGoal = extractedData.isGlasses
          ? extractedData.value
          : Math.round((extractedData.value ?? 0) / 250);

        requestData = { waterGoal: waterGoal };
        successMessage = `${t('healthData.water_goal_set')} ${waterGoal} ${t('healthData.glasses_per_day')}`;
      }
    } else if (isStepsGoal) {
      extractedData = extractMetricFromText(query, "steps");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`;
        requestData = { stepsGoal: extractedData.value };
        successMessage = `${t('healthData.steps_goal_set')} ${extractedData.value} ${t('healthData.steps_per_day')}`;
      }
    }

    // If we have valid data and an endpoint, make the API call
    if (extractedData && endpoint) {
      console.log("Setting health goal:", { endpoint, requestData });

      const response = await axios.post(endpoint, requestData);

      if (response.status >= 200 && response.status < 300) {
        // Success - refresh health data
        await updateHealthData();

        if(shouldSpeak){
            speakResponse(successMessage);
          }

        // Add response message
        addResponseMessage(successMessage);

        return { handled: true };
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    }
  } catch (error) {
    console.error("Error setting health goal:", error);
    
    addResponseMessage(
       t('healthData.goal_set_error')
    );

    return { handled: true };
  }

  return { handled: false }; // Not handled as a goal request
};