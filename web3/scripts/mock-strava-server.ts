import express, { Request, Response, NextFunction } from 'express';
import { StravaActivity, StravaAthlete, MockStravaConfig, ActivityType } from '../lit-actions/types/strava.js';

const app = express();
app.use(express.json());

// Default mock configuration
const defaultConfig: MockStravaConfig = {
  port: 3001,
  baseUrl: 'http://localhost:3001',
  activities: [],
  athletes: [],
  delayMs: 100,
  errorRate: 0
};

let config = { ...defaultConfig };

// Generate mock athlete
const mockAthlete: StravaAthlete = {
  id: 12345,
  username: 'testrunner',
  firstname: 'Test',
  lastname: 'Runner',
  profile_medium: 'https://example.com/profile.jpg',
  profile: 'https://example.com/profile-large.jpg'
};

// Generate mock activities
const generateMockActivities = (): StravaActivity[] => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  return [
    {
      id: 1,
      name: 'Morning Run',
      distance: 5200, // 5.2 km
      moving_time: 1800, // 30 minutes
      elapsed_time: 1900, // 31 minutes
      total_elevation_gain: 50,
      type: 'Run',
      start_date: oneHourAgo.toISOString(),
      start_date_local: oneHourAgo.toISOString(),
      timezone: 'UTC',
      utc_offset: 0,
      achievement_count: 2,
      kudos_count: 5,
      comment_count: 1,
      athlete_count: 1,
      photo_count: 0,
      map: {
        id: 'a123456789',
        summary_polyline: 'encoded_polyline_data',
        resource_state: 2
      },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      flagged: false,
      gear_id: null,
      from_accepted_tag: false,
      average_speed: 2.89, // ~10.4 km/h
      max_speed: 4.17, // ~15 km/h
      average_cadence: 0,
      average_watts: 0,
      weighted_average_watts: 0,
      kilojoules: 0,
      device_watts: false,
      has_heartrate: false,
      average_heartrate: 0,
      max_heartrate: 0,
      max_watts: 0,
      pr_count: 0,
      total_photo_count: 0,
      has_kudoed: false,
      suffer_score: 0
    },
    {
      id: 2,
      name: 'Evening Walk',
      distance: 3000, // 3 km
      moving_time: 2400, // 40 minutes
      elapsed_time: 2500, // 41 minutes
      total_elevation_gain: 20,
      type: 'Walk',
      start_date: twoHoursAgo.toISOString(),
      start_date_local: twoHoursAgo.toISOString(),
      timezone: 'UTC',
      utc_offset: 0,
      achievement_count: 0,
      kudos_count: 2,
      comment_count: 0,
      athlete_count: 1,
      photo_count: 0,
      map: {
        id: 'b987654321',
        summary_polyline: 'encoded_polyline_data_2',
        resource_state: 2
      },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      flagged: false,
      gear_id: null,
      from_accepted_tag: false,
      average_speed: 1.25, // ~4.5 km/h
      max_speed: 2.0, // ~7.2 km/h
      average_cadence: 0,
      average_watts: 0,
      weighted_average_watts: 0,
      kilojoules: 0,
      device_watts: false,
      has_heartrate: false,
      average_heartrate: 0,
      max_heartrate: 0,
      max_watts: 0,
      pr_count: 0,
      total_photo_count: 0,
      has_kudoed: false,
      suffer_score: 0
    },
    {
      id: 3,
      name: 'Short Run',
      distance: 2000, // 2 km - This will fail 5km challenge
      moving_time: 900, // 15 minutes
      elapsed_time: 950, // 15 minutes 50 seconds
      total_elevation_gain: 10,
      type: 'Run',
      start_date: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      start_date_local: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      timezone: 'UTC',
      utc_offset: 0,
      achievement_count: 0,
      kudos_count: 1,
      comment_count: 0,
      athlete_count: 1,
      photo_count: 0,
      map: {
        id: 'c555666777',
        summary_polyline: 'encoded_polyline_data_3',
        resource_state: 2
      },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      flagged: false,
      gear_id: null,
      from_accepted_tag: false,
      average_speed: 2.22, // ~8 km/h
      max_speed: 3.33, // ~12 km/h
      average_cadence: 0,
      average_watts: 0,
      weighted_average_watts: 0,
      kilojoules: 0,
      device_watts: false,
      has_heartrate: false,
      average_heartrate: 0,
      max_heartrate: 0,
      max_watts: 0,
      pr_count: 0,
      total_photo_count: 0,
      has_kudoed: false,
      suffer_score: 0
    }
  ];
};

