import { StravaActivity, ActivityType, MockActivityOptions } from '../lit-actions/types/strava.js';

/**
 * Generate realistic mock Strava activities for testing
 */

export function generateMockActivity(options: MockActivityOptions = {}): StravaActivity {
  const {
    type = 'Run',
    distance,
    timestamp,
    includeInvalid = false
  } = options;

  const now = new Date();
  const defaultStartTime = timestamp?.start || new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const defaultEndTime = timestamp?.end || now;

  // Generate random distance if not specified
  let activityDistance: number;
  if (distance) {
    activityDistance = Math.floor(Math.random() * (distance.max - distance.min + 1)) + distance.min;
  } else {
    // Default distances based on activity type
    switch (type) {
      case 'Run':
        activityDistance = includeInvalid ? 
          Math.floor(Math.random() * 2000) + 1000 : // 1-3km (invalid for 5km challenge)
          Math.floor(Math.random() * 3000) + 5000; // 5-8km (valid for 5km challenge)
        break;
      case 'Walk':
        activityDistance = Math.floor(Math.random() * 2000) + 2000; // 2-4km
        break;
      case 'Ride':
        activityDistance = Math.floor(Math.random() * 20000) + 10000; // 10-30km
        break;
      case 'Swim':
        activityDistance = Math.floor(Math.random() * 2000) + 1000; // 1-3km
        break;
      default:
        activityDistance = Math.floor(Math.random() * 5000) + 2000; // 2-7km
    }
  }

  // Generate random timestamp within range
  const startTime = new Date(
    defaultStartTime.getTime() + 
    Math.random() * (defaultEndTime.getTime() - defaultStartTime.getTime())
  );

  // Calculate moving time based on distance and activity type
  let movingTimeSeconds: number;
  switch (type) {
    case 'Run':
      movingTimeSeconds = Math.floor(activityDistance / 3.0); // ~3 m/s average
      break;
    case 'Walk':
      movingTimeSeconds = Math.floor(activityDistance / 1.4); // ~1.4 m/s average
      break;
    case 'Ride':
      movingTimeSeconds = Math.floor(activityDistance / 8.0); // ~8 m/s average
      break;
    case 'Swim':
      movingTimeSeconds = Math.floor(activityDistance / 1.0); // ~1 m/s average
      break;
    default:
      movingTimeSeconds = Math.floor(activityDistance / 2.0); // ~2 m/s average
  }

  const elapsedTimeSeconds = movingTimeSeconds + Math.floor(Math.random() * 300); // Add some buffer

  // Generate activity name
  const activityNames = {
    'Run': ['Morning Run', 'Evening Run', 'Trail Run', 'Speed Workout', 'Long Run', 'Recovery Run'],
    'Walk': ['Morning Walk', 'Evening Walk', 'Nature Walk', 'City Walk', 'Dog Walk'],
    'Ride': ['Morning Ride', 'Evening Ride', 'Mountain Bike', 'Road Ride', 'Commute'],
    'Swim': ['Pool Swim', 'Open Water Swim', 'Swim Workout', 'Morning Swim'],
    'Workout': ['Strength Training', 'CrossFit', 'Yoga', 'Pilates', 'HIIT']
  };

  const names = activityNames[type] || ['Workout'];
  const activityName = names[Math.floor(Math.random() * names.length)];

  // Generate elevation gain (roughly 1-5% of distance)
  const elevationGain = Math.floor(activityDistance * (0.01 + Math.random() * 0.04));

  // Calculate average speed
  const averageSpeed = activityDistance / movingTimeSeconds;
  const maxSpeed = averageSpeed * (1.2 + Math.random() * 0.3); // 20-50% faster than average

  const activity: StravaActivity = {
    id: Math.floor(Math.random() * 1000000) + 100000,
    name: activityName,
    distance: activityDistance,
    moving_time: movingTimeSeconds,
    elapsed_time: elapsedTimeSeconds,
    total_elevation_gain: elevationGain,
    type: type,
    start_date: startTime.toISOString(),
    start_date_local: startTime.toISOString(),
    timezone: 'UTC',
    utc_offset: 0,
    achievement_count: Math.floor(Math.random() * 5),
    kudos_count: Math.floor(Math.random() * 10),
    comment_count: Math.floor(Math.random() * 3),
    athlete_count: 1,
    photo_count: Math.floor(Math.random() * 3),
    map: {
      id: `map_${Math.random().toString(36).substr(2, 9)}`,
      summary_polyline: 'encoded_polyline_data',
      resource_state: 2
    },
    trainer: false,
    commute: Math.random() < 0.1, // 10% chance
    manual: Math.random() < 0.05, // 5% chance
    private: Math.random() < 0.2, // 20% chance
    flagged: false,
    gear_id: null,
    from_accepted_tag: false,
    average_speed: averageSpeed,
    max_speed: maxSpeed,
    average_cadence: type === 'Run' ? Math.floor(160 + Math.random() * 20) : 0, // 160-180 spm for runs
    average_watts: type === 'Ride' ? Math.floor(150 + Math.random() * 100) : 0, // 150-250W for rides
    weighted_average_watts: type === 'Ride' ? Math.floor(150 + Math.random() * 100) : 0,
    kilojoules: type === 'Ride' ? Math.floor(activityDistance * 0.1) : 0,
    device_watts: type === 'Ride',
    has_heartrate: Math.random() < 0.7, // 70% chance
    average_heartrate: Math.floor(140 + Math.random() * 40), // 140-180 bpm
    max_heartrate: Math.floor(160 + Math.random() * 30), // 160-190 bpm
    max_watts: type === 'Ride' ? Math.floor(200 + Math.random() * 200) : 0,
    pr_count: Math.floor(Math.random() * 3),
    total_photo_count: Math.floor(Math.random() * 2),
    has_kudoed: false,
    suffer_score: Math.floor(Math.random() * 100)
  };

  return activity;
}

