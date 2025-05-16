import { GOAL_PATTERNS } from "./doulaLogPatterns";

// Function to detect goal requests using our more advanced patterns
export function detectGoalRequestWithPatterns(query: string) {
    // Check for water intake goals
    for (const pattern of GOAL_PATTERNS.water) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        const isGlasses = /glass|glasses|cup|cups/i.test(query);
        return {
          type: "water",
          value,
          isGlasses,
        };
      }
    }

    // Check for step goals
    for (const pattern of GOAL_PATTERNS.steps) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return {
          type: "steps",
          value,
        };
      }
    }

    return null;
  }