// Initialize with mock data
config.activities = generateMockActivities();
config.athletes = [mockAthlete];

// Middleware to simulate network delay
app.use((req, res, next) => {
  if (config.delayMs && config.delayMs > 0) {
    setTimeout(next, config.delayMs);
  } else {
    next();
  }
});

// Middleware to simulate errors
app.use((req, res, next) => {
  if (config.errorRate && config.errorRate > 0 && Math.random() < config.errorRate) {
    res.status(500).json({ error: 'Simulated server error' });
    return;
  }
  next();
});

// GET /athlete - Get athlete info
app.get('/athlete', (req, res) => {
  res.json(config.athletes[0]);
});

// GET /athlete/activities - Get athlete activities
app.get('/athlete/activities', (req, res) => {
  const { before, after, page, per_page } = req.query;
  
  let activities = [...config.activities];
  
  // Sort by start_date descending (newest first)
  activities.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  
  // Apply pagination
  const pageNum = parseInt(page as string) || 1;
  const perPage = parseInt(per_page as string) || 30;
  const startIndex = (pageNum - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  const paginatedActivities = activities.slice(startIndex, endIndex);
  
  res.json(paginatedActivities);
});

// GET /activities/:id - Get specific activity
app.get('/activities/:id', (req, res) => {
  const activityId = parseInt(req.params.id);
  const activity = config.activities.find(a => a.id === activityId);
  
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }
  
  res.json(activity);
});

// POST /activities - Create new activity (for testing)
app.post('/activities', (req, res) => {
  const newActivity: StravaActivity = {
    id: Math.max(...config.activities.map(a => a.id)) + 1,
    ...req.body,
    start_date: new Date().toISOString(),
    start_date_local: new Date().toISOString()
  };
  
  config.activities.unshift(newActivity);
  res.status(201).json(newActivity);
});

// PUT /config - Update server configuration
app.put('/config', (req, res) => {
  config = { ...config, ...req.body };
  res.json({ message: 'Configuration updated', config });
});

// GET /config - Get current configuration
app.get('/config', (req, res) => {
  res.json(config);
});

// POST /reset - Reset to default configuration
app.post('/reset', (req, res) => {
  config = { ...defaultConfig };
  config.activities = generateMockActivities();
  config.athletes = [mockAthlete];
  res.json({ message: 'Configuration reset to defaults' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activitiesCount: config.activities.length,
    athletesCount: config.athletes.length
  });
});

// Start server function
function startServer() {
  const PORT = process.env.MOCK_STRAVA_PORT || config.port;

  app.listen(PORT, () => {
    console.log(`🏃 Mock Strava server running on http://localhost:${PORT}`);
    console.log(`📊 Available activities: ${config.activities.length}`);
    console.log(`👤 Mock athlete: ${mockAthlete.firstname} ${mockAthlete.lastname}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`  GET  /athlete`);
    console.log(`  GET  /athlete/activities`);
    console.log(`  GET  /activities/:id`);
    console.log(`  POST /activities`);
    console.log(`  GET  /config`);
    console.log(`  PUT  /config`);
    console.log(`  POST /reset`);
    console.log(`  GET  /health`);
  });
}

// Auto-start when run directly
startServer();

export default app;
