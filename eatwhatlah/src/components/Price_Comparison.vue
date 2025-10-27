<script>
import databaseFunctions from '../services/databaseFunctions';
import { getAuth, signOut } from "firebase/auth";

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
document.head.appendChild(link);

const link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = 'https://cdn.lineicons.com/4.0/lineicons.css';
document.head.appendChild(link2);

const link3 = document.createElement('link');
link3.rel = 'stylesheet';
link3.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
document.head.appendChild(link3);

const link4 = document.createElement('link');
link4.rel = 'stylesheet';
link4.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css';
document.head.appendChild(link4);

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js';
script.integrity = 'sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI';
script.crossOrigin = 'anonymous';
document.head.appendChild(script);

export default {
  data() {
    return {
      selectedRange: 'All',
      restaurants: [],
      loading: true,
      error: null,
      ranges: [
        { label: 'All', min: 0, max: Infinity },
        { label: '$', min: 0, max: 1 },
        { label: '$$', min: 1, max: 2 },
        { label: '$$$', min: 2, max: 3 },
        { label: '$$$$', min: 3, max: Infinity },
      ],
    }    
  }, 

  computed: {
    filteredRestaurants() {
      if (this.selectedRange === "All") return this.restaurants;

      const selected = this.ranges.find(r => r.label === this.selectedRange);
      const min = selected ? selected.min : 0;
      const max = selected ? selected.max : Infinity;

      return this.restaurants.filter(restaurant => {
        const priceLevel = restaurant.price_level;
        if (priceLevel == null) return true;
        return priceLevel >= min && priceLevel < max;
      });
    },
  },
  
  mounted() {
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
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const position = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };

          await this.fetchNearbyRestaurants(position);
        },
        (error) => {
          console.error("Geolocation error:", error);
          this.error = "Unable to get your location. Please enable location services.";
          this.loading = false;
        }
      );
    } else {
      this.error = "Geolocation is not supported by your browser.";
      this.loading = false;
    }
  },

  methods: {
    async fetchNearbyRestaurants(position) {
      try {
        const { Map } = await google.maps.importLibrary("maps");
        
        const mapDiv = document.createElement('div');
        const map = new Map(mapDiv, {
          center: position,
          zoom: 15
        });

        const service = new google.maps.places.PlacesService(map);

        const request = {
          location: position,
          radius: 500,
          type: 'restaurant',
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`Found ${results.length} nearby restaurants`);

            this.restaurants = results.map((place) => ({
              id: place.place_id,
              name: place.name,
              cuisine: place.types?.[0]?.replace(/_/g, ' ') || 'Restaurant',
              priceRange: this.formatPriceRange(place.price_level),
              price_level: place.price_level,
              rating: place.rating || 0,
              location: place.vicinity || 'Address not available',
              phone: place.formatted_phone_number || 'N/A',
              hours: this.formatHours(place.opening_hours),
              image: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || 
                     'https://via.placeholder.com/400x300?text=No+Image',
              user_ratings_total: place.user_ratings_total || 0
            }));

            this.loading = false;
          } else {
            console.error('Places search failed:', status);
            this.error = "Failed to load restaurants. Please try again.";
            this.loading = false;
          }
        });
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        this.error = "An error occurred while loading restaurants.";
        this.loading = false;
      }
    },

    formatPriceRange(priceLevel) {
      if (priceLevel == null) return 'N/A';
      const priceMap = {
        0: '$',
        1: '$',
        2: '$$',
        3: '$$$',
        4: '$$$$'
      };
      return priceMap[priceLevel] || 'N/A';
    },

    formatHours(openingHours) {
      if (!openingHours || !openingHours.weekday_text) return null;
      
      const daysMap = {
        'Monday': openingHours.weekday_text[0],
        'Tuesday': openingHours.weekday_text[1],
        'Wednesday': openingHours.weekday_text[2],
        'Thursday': openingHours.weekday_text[3],
        'Friday': openingHours.weekday_text[4],
        'Saturday': openingHours.weekday_text[5],
        'Sunday': openingHours.weekday_text[6]
      };

      const formatted = {};
      for (const [day, text] of Object.entries(daysMap)) {
        formatted[day] = text.replace(/^[^:]+:\s*/, '');
      }
      return formatted;
    },

    getPriceRangeDisplay(priceRange) {
      const map = {
        "$": "$0 - $10",
        "$$": "$10 - $25",
        "$$$": "$25 - $50",
        "$$$$": "$50+"
      };
      return map[priceRange] || priceRange;
    },

    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("❌ Failed to sign out. Please try again.");
      }
    },

    async confirmLogout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("❌ Failed to sign out. Please try again.");
      }
    },

    renderStars(rating) {
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
      const stars = [];

      for (let i = 0; i < fullStars; i++) {
        stars.push('<i class="fas fa-star text-warning"></i>');
      }
      if (halfStar) {
        stars.push('<i class="fas fa-star-half-alt text-warning"></i>');
      }
      for (let i = 0; i < emptyStars; i++) {
        stars.push('<i class="far fa-star text-warning"></i>');
      }

      return stars.join(" ");
    }
  }
}
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
        <button
          id="navbar-item"
          type="button"
          data-bs-toggle="modal"
          data-bs-target="#logoutModal"
        >
          <i class="lni lni-exit"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">Logout</a>
        </div>
      </div>

    </aside>
    <div class="main p-3">
      <div class="container-fluid mt-4">
        <div class="text-center mb-5">
          <h1 class="fw-bold display-5 text-white">Price Comparison</h1>
          <p class="text-muted">Filter restaurants by price and explore your options</p>
          <hr class="w-25 mx-auto opacity-50" />
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6 text-white">
            <label for="priceRange">Select Price Range: </label> 
            <select v-model="selectedRange" id="priceRange" class="form-control w-50">
              <option v-for="range in ranges" :key="range.label" :value="range.label">
                {{ range.label }}
              </option>
            </select>
          </div>
          <div class="col-md-6 text-white text-md-end">
            <p class="mb-0">Found <strong>{{ filteredRestaurants.length }}</strong> restaurants</p>
          </div>
        </div>

        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <p class="mt-3 text-white">Loading nearby restaurants...</p>
        </div>

        <div v-else>
          <div v-if="filteredRestaurants.length" class="row">
            <div v-for="restaurant in filteredRestaurants"
            :key="restaurant.id"
            class="col-md-4 mb-4">
              <div class="card shadow h-100">
                <img 
                  v-if="restaurant.image"
                  :src="restaurant.image" 
                  class="card-img-top"
                  alt="Restaurant image"
                  style="height: 180px; object-fit: cover;">
                <div class="card-body">
                  <!-- Restaurant name + price on same line -->
                  <h5 class="card-title d-flex align-items-center justify-content-between">
                    <span>{{ restaurant.name }}</span>
                    <small class="text-muted">
                      <strong>{{ restaurant.priceRange }}</strong>
                      <span class="text-secondary small"> ({{ getPriceRangeDisplay(restaurant.priceRange) }})</span>
                    </small>
                  </h5>

                  <!-- cuisine + rating -->
                  <div class="d-flex align-items-center mb-2 flex-wrap">
                    <!-- Cuisine -->
                    <span 
                      v-if="restaurant.cuisine" 
                      class="text-muted small d-flex align-items-center text-capitalize"
                    >
                      <i class="fas fa-utensils me-2"></i> {{ restaurant.cuisine }}
                    </span>
                    
                    <!-- Stars -->
                    <span v-html="renderStars(restaurant.rating || 0)" class="ms-auto"></span>
                  </div>

                  <!-- Location -->
                  <p v-if="restaurant.location" class="text-muted small mb-1">
                    <i class="fas fa-map-marker-alt me-1"></i> {{ restaurant.location }}
                  </p>

                  <!-- Phone -->
                  <p v-if="restaurant.phone && restaurant.phone !== 'N/A'" class="text-muted small mb-1">
                    <i class="fas fa-phone me-1"></i> {{ restaurant.phone }}
                  </p>

                  <!-- Hours -->
                  <div v-if="restaurant.hours" class="text-muted small mb-2">
                    <i class="fas fa-clock me-1"></i>
                    <ul class="list-unstyled ms-3 mb-0">
                      <li v-for="(h, day) in restaurant.hours" :key="day">{{ day }}: {{ h }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-dark">
            No restaurants found in the selected price range. Try selecting "All" or a different range.
          </div>
        </div>

      </div>

      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>

    </div>
  </div>

  <!-- Logout Confirmation Modal -->
  <div
    class="modal fade"
    id="logoutModal"
    tabindex="-1"
    aria-labelledby="logoutModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-3 border-0 shadow-lg rounded">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold" id="logoutModalLabel">
            Confirm Logout
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body text-center">
          <i class="bi bi-box-arrow-right fs-1 text-danger mb-3"></i>
          <p class="mb-0 fs-5">Are you sure you want to log out?</p>
        </div>

        <div class="modal-footer border-0 d-flex justify-content-center gap-3">
          <button
            type="button"
            class="btn btn-secondary px-4"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-dark px-4"
            @click="confirmLogout"
            data-bs-dismiss="modal"
          >
            Yes, Log Out
          </button>
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

#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100% - 260px);
}

#toggle-btn, #navbar-item {
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

#toggle-btn:hover, #navbar-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

#toggle-btn i, #navbar-item i {
  font-size: 1.4rem;
  color: #e8eaed;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo a, .item-logo a {
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

.sidebar-logo, .item-logo {
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

.main{ 
  min-height: 100vh;
  transition: margin-left 0.25s, width 0.25s;
  margin-left: 70px;
  background: 
  radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
  #0a0a0f;
  overflow: hidden;
  width: calc(100vw - 70px);
  display: flex;
  flex-direction: column;
}

#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

.card-body .fa-utensils {
  font-size: 0.90rem;
}

.card-body .text-muted.small {
  font-size: 1.0rem;
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

</style>
