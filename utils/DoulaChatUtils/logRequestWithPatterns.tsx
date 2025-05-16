import { isIncrementalRequest, LOG_PATTERNS } from "./doulaLogPatterns";


// Function to detect log requests using our more advanced patterns
export function detectLogRequestWithPatterns(query: string) {
    // Check for water intake logs
    for (const pattern of LOG_PATTERNS.water) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const isGlasses = /glass|glasses|cup|cups/i.test(query);
        const isIncremental = isIncrementalRequest(query);

        return {
          type: "water",
          value,
          isGlasses,
          isIncremental,
        };
      }
    }

    // Check for weight logs
    for (const pattern of LOG_PATTERNS.weight) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const unit = /\b(kg|kgs|kilograms)\b/i.test(query) ? "kg" : "lbs";
        return {
          type: "weight",
          value,
          unit,
        };
      }
    }

    // Check for steps logs
    for (const pattern of LOG_PATTERNS.steps) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: "steps",
          value,
        };
      }
    }

    // Check for heart rate logs
    for (const pattern of LOG_PATTERNS.heartRate) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: "heart",
          value,
        };
      }
    }

    // Check for sleep logs
    for (const pattern of LOG_PATTERNS.sleep) {
      const match = query.match(pattern);
      if (match && match[1] && match[2]) {
        // We need both start and end time
        return {
          type: "sleep",
          sleepStart: match[1],
          sleepEnd: match[2],
        };
      }
    }

    return null;
  }