<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import databaseFunctions from "../services/databaseFunctions";

let map;
let markers = [];

// Static list of restaurants (replace or extend as needed)
const restaurants = ref([]);

// Reactive favorites Map (key: place_id, value: restaurant data)
const favorites = ref(new Map());

// Current filter: "nearby" or "favorites"
const filter = ref("nearby");

// Current user ID
const currentUserId = ref(null);

// Firebase auth unsubscribe function
let authUnsubscribe = null;

// Firebase favorites listener unsubscribe function
let favoritesUnsubscribe = null;

// Computed list of restaurants to display based on filter
const displayedRestaurants = computed(() => {
  if (filter.value === "favorites") {
    // Convert favorites Map to array format matching restaurants structure
    return Array.from(favorites.value.values()).map((fav, index) => ({
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
      user_ratings_total: fav.user_ratings_total
    }));
  }
  return restaurants.value;
});

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
        user_ratings_total: restaurant.user_ratings_total
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

onMounted(() => {
  // Initialize Firebase Auth
  initializeAuth();

  const hamburger = document.querySelector("#toggle-btn");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const sidebar = document.querySelector("#sidebar");
      if (sidebar) sidebar.classList.toggle("expand");
    });
  }

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
            restaurants.value = results.map((place, index) => ({
              id: place.place_id,
              title: place.name,
              description: place.vicinity || 'No description available',
              category: `${place.types?.[0] || 'Restaurant'} . ${getPriceLevel(place.price_level)} . ${calculateDistance(position, place.geometry.location)} . ${place.user_ratings_total ? 'Popular' : 'New'}`,
              stars: Math.round(place.rating || 0),
              img: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || '../assets/logos/default.png',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              place_id: place.place_id,
              rating: place.rating,
              user_ratings_total: place.user_ratings_total
            }));

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
    <aside id="sidebar">
      <div class="d-flex align-items-center mb-3">
        <button id="toggle-btn" type="button">
          <i class="lni lni-grid-alt"></i>
        </button>
        <div class="sidebar-logo ml-2">
          <RouterLink to="/Home/">Home</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Profile/')">
          <i class="lni lni-user"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Profile/">Profile</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/NearbyFav/')">
          <i class="lni lni-heart"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/NearbyFav/">Favourites</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Map/')">
          <i class="lni lni-map"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Map/">Map</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Discounts/')">
          <i class="lni lni-ticket"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Discounts/">Discounts</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Price_Comparison/')">
          <i class="lni lni-dollar"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Price_Comparison/">Filter by Price</RouterLink>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="item d-flex align-items-center mt-auto mb-3">
        <button id="navbar-item" type="button" data-bs-toggle="modal" data-bs-target="#logoutModal">
          <i class="lni lni-exit"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">Logout</a>
        </div>
      </div>

    </aside>

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
              <div id="buttonfilter" class="d-flex justify-content-center gap-2">
                <button type="button" class="btn" :class="filter === 'nearby' ? 'btn-primary' : 'btn-secondary'"
                  @click="setFilter('nearby')">
                  Near By
                </button>
                <button type="button" class="btn" :class="filter === 'favorites' ? 'btn-primary' : 'btn-secondary'"
                  @click="setFilter('favorites')">
                  Favourites
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Restaurants list -->
        <div v-for="restaurant in displayedRestaurants" :key="restaurant.id" class="card mb-3 my-custom-card mt-5">
          <div class="row no-gutters align-items-center flex-md-row flex-column">
            <div class="col-md-3 col-12 d-flex align-items-center justify-content-center">
              <img :src="restaurant.img" class="card-img my-card-img" />
            </div>
            <div class="col-md-9 col-12">
              <div class="card-body p-4 position-relative">
                <h5 class="card-title">{{ restaurant.title }}</h5>
                <p class="card-text" v-html="restaurant.description"></p>
                <div class="star-rating">
                  <span v-for="n in 5" :key="n" class="star"
                    :class="n <= restaurant.stars ? 'filled' : ''">&#9733;</span>
                </div>
                <div class="card-footer-row d-flex justify-content-between align-items-center mt-2">
                  <div>
                    <div class="category-review text-muted">{{ restaurant.category }}</div>
                    <div class="review-line text-muted">Real time reviews: Have it loop through recent reviews</div>
                  </div>
                  <button type="button" class="btn"
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

/* Sidebar - Refined with Aligned Icons */
#sidebar {
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 72px;
  min-width: 72px;
  z-index: 1000;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1e3a5f 0%, #152d47 100%);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

#sidebar.expand {
  width: 260px;
  min-width: 260px;
}

#sidebar.expand~.main {
  margin-left: 260px;
  width: calc(100% - 260px);
}

#toggle-btn,
#navbar-item {
  background-color: transparent;
  cursor: pointer;
  border: 0;
  padding: 1rem 1.25rem;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 56px;
}

#toggle-btn:hover,
#navbar-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

#toggle-btn i,
#navbar-item i {
  font-size: 1.4rem;
  color: #e8eaed;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo a,
.item-logo a {
  color: #e8eaed;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

#sidebar:not(.expand) .sidebar-logo,
#sidebar:not(.expand) .item-logo {
  visibility: hidden;
  width: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  pointer-events: none;
  transition: visibility 0s linear 0.28s, width 0.28s ease;
}

.sidebar-logo,
.item-logo {
  transition: width 0.28s ease, visibility 0s linear 0s;
  white-space: nowrap;
}

.item {
  margin: 0.25rem 0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.item:hover {
  background-color: rgba(255, 255, 255, 0.08);
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
    radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
    #0a0a0f;
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

#buttonfilter button.btn-primary {
  background: #2d3748;
  color: #f9fafb;
  border-color: #2d3748;
  box-shadow: 0 2px 6px rgba(45, 55, 72, 0.2);
}

#buttonfilter button.btn-primary:hover {
  background: #1a202c;
  border-color: #1a202c;
  box-shadow: 0 4px 12px rgba(26, 32, 44, 0.25);
}

#buttonfilter button.btn-secondary {
  background: #f9fafb;
  color: #6b7280;
  border-color: #d1d5db;
}

#buttonfilter button.btn-secondary:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Cards - Premium */
.my-custom-card {
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(0, 0, 0, 0.08);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 960px;
  margin: 2.4rem auto;
}

.my-custom-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.08),
    0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #d1d5db;
}

.my-card-img {
  height: 210px;
  width: 100%;
  object-fit: cover;
  background: #f3f4f6;
}

.card-body {
  padding: 2.2rem 2.4rem;
  min-height: 230px;
  position: relative;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1.55rem;
  color: #111827;
  margin-bottom: 0.6rem;
  letter-spacing: -0.01em;
}

.card-text {
  color: #374151;
  font-size: 1.02rem;
  line-height: 1.65;
  margin-bottom: 1.2rem;
  font-weight: 400;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.6rem;
  flex-wrap: wrap;
  gap: 1.2rem;
}

.category-review,
.review-line {
  color: #6b7280;
  font-size: 0.92rem;
  margin-bottom: 0.25rem;
  font-weight: 400;
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
}
</style>
