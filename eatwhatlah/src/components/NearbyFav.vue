<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router"; // ✅ Works only in <script setup>
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import databaseFunctions from "../services/databaseFunctions";
import placeholderImg from '../assets/placeholder.webp';
import Sidebar from './subcomponents/Sidebar.vue';

let map;
let markers = [];

const router = useRouter(); // ✅ Create router instance

// Static list of restaurants (replace or extend as needed)
const restaurants = ref([]);

// Reactive favorites Map (key: place_id, value: restaurant data)
const favorites = ref(new Map());

// Reactive reviews Map (key: restaurantName, value: array of reviews)
const restaurantReviews = ref(new Map());

const restaurantEmotions = ref(new Map());

// Current filter: "nearby" or "favorites"
const filter = ref("nearby");

// Price filter: "All", "$", "$$", or "$$$"
const priceFilter = ref("All");

// Current user ID
const currentUserId = ref(null);

// Firebase auth unsubscribe function
let authUnsubscribe = null;

// Firebase favorites listener unsubscribe function
let favoritesUnsubscribe = null;

// Helper function to format restaurant type
function formatRestaurantType(type) {
  if (!type) return 'Restaurant';

  // Convert meal_takeaway to Restaurant
  if (type === 'meal_takeaway') return 'Restaurant';

  // Remove underscores and capitalize each word
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Computed list of restaurants to display based on filter
const displayedRestaurants = computed(() => {
  let restaurantList = [];

  if (filter.value === "favorites") {
    // Convert favorites Map to array format matching restaurants structure
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

  // Filter by price if a specific price is selected
  if (priceFilter.value !== "All") {
    restaurantList = restaurantList.filter(r => r.priceLevel === priceFilter.value);
  }

  // Load reviews for each restaurant
  restaurantList.forEach(restaurant => {
    loadReviewsForRestaurant(restaurant.title);
  });

  return restaurantList;
});


// Load reviews for a specific restaurant
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

// Get reviews for a specific restaurant
function getRestaurantReviews(restaurantName) {
  return restaurantReviews.value.get(restaurantName) || [];
}

// Format timestamp to readable date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Navigate to restaurant detail page
function viewRestaurantDetail(restaurant) {
  // Encode restaurant data as URL parameter
  const restaurantData = encodeURIComponent(JSON.stringify(restaurant));
  router.push({
    path: '/RestaurantDetail/',
    query: { data: restaurantData }
  });
}

// Toggle favorite status by restaurant
async function toggleFavorite(restaurantId) {
  if (!currentUserId.value) {
    console.error("User not authenticated");
    alert("Please log in to add favorites");
    return;
  }

  // Find the restaurant data
  const restaurant = restaurants.value.find(r => r.id === restaurantId || r.place_id === restaurantId);
  if (!restaurant) {
    console.error("Restaurant not found");
    return;
  }

  const placeId = restaurant.place_id || restaurantId;

  try {
    if (favorites.value.has(placeId)) {
      // Remove from favorites
      await databaseFunctions.removeFavorite(currentUserId.value, placeId);
      console.log("Removed from favorites");
    } else {
      // Add to favorites
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

// Change filter when filter buttons clicked
function setFilter(value) {
  filter.value = value;
}

// Change price filter
function setPriceFilter(value) {
  priceFilter.value = value;
}


// Initialize Firebase Auth listener
function initializeAuth() {
  const auth = getAuth();
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId.value = user.uid;
      console.log("User authenticated:", user.uid);
      // Load user's favorites
      loadFavorites();
    } else {
      currentUserId.value = null;
      favorites.value.clear();
      console.log("User not authenticated");
    }
  });
}

// Load user's favorites from Firebase
function loadFavorites() {
  if (!currentUserId.value) return;

  // Set up real-time listener for favorites
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

// Check if a restaurant is favorited
function isFavorited(restaurantId) {
  const restaurant = restaurants.value.find(r => r.id === restaurantId || r.place_id === restaurantId);
  if (!restaurant) return false;
  const placeId = restaurant.place_id || restaurantId;
  return favorites.value.has(placeId);
}

// Loading emojis from Firebase
function loadAllEmotions(hoursAgo = 1) {
  databaseFunctions.getAllEmotions((snapshot) => {
    const data = snapshot.val();
    if (!data) {
      console.log("No emotion data found");
      return;
    }

    // Clear existing counts
    restaurantEmotions.value.clear();

    // Calculate the cutoff timestamp (e.g., 1 hour ago)
    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);

    // Process emotions and associate with restaurants
    Object.entries(data).forEach((userData) => {
      if (!userData || !userData.emotion || !userData.lat || !userData.lng) {
        return;
      }

      // Filter by timestamp - only count emotions from the last X hours
      if (!userData.timestamp || userData.timestamp < cutoffTime) {
        return; // Skip old emotions
      }

      const emotionLocation = { lat: userData.lat, lng: userData.lng };
      
      restaurants.value.forEach(restaurant => {
        const distance = calculateDistanceInMeters(
          emotionLocation,
          { lat: restaurant.lat, lng: restaurant.lng }
        );

        // If emotion is within 50 meters of restaurant, count it
        if (distance < 50) {
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
          if (counts[userData.emotion] !== undefined) {
            counts[userData.emotion]++;
          }
        }
      });
    });

    console.log(`Loaded emotion counts for restaurants (last ${hoursAgo} hours(s))`);
  });
}

// Calculate distance between two points in meters
function calculateDistanceInMeters(pos1, pos2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Handle image load error
function handleImageError(event) {
  event.target.src = placeholderImg;
  event.target.onerror = null;
}



onMounted(() => {
  // Initialize Firebase Auth
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

      // Create InfoWindow instance
      const infoWindow = new InfoWindow();

      // Marker for user location
      new AdvancedMarkerElement({
        map,
        position,
        title: "You are here!",
      });

      // Places service instance
      const service = new google.maps.places.PlacesService(map);

      // Function to search for nearby restaurants
      function searchNearbyRestaurants() {
        const request = {
          location: position,
          radius: 500,
          type: 'restaurant',
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`Found ${results.length} nearby restaurants`);

            // Clear existing restaurant markers (keep user location marker)
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            // Update the restaurants array with real restaurant data
            restaurants.value = results.map((place, index) => {
              const restaurantType = place.types?.[0] || 'restaurant';
              const priceLevel = getPriceLevel(place.price_level);

              return {
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
                priceLevel: priceLevel
              };
            });

            // Create markers for each restaurant
            results.forEach((place) => {
              if (place.geometry && place.geometry.location) {
                const pin = new PinElement({
                  background: "#FF5722",
                  borderColor: "#D84315",
                  glyphColor: "#FFFFFF",
                  scale: 1.1
                });

                const marker = new AdvancedMarkerElement({
                  map,
                  position: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  },
                  title: place.name,
                  content: pin.element,
                  gmpClickable: true
                });

                marker.addListener('click', () => {
                  infoWindow.close();

                  // Get emoji counts for this restaurant
                  const restaurantKey = `${place.geometry.location.lat()}_${place.geometry.location.lng()}`;
                  const emotionCounts = restaurantEmotions.value.get(restaurantKey) || {
                    delicious: 0,
                    meh: 0,
                    disappointing: 0,
                    crowded: 0,
                    longWait: 0
                  };

                  // Emoji icons to display
                  const emotionIcons = {
                    delicious: "😋",
                    meh: "😐",
                    disappointing: "🤢",
                    crowded: "👥",
                    longWait: "⏳"
                  };

                  // Build emotion counts HTML
                  let emotionCountsHTML = '';
                  const totalEmotions = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
                  
                  if (totalEmotions > 0) {
                    emotionCountsHTML = `
                      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                          ${Object.entries(emotionCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([emotion, count]) => `
                              <div style="display: flex; align-items: center; gap: 4px; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                                <span style="font-size: 16px;">${emotionIcons[emotion]}</span>
                                <span style="font-weight: 600; color: #1f2937;">${count}</span>
                              </div>
                            `).join('')}
                        </div>
                      </div>
                    `;
                  }

                  const content = `
                    <div style="padding: 12px; max-width: 280px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                        ${place.name}
                      </h3>
                      ${place.rating ? `
                        <div style="margin-bottom: 6px;">
                          <span style="color: #f59e0b; font-size: 14px;">${'★'.repeat(Math.round(place.rating))}${'☆'.repeat(5 - Math.round(place.rating))}</span>
                          <span style="color: #6b7280; font-size: 13px; margin-left: 4px;">${place.rating} (${place.user_ratings_total || 0} reviews)</span>
                        </div>
                      ` : ''}
                      <div style="color: #4b5563; font-size: 13px; line-height: 1.5; margin-bottom: 6px;">
                        ${place.vicinity || 'Address not available'}
                      </div>
                      ${place.opening_hours ? `
                        <div style="color: ${place.opening_hours.open_now ? '#10b981' : '#ef4444'}; font-size: 12px; font-weight: 600;">
                          ${place.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
                        </div>
                      ` : ''}
                      ${place.price_level ? `
                        <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
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
          } else {
            console.error('Places search failed:', status);
          }
        });
      }

      // Helper function to convert price level to symbols
      function getPriceLevel(level) {
        if (!level) return '$$';
        return '$'.repeat(level);
      }

      // Helper function to calculate distance
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

      // Clear all markers
      function clearMarkers() {
        markers.forEach(marker => marker.setMap(null));
        markers = [];
      }

      // Search places by text query
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

      // Automatically search for nearby restaurants when map loads
      searchNearbyRestaurants();

      // Hook search input keypress "Enter" event to searchPlaces
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

// Cleanup listeners on component unmount
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
  <!-- NAVBAR -->
  <div class="wrapper">
    <Sidebar />
    <!-- SEARCH BAR -->
    <div class="main p-3">
      <div class="container">
        <!-- Search -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="search-container">
              <input type="text" class="form-control search-input" placeholder="  Search Places" />
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>
        </div>

        <!-- Map -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="map-container">
              <div id="map"></div>
            </div>
          </div>
        </div>

        <!-- Filter buttons -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="buttonfilter-container">
              <div id="buttonfilter" class="d-flex justify-content-center gap-2 align-items-center flex-wrap">
                <button type="button" class="btn" :class="[
                  filter === 'nearby' ? 'btn-primary btn-active' : 'btn-secondary'
                ]" @click="setFilter('nearby')">
                  Near By
                </button>
                <button type="button" class="btn" :class="[
                  filter === 'favorites' ? 'btn-primary btn-active' : 'btn-secondary'
                ]" @click="setFilter('favorites')">
                  Favourites
                </button>

                <!-- Price Filter Select -->
                <select v-model="priceFilter" class="price-filter-select custom-select">
                  <option value="All">All Prices</option>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>
              </div>
            </div>
          </div>
        </div>


        <!-- Restaurants list -->
        <div v-for="restaurant in displayedRestaurants" :key="restaurant.id" class="card mb-3 my-custom-card mt-5">
          <div class="row no-gutters align-items-center flex-md-row flex-column">
            <div class="col-md-3 col-12 d-flex align-items-center justify-content-center">
              <img :src="restaurant.img" class="card-img my-card-img" @error="handleImageError" />
            </div>
            <div class="col-md-9 col-12">
              <div class="card-body p-4 position-relative">
                <h5 class="card-title">{{ restaurant.title }}</h5>
                <p class="card-text" v-html="restaurant.description"></p>
                <div class="star-rating">
                  <span v-for="n in 5" :key="n" class="star"
                    :class="n <= restaurant.stars ? 'filled' : ''">&#9733;</span>
                </div>
                <div class="card-footer-row">
                  <div class="w-100">
                    <div class="category-review text-muted mb-3">{{ restaurant.category }}</div>

                    <!-- Reviews Marquee Section -->
                    <div class="reviews-section" v-if="getRestaurantReviews(restaurant.title).length > 0">
                      <h6 class="reviews-title">Recent Reviews</h6>
                      <div class="marquee-container">
                        <div class="marquee">
                          <!-- First set of reviews -->
                          <div v-for="review in getRestaurantReviews(restaurant.title)" :key="'first-' + review.id"
                            class="marquee-item">
                            <div class="review-stars">
                              <span v-for="n in 5" :key="n" class="review-star"
                                :class="n <= review.rating ? 'filled' : ''">★</span>
                            </div>
                            <p class="review-text">{{ review.reviewText }}</p>
                            <span class="review-date">{{ formatDate(review.timestamp) }}</span>
                          </div>
                          <!-- Duplicate set for seamless loop -->
                          <div v-for="review in getRestaurantReviews(restaurant.title)" :key="'second-' + review.id"
                            class="marquee-item">
                            <div class="review-stars">
                              <span v-for="n in 5" :key="n" class="review-star"
                                :class="n <= review.rating ? 'filled' : ''">★</span>
                            </div>
                            <p class="review-text">{{ review.reviewText }}</p>
                            <span class="review-date">{{ formatDate(review.timestamp) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="reviews-section">
                      <p class="no-reviews">No reviews yet. Be the first to review!</p>
                    </div>

                    <button type="button" class="btn mt-3"
                      :class="isFavorited(restaurant.id) ? 'btn-danger' : 'btn-outline-danger'"
                      @click="toggleFavorite(restaurant.id)">
                      <i class="bi bi-heart"></i>
                      {{ isFavorited(restaurant.id) ? 'Remove from Favourites' : 'Add to Favourites' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.wrapper {
  display: flex;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

a {
  text-decoration: none !important;
}

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}

/* Main - Enhanced Gradient */
.main {
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(187, 222, 251, 0.3) 0%, transparent 50%),
    linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
  margin-left: 72px;
  padding: 2.8rem 2.2rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Search - Elevated */
.search-container {
  position: relative;
  max-width: 680px;
  margin: 0 auto 2.2rem auto;
}

.search-input {
  height: 52px;
  border-radius: 10px;
  padding-left: 52px;
  border: 1.5px solid #d3dce6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03);
  font-size: 1.02rem;
  font-weight: 400;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  border-color: #6b7280;
  box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.08);
  outline: none;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 19px;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 1.15rem;
  pointer-events: none;
}

/* Map - Refined Shadow */
.map-container {
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.08);
  background: #fff;
  margin-top: 1.8rem;
  border: 1px solid #e5e7eb;
}

#map {
  height: 480px;
  width: 100%;
}

/* Filter Buttons - Corporate */
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
  border: 1.5px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  letter-spacing: 0.01em;
}

.btn-active {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%) !important;
  color: #fff !important;
  font-weight: 700;
  border: 2.5px solid #42a5f5 !important;
  box-shadow: 0 2px 14px rgba(66, 165, 245, 0.35);
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
  border: 1.5px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  letter-spacing: 0.01em;
  outline: none;
}

.price-filter-select:focus {
  border-color: #42a5f5;
  box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.1);
}  

.price-filter-select option {
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
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

.price-filter-select {
  min-width: 160px; 
  position: relative;
  z-index: 2;
}





/* Cards - Premium */
.my-custom-card {
  background: linear-gradient(105deg, #fbfcff 70%, #eaf1fd 100%);
  box-shadow: 0 6px 32px rgba(41, 111, 165, 0.11);
  border-radius: 20px;
  border:none;
  margin-bottom: 2.5rem;
  padding: 2rem 2.7rem;
  transition: box-shadow 0.23s, transform 0.18s;
}

.my-custom-card:hover {
  transform: translateY(-7px) scale(1.03);
  box-shadow: 0 24px 56px rgba(41, 111, 165, 0.22);
}


.card-title {
  font-size: 1.68rem;
  color: #18325d;
  font-family: 'Inter', sans-serif;
  font-weight: 650;
  margin-bottom: 0.8rem;
}


.my-card-img {
  height: 300px;
  width: 240px;
  object-fit: cover;
  border-radius: 14px;
  display: block;
  box-shadow: 0 2px 8px rgba(41, 111, 165, 0.07);
  background: #f3f4f6;
  margin: 0 !important;
  padding: 0 !important;

}

.card-body {
  padding: 2.2rem 2.4rem;
  min-height: 230px;
  position: relative;
  border-radius: 14px;
}


.card-text {
  color: #374151;
  font-size: 1.02rem;
  line-height: 1.65;
  margin-bottom: 1.2rem;
  font-weight: 400;
}

.star-rating {
  margin-bottom: 1rem;
}

.star {
  font-size: 1.35em;
  color: #e5e7eb;
  margin-right: 2px;
}

.star.filled {
  color: #f59e0b;
  filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
}

.card-footer-row {
  margin-top: 1.6rem;
}

.category-review {
  color: #6b7280;
  font-size: 0.92rem;
  margin-bottom: 0.25rem;
  font-weight: 400;
}




/* Reviews Section Styles */
.reviews-section {
  background: #f9fafb;
  border-radius: 10px;
  padding: 1.2rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.reviews-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

/* Marquee Container */
.marquee-container {
  overflow: hidden;
  position: relative;
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  padding: 0.5rem 0;
}

/* Marquee Wrapper */
.marquee {
  display: flex;
  animation: scroll 30s linear infinite;
  will-change: transform;
}

/* Pause animation on hover */
.marquee-container:hover .marquee {
  animation-play-state: paused;
}

/* Marquee Animation */
@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

/* Individual Review Items in Marquee */
.marquee-item {
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.2rem;
  margin-right: 1rem;
  min-width: 280px;
  max-width: 280px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.marquee-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.review-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 0.6rem;
}

.review-star {
  font-size: 1rem;
  color: #e5e7eb;
  transition: color 0.2s ease;
}

.review-star.filled {
  color: #f59e0b;
  filter: drop-shadow(0 1px 1px rgba(245, 158, 11, 0.25));
}

.review-text {
  margin: 0 0 0.6rem 0;
  font-size: 0.92rem;
  color: #4b5563;
  line-height: 1.6;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.review-date {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 500;
}

.no-reviews {
  font-size: 0.9rem;
  font-style: italic;
  margin: 0;
  color: #9ca3af;
  text-align: center;
  padding: 0.5rem 0;
}

/* Favorite Buttons - Refined */
.btn-outline-danger {
  background: transparent;
  border: 1.5px solid #ef4444;
  color: #ef4444;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.55rem 1.3rem;
  border-radius: 9px;
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
  font-size: 0.95rem;
  padding: 0.55rem 1.3rem;
  border-radius: 9px;
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

/* Responsive */
@media (max-width: 768px) {
  .main {
    padding: 1.6rem 1.2rem;
    margin-left: 72px;
  }

  .my-custom-card .row.no-gutters {
    flex-direction: column !important;
  }

  .my-card-img {
    height: 190px;
  }

  .card-body {
    padding: 1.6rem;
  }

  .card-footer-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  #buttonfilter {
    flex-direction: column;
    width: 100%;
  }

  #buttonfilter .btn {
    width: 100%;
  }

  .reviews-section {
    padding: 1rem;
  }

  .marquee-item {
    min-width: 240px;
    max-width: 240px;
    padding: 0.85rem 1rem;
  }

  /* Faster animation on mobile for better UX */
  .marquee {
    animation-duration: 20s;
  }


}
</style>
