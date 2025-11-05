<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import databaseFunctions from "../services/databaseFunctions";
import placeholderImg from '../assets/placeholder.webp';
import Sidebar from './subcomponents/Sidebar.vue';


let map;
let markers = [];
let emojiMarkers = []; // Separate array for emoji markers
let cachedPlaces = []; // Store places for marker recreation

const router = useRouter(); 
const restaurants = ref([]);
const favorites = ref(new Map());
const restaurantReviews = ref(new Map());
const restaurantEmotions = ref(new Map());
const filter = ref("nearby");
const priceFilter = ref("All");
const deliciousFilter = ref(false);

const tooltipVisible = ref(false);
const tooltipContent = ref({ name: "", rating: 0, review: "", emotion: "" });
const tooltipPosition = ref({ x: 0, y: 0 });

const emotionIcons = {
  delicious: "😋",
  meh: "😐",
  disappointing: "🤢",
  crowded: "👥",
  longWait: "⏳",
};

const currentUserId = ref(null);

let authUnsubscribe = null;
let favoritesUnsubscribe = null;
let createMapMarkersFunction = null; // Will be set when map initializes

// Watch favorites and recreate markers when they change
watch(favorites, () => {
  if (cachedPlaces.length > 0 && map && createMapMarkersFunction) {
    createMapMarkersFunction(cachedPlaces);
  }
}, { deep: true });

const showBackToTop = ref(false);

function topFunction() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function onScroll() {
  showBackToTop.value = window.scrollY > 20;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});



