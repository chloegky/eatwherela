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
        { label: '$', min: 0, max: 10 },
        { label: '$$', min: 10, max: 20 },     
        { label: '$$$', min: 20, max: 30 },    
        { label: '$$$$', min: 30, max: Infinity }, 
      ],
      priceMap: {
        "$": { min: 0, max: 10 },
        "$$": { min: 10, max: 20 },    
        "$$$": { min: 20, max: 30 },   
        "$$$$": { min: 30, max: Infinity } 
      }, 
      // store only ids in the UI, compute full objects below
      selectedIds: []
    }    
  }, 

  computed: {
    // keep existing filteredRestaurants computed (unchanged)
    filteredRestaurants() {
      if (this.selectedRange === "All") return this.restaurants;

      const selected = this.ranges.find(r => r.label === this.selectedRange);
      const min = selected ? selected.min : 0;
      const max = selected ? selected.max : Infinity;

      return this.restaurants.filter(restaurant => {
        const key = this.normalizePriceKey(restaurant.priceRange);
        const range = this.priceMap[key];
        // if unknown format include the restaurant (so it won't silently disappear)
        if (!range) return true;
        // use exclusive upper-bound comparison so adjacent ranges (e.g. $$ max 20 and $$$ min 20)
        // don't count as overlapping
        return !(range.max <= min || range.min >= max);
      });
    },

    // derive selected restaurant objects from ids so UI stays in sync
    selectedRestaurants() {
      return this.restaurants.filter(r => this.selectedIds.includes(r.id));
    }
  },
  
  // mounted() {
  //   const hamburger = document.querySelector("#toggle-btn");
  //   if (hamburger) {
  //     hamburger.addEventListener("click", function () {
  //       document.querySelector("#sidebar").classList.toggle("expand");
  //     });
  //   }

  //   // Fetch restaurants from the database when component is mounted
  //   databaseFunctions.getAllRestaurants((snapshot) => {
  //     if (snapshot.exists()) {
  //       const data = snapshot.val();
  //       this.restaurants = Object.keys(data).map((key) => ({
  //         id: key,
  //         ...data[key]
  //       }));
  //     } else {
  //       this.restaurants = [];
  //     }
  //     this.loading = false;
  //   });
  // },
  mounted() {
    // attach sidebar toggle reliably
    const hamburger = document.querySelector("#toggle-btn");
    if (hamburger) {
      hamburger.addEventListener("click", () => {
        const sidebar = document.querySelector("#sidebar");
        if (sidebar) sidebar.classList.toggle("expand");
      });
    }

    // 🔧 Mock Data for Testing
    this.restaurants = [
      {
        id: "1",
        name: "Pasta Palace",
        cuisine: "Italian",
        priceRange: "$$",
        rating: 4.2,
        location: "123 Main Street",
        phone: "(555) 123-4567",
        hours: {
          Monday: "10am - 9pm",
          Tuesday: "10am - 9pm",
          Wednesday: "10am - 9pm",
          Thursday: "10am - 9pm",
          Friday: "10am - 11pm",
          Saturday: "12pm - 11pm",
          Sunday: "Closed",
        },
        image: "https://source.unsplash.com/400x300/?pasta,restaurant"
      },
      {
        id: "2",
        name: "Sushi Central",
        cuisine: "Japanese",
        priceRange: "$$$",
        rating: 4.8,
        location: "456 Ocean Blvd",
        phone: "(555) 987-6543",
        hours: {
          Monday: "11am - 10pm",
          Tuesday: "11am - 10pm",
          Wednesday: "11am - 10pm",
          Thursday: "11am - 10pm",
          Friday: "11am - 11pm",
          Saturday: "12pm - 11pm",
          Sunday: "12pm - 8pm",
        },
        image: "https://source.unsplash.com/400x300/?sushi,restaurant"
      },
      {
        id: "3",
        name: "Burger Haven",
        cuisine: "American",
        priceRange: "$",
        rating: 3.9,
        location: "789 King Avenue",
        phone: "(555) 555-0000",
        hours: {
          Monday: "9am - 8pm",
          Tuesday: "9am - 8pm",
          Wednesday: "9am - 8pm",
          Thursday: "9am - 8pm",
          Friday: "9am - 9pm",
          Saturday: "10am - 9pm",
          Sunday: "10am - 7pm",
        },
        image: "https://source.unsplash.com/400x300/?burger,restaurant"
      }
    ];

    this.loading = false;
  },


  methods: {

    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/"); // redirect to login page
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

    // manage selection by id so checkboxes remain authoritative
    toggleSelect(restaurant, evt) {
      const id = restaurant.id;
      const checked = !!(evt && evt.target && evt.target.checked);

      // Defensive guard: don't allow selecting >3 (checkboxes are disabled in the UI)
      if (checked) {
        if (this.selectedIds.length >= 3) {
          return;
        }
        if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
        return;
      }
      // uncheck -> remove id
      const idx = this.selectedIds.indexOf(id);
      if (idx !== -1) this.selectedIds.splice(idx, 1);
    },
    
    normalizePriceKey(symbol) {
      if (symbol == null || symbol === '') return '';
      // numbers
      if (typeof symbol === 'number') {
        const n = symbol;
        if (n <= 10) return '$';
        if (n <= 20) return '$$';   
        if (n <= 30) return '$$$'; 
        return '$$$$';
      }

      const s = String(symbol).trim();

      // exact dollar-sign style like "$" / "$$"
      if (/^\${1,4}$/.test(s)) return s;

      // numeric string like "2" or "25.5"
      if (/^\d+(\.\d+)?$/.test(s)) {
        const n = parseFloat(s);
        if (n <= 10) return '$';
        if (n <= 20) return '$$';   
        if (n <= 30) return '$$$';  
        return '$$$$';
      }

      // range like "10-20" or "$10 - $20"
      const rangeMatch = s.match(/(\d+(\.\d+)?).*(\d+(\.\d+)?)/);
      if (rangeMatch) {
        const n = parseFloat(rangeMatch[1]);
        if (n <= 10) return '$';
        if (n <= 20) return '$$';   
        if (n <= 30) return '$$$';  
        return '$$$$';
      }

      // repeated currency symbol like "££" or "€€€"
      const repeatedCurrencyMatch = s.match(/^([^\d\s])\1{0,3}$/);
      if (repeatedCurrencyMatch) {
        const len = s.length;
        return '$'.repeat(Math.min(Math.max(len, 1), 4));
      }

      // unknown: return trimmed string so getPriceRange can display it
      return s;
    },

    getPriceRange(symbol) {
      const key = this.normalizePriceKey(symbol);
      const map = {
        "$": "$0 - $10",
        "$$": "$10 - $20",  
        "$$$": "$20 - $30",  
        "$$$$": "$30+"
      };
      return map[key] || (key ? key : "N/A");
    },
    goToDetails(id) {
      this.$router.push(`/Restaurant/${id}`);
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
        <button id= "navbar-item" type="button" @click="$router.push('/Profile/')">
          <i class="lni lni-user"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Profile/">Profile</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/NearbyFav/')">
          <i class="lni lni-heart"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/NearbyFav/">Favourites</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Map/')">
          <i class="lni lni-map"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Map/">Map</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Discounts/')">
          <i class="lni lni-ticket"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Discounts/">Discounts</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Price_Comparison/')">
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
          <p class="text-muted">Compare restaurants by price and explore your options</p>
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
        </div>

        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <p class="mt-3">Loading restaurants...</p>
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
                      <span class="text-secondary small"> ({{ getPriceRange(restaurant.priceRange) }})</span>
                    </small>
                  </h5>

                  <!-- cuisine + rating -->
                  <div class="d-flex align-items-center mb-2 flex-wrap">
                    <!-- Cuisine -->
                    <span 
                      v-if="restaurant.cuisine" 
                      class="text-muted small d-flex align-items-center"
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
                  <p v-if="restaurant.phone" class="text-muted small mb-1">
                    <i class="fas fa-phone me-1"></i> {{ restaurant.phone }}
                  </p>

                  <!-- Hours -->
                  <div v-if="restaurant.hours" class="text-muted small mb-2">
                    <i class="fas fa-clock me-1"></i>
                    <ul class="list-unstyled ms-3 mb-0">
                      <li v-for="(h, day) in restaurant.hours" :key="day">{{ day }}: {{ h }}</li>
                    </ul>
                  </div>

                  <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="'compare-' + restaurant.id"
                        :value="restaurant.id"
                        @change="toggleSelect(restaurant, $event)"
                        :checked="selectedIds.includes(restaurant.id)"
                        :disabled="selectedIds.length >= 3 && !selectedIds.includes(restaurant.id)"
                      />
                      <label class="form-check-label small" :for="'compare-' + restaurant.id">Compare</label>
                    </div>

                    <button
                      class="btn btn-dark btn-sm"
                      @click="goToDetails(restaurant.id)"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="alert alert-dark">
            No restaurants found in the selected price range.
        </div>

        <!-- Comparison Modal -->
        <div
          class="modal fade"
          id="compareModal"
          tabindex="-1"
          aria-labelledby="compareLabel"
          aria-hidden="true"
        >
          <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content p-3">
              <div class="modal-header border-0">
                <h5 class="modal-title fw-bold" id="compareLabel">
                  Compare Restaurants
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div class="modal-body">
                <div class="table-responsive">
                  <table class="table table-bordered align-middle text-center">
                    <thead class="table-dark">
                      <tr>
                        <th>Feature</th>
                        <th v-for="r in selectedRestaurants" :key="r.id">{{ r.name }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Price Range</td>
                        <td v-for="r in selectedRestaurants" :key="'price-' + r.id">{{ getPriceRange(r.priceRange) }}</td>
                      </tr>
                      <tr>
                        <td>Cuisine</td>
                        <td v-for="r in selectedRestaurants" :key="'cuisine-' + r.id">{{ r.cuisine || 'N/A' }}</td>
                      </tr>
                      <tr>
                        <td>Rating</td>
                        <td v-for="r in selectedRestaurants" :key="'rating-' + r.id" v-html="renderStars(r.rating || 0)"></td>
                      </tr>
                      <tr>
                        <td>Location</td>
                        <td v-for="r in selectedRestaurants" :key="'location-' + r.id">{{ r.location || 'N/A' }}</td>
                      </tr>
                      <tr>
                        <td>Phone</td>
                        <td v-for="r in selectedRestaurants" :key="'phone-' + r.id">{{ r.phone || 'N/A' }}</td>
                      </tr>
                      <tr>
                        <td>Opening Hours</td>
                        <td v-for="r in selectedRestaurants" :key="'hours-' + r.id">
                          <div v-if="r.hours">
                            <ul class="list-unstyled mb-0">
                              <li v-for="(h, day) in r.hours" :key="day">{{ day }}: {{ h }}</li>
                            </ul>
                          </div>
                          <span v-else>N/A</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="modal-footer border-0">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>


      </div>

      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
      </div>

      <!-- Floating Compare Button -->
      <button
        v-if="selectedRestaurants.length >= 2"
        class="btn btn-dark compare-btn shadow-lg"
        data-bs-toggle="modal"
        data-bs-target="#compareModal"
      >
        <i class="bi bi-columns-gap me-2"></i>
        Compare Selected ({{ selectedRestaurants.length }})
      </button>

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

.table th {
  background-color: #212529;
  color: white;
}

#compareModal td, #compareModal th {
  vertical-align: middle;
}

.compare-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1050; /* stays above cards and sidebar */
  border-radius: 50px;
  padding: 12px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.compare-btn:hover {
  transform: scale(1.05);
  background-color: #0b5ed7;
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
