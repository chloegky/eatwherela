/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const googleTrends = require("google-trends-api");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Google Trends API endpoint
exports.getTrendingFoods = onRequest(async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    logger.info("Fetching trending foods from Google Trends");
      
      const foodKeywords = [
        'bubble tea singapore',
        'ramen singapore',
        'hotpot singapore',
        'korean bbq singapore',
        'dim sum singapore',
        'chicken rice singapore',
        'laksa singapore',
        'sushi singapore',
        'pasta singapore',
        'burger singapore',
        'thai food singapore',
        'indian curry singapore'
      ];
      
      const trendsPromises = foodKeywords.map(async (keyword) => {
        try {
          const results = await googleTrends.interestOverTime({
            keyword: keyword,
            geo: 'SG',
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          });
          
          const data = JSON.parse(results);
          const timelineData = data.default.timelineData;
          
          if (timelineData && timelineData.length > 0) {
            const avgInterest = timelineData.reduce((sum, point) => 
              sum + point.value[0], 0) / timelineData.length;
            
            const foodName = keyword.replace(' singapore', '').trim();
            return { foodName, interest: avgInterest };
          }
          return null;
        } catch (error) {
          logger.error(`Error fetching trends for ${keyword}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(trendsPromises);
      const trendsData = {};
      
      results.forEach(result => {
        if (result) {
          trendsData[result.foodName] = result.interest;
        }
      });
      
      logger.info("Trends data fetched successfully", trendsData);
      response.json({ success: true, data: trendsData });
      
  } catch (error) {
    logger.error("Error in getTrendingFoods:", error);
    response.status(500).json({ 
      success: false, 
      error: error.message,
      // Fallback data
      data: {
        'bubble tea': 80,
        'ramen': 70,
        'hotpot': 75,
        'korean bbq': 65,
        'dim sum': 60,
        'chicken rice': 55,
        'laksa': 50,
        'sushi': 65
      }
    });
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