function formatRestaurantType(type) {
  if (!type) return 'Restaurant';
  if (type === 'meal_takeaway') return 'Restaurant';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const displayedRestaurants = computed(() => {
  let restaurantList = [];

  if (filter.value === "favorites") {
    restaurantList = Array.from(favorites.value.values()).map((fav) => ({
      id: fav.place_id,
      title: fav.title,
      description: fav.description,
      category: fav.category,
      stars: fav.stars,
      img: fav.img,
      lat: fav.lat,
      lng: fav.lng,
      place_id: fav.place_id,
      rating: fav.rating,
      user_ratings_total: fav.user_ratings_total,
      restaurantType: fav.restaurantType,
      priceLevel: fav.priceLevel
    }));
  } else {
    restaurantList = restaurants.value;
  }

  // Apply price filter
  if (priceFilter.value !== "All") {
    restaurantList = restaurantList.filter(r => r.priceLevel === priceFilter.value);
  }

  // Apply delicious filter (90%+ delicious ratings)
  if (deliciousFilter.value) {
    console.log('=== DELICIOUS FILTER ACTIVE ===');
    console.log('Total restaurants before filter:', restaurantList.length);
    console.log('Restaurant emotions map:', restaurantEmotions.value);
    
    restaurantList = restaurantList.filter(restaurant => {
      const restaurantKey = `${restaurant.lat}_${restaurant.lng}`;
      const emotions = restaurantEmotions.value.get(restaurantKey);
      
      console.log(`Restaurant: ${restaurant.title}`);
      console.log(`  Key: ${restaurantKey}`);
      console.log(`  Emotions:`, emotions);
      
      if (!emotions) {
        console.log(`  ❌ No emotion data found`);
        return false;
      }
      
      const deliciousCount = emotions.delicious || 0;
      const totalEmotions = (emotions.delicious || 0) + 
                           (emotions.meh || 0) + 
                           (emotions.disappointing || 0) +
                           (emotions.crowded || 0) +
                           (emotions.longWait || 0);
      
      console.log(`  Delicious: ${deliciousCount}, Total: ${totalEmotions}`);
      
      if (totalEmotions === 0) {
        console.log(`  ❌ No emotions recorded`);
        return false;
      }
      
      const deliciousPercentage = (deliciousCount / totalEmotions) * 100;
      console.log(`  Delicious percentage: ${deliciousPercentage.toFixed(2)}%`);
      
      if (deliciousPercentage >= 90) {
        console.log(`  ✅ PASSES FILTER (≥90%)`);
        return true;
      } else {
        console.log(`  ❌ Does not meet 90% threshold`);
        return false;
      }
    });
    
    console.log('Total restaurants after filter:', restaurantList.length);
    console.log('=== END DELICIOUS FILTER ===');
  }

  restaurantList.forEach(restaurant => {
    loadReviewsForRestaurant(restaurant.title);
  });

  return restaurantList;
});

async function loadReviewsForRestaurant(restaurantName) {
  if (!restaurantReviews.value.has(restaurantName)) {
    try {
      const reviews = await databaseFunctions.getRecentReviewsByRestaurant(restaurantName, 10);
      restaurantReviews.value.set(restaurantName, reviews);
    } catch (error) {
      console.error(`Error loading reviews for ${restaurantName}:`, error);
      restaurantReviews.value.set(restaurantName, []);
    }
  }
}

function getRestaurantReviews(restaurantName) {
  return restaurantReviews.value.get(restaurantName) || [];
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function loadEmotionsForRestaurant(restaurantName) {
  if (!restaurantEmotions.value.has(restaurantName)) {
    try {
      const emotions = await databaseFunctions.getEmotionsByRestaurant(restaurantName);
      restaurantEmotions.value.set(restaurantName, emotions);
    } catch (error) {
      console.error(`Error loading emotions for ${restaurantName}:`, error);
      restaurantEmotions.value.set(restaurantName, []);
    }
  }
}

function getRestaurantEmotions(restaurantName) {
  return restaurantEmotions.value.get(restaurantName) || [];
}

function showEmojiTooltip(event, emotionData) {
  tooltipContent.value = {
    name: emotionData.restaurantName,
    rating: emotionData.rating,
    review: emotionData.reviewText,
    emotion: emotionData.emotion
  };
  tooltipPosition.value = {
    x: event.pageX || event.clientX + window.scrollX,
    y: event.pageY || event.clientY + window.scrollY
  };
  tooltipVisible.value = true;
}

function hideEmojiTooltip() {
  tooltipVisible.value = false;
}

function viewRestaurantDetail(restaurant) {
  const restaurantData = encodeURIComponent(JSON.stringify(restaurant));
  router.push({
    path: '/RestaurantDetail/',
    query: { data: restaurantData }
  });
}

function openRestaurantWebsite(restaurant) {
  const link = restaurant.website || restaurant.url;
  if (link) {
    window.open(link, '_blank');
  } else {
    const query = encodeURIComponent(restaurant.title + ' ' + (restaurant.description || ''));
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  }
}

async function toggleFavorite(restaurantId) {
  if (!currentUserId.value) {
    console.error("User not authenticated");
    alert("Please log in to add favorites");
    return;
  }

  const restaurant = restaurants.value.find(r => r.id === restaurantId || r.place_id === restaurantId);
  if (!restaurant) {
    console.error("Restaurant not found");
    return;
  }

  const placeId = restaurant.place_id || restaurantId;

  try {
    if (favorites.value.has(placeId)) {
      await databaseFunctions.removeFavorite(currentUserId.value, placeId);
      console.log("Removed from favorites");
    } else {
      await databaseFunctions.addFavorite(currentUserId.value, {
        place_id: placeId,
        title: restaurant.title,
        description: restaurant.description,
        category: restaurant.category,
        stars: restaurant.stars,
        img: restaurant.img,
        lat: restaurant.lat,
        lng: restaurant.lng,
        rating: restaurant.rating,
        user_ratings_total: restaurant.user_ratings_total,
        restaurantType: restaurant.restaurantType
      });
      console.log("Added to favorites");
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    alert("Failed to update favorites. Please try again.");
  }
}

function setFilter(value) {
  filter.value = value;
}

// Function to generate fake reviews and emotions for testing
async function generateFakeData() {
  // Generate 300 fake user IDs
  const fakeUserIds = [];
  for (let i = 1; i <= 300; i++) {
    fakeUserIds.push(`fakeUser${String(i).padStart(3, '0')}`);
  }
  
  const emotions = ['delicious', 'meh', 'disappointing', 'crowded', 'longWait'];
  
  // Reviews categorized by rating
  const reviewsByRating = {
    1: [
      "Absolutely terrible! Worst meal ever.",
      "Disgusting food, would never come back.",
      "Complete waste of money. Avoid at all costs!",
      "Food was cold and tasteless. Horrible service.",
      "Inedible. How is this place still open?",
      "Terrible experience. Food was awful.",
      "Do NOT eat here. Save your money!",
      "Worst restaurant in Singapore."
    ],
    2: [
      "Very disappointing. Expected much better.",
      "Below average food and poor service.",
      "Not good at all. Won't be returning.",
      "Overpriced and underwhelming.",
      "Food was mediocre at best.",
      "Poor quality ingredients. Not impressed.",
      "Service was slow and food was bland.",
      "Not worth the price or time."
    ],
    3: [
      "It's okay, nothing special.",
      "Average food, average service.",
      "Not bad, could be better.",
      "Decent but wouldn't rush back.",
      "Fair enough for the price.",
      "Acceptable, but many better options.",
      "Middle of the road. Just okay.",
      "Nothing to write home about."
    ],
    4: [
      "Really good! Would recommend.",
      "Great food and friendly service.",
      "Very enjoyable meal, will come back!",
      "Tasty food and nice atmosphere.",
      "Good value for money. Impressed!",
      "Solid choice, really liked it.",
      "Fresh ingredients and well prepared.",
      "Pleasantly surprised, quite good!"
    ],
    5: [
      "Amazing food! Highly recommend!",
      "Absolutely delicious! Best in Singapore!",
      "Perfect in every way! Will definitely come back!",
      "Outstanding! Exceeded all expectations!",
      "Incredible experience, 10/10!",
      "Phenomenal food and service!",
      "Hidden gem! Must try!",
      "Best meal I've had in ages!",
      "Flawless! Love this place!",
      "Exceptional quality, can't fault it!"
    ]
  };

  // Key locations across Singapore to search for restaurants
  const singaporeLocations = [
    { name: "Marina Bay", lat: 1.2806, lng: 103.8501 },
    { name: "Orchard Road", lat: 1.3048, lng: 103.8318 },
    { name: "Chinatown", lat: 1.2818, lng: 103.8439 },
    { name: "Little India", lat: 1.3066, lng: 103.8518 },
    { name: "Bugis", lat: 1.3006, lng: 103.8556 },
    { name: "Clarke Quay", lat: 1.2905, lng: 103.8469 },
    { name: "Sentosa", lat: 1.2494, lng: 103.8303 },
    { name: "East Coast", lat: 1.3006, lng: 103.9280 },
    { name: "Jurong", lat: 1.3329, lng: 103.7436 },
    { name: "Tampines", lat: 1.3496, lng: 103.9568 },
    { name: "Woodlands", lat: 1.4382, lng: 103.7891 },
    { name: "Bedok", lat: 1.3236, lng: 103.9273 },
    { name: "Clementi", lat: 1.3162, lng: 103.7649 },
    { name: "Ang Mo Kio", lat: 1.3691, lng: 103.8454 },
    { name: "Hougang", lat: 1.3612, lng: 103.8864 }
  ];

  console.log("🔍 Searching for restaurants across Singapore...");
  
  // Helper function to add delay between API calls
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Function to search restaurants in a specific location
  const searchRestaurantsInArea = (location) => {
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(map);
      const request = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 5000, // 5km radius for better coverage
        type: 'restaurant'
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`✅ Found ${results.length} restaurants in ${location.name}`);
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.warn(`⚠️ Rate limit reached for ${location.name}, retrying...`);
          // Retry after a longer delay
          setTimeout(() => {
            service.nearbySearch(request, (retryResults, retryStatus) => {
              if (retryStatus === google.maps.places.PlacesServiceStatus.OK && retryResults) {
                console.log(`✅ Retry successful: Found ${retryResults.length} restaurants in ${location.name}`);
                resolve(retryResults);
              } else {
                console.log(`❌ Retry failed for ${location.name}: ${retryStatus}`);
                resolve([]);
              }
            });
          }, 2000);
        } else {
          console.log(`❌ No results for ${location.name}: ${status}`);
          resolve([]);
        }
      });
    });
  };

  // Collect all restaurants from all locations with delays between searches
  const allRestaurants = [];
  for (let i = 0; i < singaporeLocations.length; i++) {
    const location = singaporeLocations[i];
    console.log(`📍 Searching ${i + 1}/${singaporeLocations.length}: ${location.name}...`);
    const restaurants = await searchRestaurantsInArea(location);
    allRestaurants.push(...restaurants);
    
    // Add delay between searches to avoid rate limiting (except for last iteration)
    if (i < singaporeLocations.length - 1) {
      await delay(500); // 500ms delay between searches
    }
  }

  // Remove duplicates based on place_id
  const uniqueRestaurants = Array.from(
    new Map(allRestaurants.map(r => [r.place_id, r])).values()
  );

  console.log(`📍 Found ${uniqueRestaurants.length} unique restaurants across Singapore`);

  let totalCreated = 0;
  const restaurantReviewCount = new Map(); // Track reviews per restaurant

  // Create a pool of restaurants to assign to users
  const restaurantsPool = [...uniqueRestaurants];
  
  for (const restaurant of restaurantsPool) {
    // Each restaurant gets 2-3 reviews
    const numReviewsForRestaurant = Math.floor(Math.random() * 2) + 2; // 2-3 reviews
    
    // Pick random users to review this restaurant
    const shuffledUsers = [...fakeUserIds].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, numReviewsForRestaurant);

    for (const fakeUserId of selectedUsers) {
      // Generate rating first (1-5 stars)
      const randomRating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
      
      // Select review based on rating
      const ratingReviews = reviewsByRating[randomRating];
      const randomReview = ratingReviews[Math.floor(Math.random() * ratingReviews.length)];
      
      // Select emotion based on rating
      let randomEmotion;
      if (randomRating >= 4) {
        randomEmotion = 'delicious'; // 4-5 stars = delicious
      } else if (randomRating === 3) {
        randomEmotion = Math.random() < 0.5 ? 'meh' : (Math.random() < 0.5 ? 'crowded' : 'longWait'); // 3 stars = meh/crowded/longWait
      } else {
        randomEmotion = 'disappointing'; // 1-2 stars = disappointing
      }
      
      const timestamp = Date.now() - Math.floor(Math.random() * 86400000); // Within last 24 hours

      const lat = restaurant.geometry.location.lat();
      const lng = restaurant.geometry.location.lng();

      const emotionData = {
        emotion: randomEmotion,
        lat: lat,
        lng: lng,
        restaurantName: restaurant.name,
        rating: randomRating,
        reviewText: randomReview,
        timestamp: timestamp,
        userId: fakeUserId
      };

      try {
        await databaseFunctions.updateUserEmotion(fakeUserId, emotionData);
        totalCreated++;
        
        // Track restaurant review count
        const count = restaurantReviewCount.get(restaurant.name) || 0;
        restaurantReviewCount.set(restaurant.name, count + 1);
        
        if (totalCreated % 50 === 0) {
          console.log(`✅ Created ${totalCreated} reviews so far...`);
        }
      } catch (error) {
        console.error("Error saving fake emotion:", error);
      }
    }
  }

  console.log(`🎉 Generated ${totalCreated} fake reviews for ${restaurantReviewCount.size} restaurants!`);
  console.log(`📊 Each restaurant has 2-3 reviews`);
  alert(`Success! Generated ${totalCreated} fake reviews (2-3 per restaurant) for ${restaurantReviewCount.size} restaurants across Singapore. Refresh the page to see them on the map!`);
}

