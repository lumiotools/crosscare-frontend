export const LOG_PATTERNS = {
    water: [
      /(?:log|record|track|add|drank|had|consumed).*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
      /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres).*?water/i,
      /my water intake (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
      /(?:i\s+)?(?:drank|had|took|consumed)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
      // New patterns for incremental logging
      /(?:i\s+)?(?:drank|had|took|consumed)\s+(\d+(?:\.\d+)?)\s+(?:more|additional|extra)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
      /(?:add|log|record|track)\s+(\d+(?:\.\d+)?)\s+(?:more|additional|extra)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
      /(?:i\s+)?(?:just|now|recently)\s+(?:drank|had|took|consumed)\s+(?:another|an additional|an extra)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)(?:\s+of water)?/i,
    ],
    weight: [
      /(?:log|record|track|add|weigh|measure).*?(\d+(?:\.\d+)?).*?(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
      /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?).*?weight/i,
      /my weight (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
      /(?:i\s+)?(?:weigh|am|measure)\s+(\d+(?:\.\d+)?)\s+(?:kg|kgs|kilograms?|lbs?|pounds?)/i,
    ],
    steps: [
      /(?:log|record|track|add|walk|measure).*?(\d+(?:\.\d+)?).*?(?:steps?|walked)/i,
      /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+steps/i,
      /(?:my steps?|my step count) (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)/i,
      /(?:i\s+)?(?:walked|did|took)\s+(\d+(?:\.\d+)?)\s+steps/i,
    ],
    heartRate: [
      /(?:log|record|track|add|measured).*?(\d+(?:\.\d+)?).*?(?:bpm|beats per minute|heart rate|pulse)/i,
      /(?:track|log|record|add)\s+(\d+(?:\.\d+)?)\s+(?:bpm|beats per minute).*?(?:heart|pulse)/i,
      /my (?:heart rate|pulse) (?:today|now|just now) (?:is|was)\s+(\d+(?:\.\d+)?)/i,
      /(?:i\s+)?(?:have|had|measured)\s+(?:a\s+)?(?:heart rate|pulse|HR) of\s+(\d+(?:\.\d+)?)/i,
    ],
    sleep: [
      /(?:log|record|track|add).*?sleep.*?from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
      /(?:i\s+)?(?:slept|sleep).*?from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
      /(?:i\s+)?(?:went to bed|fell asleep).*?(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?(?:woke up|got up).*?(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
      /my sleep (?:yesterday|last night) was from\s+(\d+(?::\d+)?\s*(?:am|pm)?).*?to\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i,
    ],
  };
  
  export const GOAL_PATTERNS = {
    water: [
      /(?:set|update|change).*?(?:water|hydration).*?goal.*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
      /(?:goal|target) (?:is|to drink|for|of).*?(\d+(?:\.\d+)?).*?(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
      /(?:want|aim|going) to drink\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
      /my water goal (?:is|should be)\s+(\d+(?:\.\d+)?)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
    ],
    steps: [
      /(?:set|update|change).*?(?:steps?).*?goal.*?(\d+(?:\.\d+)?).*?(?:steps?)/i,
      /(?:step goal|step target|walking goal|walking target) (?:is|to reach|for|of).*?(\d+(?:\.\d+)?).*?(?:steps?)/i,
      /(?:want|aim|going) to (?:walk|reach|do)\s+(\d+(?:\.\d+)?)\s+steps/i,
      /my step goal (?:is|should be)\s+(\d+(?:\.\d+)?)/i,
    ],
  };
  
  // Function to check if the request is for an incremental update
  export function isIncrementalRequest(query: string) {
    const incrementalPatterns = [
      /(?:more|additional|extra|another)\s+(?:glass|glasses|cup|cups|ml|milliliters|millilitres)/i,
      /(?:increase|increment|add to|on top of)/i,
    ];
  
    return incrementalPatterns.some((pattern) => pattern.test(query));
  }