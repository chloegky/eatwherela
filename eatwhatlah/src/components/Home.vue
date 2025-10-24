<script>
import { getAuth, signOut } from "firebase/auth";
import { ref as dbRef, get, push, query, orderByChild, limitToLast } from "firebase/database";
import { database } from '../firebase';

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


import { googleTrends } from 'google-trends-api';

export default {
  async mounted() {
    const hamburger = document.querySelector("#toggle-btn");
    if (hamburger) {
      hamburger.addEventListener("click", function () {
        const sidebar = document.querySelector("#sidebar");
        if (sidebar) sidebar.classList.toggle("expand");
      });
    }

    // Get user name from Firebase
    const auth = getAuth();
    if (auth.currentUser) {
      this.userName = auth.currentUser.displayName?.split(' ')[0] || 'there';
      await this.loadUserSearchHistory();
    } else {
      this.userName = 'there';
    }

    // Generate custom placeholders from search history
    this.generateCustomPlaceholders();

    // Start the carousel
    this.startPlaceholderCarousel();

    // Fetch trending food searches
    this.fetchTrendingFoods();
  },

  data() {
    return {
      searchInput: '',
      userName: '',
      userSearchHistory: [],
      defaultPlaceholders: [
        'need coffee?',
        'craving for bubble tea?',
        'hungry for local food?',
        'want some desserts?',
        'looking for dinner plans?'
      ],
      customPlaceholders: [],
      currentPlaceholderIndex: 0,
      trendingFoods: [],
      predictions: [],
      showDropdown: false,
      isPlaceholderFading: false,
      lastSearchCategory: null
    }
  },

  methods: {
    async fetchTrendingFoods() {
      try {
        const results = await googleTrends.relatedQueries({
          keyword: "food singapore",
          geo: "SG",
          hl: "en-SG",
          timeRange: "now 1-d"
        });

        const trendData = JSON.parse(results).default.rankedList[0].rankedKeyword;
        this.trendingFoods = trendData.slice(0, 5).map(item => ({
          query: item.query,
          score: item.value
        }));
      } catch (error) {
        console.error('Error fetching food trends:', error);
        // Fallback trending foods if API fails
        this.trendingFoods = [
          { query: "Nasi Lemak", score: 100 },
          { query: "Korean BBQ", score: 95 },
          { query: "Bubble Tea", score: 90 },
          { query: "Mala Hotpot", score: 85 },
          { query: "Japanese Ramen", score: 80 }
        ];
      }
    },

    async loadUserSearchHistory() {
      try {
        const auth = getAuth();
        const searchHistoryRef = dbRef(database, `userSearchHistory/${auth.currentUser.uid}`);
        const historyQuery = query(searchHistoryRef, orderByChild('timestamp'), limitToLast(10));
        const snapshot = await get(historyQuery);

        if (snapshot.exists()) {
          this.userSearchHistory = Object.values(snapshot.val());
          this.lastSearchCategory = this.userSearchHistory[this.userSearchHistory.length - 1]?.category;
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    },

    generateCustomPlaceholders() {
      if (this.userSearchHistory.length === 0) {
        this.customPlaceholders = this.defaultPlaceholders;
        return;
      }

      // Generate custom suggestions based on search history
      this.customPlaceholders = [];

      // Get search patterns
      const searchPatterns = this.analyzeSearchPatterns();
      const lastSearch = this.userSearchHistory[this.userSearchHistory.length - 1];
      const mostSearched = this.getMostSearchedCategory();

      // Add personalized suggestions based on patterns
      if (searchPatterns.hasRepeatedCategory) {
        const category = mostSearched.category;
        const suggestions = [
          `back for more ${category}? We know some great spots!`,
          `your usual ${category} craving? Let's find something new!`,
          `looks like you love ${category}! Try these spots next`,
        ];
        this.customPlaceholders.push(...suggestions);
      }

      // Reference specific previous searches
      if (lastSearch) {
        const suggestions = [
          `enjoyed ${lastSearch.query} last time? Here are similar places!`,
          `ready to explore more ${lastSearch.category} spots like ${lastSearch.query}?`,
          `since you liked ${lastSearch.query}, you might enjoy these too!`
        ];
        this.customPlaceholders.push(...suggestions);
      }

      // Add time-based suggestions with history context
      const timeBasedSuggestions = this.getTimeBasedSuggestions(mostSearched.category);
      this.customPlaceholders.push(...timeBasedSuggestions);

      // Add some default ones if we don't have enough custom ones
      if (this.customPlaceholders.length < 3) {
        this.customPlaceholders = [...this.customPlaceholders, ...this.defaultPlaceholders];
      }
    },

    analyzeSearchPatterns() {
      const categoryCounts = {};
      this.userSearchHistory.forEach(search => {
        categoryCounts[search.category] = (categoryCounts[search.category] || 0) + 1;
      });

      return {
        hasRepeatedCategory: Object.values(categoryCounts).some(count => count > 1),
        categoryCounts
      };
    },

    getMostSearchedCategory() {
      const counts = {};
      let maxCount = 0;
      let maxCategory = '';

      this.userSearchHistory.forEach(search => {
        counts[search.category] = (counts[search.category] || 0) + 1;
        if (counts[search.category] > maxCount) {
          maxCount = counts[search.category];
          maxCategory = search.category;
        }
      });

      return { category: maxCategory, count: maxCount };
    },

    getTimeBasedSuggestions(favoriteCategory) {
      const hour = new Date().getHours();
      const suggestions = [];

      if (hour >= 6 && hour < 11) {
        suggestions.push(`morning! Your usual ${favoriteCategory} breakfast spot?`);
      } else if (hour >= 11 && hour < 15) {
        suggestions.push(`lunch time! Another ${favoriteCategory} adventure?`);
      } else if (hour >= 15 && hour < 18) {
        suggestions.push(`afternoon ${favoriteCategory} break? We've got ideas!`);
      } else if (hour >= 18 && hour < 22) {
        suggestions.push(`dinner time! Your favorite ${favoriteCategory} spot is calling!`);
      } else {
        suggestions.push(`late night ${favoriteCategory} cravings? We know just the place!`);
      }

      return suggestions;
    },

    async saveSearch(query, category) {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const searchHistoryRef = dbRef(database, `userSearchHistory/${auth.currentUser.uid}`);
      await push(searchHistoryRef, {
        query,
        category,
        timestamp: Date.now()
      });

      // Reload history and regenerate placeholders
      await this.loadUserSearchHistory();
      this.generateCustomPlaceholders();
    },

    startPlaceholderCarousel() {
      setInterval(() => {
        this.isPlaceholderFading = true;
        setTimeout(() => {
          this.currentPlaceholderIndex =
            (this.currentPlaceholderIndex + 1) % this.customPlaceholders.length;
          this.isPlaceholderFading = false;
        }, 500); // Wait for fade out before changing text
      }, 4000); // Change placeholder every 4 seconds
    },

    getCurrentPlaceholder() {
      return `Hi ${this.userName}, ${this.customPlaceholders[this.currentPlaceholderIndex]}`;
    },

    getPredictions(input) {
      // Combine trending foods with static suggestions
      const staticSuggestions = [
        'Chinese food', 'Japanese food', 'Korean food',
        'Halal food', 'Vegetarian food', 'Breakfast',
        'Lunch deals', 'Dinner spots', 'Cafes'
      ];

      if (input.trim() === '') {
        this.predictions = [];
        return;
      }

      const allSuggestions = [
        ...this.trendingFoods.map(food => food.query),
        ...staticSuggestions
      ];

      this.predictions = allSuggestions
        .filter(item => item.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 5);
    },

    selectPrediction(prediction) {
      this.searchInput = prediction;
      this.showDropdown = false;
      this.goToSearch();
    },

    handleInput() {
      this.showDropdown = true;
      this.getPredictions(this.searchInput);
    },

    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/Login"); // redirect to login page
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
        this.$router.push("/Login");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("❌ Failed to sign out. Please try again.");
      }
    },
    async goToSearch() {
      if (this.searchInput.trim()) {
        // Determine category based on search input
        const category = this.determineCategory(this.searchInput);
        await this.saveSearch(this.searchInput, category);
        this.$router.push('/Response');
      }
    },

    determineCategory(query) {
      query = query.toLowerCase();
      const categories = {
        'chicken rice': ['chicken rice', 'hainanese', 'chicken'],
        'coffee': ['coffee', 'cafe', 'latte', 'espresso'],
        'japanese': ['sushi', 'ramen', 'japanese', 'udon'],
        'chinese': ['chinese', 'dimsum', 'noodles', 'wonton'],
        'dessert': ['dessert', 'cake', 'ice cream', 'sweet'],
        'local food': ['laksa', 'nasi lemak', 'mee goreng', 'local']
      };

      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => query.includes(keyword))) {
          return category;
        }
      }
      return 'other';
    },

    redirect() {
      this.$router.push('/Restaurant');
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
        <button id="navbar-item" type="button" data-bs-toggle="modal" data-bs-target="#logoutModal">
          <i class="lni lni-exit"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">Logout</a>
        </div>
      </div>

    </aside>

    <div class="main">
      <h1>EatWhatLa!</h1>
      <div class="search-container">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input v-model="searchInput" @keydown.enter="goToSearch" @focus="showDropdown = true" @input="handleInput"
            class="search-input" :placeholder="getCurrentPlaceholder()"
            :class="{ 'placeholder-fade': isPlaceholderFading }" />
          <!-- Search Predictions Dropdown -->
          <div v-if="showDropdown && predictions.length > 0" class="predictions-dropdown">
            <div v-for="(prediction, index) in predictions" :key="index" class="prediction-item"
              @click="selectPrediction(prediction)">
              <i class="fas fa-search fa-sm"></i>
              {{ prediction }}
              <span v-if="trendingFoods.find(f => f.query === prediction)" class="trending-badge">
                🔥 Trending
              </span>
            </div>
          </div>
        </div>

        <!-- Trending Foods Section -->
        <div class="trending-foods" v-if="trendingFoods.length > 0">
          <h4>Trending in Singapore</h4>
          <div class="trending-tags">
            <span v-for="(food, index) in trendingFoods" :key="index" class="trending-tag"
              @click="selectPrediction(food.query)">
              🔥 {{ food.query }}
            </span>
          </div>
        </div>
      </div>
      <br>
    </div>
  </div>


  <!-- Logout Confirmation Modal -->
  <div class="modal fade" id="logoutModal" tabindex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true">
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
          <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">
            Cancel
          </button>
          <button type="button" class="btn btn-dark px-4" @click="confirmLogout" data-bs-dismiss="modal">
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
        justify-content: center;
        align-items: center;
        color: white;
    }
      
    #sidebar.expand ~ .main {
        margin-left: 260px;
        width: calc(100vw - 260px);
    }
    
    .search-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 450px;
        position: relative;
        margin-top: 2rem;
    }