function setPriceFilter(value) {
  priceFilter.value = value;
}

// Format category with green dollar signs
function formatCategoryWithGreenPrice(category) {
  if (!category) return '';
  // Replace dollar signs with green-colored spans
  return category.replace(/(\$+)/g, '<span class="price-green">$1</span>');
}

function initializeAuth() {
  const auth = getAuth();
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId.value = user.uid;
      console.log("User authenticated:", user.uid);
      loadFavorites();
    } else {
      currentUserId.value = null;
      favorites.value.clear();
      console.log("User not authenticated");
    }
  });
}

function loadFavorites() {
  if (!currentUserId.value) return;

  favoritesUnsubscribe = databaseFunctions.watchUserFavorites(
    currentUserId.value,
    (snapshot) => {
      favorites.value.clear();
      if (snapshot.exists()) {
        const favoritesData = snapshot.val();
        Object.keys(favoritesData).forEach((placeId) => {
          favorites.value.set(placeId, favoritesData[placeId]);
        });
        console.log(`Loaded ${favorites.value.size} favorites`);
      } else {
        console.log("No favorites found");
      }
    }
  );
}

function isFavorited(restaurantId) {
  const restaurant = restaurants.value.find(r => r.id === restaurantId || r.place_id === restaurantId);
  if (!restaurant) {
    // If not in nearby list, check if it's directly in favorites by ID
    return favorites.value.has(restaurantId);
  }
  const placeId = restaurant.place_id || restaurant.id || restaurantId;
  return favorites.value.has(placeId);
}

function loadAllEmotions(hoursAgo = 1, onComplete = null) {
  console.log('=== LOADING ALL EMOTIONS ===');
  console.log('Looking for emotions from last', hoursAgo, 'hour(s)');
  console.log('Current restaurants count:', restaurants.value.length);
  console.log('Restaurant names:', restaurants.value.map(r => r.title));
  
  databaseFunctions.getAllUserEmotions((snapshot) => {
    console.log('Snapshot exists?', snapshot.exists());
    const data = snapshot.val();
    console.log('Raw emotion data from database:', data);
    
    if (!data) {
      console.log("❌ No emotion data found in database");
      if (onComplete) onComplete();
      return;
    }

    console.log('✅ Emotion data found. Processing...');
    console.log('Number of users with emotions:', Object.keys(data).length);
    console.log('User IDs:', Object.keys(data));
    
    restaurantEmotions.value.clear();
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    console.log('Cutoff time:', new Date(cutoffTime).toLocaleString());
    
    let totalEmotionsProcessed = 0;
    let emotionsMatchedByName = 0;
    let emotionsMatchedByGPS = 0;

    // Iterate through all users
    Object.entries(data).forEach(([userId, userEmotions]) => {
      console.log(`User ${userId}: ${Object.keys(userEmotions).length} emotions`);
      
      // Iterate through all emotions for this user
      Object.entries(userEmotions).forEach(([emotionId, emotionData]) => {
        if (!emotionData || !emotionData.emotion || !emotionData.lat || !emotionData.lng) {
          return;
        }

        if (!emotionData.timestamp || emotionData.timestamp < cutoffTime) {
          return;
        }
        
        totalEmotionsProcessed++;
        console.log(`Emotion #${totalEmotionsProcessed}:`, emotionData.emotion, 'at', emotionData.restaurantName || 'Unknown');

        const emotionLocation = { lat: emotionData.lat, lng: emotionData.lng };
        
        // Try to match by restaurant name first
        let matched = false;
        if (emotionData.restaurantName) {
          const matchingRestaurant = restaurants.value.find(r => 
            r.title.toLowerCase() === emotionData.restaurantName.toLowerCase()
          );
          
          if (matchingRestaurant) {
            const restaurantKey = `${matchingRestaurant.lat}_${matchingRestaurant.lng}`;
            
            if (!restaurantEmotions.value.has(restaurantKey)) {
              restaurantEmotions.value.set(restaurantKey, {
                delicious: 0,
                meh: 0,
                disappointing: 0,
                crowded: 0,
                longWait: 0
              });
            }
            
            const counts = restaurantEmotions.value.get(restaurantKey);
            if (counts[emotionData.emotion] !== undefined) {
              counts[emotionData.emotion]++;
              emotionsMatchedByName++;
              console.log(`  ✅ Matched by name to: ${matchingRestaurant.title}`);
            }
            matched = true;
          }
        }
        
        // If no name match, try GPS-based matching (75m threshold)
        if (!matched) {
          restaurants.value.forEach(restaurant => {
            const distance = getDistance(
              emotionLocation.lat,
              emotionLocation.lng,
              restaurant.lat,
              restaurant.lng
            );

            if (distance < 75) {
              const restaurantKey = `${restaurant.lat}_${restaurant.lng}`;
              
              if (!restaurantEmotions.value.has(restaurantKey)) {
                restaurantEmotions.value.set(restaurantKey, {
                  delicious: 0,
                  meh: 0,
                  disappointing: 0,
                  crowded: 0,
                  longWait: 0
                });
              }
              
              const counts = restaurantEmotions.value.get(restaurantKey);
              if (counts[emotionData.emotion] !== undefined) {
                counts[emotionData.emotion]++;
                emotionsMatchedByGPS++;
                console.log(`  ✅ Matched by GPS (${distance.toFixed(1)}m) to: ${restaurant.title}`);
              }
            }
          });
        }
      });
    });

    console.log('=== EMOTION LOADING SUMMARY ===');
    console.log('Total emotions processed:', totalEmotionsProcessed);
    console.log('Matched by name:', emotionsMatchedByName);
    console.log('Matched by GPS:', emotionsMatchedByGPS);
    console.log('Restaurants with emotions:', restaurantEmotions.value.size);
    console.log('Restaurant emotions map:');
    restaurantEmotions.value.forEach((emotions, key) => {
      const total = emotions.delicious + emotions.meh + emotions.disappointing + emotions.crowded + emotions.longWait;
      const deliciousPercent = total > 0 ? ((emotions.delicious / total) * 100).toFixed(1) : 0;
      console.log(`  ${key}: Delicious=${emotions.delicious}/${total} (${deliciousPercent}%)`, emotions);
    });
    console.log('=== END EMOTION LOADING ===');
    
    // Call onComplete callback if provided
    if (onComplete) {
      console.log('Calling onComplete callback...');
      onComplete();
    }
  });
}

// Haversine formula to calculate distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toggleDeliciousFilter() {
  deliciousFilter.value = !deliciousFilter.value;
  console.log('Delicious filter:', deliciousFilter.value);
}

