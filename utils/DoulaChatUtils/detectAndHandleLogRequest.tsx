import axios from "axios";
import { detectLogRequestWithPatterns } from "./logRequestWithPatterns";
import { useTranslation } from 'react-i18next';

// Define the function parameters and return type
export interface LogRequestResult {
  handled: boolean;
  message?: string;
}

export const detectAndHandleLogRequest = async (
  query: string,
  userId: string,
  extractMetricFromText: (text: string, metricType: string) => any,
  updateHealthData: () => Promise<void>,
  addResponseMessage: (content: string) => void
): Promise<LogRequestResult> => {
  // First try pattern-based recognition
  const {t} = useTranslation();
  const patternMatch = detectLogRequestWithPatterns(query);

  if (patternMatch) {
    let endpoint = "";
    let requestData = {};
    let successMessage = "";

    try {
      if (patternMatch.type === "water") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/water`;

        const waterValue = patternMatch.isGlasses
          ? patternMatch.value
          : Math.round((patternMatch.value ?? 0) / 250);

        const isIncrement = patternMatch.isIncremental || false;

        requestData = {
          water: waterValue,
          isIncrement: isIncrement,
        };

        const incrementText = isIncrement ? ` ${t('healthData.more')}` : "";
        successMessage = `${t('healthData.ive_logged')} ${
          patternMatch.isGlasses
            ? patternMatch.value + incrementText + ` ${t('healthData.glasses')}`
            : patternMatch.value + incrementText + "ml"
        } ${t('healthData.of_water_for_you')}`;

        console.log("Water logging request:", { waterValue, isIncrement });
      } else if (patternMatch.type === "weight") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/weight`;
        requestData = {
          weight: patternMatch.value,
          weight_unit: patternMatch.unit,
        };
        successMessage = `${t('healthData.logged_weight')} ${patternMatch.value} ${patternMatch.unit}.`;
      } else if (patternMatch.type === "steps") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`;
        requestData = { steps: patternMatch.value };
        successMessage = `${t('healthData.ive_logged')} ${patternMatch.value} ${t('healthData.steps_for_you')}`;
      } else if (patternMatch.type === "heart") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/heart`;
        requestData = { heartRate: patternMatch.value };
        successMessage = `${t('healthData.logged_heart_rate')} ${patternMatch.value} bpm.`;
      } else if (patternMatch.type === "sleep") {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/sleep`;

        // Format times to ensure they have AM/PM
        const formatTime = (timeStr: string) => {
          let formattedTime = timeStr.trim();

          // Convert am/pm to uppercase AM/PM
          if (formattedTime.toLowerCase().endsWith("am")) {
            formattedTime = formattedTime.slice(0, -2) + "AM";
          } else if (formattedTime.toLowerCase().endsWith("pm")) {
            formattedTime = formattedTime.slice(0, -2) + "PM";
          }
          // Add AM/PM if missing
          else if (
            !formattedTime.toUpperCase().endsWith("AM") &&
            !formattedTime.toUpperCase().endsWith("PM")
          ) {
            const hour = parseInt(formattedTime.split(":")[0]);
            // Assume hours 7-11 are AM, 12 and 1-6 are PM, and others are AM
            if (hour >= 7 && hour <= 11) {
              formattedTime += " AM";
            } else {
              formattedTime += " PM";
            }
          }

          return formattedTime;
        };

        const sleepStart = formatTime(patternMatch.sleepStart || "");
        const sleepEnd = formatTime(patternMatch.sleepEnd || "");

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split("T")[0];

        requestData = {
          date: today,
          sleepStart: sleepStart,
          sleepEnd: sleepEnd,
        };
        successMessage = `${t('healthData.logged_sleep_from')} ${sleepStart} ${t('healthData.to')} ${sleepEnd}.`;
      }

      // If we have valid data and an endpoint, make the API call
      if (endpoint) {
        console.log("Logging health metric:", { endpoint, requestData });

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
      console.error("Error logging health metric:", error);

      addResponseMessage(
        t('healthData.log_error')
      );
    }

    return { handled: true }; // We had a pattern match, even if the API call failed
  }

  // If pattern matching failed, check if this is a log request with generic indicators
  const isLogRequest = /log|record|track|add|set|update/i.test(query);

  if (!isLogRequest) {
    return { handled: false }; // Not a log request
  }

  // Determine what metric is being logged
  const isWaterLog = /water|hydration|glass|glasses|drink/i.test(query);
  const isWeightLog = /weight|weigh/i.test(query);
  const isStepsLog = /steps|walked|walking/i.test(query);
  const isHeartLog = /heart|pulse|bpm/i.test(query);
  const isSleepLog = /sleep|slept|bed time|bedtime|woke up/i.test(query);

  // Extract the metric
  let extractedData = null;
  let endpoint = "";
  let requestData = {};
  let successMessage = "";

  try {
    if (isWaterLog) {
      extractedData = extractMetricFromText(query, "water");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/water`;

        // If the user specified glasses, send that value directly
        // Otherwise, convert ml to glasses (assuming 250ml per glass)
        const waterValue = extractedData.isGlasses
          ? extractedData.value
          : Math.round(extractedData.value ?? 0 / 250);

        requestData = { water: waterValue };
        successMessage = `${t('healthData.ive_logged')} ${
          extractedData.isGlasses
            ? extractedData.value + ` ${t('healthData.glasses')}`
            : extractedData.value + "ml"
        } ${t('healthData.of_water_for_you')}`;
      }
    } else if (isWeightLog) {
      extractedData = extractMetricFromText(query, "weight");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/weight`;
        requestData = {
          weight: extractedData.value,
          weight_unit: extractedData.unit,
        };
        successMessage = `${t('healthData.logged_weight')} ${extractedData.value} ${extractedData.unit}.`;
      }
    } else if (isStepsLog) {
      extractedData = extractMetricFromText(query, "steps");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`;
        requestData = { steps: extractedData.value };
        successMessage = `${t('healthData.ive_logged')} ${extractedData.value} ${t('healthData.steps_for_you')}`;
      }
    } else if (isHeartLog) {
      extractedData = extractMetricFromText(query, "heart");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/heart`;
        requestData = { heartRate: extractedData.value };
        successMessage = `${t('healthData.logged_heart_rate')} ${extractedData.value} bpm.`;
      }
    } else if (isSleepLog) {
      extractedData = extractMetricFromText(query, "sleep");

      if (extractedData) {
        endpoint = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/sleep`;

        // Format times to ensure they have AM/PM
        const formatTime = (timeStr: string) => {
          // Ensure time has AM/PM
          if (
            !timeStr.toLowerCase().includes("am") &&
            !timeStr.toLowerCase().includes("pm")
          ) {
            // Make assumption based on typical sleep patterns
            const hour = parseInt(timeStr.split(":")[0]);
            // Assume hours 7-11 are AM, 12 and 1-6 are PM, and after midnight is AM
            if (hour >= 7 && hour <= 11) {
              return timeStr + " AM";
            } else {
              return timeStr + " PM";
            }
          }
          return timeStr;
        };

        const sleepStart = formatTime(extractedData.sleepStart || "");
        const sleepEnd = formatTime(extractedData.sleepEnd || "");

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split("T")[0];

        requestData = {
          date: today,
          sleepStart: sleepStart,
          sleepEnd: sleepEnd,
        };
        successMessage = `I've logged your sleep from ${sleepStart} to ${sleepEnd}.`;
      } else {
        // If we couldn't extract specific sleep times, provide guidance
        addResponseMessage(
          t('healthData.sleep_log_instruction'),
        );
        return { handled: true };
      }
    }

    // If we have valid data and an endpoint, make the API call
    if (extractedData && endpoint) {
      console.log("Logging health metric:", { endpoint, requestData });

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
    console.error("Error logging health metric:", error);

    addResponseMessage(
      "I'm sorry, I couldn't log that health information. Please try again or use the tracking screens."
    );

    return { handled: true };
  }

  return { handled: false }; // Not handled as a log request
};