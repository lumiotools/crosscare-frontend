import { router } from "expo-router";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

export const onBoardingData: onBoardingDataType[] = [
  {
    id: 1,
    title: i18next.t('cards.askDoula'),
    description:
      "Personalized health tracking, expert insights, and emotional support — all in one place.",
    image: require("../assets/images/onboarding1.png"),
  },
  {
    id: 2,
    title: "Your Health, Your Way",
    description:
      "Track vitals, nutrition, activity, and more. Get AI-powered feedback tailored just for you and your baby.",
    image: require("../assets/images/onboarding2.png"),
  },
  {
    id: 3,
    title: "Never Feel Alone",
    description:
      "Chat with your Digital Doula, connect with healthcare providers, and join supportive mom communities.",
    image: require("../assets/images/onboarding3.png"),
  },
];



/**
 * Utility functions for sleep calculations
 */

/**
 * Calculates wake-up times based on a target sleep time
 * @param sleepTime The target time to sleep
 * @returns An array of optimal wake-up times
 */
export const calculateWakeupTimes = (
  wakeUpTime: Date
): Array<{
  time: string;
  cycles: number;
  hours: number;
  mood: "happy" | "neutral" | "sad";
  color: string;
}> => {
  const times = [];
  const cycleLength = 90; // Sleep cycle duration in minutes

  const adjustedSleepTime = new Date(wakeUpTime.getTime())
  adjustedSleepTime.setMinutes(adjustedSleepTime.getMinutes())

  for (let cycles = 6; cycles >= 1; cycles--) {
    // Create a new Date object to avoid mutating wakeUpTime
    const wakeUpTime = new Date(adjustedSleepTime.getTime())
    wakeUpTime.setMinutes(wakeUpTime.getMinutes() + cycles * cycleLength)

    // Format sleep time correctly
    const formattedTime = wakeUpTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate sleep duration in hours
    const hours = (cycles * cycleLength) / 60;

    // Determine mood & color
    let mood: "happy" | "neutral" | "sad";
    let color: string;

    if (cycles >= 5) {
      mood = "happy";
      color = "#52E186";
    } else if (cycles >= 3) {
      mood = "neutral";
      color = "#FFD764";
    } else {
      mood = "sad";
      color = "#FF7575";
    }

    times.push({
      time: formattedTime,
      cycles,
      hours,
      mood,
      color,
    });
  }

  return times;
};

export const calculateBedtimes = (
  wakeUpTime: Date,
): Array<{
  time: string
  cycles: number
  hours: number
  mood: "happy" | "neutral" | "sad"
  color: string
}> => {
  const times = [];
  const cycleLength = 90; // Sleep cycle duration in minutes
  
  // Loop through the cycles to generate different bedtime options
  for (let cycles = 6; cycles >= 1; cycles--) {
    const sleepTime = new Date(wakeUpTime.getTime());

    // Subtract cycle length from the wake-up time to get the bedtime
    sleepTime.setMinutes(sleepTime.getMinutes() + (cycles * cycleLength));

    // Format the bedtime into a 12-hour time format
    const formattedTime = sleepTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate the sleep duration in hours
    const hours = (cycles * cycleLength) / 60;

    // Determine mood & color based on the number of cycles
    let mood: "happy" | "neutral" | "sad";
    let color: string;

    if (cycles >= 5) {
      mood = "happy";
      color = "#52E186"; // Green for 5 and 6 cycles
    } else if (cycles >= 3) {
      mood = "neutral";
      color = "#FFD764"; // Yellow for 3 and 4 cycles
    } else {
      mood = "sad";
      color = "#FF7575"; // Red for less than 3 cycles
    }

    times.push({
      time: formattedTime,
      cycles,
      hours,
      mood,
      color,
    });
  }

  return times;
};



/**
 * Formats a date object to a time string like "08:15 AM"
 */
export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12

  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Parses a time string like "11:00 PM" to a Date object
 */
export const parseTimeString = (timeStr: string): Date => {
  const date = new Date();

  // Extract hours, minutes, and AM/PM
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);

  if (match) {
    let hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    const isPM = match[3].toUpperCase() === "PM";

    // Convert to 24-hour format
    if (isPM && hours < 12) {
      hours += 12;
    } else if (!isPM && hours === 12) {
      hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);
  } else {
    // Handle the "7:00 | AM" format
    const altMatch = timeStr.match(/(\d+):(\d+)\s*\|\s*(AM|PM)/i);
    if (altMatch) {
      let hours = Number.parseInt(altMatch[1], 10);
      const minutes = Number.parseInt(altMatch[2], 10);
      const isPM = altMatch[3].toUpperCase() === "PM";

      // Convert to 24-hour format
      if (isPM && hours < 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }

      date.setHours(hours, minutes, 0, 0);
    }
  }

  return date;
};