function calculateDistanceInMeters(pos1, pos2) {
  const R = 6371000;
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function handleImageError(event) {
  event.target.src = placeholderImg;
  event.target.onerror = null;
}

onMounted(() => {
  initializeAuth();

  (g => {
    var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary",
      q = "__ib__", m = document, b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams,
      u = () => h || (h = new Promise(async (f, n) => {
        await (a = m.createElement("script"));
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => h = n(Error(p + " could not load."));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
      }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
  })({ key: "AIzaSyAb_Mphc8FUiyDLfOvWTYsVTYvipMLi7bo", v: "weekly", libraries: "places" });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      const { Map, InfoWindow } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

      map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        mapId: "DEMO_MAP_ID",
      });

      const infoWindow = new InfoWindow();

      // Create "You are here" marker matching Map page style
      const youAreHereDiv = document.createElement("div");
      youAreHereDiv.style.width = "22px";
      youAreHereDiv.style.height = "22px";
      youAreHereDiv.style.backgroundColor = "#007bff";
      youAreHereDiv.style.border = "3px solid white";
      youAreHereDiv.style.borderRadius = "50%";
      youAreHereDiv.style.boxShadow = "0 0 10px rgba(0, 123, 255, 0.7)";

      new AdvancedMarkerElement({
        map,
        position,
        content: youAreHereDiv,
        title: "You are here!",
        zIndex: 9999,
      });

      const service = new google.maps.places.PlacesService(map);

      function searchNearbyRestaurants() {
        const request = {
          location: position,
          radius: 1500,
          type: 'restaurant',
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`Found ${results.length} nearby restaurants`);

            markers.forEach(marker => marker.setMap(null));
            markers = [];

            restaurants.value = [];
            
            let detailsCompleted = 0;
            const totalPlaces = results.length;

            results.forEach((place) => {
              service.getDetails(
                {
                  placeId: place.place_id,
                  fields: ['name', 'vicinity', 'rating', 'photos', 'website', 'url', 'geometry', 'price_level', 'types', 'user_ratings_total']
                },
                (details, status) => {
                  if (status === google.maps.places.PlacesServiceStatus.OK && details) {
                    const restaurantType = place.types?.[0] || 'restaurant';
                    const priceLevel = getPriceLevel(place.price_level);  
                    restaurants.value.push({
                      id: place.place_id,
                      title: place.name,
                      description: place.vicinity || 'No description available',
                      category: `${formatRestaurantType(restaurantType)} . ${priceLevel} . ${calculateDistance(position, place.geometry.location)}`,
                      stars: Math.round(place.rating || 0),
                      img: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || '../assets/logos/default.png',
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                      place_id: place.place_id,
                      rating: place.rating,
                      user_ratings_total: place.user_ratings_total,
                      restaurantType: formatRestaurantType(restaurantType),
                      priceLevel: priceLevel,
                      website: details.website || null,
                      url: details.url || null
                    });
                  }
                  
                  // Track completion
                  detailsCompleted++;
                  
                  // When all details are fetched, load emotions
                  if (detailsCompleted === totalPlaces) {
                    console.log('All restaurant details loaded. Now loading emotions...');
                    // Small delay to ensure restaurants array is updated
                    setTimeout(() => {
                      loadAllEmotions(24, () => {
                        // Create markers AFTER emotions are fully loaded
                        console.log('Emotions loaded, now creating markers...');
                        setTimeout(() => {
                          createMapMarkers(results);
                          // Create emoji markers after restaurant markers
                          createEmojiMarkers();
                        }, 100);
                      });
                    }, 100);
                  }
                }
              );
            });
          } else {
            console.error('Places search failed:', status);
          }
        });
      }

      function createMapMarkers(places) {
        // Cache places for later recreation (e.g., when favorites change)
        cachedPlaces = places;
        
        console.log('=== CREATING MAP MARKERS ===');
        console.log('Total places:', places.length);
        console.log('Favorites count:', favorites.value.size);
        console.log('Restaurant emotions map size:', restaurantEmotions.value.size);
        
        // Clear existing restaurant markers (emoji markers are kept separate)
        markers.forEach(marker => marker.setMap(null));
        markers = [];

        places.forEach((place) => {
              if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                
                // Check if this restaurant is in favorites
                const isFavorite = favorites.value.has(place.place_id);
                
                // Check if this restaurant is rated 90%+ delicious
                const restaurantKey = `${lat}_${lng}`;
                const emotions = restaurantEmotions.value.get(restaurantKey);
                let isDelicious = false;
                
                if (emotions) {
                  const totalEmotions = Object.values(emotions).reduce((sum, count) => sum + count, 0);
                  if (totalEmotions > 0) {
                    const deliciousCount = emotions.delicious || 0;
                    const deliciousPercentage = (deliciousCount / totalEmotions) * 100;
                    isDelicious = deliciousPercentage >= 90;
                  }
                }
                
                console.log(`${place.name}: isFavorite=${isFavorite}, isDelicious=${isDelicious}, emotions=`, emotions);
                
                let markerContent;
                if (isFavorite) {
                  console.log(`  → Creating HEART marker for ${place.name}`);
                  // Create heart icon for favorite restaurants (takes priority)
                  const heartDiv = document.createElement("div");
                  heartDiv.innerHTML = "❤️";
                  heartDiv.style.fontSize = "24px";
                  heartDiv.style.cursor = "pointer";
                  heartDiv.style.transform = "translateY(-50%)";
                  heartDiv.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.4))";
                  heartDiv.style.transition = "transform 0.2s ease";
                  markerContent = heartDiv;
                } else if (isDelicious) {
                  console.log(`  → Creating STAR marker for ${place.name}`);
                  // Create sleek star icon for delicious restaurants
                  const starDiv = document.createElement("div");
                  starDiv.innerHTML = "⭐";
                  starDiv.style.fontSize = "24px";
                  starDiv.style.cursor = "pointer";
                  starDiv.style.transform = "translateY(-50%)";
                  starDiv.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.4))";
                  starDiv.style.transition = "transform 0.2s ease";
                  markerContent = starDiv;
                } else {
                  console.log(`  → Creating RED PIN marker for ${place.name}`);
                  // Use red pin for other restaurants
                  const pin = new PinElement({
                    background: "#FF5722",
                    borderColor: "#D84315",
                    glyphColor: "#FFFFFF",
                    scale: 1.1
                  });
                  markerContent = pin.element;
                }

                const marker = new AdvancedMarkerElement({
                  map,
                  position: { lat, lng },
                  title: place.name,
                  content: markerContent,
                  gmpClickable: true
                });

                marker.addListener('click', () => {
                  infoWindow.close();

                  const restaurantKey = `${place.geometry.location.lat()}_${place.geometry.location.lng()}`;
                  const emotionCounts = restaurantEmotions.value.get(restaurantKey) || {
                    delicious: 0,
                    meh: 0,
                    disappointing: 0,
                    crowded: 0,
                    longWait: 0
                  };

                  const emotionIcons = {
                    delicious: "😋",
                    meh: "😐",
                    disappointing: "🤢",
                    crowded: "👥",
                    longWait: "⏳"
                  };

                  let emotionCountsHTML = '';
                  const totalEmotions = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
                  
                  if (totalEmotions > 0) {
                    emotionCountsHTML = `
                      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151;">
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                          ${Object.entries(emotionCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([emotion, count]) => `
                              <div style="display: flex; align-items: center; gap: 4px; background: #2d3748; padding: 4px 8px; border-radius: 12px; font-size: 12px; border: 1px solid #374151;">
                                <span style="font-size: 16px;">${emotionIcons[emotion]}</span>
                                <span style="font-weight: 600; color: #e5e7eb;">${count}</span>
                              </div>
                            `).join('')}
                        </div>
                      </div>
                    `;
                  }

                  const content = `
                    <div style="padding: 12px; max-width: 280px; background: #1f2937; border-radius: 8px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #f3f4f6;">
                        ${place.name}
                      </h3>
                      ${place.rating ? `
                        <div style="margin-bottom: 6px;">
                          <span style="color: #f59e0b; font-size: 14px;">${'★'.repeat(Math.round(place.rating))}${'☆'.repeat(5 - Math.round(place.rating))}</span>
                          <span style="color: #9ca3af; font-size: 13px; margin-left: 4px;">${place.rating} (${place.user_ratings_total || 0} reviews)</span>
                        </div>
                      ` : ''}
                      <div style="color: #d1d5db; font-size: 13px; line-height: 1.5; margin-bottom: 6px;">
                        ${place.vicinity || 'Address not available'}
                      </div>
                      ${place.opening_hours ? `
                        <div style="color: ${place.opening_hours.open_now ? '#10b981' : '#ef4444'}; font-size: 12px; font-weight: 600;">
                          ${place.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
                        </div>
                      ` : ''}
                      ${place.price_level ? `
                        <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">
                          Price: ${getPriceLevel(place.price_level)}
                        </div>
                      ` : ''}
                      ${emotionCountsHTML}
                    </div>
                  `;

                  infoWindow.setContent(content);
                  infoWindow.open(marker.map, marker);
                });

                markers.push(marker);
              }
            });
      }
      
      // Assign to global variable so watcher can access it
      createMapMarkersFunction = createMapMarkers;

      // Create emoji markers for user reviews with emotions
      function createEmojiMarkers() {
        console.log("=== CREATING EMOJI MARKERS ===");
        console.log("Calling databaseFunctions.getAllEmotions...");
        try {
          const unsubscribe = databaseFunctions.getAllEmotions((snapshot) => {
            console.log("getAllEmotions callback received");
            console.log("Snapshot:", snapshot);
            const userLatestEmotions = new window.Map(); // Use window.Map to avoid conflict with Google Maps
            
            // Iterate through each user
            snapshot.forEach((userSnapshot) => {
              const userId = userSnapshot.key;
              const userData = userSnapshot.val();
              console.log("Processing user:", userId, userData);
              
              let latestEmotion = null;
              let latestTimestamp = 0;
              
              // userData is an object where each key is a timestamp and value is the emotion data
              if (userData && typeof userData === 'object') {
                Object.values(userData).forEach((emotionEntry) => {
                  console.log("Processing emotion entry:", emotionEntry);
                  // Check if emotionEntry is an object with lat/lng OR has a location property
                  if (emotionEntry && typeof emotionEntry === 'object' && emotionEntry.emotion) {
                    const location = emotionEntry.location || { lat: emotionEntry.lat, lng: emotionEntry.lng };
                    const timestamp = emotionEntry.timestamp || 0;
                    
                    if (location && location.lat && location.lng && timestamp > latestTimestamp) {
                      latestTimestamp = timestamp;
                      latestEmotion = {
                        location: location,
                        emotion: emotionEntry.emotion,
                        restaurantName: emotionEntry.restaurantName,
                        rating: emotionEntry.rating,
                        reviewText: emotionEntry.reviewText,
                        timestamp: timestamp
                      };
                    }
                  }
                });
              }
              
              // Store the latest emotion for this user
              if (latestEmotion) {
                userLatestEmotions.set(userId, latestEmotion);
              }
            });

            const allEmotions = Array.from(userLatestEmotions.values());
            console.log("Total emotions to display (latest per user):", allEmotions.length);

            allEmotions.forEach((emotionData) => {
              const emoji = emotionIcons[emotionData.emotion];
              console.log("Creating marker for emotion:", emotionData.emotion, "emoji:", emoji);
              console.log("Map object:", map);
              console.log("Location:", emotionData.location);
              console.log("AdvancedMarkerElement available?", typeof AdvancedMarkerElement);
              if (!emoji) return;

              const markerDiv = document.createElement("div");
              markerDiv.style.fontSize = "28px";
              markerDiv.style.cursor = "pointer";
              markerDiv.style.transition = "transform 0.2s";
              markerDiv.textContent = emoji;

              console.log("About to create AdvancedMarkerElement...");
              const emojiMarker = new AdvancedMarkerElement({
                map: map,
                position: emotionData.location,
                content: markerDiv,
                title: emotionData.restaurantName
              });

              console.log("Emoji marker created and added to map:", emojiMarker);
              console.log("Total emoji markers now:", emojiMarkers.length + 1);

              markerDiv.addEventListener('mouseenter', (e) => {
                markerDiv.style.transform = "scale(1.3)";
                showEmojiTooltip(e, emotionData);
              });

              markerDiv.addEventListener('mousemove', (e) => {
                if (tooltipVisible.value) {
                  tooltipPosition.value = {
                    x: e.pageX || e.clientX + window.scrollX,
                    y: e.pageY || e.clientY + window.scrollY
                  };
                }
              });

              markerDiv.addEventListener('mouseleave', () => {
                markerDiv.style.transform = "scale(1)";
                hideEmojiTooltip();
              });

              emojiMarkers.push(emojiMarker); // Use separate array for emoji markers
            });
          });
        } catch (error) {
          console.error("Error creating emoji markers:", error);
        }
      }

      function getPriceLevel(level) {
        if (!level) return '$$';
        return '$'.repeat(level);
      }

      function calculateDistance(pos1, pos2) {
        const R = 6371;
        const dLat = (pos2.lat() - pos1.lat) * Math.PI / 180;
        const dLon = (pos2.lng() - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat() * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance < 1) {
          return `${Math.round(distance * 1000)}m away`;
        }
        return `${distance.toFixed(1)}km away`;
      }

      function clearMarkers() {
        markers.forEach(marker => marker.setMap(null));
        markers = [];
      }

      function searchPlaces(query) {
        if (!query) return;

        service.textSearch({ query }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            clearMarkers();
            results.forEach(place => {
              if (place.geometry && place.geometry.location) {
                const marker = new AdvancedMarkerElement({
                  map,
                  position: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  },
                  title: place.name,
                });
                markers.push(marker);
              }
            });
            if (results.length > 0) {
              map.setCenter(results[0].geometry.location);
            }
          }
        });
      }

      searchNearbyRestaurants();
      // createEmojiMarkers() is now called after markers are created

      const input = document.querySelector(".search-input");
      if (input) {
        input.addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            searchPlaces(input.value);
          }
        });
      }
    });
  } else {
    console.log("Geolocation not supported by this browser.");
  }
});