.search-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.search-wrapper:hover,
.search-wrapper:focus-within {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.search-input {
  height: 50px;
  width: 100%;
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 0 50px;
  font-size: 1rem;
  background-color: #fff;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.search-wrapper:focus-within .search-icon {
  color: #007bff;
}

.placeholder-fade::placeholder {
  animation: fadeInOut 1s ease infinite;
}

.predictions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-top: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.prediction-item {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s;
}

.prediction-item:hover {
  background-color: #f5f5f5;
}

.trending-badge {
  margin-left: auto;
  font-size: 0.8em;
  color: #ff6b6b;
}

.trending-foods {
  margin-top: 20px;
  width: 100%;
  text-align: center;
}

.trending-foods {
  margin-top: 2rem;
  width: 100%;
  text-align: center;
  animation: slideUp 0.5s ease;
}

.trending-foods h4 {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
  font-weight: 600;
}

.trending-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.trending-tag {
  background-color: #f8f9fa;
  padding: 10px 18px;
  border-radius: 25px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  color: #495057;
}

.trending-tag:hover {
  background-color: #fff;
  border-color: #007bff;
  color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

@keyframes fadeInOut {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-input::placeholder {
  color: #adb5bd;
  font-weight: 400;
  transition: opacity 0.3s ease;
}

.search-wrapper:focus-within .search-input::placeholder {
  opacity: 0.7;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: gray;
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
  height: 36px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 30px;
}

img {
  margin: 10px 20px;
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
