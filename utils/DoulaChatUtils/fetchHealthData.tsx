import axios from "axios";

// Define types for health data
export interface HealthStats {
  water: {
    today: number;
    weekly: number;
    monthly: number;
    avgWeekly: number;
    avgMonthly: number;
  };
  steps: {
    today: number;
    weekly: number;
    monthly: number;
    avgWeekly: number;
    avgMonthly: number;
  };
  weight: {
    today: number;
    weekly: number;
    monthly: number;
    avgWeekly: number;
    avgMonthly: number;
    unit: string;
  };
  heart: {
    today: number;
    weekly: number;
    monthly: number;
    avgWeekly: number;
    avgMonthly: number;
  };
  sleep: {
    today: number;
    weekly: number;
    monthly: number;
    avgWeekly: number;
    avgMonthly: number;
  };
}

export interface HealthData {
  steps: {
    today: number;
    weekly: number;
  };
  water: {
    today: number;
    weekly: number;
  };
  weight: {
    current: number;
    unit: string;
    previous: number;
  };
}

interface FetchHealthDataResult {
  healthStats: HealthStats;
  healthData: HealthData;
}

export const fetchHealthData = async (userId: string): Promise<FetchHealthDataResult> => {
  // Initialize default health stats
  const defaultHealthStats: HealthStats = {
    water: {
      today: 0,
      weekly: 0,
      monthly: 0,
      avgWeekly: 0,
      avgMonthly: 0,
    },
    steps: {
      today: 0,
      weekly: 0,
      monthly: 0,
      avgWeekly: 0,
      avgMonthly: 0,
    },
    weight: {
      today: 0,
      weekly: 0,
      monthly: 0,
      avgWeekly: 0,
      avgMonthly: 0,
      unit: "kg",
    },
    heart: {
      today: 0,
      weekly: 0,
      monthly: 0,
      avgWeekly: 0,
      avgMonthly: 0,
    },
    sleep: {
      today: 0,
      weekly: 0,
      monthly: 0,
      avgWeekly: 0,
      avgMonthly: 0,
    },
  };

  // Initialize default health data
  const defaultHealthData: HealthData = {
    steps: {
      today: 0,
      weekly: 0,
    },
    water: {
      today: 0,
      weekly: 0,
    },
    weight: {
      current: 0,
      unit: "kg",
      previous: 0,
    },
  };

  if (!userId) {
    console.log("No user ID available");
    return { healthStats: defaultHealthStats, healthData: defaultHealthData };
  }

  try {
    // Use the specified endpoint format
    const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${userId}`;
    console.log(`Making API call to: ${apiUrl}`);

    // Make the API call
    const response = await axios.get(apiUrl);
    const apiData = response.data.activities;

    // Process the data if we got a response
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      console.log(
        "API data found. First record:",
        JSON.stringify(apiData[0], null, 2)
      );

      // Sort by date (newest first)
      const sortedRecords = [...apiData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Get the most recent record
      const latestRecord = sortedRecords[0];

      // Get the last 7 days of records for weekly stats
      const last7Days = sortedRecords.slice(0, 7);

      // Get the last 30 days of records for monthly stats
      const last30Days = sortedRecords.slice(0, 30);

      // Calculate sleep duration in hours for a record
      const calculateSleepDuration = (record: any) => {
        if (
          record.details &&
          record.details.sleep &&
          record.details.sleep.start &&
          record.details.sleep.end
        ) {
          const start = new Date(record.details.sleep.start);
          const end = new Date(record.details.sleep.end);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert ms to hours
        }
        return 0;
      };

      // Create a new stats object to update state
      const newHealthStats = { ...defaultHealthStats };

      // TODAY'S STATS
      newHealthStats.water.today = latestRecord.details?.water || 0;
      newHealthStats.steps.today = latestRecord.details?.steps || 0;
      newHealthStats.heart.today = latestRecord.details?.heart || 0;
      newHealthStats.sleep.today = calculateSleepDuration(latestRecord);
      if (latestRecord.details?.weight?.value) {
        newHealthStats.weight.today = latestRecord.details.weight.value;
        newHealthStats.weight.unit = latestRecord.details.weight.unit || "kg";
      }

      // WEEKLY STATS
      // Filter records with valid data for each metric
      const weeklyWaterRecords = last7Days.filter(
        (r) =>
          r.details &&
          typeof r.details.water === "number" &&
          r.details.water > 0
      );
      const weeklyStepsRecords = last7Days.filter(
        (r) =>
          r.details &&
          typeof r.details.steps === "number" &&
          r.details.steps > 0
      );
      const weeklyHeartRecords = last7Days.filter(
        (r) =>
          r.details &&
          typeof r.details.heart === "number" &&
          r.details.heart > 0
      );
      const weeklySleepRecords = last7Days.filter(
        (r) => calculateSleepDuration(r) > 0
      );
      const weeklyWeightRecords = last7Days.filter(
        (r) =>
          r.details &&
          r.details.weight &&
          typeof r.details.weight.value === "number" &&
          r.details.weight.value > 0
      );

      // Calculate totals
      newHealthStats.water.weekly = weeklyWaterRecords.reduce(
        (sum, r) => sum + r.details.water,
        0
      );
      newHealthStats.steps.weekly = weeklyStepsRecords.reduce(
        (sum, r) => sum + r.details.steps,
        0
      );
      newHealthStats.heart.weekly = weeklyHeartRecords.reduce(
        (sum, r) => sum + r.details.heart,
        0
      );
      newHealthStats.sleep.weekly = weeklySleepRecords.reduce(
        (sum, r) => sum + calculateSleepDuration(r),
        0
      );
      newHealthStats.weight.weekly = weeklyWeightRecords.reduce(
        (sum, r) => sum + r.details.weight.value,
        0
      );

      // Calculate averages
      newHealthStats.water.avgWeekly =
        weeklyWaterRecords.length > 0
          ? newHealthStats.water.weekly / weeklyWaterRecords.length
          : 0;
      newHealthStats.steps.avgWeekly =
        weeklyStepsRecords.length > 0
          ? newHealthStats.steps.weekly / weeklyStepsRecords.length
          : 0;
      newHealthStats.heart.avgWeekly =
        weeklyHeartRecords.length > 0
          ? newHealthStats.heart.weekly / weeklyHeartRecords.length
          : 0;
      newHealthStats.sleep.avgWeekly =
        weeklySleepRecords.length > 0
          ? newHealthStats.sleep.weekly / weeklySleepRecords.length
          : 0;
      newHealthStats.weight.avgWeekly =
        weeklyWeightRecords.length > 0
          ? newHealthStats.weight.weekly / weeklyWeightRecords.length
          : 0;

      // MONTHLY STATS
      // Filter records with valid data for each metric
      const monthlyWaterRecords = last30Days.filter(
        (r) =>
          r.details &&
          typeof r.details.water === "number" &&
          r.details.water > 0
      );
      const monthlyStepsRecords = last30Days.filter(
        (r) =>
          r.details &&
          typeof r.details.steps === "number" &&
          r.details.steps > 0
      );
      const monthlyHeartRecords = last30Days.filter(
        (r) =>
          r.details &&
          typeof r.details.heart === "number" &&
          r.details.heart > 0
      );
      const monthlySleepRecords = last30Days.filter(
        (r) => calculateSleepDuration(r) > 0
      );
      const monthlyWeightRecords = last30Days.filter(
        (r) =>
          r.details &&
          r.details.weight &&
          typeof r.details.weight.value === "number" &&
          r.details.weight.value > 0
      );

      // Calculate totals
      newHealthStats.water.monthly = monthlyWaterRecords.reduce(
        (sum, r) => sum + r.details.water,
        0
      );
      newHealthStats.steps.monthly = monthlyStepsRecords.reduce(
        (sum, r) => sum + r.details.steps,
        0
      );
      newHealthStats.heart.monthly = monthlyHeartRecords.reduce(
        (sum, r) => sum + r.details.heart,
        0
      );
      newHealthStats.sleep.monthly = monthlySleepRecords.reduce(
        (sum, r) => sum + calculateSleepDuration(r),
        0
      );
      newHealthStats.weight.monthly = monthlyWeightRecords.reduce(
        (sum, r) => sum + r.details.weight.value,
        0
      );

      // Calculate averages
      newHealthStats.water.avgMonthly =
        monthlyWaterRecords.length > 0
          ? newHealthStats.water.monthly / monthlyWaterRecords.length
          : 0;
      newHealthStats.steps.avgMonthly =
        monthlyStepsRecords.length > 0
          ? newHealthStats.steps.monthly / monthlyStepsRecords.length
          : 0;
      newHealthStats.heart.avgMonthly =
        monthlyHeartRecords.length > 0
          ? newHealthStats.heart.monthly / monthlyHeartRecords.length
          : 0;
      newHealthStats.sleep.avgMonthly =
        monthlySleepRecords.length > 0
          ? newHealthStats.sleep.monthly / monthlySleepRecords.length
          : 0;
      newHealthStats.weight.avgMonthly =
        monthlyWeightRecords.length > 0
          ? newHealthStats.weight.monthly / monthlyWeightRecords.length
          : 0;

      // Create health data object with safer property access (for backward compatibility)
      const newHealthData: HealthData = {
        steps: {
          today: newHealthStats.steps.today,
          weekly: newHealthStats.steps.weekly,
        },
        water: {
          today: newHealthStats.water.today,
          weekly: newHealthStats.water.weekly,
        },
        weight: {
          current: latestRecord.details?.weight?.value || 0,
          unit: latestRecord.details?.weight?.unit || "kg",
          previous: 0,
        },
      };

      // Find previous weight record for backward compatibility
      const prevWeightRecord = sortedRecords.find(
        (r) =>
          r !== latestRecord &&
          r.details &&
          r.details.weight &&
          typeof r.details.weight.value === "number" &&
          r.details.weight.value > 0
      );

      if (
        prevWeightRecord &&
        prevWeightRecord.details &&
        prevWeightRecord.details.weight
      ) {
        newHealthData.weight.previous = prevWeightRecord.details.weight.value;
      }

      console.log(
        "Health stats calculated successfully:",
        JSON.stringify(newHealthStats, null, 2)
      );

      return { healthStats: newHealthStats, healthData: newHealthData };
    } else {
      console.log("No valid data in API response");
      return { healthStats: defaultHealthStats, healthData: defaultHealthData };
    }
  } catch (error: any) {
    console.error("API call error:", error.message);
    if (error.response) {
      console.error("API error response status:", error.response.status);
      console.error(
        "API error response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return { healthStats: defaultHealthStats, healthData: defaultHealthData };
  }
};