onUnmounted(() => {
  if (authUnsubscribe) {
    authUnsubscribe();
  }
  if (favoritesUnsubscribe) {
    favoritesUnsubscribe();
  }
});
</script>

<template>
  <div class="wrapper">
    <Sidebar />
    <div class="main p-3">
    <button v-show="showBackToTop" @click="topFunction" id="myBtn" title="Go to top">
      Back to Top
    </button>      
      <div class="container">
        <div class="row justify-content-center">
          <div class="col">
            <div class="search-container">
              <input type="text" class="form-control search-input" placeholder="  Search Places" />
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>
        </div>

        <div class="row justify-content-center">
          <div class="col">
            <div class="map-container">
              <div id="map"></div>
            </div>
          </div>
        </div>

        <div class="row justify-content-center">
          <div class="col">
            <div class="buttonfilter-container">
              <div id="buttonfilter" class="d-flex justify-content-center gap-2 align-items-center flex-wrap">
                <button type="button" class="btn" :class="[
                  filter === 'nearby' ? 'btn-primary btn-active' : 'btn-secondary'
                ]" @click="setFilter('nearby')">
                  Near By
                </button>
                <button type="button" class="btn favorites-btn" :class="[
                  filter === 'favorites' ? 'favorites-active' : ''
                ]" @click="setFilter('favorites')">
                  Favourites
                </button>

                <select v-model="priceFilter" class="price-filter-select custom-select" :class="[
                  priceFilter !== 'All' ? 'price-active' : ''
                ]">
                  <option value="All">All Prices</option>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>

                <!-- Delicious Filter Button -->
                <button 
                  type="button" 
                  class="btn delicious-filter-btn" 
                  :class="{ 'delicious-active': deliciousFilter }"
                  @click.prevent="toggleDeliciousFilter"
                >
                  <i class="fas fa-star"></i>
                  Rated Delicious by EatWhatLah users
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No results message when any filter is active and no restaurants match -->
        <div v-if="displayedRestaurants.length === 0" class="no-results-container">
          <div class="no-results-card">
            <i class="fas fa-search" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
            <h5 style="color: #f3f4f6; font-weight: 600; margin-bottom: 0.5rem;">
              {{ deliciousFilter ? 'No Delicious Restaurants Found' : 'No Restaurants Found' }}
            </h5>
            <p style="color: #d1d5db; margin-bottom: 0;">
              {{ deliciousFilter 
                ? 'Try adjusting your filters or check back later as more users rate restaurants!' 
                : 'Try adjusting your filters or search in a different area!' 
              }}
            </p>
          </div>
        </div>

        <div v-for="restaurant in displayedRestaurants" :key="restaurant.id" class="card my-custom-card mt-5"
          @click="openRestaurantWebsite(restaurant)" style="cursor: pointer;">
          <div class="row no-gutters">
            <div class="col-md-3 card-image-container">
              <img :src="restaurant.img" class="card-img my-card-img" @error="handleImageError" alt="Restaurant"/>
            </div>
            <div class="col-md-9">
              <div class="card-body">
                <div class="card-header-row">
                  <div class="title-rating-wrapper">
                    <h5 class="card-title">{{ restaurant.title }}</h5>
                    <div class="star-rating-inline">
                      <span v-for="n in 5" :key="n" class="star" :class="n <= restaurant.stars ? 'filled' : ''">★</span>
                      <span class="category-review-inline" v-html="formatCategoryWithGreenPrice(restaurant.category)"></span>
                    </div>
                  </div>
                  <button type="button" class="btn btn-compact"
                    :class="isFavorited(restaurant.id) ? 'btn-danger' : 'btn-outline-danger'"
                    @click.stop="toggleFavorite(restaurant.id)">
                    <i class="bi bi-heart"></i>
                  </button>
                </div>
                
                <div class="reviews-box" v-if="getRestaurantReviews(restaurant.title).length > 0">
                  <div class="reviews-header">Recent Reviews</div>
                  <div class="marquee-container-inline">
                    <div class="marquee">
                      <div v-for="review in getRestaurantReviews(restaurant.title)" :key="'first-' + review.id" class="marquee-item-inline">
                        <span v-for="n in 5" :key="n" class="review-star-inline" :class="n <= review.rating ? 'filled' : ''">★</span>
                        <span class="review-text-inline">"{{ review.reviewText }}"</span>
                        <span class="review-date-inline">{{ formatDate(review.timestamp) }}</span>
                      </div>
                      <div v-for="review in getRestaurantReviews(restaurant.title)" :key="'second-' + review.id" class="marquee-item-inline">
                        <span v-for="n in 5" :key="n" class="review-star-inline" :class="n <= review.rating ? 'filled' : ''">★</span>
                        <span class="review-text-inline">"{{ review.reviewText }}"</span>
                        <span class="review-date-inline">{{ formatDate(review.timestamp) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="reviews-box no-reviews-box" v-else>
                  <div class="reviews-header">Recent Reviews</div>
                  <p class="no-reviews-text">No reviews yet. Be the first to review!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Emoji Tooltip -->
  <div 
    v-if="tooltipVisible" 
    class="emoji-tooltip"
    :style="{
      left: (tooltipPosition.x - 125) + 'px',
      top: (tooltipPosition.y - 130) + 'px'
    }"
  >
    <div class="tooltip-header">🍽️ {{ tooltipContent.name }}</div>
    <div class="tooltip-rating">⭐ Rating: {{ tooltipContent.rating }}/5</div>
    <div class="tooltip-review">"{{ tooltipContent.review }}"</div>
    <div class="tooltip-emotion">{{ emotionIcons[tooltipContent.emotion] }} {{ tooltipContent.emotion }}</div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.wrapper {
  display: flex;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0f1419;
}

a {
  text-decoration: none !important;
}

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}

