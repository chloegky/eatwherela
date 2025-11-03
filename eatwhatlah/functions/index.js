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
    
    // Use curated list with more specific food names
    const curatedFoods = [
      'brown sugar boba',
      'hainanese chicken rice',
      'tonkotsu ramen',
      'katong laksa',
      'nasi lemak with fried chicken',
      'har gow dim sum',
      'salmon sushi',
      'smash burger',
      'neapolitan pizza',
      'korean bbq buffet',
      'mala hotpot',
      'cheese prata',
      'chicken satay',
      'hyderabadi biryani',
      'pistachio kunafa',
      'chicken shawarma',
      'penang char kway teow',
      'herbal bak kut teh',
      'beef pho',
      'carbonara pasta',
      'salted egg croissant',
      'truffle fries',
      'matcha latte',
      'acai bowl'
    ];
    
    logger.info(`Analyzing ${curatedFoods.length} foods`);
    
    // Fetch interest scores in parallel
    const trendsPromises = curatedFoods.map(async (foodName) => {
      try {
        const keyword = `${foodName} singapore`;
        
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
          
          return { foodName, interest: avgInterest };
        }
        return null;
      } catch (error) {
        logger.error(`Error for ${foodName}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(trendsPromises);
    const trendsData = {};
    
    results.forEach(result => {
      if (result && result.interest > 0) {
        trendsData[result.foodName] = result.interest;
      }
    });
    
    logger.info(`Successfully fetched trends for ${Object.keys(trendsData).length} foods`);
    
    response.json({ 
      success: true, 
      data: trendsData,
      totalAnalyzed: curatedFoods.length
    });
    
  } catch (error) {
    logger.error("Error in getTrendingFoods:", error);
    response.status(500).json({ 
      success: false, 
      error: error.message,
      data: {
        'chicken rice': 78,
        'ramen': 77,
        'korean bbq': 74,
        'laksa': 72,
        'bubble tea': 68,
        'dim sum': 66,
        'nasi lemak': 65,
        'sushi': 64,
        'hotpot': 63,
        'prata': 62
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