export function generateMockActivities(count: number, options: MockActivityOptions = {}): StravaActivity[] {
  const activities: StravaActivity[] = [];
  
  for (let i = 0; i < count; i++) {
    activities.push(generateMockActivity(options));
  }
  
  // Sort by start_date descending (newest first)
  activities.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  
  return activities;
}

export function generateValidRunActivity(targetDistance: number): StravaActivity {
  return generateMockActivity({
    type: 'Run',
    distance: {
      min: targetDistance,
      max: targetDistance + 2000 // 2km over target
    },
    includeInvalid: false
  });
}

export function generateInvalidRunActivity(targetDistance: number): StravaActivity {
  return generateMockActivity({
    type: 'Run',
    distance: {
      min: 1000,
      max: targetDistance - 1000 // Under target
    },
    includeInvalid: true
  });
}

export function generateWrongTypeActivity(targetDistance: number): StravaActivity {
  const wrongTypes: ActivityType[] = ['Walk', 'Ride', 'Swim', 'Workout'];
  const randomType = wrongTypes[Math.floor(Math.random() * wrongTypes.length)];
  
  return generateMockActivity({
    type: randomType,
    distance: {
      min: targetDistance,
      max: targetDistance + 1000
    }
  });
}

// Test data generators for specific scenarios
export const TestActivityGenerators = {
  valid5kRun: () => generateValidRunActivity(5000),
  invalid5kRun: () => generateInvalidRunActivity(5000),
  wrongType5k: () => generateWrongTypeActivity(5000),
  valid10kRun: () => generateValidRunActivity(10000),
  invalid10kRun: () => generateInvalidRunActivity(10000),
  
  // Generate activities for different time periods
  recentActivities: (count: number = 5) => generateMockActivities(count, {
    timestamp: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    }
  }),
  
  oldActivities: (count: number = 5) => generateMockActivities(count, {
    timestamp: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
      end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  })
};