.main {
  flex: 1;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%);
  margin-left: 72px;
  padding: 2.8rem 2.2rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  color: #e5e7eb;
}


#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

.search-container {
  position: relative;
  max-width: 680px;
  margin: 0 auto 2.2rem auto;
}

.search-input {
  height: 52px;
  border-radius: 10px;
  padding-left: 52px;
  border: 1.5px solid #374151;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  font-size: 1.02rem;
  font-weight: 400;
  color: #e5e7eb;
  background: #1f2937;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #6b7280;
}

.search-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  outline: none;
  background: #2d3748;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 19px;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.15rem;
  pointer-events: none;
}

.map-container {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  background: #1f2937;
  margin-top: 1.8rem;
  border: 1px solid #374151;
}

#map {
  height: 480px;
  width: 100%;
}

.buttonfilter-container {
  margin-top: 3.2rem;
  display: flex;
  justify-content: center;
}

#buttonfilter {
  display: flex;
  gap: 14px;
  align-items: flex-start !important;
}

#buttonfilter button {
  font-family: 'Inter', sans-serif;
  font-size: 0.975rem;
  font-weight: 600;
  padding: 0.65rem 1.6rem;
  border-radius: 9px;
  border: 1.5px solid #374151;
  background: #1f2937;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.01em;
}

.btn-active {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%) !important;
  color: #fff !important;
  font-weight: 700;
  border: 2.5px solid #42a5f5 !important;
  box-shadow: 0 4px 16px rgba(66, 165, 245, 0.5);
  transform: scale(1.05);
  transition: background 0.2s, transform 0.22s, box-shadow 0.22s;
}

#buttonfilter .btn-primary:hover,
#buttonfilter .btn-active:hover {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%) !important;
  color: #fff !important;
}

#buttonfilter .btn-secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

#buttonfilter .btn-secondary:hover {
  transform: scale(1.04);
  border-color: #42a5f5;
  box-shadow: 0 0 8px rgba(66, 165, 245, 0.4);
}

.price-filter-select {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.30rem 0.6rem 0.30rem 0.8rem;
  border-radius: 9px;
  border: 1.5px solid #374151;
  background: #1f2937;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.01em;
  outline: none;
}

.price-filter-select:hover {
  background: rgba(16, 185, 129, 0.15) !important;
  border-color: #10b981 !important;
}

.price-filter-select:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}  

.price-filter-select option {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  background-color: #1f2937;
  color: #e5e7eb;
}

.price-filter-select.custom-select {
  appearance: none;
  padding: 0.65rem 2.2rem 0.65rem 1.1rem;
  border-radius: 9px;
  border: 1.5px solid #d1d5db;
  background-color: #fff;
  font-weight: 600;
  color: #374151;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  position: relative;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='18' viewBox='0 0 24 24' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  transition: border-color 0.2s, box-shadow 0.2s;
  height: inherit;
}

.price-filter-select.custom-select:focus {
  border-color: #42a5f5;
  box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.1);
  outline: none;
}

.buttonfilter-container,
#buttonfilter {
  overflow: visible !important;   
}

/* Favorites Button Styles */
.favorites-btn {
  background: #ffffff !important;
  border: 1.5px solid #374151 !important;
  color: #374151 !important;
  transition: all 0.3s ease !important;
}

.favorites-btn.favorites-active {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border-color: #dc2626 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
}

.favorites-btn:hover {
  border-color: #ef4444 !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
}

.favorites-btn.favorites-active:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5) !important;
}

/* Price Filter Button START */
.price-filter-select {
  background: #fff;
  color: #374151;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  height: inherit;
  padding: 0.7rem 2rem 0.7rem 1.1rem;
  border-radius: 9px;
  border: 1.5px solid #374151;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.01em;
  outline: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='18' viewBox='0 0 24 24' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.price-filter-select:hover,
.price-filter-select:focus {
  border-color: #10b981 !important;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.price-filter-select option {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  background-color: #e5e7eb;
  color: #1f2937;
}

.price-filter-select {
  min-width: auto !important;
  width: auto !important;
  position: relative;
  z-index: 2;
}
/* Price Filter Button END */

/* Delicious Filter Button */
.delicious-filter-btn {
  background: #1f2937 !important;
  border: 1.5px solid #374151 !important;
  color: #e5e7eb !important;
  padding: 0.65rem 1.1rem !important;
  border-radius: 9px !important;
  font-weight: 600 !important;
  font-size: 0.9rem !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  width: auto !important;
  justify-content: center !important;
  letter-spacing: 0.01em !important;
}

.delicious-filter-btn i {
  font-size: 1rem;
  color: #9ca3af;
  transition: color 0.3s ease;
}

.delicious-filter-btn:hover {
  border-color: #fbbf24 !important;
  background: rgba(251, 191, 36, 0.1) !important;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3) !important;
}

.delicious-filter-btn.delicious-active {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
  border-color: #f59e0b !important;
  color: #ffffff !important;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.5) !important;
}

.delicious-filter-btn.delicious-active i {
  color: #ffffff !important;
}

.delicious-filter-btn.delicious-active:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  box-shadow: 0 6px 20px rgba(251, 191, 36, 0.6) !important;
}

/* No results container */
.no-results-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 3rem 1rem;
}

.no-results-card {
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  border: 1px solid #374151;
}

.my-custom-card {
  display: flex;
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  border: 1px solid #374151;
  margin-bottom: 0.5rem;
  padding: 0 !important;
  transition: box-shadow 0.23s, transform 0.18s, border-color 0.23s;
  overflow: hidden;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
  height: 220px;
  min-height: 220px;
  max-height: 220px;
}

.my-custom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  border-color: #4b5563;
}

.my-custom-card .row.no-gutters {
  display: flex;
  flex-direction: row;
  margin: 0;
  width: 100%;
  height: 100%;
}

.my-custom-card .col-md-3 {
  display: flex;
  padding: 0 !important;
  align-items: stretch;
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  flex: 0 0 200px;
  height: 100%;
}

.my-custom-card .col-md-9 {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  height: 100%;
  overflow: hidden;
}

.card-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.card-title {
  font-size: 1.15rem;
  color: #f3f4f6;
  font-family: 'Inter', sans-serif;
  font-weight: 650;
  margin-bottom: 0.3rem;
  line-height: 1.2;
}

.my-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 8px 0 0 8px;
  display: block;
  background: #374151;
  margin: 0 !important;
  padding: 0 !important;
}

.card-body {
  padding: 1rem 1.2rem !important;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  position: relative;
  background: #1f2937;
  height: 100%;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.title-rating-wrapper {
  flex: 1;
  min-width: 0;
}

.star-rating-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
  flex-wrap: wrap;
}

.category-review-inline {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 400;
  margin-left: 0.3rem;
}

/* Green price styling - only in category line */
.category-review-inline ::v-deep(.price-green),
.category-review-inline :deep(.price-green) {
  color: #10b981 !important;
  font-weight: 600 !important;
}

/* Reviews Box Styling */
.reviews-box {
  background: linear-gradient(135deg, #1e293b 0%, #1a1f2e 100%);
  border-radius: 8px;
  padding: 1rem 1.1rem;
  border: 1px solid #374151;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.reviews-box .price-green {
  color: inherit;
  font-weight: inherit;
}

.reviews-header {
  font-size: 0.82rem;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-reviews-box {
  background: linear-gradient(135deg, #1e293b 0%, #1a1f2e 100%);
}

.no-reviews-text {
  font-size: 0.75rem;
  font-style: italic;
  margin: 0;
  color: #6b7280;
  text-align: left;
}

.card-text {
  color: #d1d5db;
  font-size: clamp(0.85rem, 1.3vw, 0.92rem);
  line-height: 1.55;
  margin-bottom: 0.7rem;
  font-weight: 400;
}

.star-rating {
  margin-bottom: 0.6rem;
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1em;
  color: #4b5563;
  margin-right: 1px;
}

.star.filled {
  color: #f59e0b;
  filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
}

.card-footer-row {
  margin-top: auto;
  width: 100%;
}

.category-review {
  color: #6b7280;
  font-size: clamp(0.8rem, 1.1vw, 0.85rem);
  margin-bottom: 0.7rem;
  font-weight: 400;
}

/* Inline Reviews Section */
.reviews-section-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1a1f2e;
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  border: 1px solid #374151;
  overflow: hidden;
}

.reviews-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
}

.marquee-container-inline {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.marquee-item-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-right: 1.5rem;
  white-space: nowrap;
}

.review-star-inline {
  font-size: 0.75rem;
  color: #4b5563;
}

.review-star-inline.filled {
  color: #f59e0b;
}

.review-text-inline {
  font-size: 0.78rem;
  color: #d1d5db;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  display: inline-block;
  white-space: nowrap;
}

.review-date-inline {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-left: 0.5rem;
  font-style: normal;
}

/* Compact button styling */
.btn-compact {
  padding: 0.45rem 0.7rem !important;
  font-size: 0.88rem !important;
  border-radius: 6px !important;
  flex-shrink: 0;
  min-width: auto;
}

.btn-compact i {
  font-size: 1.05rem;
}

.reviews-section {
  background: #1a1f2e;
  border-radius: 8px;
  padding: clamp(0.7rem, 1.2vw, 0.9rem);
  margin-top: 0.7rem;
  margin-bottom: 0.7rem;
  border: 1px solid #374151;
}

.reviews-title {
  font-size: clamp(0.85rem, 1.2vw, 0.9rem);
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 0.6rem;
  letter-spacing: -0.01em;
}

.marquee-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  background: #1f2937;
  border-radius: 6px;
  padding: 0.3rem 0;

}

.marquee {
  display: flex;
  width: max-content;
  gap: 0.3rem;
  animation: scroll 30s linear infinite;
  will-change: transform;
}

.marquee-container:hover .marquee {
  animation-play-state: paused;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

.marquee-item {
  flex: 0 0 auto;
  background: #2d3748;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: clamp(0.6rem, 1.1vw, 0.8rem);
  margin-right: 0.8rem;
  width: 200px;
  min-width: 160px;
  max-width: 95vw;
  transition: all 0.2s ease;
  box-sizing: border-box;    
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.marquee-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border-color: #4b5563;
  transform: translateY(-2px);
}

.review-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 0.5rem;
}

.review-star {
  font-size: clamp(0.85rem, 1.1vw, 0.9rem);
  color: #e5e7eb;
  transition: color 0.2s ease;
}

.review-star.filled {
  color: #f59e0b;
  filter: drop-shadow(0 1px 1px rgba(245, 158, 11, 0.25));
}

.review-text {
  margin: 0 0 0.5rem 0;
  font-size: clamp(0.78rem, 1.1vw, 0.85rem);
  color: #d1d5db;
  line-height: 1.5;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.review-date {
  font-size: clamp(0.7rem, 0.95vw, 0.75rem);
  color: #9ca3af;
  font-weight: 500;
}

.no-reviews {
  font-size: clamp(0.8rem, 1.1vw, 0.85rem);
  font-style: italic;
  margin: 0;
  color: #9ca3af;
  text-align: center;
  padding: 0.3rem 0;
}

.btn-outline-danger {
  background: transparent;
  border: 1.5px solid #ef4444;
  color: #ef4444;
  font-weight: 600;
  font-size: clamp(0.8rem, 1.2vw, 0.88rem);
  padding: clamp(0.4rem, 0.9vw, 0.5rem) clamp(1rem, 1.8vw, 1.2rem);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.05);
}

.btn-outline-danger:hover {
  background: #ef4444;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-danger {
  background: #ef4444;
  border: 1.5px solid #ef4444;
  color: #ffffff;
  font-weight: 600;
  font-size: clamp(0.8rem, 1.2vw, 0.88rem);
  padding: clamp(0.4rem, 0.9vw, 0.5rem) clamp(1rem, 1.8vw, 1.2rem);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
}

#logoutModal .modal-content {
  border-radius: 12px;
}

#logoutModal .btn-dark {
  background-color: #222;
  border: none;
}

#logoutModal .btn-dark:hover {
  background-color: #444;
}

@media (min-width: 992px) and (max-width: 1199px) {
  .my-custom-card {
    max-width: 950px;
    height: 200px;
    min-height: 200px;
    max-height: 200px;
  }
  
  .my-custom-card .col-md-2 {
    flex: 0 0 160px;
    max-width: 160px;
    width: 160px;
  }

  .my-custom-card .col-md-10 {
    flex: 1;
    max-width: calc(100% - 160px);
  }

  .my-custom-card .col-md-3 {
    width: 160px;
    min-width: 160px;
    max-width: 160px;
    flex: 0 0 160px;
    height: 100%;
  }

  .card-image-container {
    height: 100%;
  }

  .my-card-img {
    width: 100%;
    height: 100%;
  }

  .card-body {
    padding: 0.9rem 1.1rem !important;
  }
}

@media (min-width: 768px) and (max-width: 992px) {
  .my-custom-card {
    max-width: 720px;
    height: 180px;
    min-height: 180px;
    max-height: 180px;
  }
  
  .my-custom-card .col-md-2 {
    flex: 0 0 150px;
    max-width: 150px;
    width: 150px;
  }

  .my-custom-card .col-md-10 {
    flex: 1;
    max-width: calc(100% - 150px);
  }

  .my-custom-card .col-md-3 {
    width: 150px;
    min-width: 150px;
    max-width: 150px;
    flex: 0 0 150px;
    height: 100%;
  }

  .card-image-container {
    height: 100%;
  }
  
  .my-card-img {
    width: 100%;
    height: 100%;
  }
  
  .card-body {
    padding: 0.85rem 1rem !important;
  }
}

@media (max-width: 768px) {
  .my-custom-card {
    margin-bottom: 0.4rem;
    max-width: 100%;
    border-radius: 10px;
    height: auto;
    min-height: auto;
    max-height: none;
  }

  .my-custom-card .row.no-gutters {
    flex-direction: column !important;
    height: auto;
  }

  .my-custom-card .col-md-3 {
    flex: 0 0 auto !important;
    max-width: 100% !important;
    width: 100% !important;
    min-width: 100% !important;
    height: 180px !important;
  }

  .my-custom-card .col-md-10 {
    flex: 1 !important;
    max-width: 100% !important;
  }

  .my-custom-card .col-md-9 {
    flex: 1 !important;
    max-width: 100% !important;
    overflow: visible !important;
  }

  .card-image-container {
    height: 100% !important;
  }

  .my-card-img {
    width: 100%;
    height: 100%;
    border-radius: 10px 10px 0 0 !important;
  }

  .my-card-img {
    width: 100%;
    height: 100%;
  }

  .card-body {
    padding: 0.85rem 0.95rem !important;
  }

  .card-title {
    font-size: 1.05rem;
    margin-bottom: 0.25rem;
  }

  .star {
    font-size: 0.9em;
  }

  .category-review-inline {
    font-size: 0.72rem;
  }

  .reviews-section-inline {
    padding: 0.4rem 0.6rem;
  }

  .reviews-label {
    font-size: 0.72rem;
  }

  .review-text-inline {
    font-size: 0.72rem;
    max-width: 200px;
  }

  .btn-compact {
    padding: 0.4rem 0.6rem !important;
    font-size: 0.82rem !important;
  }

  .btn-compact i {
    font-size: 0.95rem;
  }
}

@media (max-width: 575px) {
  .my-custom-card {
    margin-bottom: 0.4rem;
    border-radius: 8px;
    height: auto;
    min-height: auto;
    max-height: none;
  }

  .my-custom-card .row.no-gutters {
    height: auto;
    flex-direction: column !important;
  }
  
  .my-custom-card .col-md-3 {
    flex: 0 0 auto !important;
    max-width: 100% !important;
    width: 100% !important;
    min-width: 100% !important;
    height: 160px !important;
  }

  .my-custom-card .col-md-10 {
    flex: 1 !important;
    max-width: 100% !important;
  }

  .my-custom-card .col-md-9 {
    flex: 1 !important;
    max-width: 100% !important;
    overflow: visible !important;
  }

  .card-image-container {
    height: 100% !important;
  }
  
  .my-card-img {
    width: 100%;
    height: 100%;
    border-radius: 8px 8px 0 0 !important;
  }
  
  .card-body {
    padding: 0.75rem 0.85rem !important;
  }
  
  .card-title {
    font-size: 1rem;
  }

  .star {
    font-size: 0.88em;
  }

  .category-review-inline {
    font-size: 0.68rem;
  }
  
  .reviews-section-inline {
    padding: 0.35rem 0.5rem;
  }

  .reviews-label {
    font-size: 0.68rem;
  }
  
  .review-text-inline {
    font-size: 0.68rem;
    max-width: 150px;
  }

  .btn-compact {
    padding: 0.38rem 0.55rem !important;
    font-size: 0.78rem !important;
  }

  .btn-compact i {
    font-size: 0.9rem;
  }
}

#myBtn {
  position: fixed;
  bottom: 20px;
  right: 30px;
  z-index: 99;
  outline: none;
  color: #ffffff;
  cursor: pointer;
  padding: 15px;
  border-radius: 22px;
  font-size: 18px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  border: 1.5px solid #60a5fa;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#myBtn:hover, #myBtn:focus {
  border-color: #3b82f6;
  color: #ffffff;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 6px 20px rgba(96, 165, 250, 0.5);
  transform: translateY(-2px);
}

/* Emoji Tooltip Styles */
.emoji-tooltip {
  position: fixed;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 12px;
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  max-width: 280px;
  min-width: 200px;
  border: 2px solid #42a5f5;
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
  color: #64b5f6;
  border-bottom: 1px solid rgba(100, 181, 246, 0.3);
  padding-bottom: 4px;
}

.tooltip-rating {
  font-size: 12px;
  margin-bottom: 6px;
  color: #ffd700;
  font-weight: 600;
}

.tooltip-review {
  font-size: 11px;
  line-height: 1.4;
  color: #ecf0f1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-style: italic;
  margin-bottom: 6px;
}

.tooltip-emotion {
  font-size: 12px;
  color: #a8dadc;
  font-weight: 600;
  text-transform: capitalize;
  padding-top: 4px;
  border-top: 1px solid rgba(168, 218, 220, 0.3);
}
</style>

