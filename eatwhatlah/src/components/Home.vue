<script>
import { getAuth, signOut } from "firebase/auth";
import { ref as dbRef, get, push, query, orderByChild, limitToLast } from "firebase/database";
import { database } from '../firebase';
import databaseFunctions from '../services/databaseFunctions';
import RecommendationEngine from './RecommendationEngine.vue';
import placeholderImage from '../assets/placeholder.webp';
import Sidebar from './subcomponents/Sidebar.vue';
import SearchBar from './subcomponents/SearchBar.vue';
import TrendingFoods from './subcomponents/TrendingFoods.vue';
import RestaurantResults from './subcomponents/RestaurantResults.vue';



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
  components: {
    Sidebar,
    RecommendationEngine,
    SearchBar,
    TrendingFoods,
    RestaurantResults
  },

  async mounted() {

    // Fetch all restaurants
    await this.fetchRestaurants();

    // Get user name from Firebase
    const auth = getAuth();

    // Listen to auth state changes
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userName = user.displayName?.split(' ')[0] || 'there';
        await this.loadUserSearchHistory();
        this.generateCustomPlaceholders();
      } else {
        this.userName = 'there';
        this.customPlaceholders = [
          'What are you craving?',
          'Looking for something delicious?',
          'Find your next meal...'
        ];
      }
    });

    // Get user's location and fetch nearby restaurants
    await this.getUserLocation();
    await this.fetchNearbyRestaurants();

    // Fetch trending foods
    await this.fetchTrendingFoods();

    // Rotate placeholders with fade effect
    setInterval(() => {
      if (this.customPlaceholders && this.customPlaceholders.length > 0) {
        // Trigger fade out
        this.placeholderFading = true;

        // Change placeholder after fade out (300ms)
        setTimeout(() => {
          this.currentPlaceholderIndex =
            (this.currentPlaceholderIndex + 1) % this.customPlaceholders.length;

          // Trigger fade in
          setTimeout(() => {
            this.placeholderFading = false;
          }, 50);
        }, 300);
      }
    }, 2500);

    // Add click outside listener to close recent searches dropdown
    this.$nextTick(() => {
      document.addEventListener('click', this.handleClickOutside);
    });
  },

  beforeUnmount() {
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
  },

  data() {
    return {
      searchInput: '',
      userName: '',
      userSearchHistory: [],
      customPlaceholders: [
        'What are you craving?',
        'Looking for something delicious?',
        'Find your next meal...'
      ],
      currentPlaceholderIndex: 0,
      placeholderFading: false,
      trendingFoods: [],
      showRecentSearches: false,
      restaurants: [],
      filteredRestaurants: [],
      userLocation: null,
      isTestMode: false,
      testTime: null,
      searchTimeout: null
    }
  },

  computed: {
    getCurrentPlaceholder() {
      if (this.customPlaceholders && this.customPlaceholders.length > 0) {
        return this.customPlaceholders[this.currentPlaceholderIndex] || "What are you craving?";
      }
      return "What are you craving?";
    },

    recentSearches() {
      return this.userSearchHistory && Array.isArray(this.userSearchHistory)
        ? this.userSearchHistory.slice(0, 5)
        : [];
    }
  },

  watch: {
    searchInput: {
      handler(newValue) {
        this.filterRestaurants();
      }
    }
  },

  methods: {
    async handleRecommendationSelect(recommendation) {
      console.log('Recommendation selected:', recommendation);

      // Set the search input to the recommended food
      this.searchInput = recommendation.title;

      // Trigger search for the recommended food
      await this.fetchNearbyRestaurants(recommendation.title);

      // Save the recommendation selection as a search
      if (this.filteredRestaurants.length > 0) {
        const category = this.determineCategory(recommendation.title);
        await this.saveSearch(recommendation.title, category);
      }
    },

    async getUserLocation() {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              console.log('User location:', this.userLocation);
              resolve(this.userLocation);
            },
            (error) => {
              console.error('Error getting location:', error);
              // Default to Singapore center if location denied
              this.userLocation = { lat: 1.3521, lng: 103.8198 };
              resolve(this.userLocation);
            }
          );
        } else {
          console.error('Geolocation not supported');
          this.userLocation = { lat: 1.3521, lng: 103.8198 };
          resolve(this.userLocation);
        }
      });
    },

    async fetchRestaurants() {
      try {
        const result = await databaseFunctions.getAllRestaurants();
        // Ensure we always have an array
        this.restaurants = Array.isArray(result) ? result : [];
        console.log('Fetched restaurants:', this.restaurants);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        this.restaurants = [];
        this.filteredRestaurants = [];
      }
    },

    async fetchNearbyRestaurants(searchQuery = null) {
      if (!this.userLocation) {
        await this.getUserLocation();
      }

      try {
        // Load Google Maps API if not already loaded
        if (!window.google || !window.google.maps) {
          await this.loadGoogleMapsAPI();
        }

        const { lat, lng } = this.userLocation;

        // Create a map (required for PlacesService)
        const mapDiv = document.createElement('div');
        const map = new google.maps.Map(mapDiv, {
          center: { lat, lng },
          zoom: 15
        });

        // Create PlacesService
        const service = new google.maps.places.PlacesService(map);

        let request;

        if (searchQuery) {
          // Use textSearch for specific queries
          request = {
            location: new google.maps.LatLng(lat, lng),
            radius: 1000,
            query: searchQuery + ' restaurant'
          };

          service.textSearch(request, (results, status) => {
            this.handleSearchResults(results, status, lat, lng);
          });
        } else {
          // Use nearbySearch for general browsing
          request = {
            location: new google.maps.LatLng(lat, lng),
            radius: 1000,
            type: 'restaurant'
          };

          service.nearbySearch(request, (results, status) => {
            this.handleSearchResults(results, status, lat, lng);
          });
        }
      } catch (error) {
        console.error('Error fetching nearby restaurants:', error);
        this.restaurants = [];
        this.filteredRestaurants = [];
      }
    },

    handleSearchResults(results, status, lat, lng) {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        this.restaurants = results.map(place => {
          const restaurant = {
            id: place.place_id,
            name: place.name,
            cuisine: place.types?.join(', ') || 'Restaurant',
            location: place.vicinity || place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            rating: place.rating || 'N/A',
            user_ratings_total: place.user_ratings_total || 0,
            img: place.photos?.[0]
              ? place.photos[0].getUrl({ maxWidth: 400 })
              : placeholderImage,
            distance: this.calculateDistance(
              lat, lng,
              place.geometry.location.lat(),
              place.geometry.location.lng()
            )
          };

          return restaurant;
        });

        // Sort by distance
        this.restaurants.sort((a, b) => a.distance - b.distance);
        this.filteredRestaurants = [...this.restaurants];

        console.log('Fetched restaurants:', this.restaurants.length);
        if (this.restaurants.length > 0) {
          console.log('Sample:', this.restaurants.slice(0, 3).map(r => r.name));
        }
      } else {
        console.error('Places service failed:', status);
        this.restaurants = [];
        this.filteredRestaurants = [];
      }
    },

    async loadGoogleMapsAPI() {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAXxC0AbbB5Vf4AU5yMM1gFbJPiAlRYgqo&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps API'));
        document.head.appendChild(script);
      });
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    getRestaurantKeywords(restaurant) {
      const name = (restaurant.name || '').toLowerCase();
      const cuisine = (restaurant.cuisine || '').toLowerCase();
      const location = (restaurant.location || '').toLowerCase();

      // Keyword mapping for common restaurants and food types
      const keywordMap = {
        // Fast Food
        'mcdonald': ['burger', 'fries', 'fast food', 'western', 'breakfast', 'mcdonalds', 'big mac', 'nuggets', 'chicken'],
        'kfc': ['chicken', 'fried chicken', 'fast food', 'western', 'coleslaw', 'popcorn chicken', 'wings'],
        'burger king': ['burger', 'whopper', 'fries', 'fast food', 'western', 'beef'],
        'subway': ['sandwich', 'subs', 'healthy', 'fast food', 'western', 'salad', 'bread'],
        'pizza hut': ['pizza', 'italian', 'pasta', 'western', 'cheese', 'pepperoni'],
        'domino': ['pizza', 'italian', 'fast food', 'western', 'delivery', 'cheese'],
        'wendy': ['burger', 'fries', 'fast food', 'western', 'chicken', 'nuggets'],
        'popeyes': ['chicken', 'fried chicken', 'fast food', 'cajun', 'spicy'],
        'jollibee': ['chicken', 'fried chicken', 'burger', 'fast food', 'filipino', 'spaghetti'],

        // Asian Fast Food
        'yoshinoya': ['japanese', 'rice bowl', 'beef bowl', 'gyudon', 'fast food', 'affordable', 'beef', 'rice'],
        'sukiya': ['japanese', 'rice bowl', 'beef bowl', 'gyudon', 'fast food', 'beef', 'rice'],
        'mos burger': ['burger', 'japanese', 'fast food', 'rice burger', 'chicken'],
        'tampopo': ['japanese', 'ramen', 'noodles', 'soup', 'pork', 'chicken'],

        // Cafe & Beverages
        'starbucks': ['coffee', 'cafe', 'beverages', 'western', 'breakfast', 'pastries', 'frappuccino', 'tea'],
        'costa': ['coffee', 'cafe', 'beverages', 'western', 'tea'],
        'koi': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'taiwanese', 'tea'],
        'gong cha': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'taiwanese', 'tea'],
        'liho': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'tea'],
        'chatime': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'taiwanese', 'tea'],
        'tealive': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'tea'],
        'tiger sugar': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'taiwanese', 'tea'],
        'playmade': ['bubble tea', 'boba', 'milk tea', 'drinks', 'beverages', 'tea'],

        // Local/Asian
        'kopitiam': ['local', 'hawker', 'coffee shop', 'asian', 'affordable', 'chicken rice', 'noodles', 'laksa', 'chicken'],
        'food court': ['local', 'hawker', 'asian', 'affordable', 'variety', 'chicken rice', 'noodles'],
        'food republic': ['local', 'hawker', 'asian', 'affordable', 'variety', 'chicken rice', 'noodles'],
        'old chang kee': ['local', 'curry puff', 'snacks', 'singaporean', 'fried'],
        'toast box': ['local', 'kaya toast', 'coffee', 'breakfast', 'singaporean', 'bread', 'tea'],
        'ya kun': ['local', 'kaya toast', 'coffee', 'breakfast', 'singaporean', 'bread', 'tea'],
        'breadtalk': ['bakery', 'bread', 'pastries', 'snacks', 'asian', 'sweet'],
        'killiney': ['local', 'kaya toast', 'coffee', 'breakfast', 'singaporean', 'bread', 'tea'],

        // Chinese
        'paradise': ['chinese', 'dim sum', 'asian', 'brunch', 'dumplings', 'noodles'],
        'crystal jade': ['chinese', 'dim sum', 'noodles', 'asian', 'dumplings'],
        'din tai fung': ['chinese', 'taiwanese', 'xiao long bao', 'dumplings', 'asian', 'noodles'],
        'tim ho wan': ['chinese', 'dim sum', 'asian', 'dumplings', 'pork', 'chicken'],
        'swee choon': ['chinese', 'dim sum', 'asian', 'dumplings', 'noodles'],

        // Japanese
        'sushi tei': ['japanese', 'sushi', 'sashimi', 'asian', 'seafood', 'fish', 'rice'],
        'ichiban': ['japanese', 'sushi', 'ramen', 'asian', 'fish', 'noodles'],
        'ajisen': ['japanese', 'ramen', 'noodles', 'asian', 'soup', 'pork', 'chicken'],
        'genki': ['japanese', 'sushi', 'asian', 'conveyor belt', 'fish', 'rice'],
        'sakae': ['japanese', 'sushi', 'asian', 'conveyor belt', 'fish', 'rice'],
        'ramen': ['japanese', 'noodles', 'soup', 'asian', 'pork', 'chicken', 'egg'],
        'ichiran': ['japanese', 'ramen', 'noodles', 'soup', 'pork'],

        // Korean
        'gong gu': ['korean', 'bbq', 'meat', 'asian', 'grilled', 'beef', 'pork', 'chicken'],
        'paik': ['korean', 'noodles', 'asian', 'bibimbap', 'rice'],
        'seoul': ['korean', 'bbq', 'kimchi', 'asian', 'beef', 'pork', 'chicken'],
        'kko kko': ['korean', 'chicken', 'fried chicken', 'asian', 'spicy'],
        '4 fingers': ['chicken', 'fried chicken', 'korean', 'spicy', 'wings'],

        // Thai/Vietnamese
        'thai express': ['thai', 'asian', 'noodles', 'spicy', 'pad thai', 'rice', 'curry', 'chicken'],
        'pho': ['vietnamese', 'noodles', 'soup', 'asian', 'healthy', 'beef', 'chicken'],
        'nha trang': ['vietnamese', 'noodles', 'soup', 'asian', 'pho', 'beef'],

        // Indian/Malay
        'muthu': ['indian', 'curry', 'naan', 'asian', 'spicy', 'chicken', 'fish', 'biryani', 'rice'],
        'banana leaf': ['indian', 'curry', 'rice', 'asian', 'spicy', 'chicken', 'fish'],
        'nasi lemak': ['malay', 'local', 'rice', 'coconut rice', 'chicken', 'fish', 'sambal', 'egg'],
        'nasi padang': ['malay', 'indonesian', 'rice', 'curry', 'chicken', 'beef', 'fish'],
        'warong': ['malay', 'local', 'nasi lemak', 'rice', 'chicken'],
        'hajah maimunah': ['malay', 'local', 'nasi padang', 'rice', 'curry', 'chicken', 'beef'],

        // Desserts
        'swensen': ['dessert', 'ice cream', 'western', 'sweet', 'sundae'],
        'haagen': ['dessert', 'ice cream', 'western', 'sweet', 'premium'],
        'cold stone': ['dessert', 'ice cream', 'western', 'sweet'],
        'cafe cartel': ['dessert', 'waffle', 'western', 'sweet', 'cafe'],
        'ice cream': ['dessert', 'sweet', 'frozen'],
      };

      // Cuisine type keywords
      const cuisineKeywords = {
        'restaurant': ['dining', 'food', 'meal'],
        'cafe': ['coffee', 'beverages', 'breakfast', 'brunch', 'tea'],
        'bar': ['drinks', 'alcohol', 'nightlife'],
        'bakery': ['bread', 'pastries', 'cake', 'dessert'],
        'food': ['dining', 'meal', 'restaurant'],
        'meal_delivery': ['delivery', 'takeaway', 'fast food'],
        'meal_takeaway': ['takeaway', 'delivery', 'fast food'],
        'chinese': ['asian', 'noodles', 'rice', 'dim sum', 'wok', 'chicken', 'pork', 'beef', 'fish'],
        'japanese': ['asian', 'sushi', 'ramen', 'sashimi', 'tempura', 'fish', 'rice', 'noodles'],
        'korean': ['asian', 'bbq', 'kimchi', 'bibimbap', 'korean fried chicken', 'chicken', 'beef', 'pork'],
        'italian': ['western', 'pizza', 'pasta', 'mediterranean', 'cheese'],
        'american': ['western', 'burger', 'steak', 'fries', 'chicken', 'beef'],
        'thai': ['asian', 'spicy', 'pad thai', 'curry', 'noodles', 'rice', 'chicken', 'fish'],
        'indian': ['asian', 'curry', 'naan', 'spicy', 'tandoori', 'chicken', 'biryani', 'rice'],
        'vietnamese': ['asian', 'pho', 'banh mi', 'noodles', 'fresh', 'soup', 'beef', 'chicken'],
        'mexican': ['western', 'tacos', 'burrito', 'spicy', 'beef', 'chicken'],
        'french': ['western', 'fine dining', 'pastries', 'croissant'],
        'mediterranean': ['healthy', 'greek', 'hummus', 'salad'],
        'malay': ['asian', 'local', 'nasi lemak', 'rice', 'curry', 'chicken', 'fish', 'spicy'],
        'indonesian': ['asian', 'nasi padang', 'rice', 'curry', 'chicken', 'beef', 'spicy'],
        'singaporean': ['local', 'chicken rice', 'laksa', 'noodles', 'asian', 'hawker'],
        'western': ['burger', 'steak', 'pasta', 'pizza', 'fries'],
        'seafood': ['fish', 'prawns', 'crab', 'oyster', 'lobster'],
      };

      // General food keywords that match cuisine types
      const generalFoodKeywords = {
        'chicken': ['chicken rice', 'fried chicken', 'roasted chicken', 'grilled chicken', 'korean fried chicken'],
        'fish': ['seafood', 'sushi', 'sashimi', 'fish and chips', 'grilled fish'],
        'noodles': ['ramen', 'pasta', 'laksa', 'pad thai', 'pho', 'wonton'],
        'rice': ['chicken rice', 'fried rice', 'biryani', 'nasi lemak', 'rice bowl'],
        'burger': ['hamburger', 'cheeseburger', 'fast food'],
        'tea': ['bubble tea', 'milk tea', 'boba', 'coffee'],
        'beef': ['steak', 'burger', 'bbq', 'beef noodles'],
        'pork': ['bbq', 'roasted pork', 'char siu'],
      };

      // Build keyword list
      let keywords = [name, cuisine, location];

      // Add mapped keywords based on restaurant name
      for (const [key, mappedKeywords] of Object.entries(keywordMap)) {
        if (name.includes(key)) {
          keywords.push(...mappedKeywords);
        }
      }

      // Add cuisine-based keywords
      const cuisineTypes = cuisine.split(',').map(c => c.trim());
      cuisineTypes.forEach(type => {
        if (cuisineKeywords[type]) {
          keywords.push(...cuisineKeywords[type]);
        }
      });

      return keywords.join(' ').toLowerCase();
    },

    filterRestaurants() {
      // Guard: ensure restaurants is an array
      if (!Array.isArray(this.restaurants)) {
        console.warn('restaurants is not an array:', this.restaurants);
        this.filteredRestaurants = [];
        return;
      }

      if (!this.searchInput.trim()) {
        this.filteredRestaurants = [...this.restaurants];
        return;
      }

      const searchTerm = this.searchInput.toLowerCase().trim();
      const searchWords = searchTerm.split(' ').filter(word => word.length > 1);

      this.filteredRestaurants = this.restaurants.filter(restaurant => {
        const keywords = this.getRestaurantKeywords(restaurant);
        const name = (restaurant.name || '').toLowerCase();
        const cuisine = (restaurant.cuisine || '').toLowerCase();

        // First priority: Check restaurant name directly
        const nameMatch = searchWords.some(word => name.includes(word));
        if (nameMatch) return true;

        // Second priority: Check if it's a known brand that matches search
        const knownBrands = {
          'bubble tea': ['koi', 'gong cha', 'liho', 'chatime', 'tealive', 'tiger sugar', 'playmade', 'each a cup', 'milksha', 'chicha'],
          'boba': ['koi', 'gong cha', 'liho', 'chatime', 'tealive', 'tiger sugar', 'playmade', 'each a cup', 'milksha', 'chicha'],
          'milk tea': ['koi', 'gong cha', 'liho', 'chatime', 'tealive', 'tiger sugar', 'playmade', 'each a cup', 'milksha', 'chicha'],
          'tea': ['koi', 'gong cha', 'liho', 'chatime', 'tealive', 'tiger sugar', 'playmade', 'starbucks', 'costa'],
          'coffee': ['starbucks', 'costa', 'coffee bean', 'toast box', 'ya kun', 'killiney', 'cafe'],
          'burger': ['mcdonald', 'burger king', 'mos burger', 'shake shack', 'five guys', 'wendy'],
          'chicken': ['kfc', 'popeyes', 'jollibee', 'arnold', '4 finger', 'kko kko', 'chir chir'],
          'pizza': ['pizza hut', 'domino', 'pezzo', 'pizza'],
          'sushi': ['sushi', 'genki', 'sakae', 'itacho', 'sushiro'],
          'ramen': ['ramen', 'ippudo', 'ichiran', 'ajisen', 'sanpoutei'],
          'nasi lemak': ['nasi lemak', 'warong', 'selera', 'muslim'],
          'chicken rice': ['chicken rice', 'tian tian', 'boon tong kee', 'wee nam kee'],
        };

        // Check if search matches any known brand category
        for (const [searchKey, brands] of Object.entries(knownBrands)) {
          if (searchTerm.includes(searchKey) || searchKey.includes(searchTerm)) {
            const brandMatch = brands.some(brand => name.includes(brand));
            if (brandMatch) return true;
          }
        }

        // Third priority: Check keywords and cuisine (partial match)
        const keywordMatch = searchWords.some(word =>
          keywords.includes(word) ||
          cuisine.includes(word)
        );

        return keywordMatch;
      });

      console.log(`Search "${searchTerm}" found ${this.filteredRestaurants.length} restaurants`);
      if (this.filteredRestaurants.length > 0) {
        console.log('Sample results:', this.filteredRestaurants.slice(0, 3).map(r => r.name));
      }
    },

    async fetchTrendingFoods() {
      try {
        console.log('Starting to fetch trending foods from Firebase...');
        
        // Fetch real Google Trends data from Firebase Function
        const response = await fetch('https://us-central1-eatwhatlah-b6d02.cloudfunctions.net/getTrendingFoods', {
          cache: 'no-cache'  // Prevent caching
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Raw Firebase response:', result);
          
          if (result.success && result.data) {
            console.log('Google Trends data received:', result.data);
            
            // Sort by interest score (highest first) and take top 5
            const sortedTrends = Object.entries(result.data)
              .sort((a, b) => b[1] - a[1])  // Sort by score descending
              .slice(0, 5)  // Take top 5
              .map(([food, score]) => ({
                query: this.capitalizeFood(food),
                trend: score > 75 ? "Hot" : score > 65 ? "Rising" : "Stable",
                score: score
              }));
            
            console.log('Sorted trends (top 5):', sortedTrends);
            this.trendingFoods = sortedTrends;
            console.log('this.trendingFoods is now:', this.trendingFoods);
          } else {
            console.error('Invalid response structure:', result);
            throw new Error('Failed to fetch trending data');
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching food trends:', error);
        // Fallback to empty array if fetch fails
        this.trendingFoods = [];
      }
    },

    capitalizeFood(foodName) {
      // Capitalize each word in the food name
      return foodName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },

    async loadUserSearchHistory() {
      try {
        const auth = getAuth();
        const searchHistoryRef = dbRef(database, `userSearchHistory/${auth.currentUser.uid}`);
        const historyQuery = query(searchHistoryRef, orderByChild('timestamp'), limitToLast(10));
        const snapshot = await get(historyQuery);

        if (snapshot.exists()) {
          // Convert to array and sort by timestamp (newest first)
          this.userSearchHistory = Object.values(snapshot.val())
            .sort((a, b) => b.timestamp - a.timestamp);
          this.lastSearchCategory = this.userSearchHistory[0]?.category;
          console.log('Loaded search history:', this.userSearchHistory);
        } else {
          console.log('No search history found');
          this.userSearchHistory = [];
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    },

    generateCustomPlaceholders() {
      const placeholders = [];
      const currentHour = this.isTestMode && this.testTime
        ? this.testTime.getHours()
        : new Date().getHours();

      if (this.userSearchHistory.length > 0) {
        const categories = {};
        this.userSearchHistory.forEach(item => {
          // Skip "other" category when counting
          if (item.category && item.category !== 'other') {
            categories[item.category] = (categories[item.category] || 0) + 1;
          }
        });

        // Get top category, fallback to recent search query if no valid categories
        let topCategory = null;
        if (Object.keys(categories).length > 0) {
          topCategory = Object.keys(categories).reduce((a, b) =>
            categories[a] > categories[b] ? a : b
          );
        }

        // If no valid category, use the most recent search query
        if (!topCategory) {
          topCategory = this.userSearchHistory[0]?.query || 'food';
        }

        const recentSearch = this.userSearchHistory[0];

        // Time-based suggestions with history
        if (currentHour >= 6 && currentHour < 11) {
          placeholders.push(`Hi ${this.userName}, morning! Your usual ${topCategory} breakfast spot?`);
        } else if (currentHour >= 11 && currentHour < 15) {
          placeholders.push(`Hi ${this.userName}, lunch time! Another ${topCategory} adventure?`);
        } else if (currentHour >= 15 && currentHour < 18) {
          placeholders.push(`Hi ${this.userName}, afternoon tea? How about some ${topCategory}?`);
        } else if (currentHour >= 18 && currentHour < 22) {
          placeholders.push(`Hi ${this.userName}, dinner time! Your favorite ${topCategory} spot is calling!`);
        }

        placeholders.push(`Hi ${this.userName}, back for more ${topCategory}? We know some great spots!`);
        if (recentSearch && recentSearch.query) {
          placeholders.push(`Hi ${this.userName}, enjoyed ${recentSearch.query} last time? Here are similar places!`);
        }
      } else {
        // Default placeholders when no history
        if (currentHour >= 6 && currentHour < 11) {
          placeholders.push(`Hi ${this.userName}, morning! Need some breakfast?`);
        } else if (currentHour >= 11 && currentHour < 15) {
          placeholders.push(`Hi ${this.userName}, what's for lunch today?`);
        } else {
          placeholders.push(`Hi ${this.userName}, what are you craving?`);
        }

        placeholders.push(`Hi ${this.userName}, looking for something delicious?`);
        placeholders.push(`Hi ${this.userName}, find your next meal...`);
      }

      this.customPlaceholders = placeholders.length > 0 ? placeholders : [
        'What are you craving?',
        'Looking for something delicious?',
        'Find your next meal...'
      ];
    },

    async saveSearch(query, category) {
      const auth = getAuth();
      if (!auth.currentUser) {
        console.log('No user logged in, cannot save search');
        return;
      }

      console.log('Saving search:', query, category);
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

    async handleInput() {
      if (!this.searchInput.trim()) {
        this.showRecentSearches = true;
        // Reset to initial restaurants
        await this.fetchNearbyRestaurants();
      } else {
        this.showRecentSearches = false;
        // Debounce search to avoid too many API calls
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
          await this.fetchNearbyRestaurants(this.searchInput);
          // Don't save search automatically - only on explicit submission
        }, 500);
      }
    },

    async handleSearchSubmit() {
      if (!this.searchInput.trim()) return;

      // Trigger search with Google Places API
      await this.fetchNearbyRestaurants(this.searchInput);

      // Save the search if there are results
      if (this.filteredRestaurants.length > 0) {
        const category = this.determineCategory(this.searchInput);
        await this.saveSearch(this.searchInput, category);
      }
    },

    async selectTrendingFood(food) {
      this.searchInput = food.query;

      // Fetch restaurants and wait for results
      await this.fetchNearbyRestaurants(food.query);

      // Always save to search history when clicking trending tags
      const category = this.determineCategory(food.query);
      await this.saveSearch(food.query, category);
    },

    async selectHistoryItem(item) {
      this.searchInput = item.query;
      this.showRecentSearches = false;
      await this.fetchNearbyRestaurants(item.query);
    },

    handleClickOutside(event) {
      // Check if click is outside the search container
      if (this.$refs.searchContainer && !this.$refs.searchContainer.contains(event.target)) {
        this.showRecentSearches = false;
      }
    },

    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return `${Math.floor(diffMins / 1440)}d ago`;
    },

    async goToSearch() {
      if (!this.searchInput.trim()) return;

      // Trigger new search with Google Places API
      await this.fetchNearbyRestaurants(this.searchInput);

      // Save the search if there are results
      if (this.filteredRestaurants.length > 0) {
        const category = this.determineCategory(this.searchInput);
        await this.saveSearch(this.searchInput, category);
      }
    },

    async viewRestaurantDetails(restaurant) {
      console.log('View Details clicked for:', restaurant.name);

      // Save restaurant name to search history
      const category = this.determineCategory(restaurant.name);
      console.log('Determined category:', category);

      await this.saveSearch(restaurant.name, category);

      // Navigate to restaurant details page
      this.$router.push(`/Restaurant/${restaurant.id}`);
    },

    getDirectionsToRestaurant(restaurant) {
      if (restaurant.location && restaurant.lat && restaurant.lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;
        window.open(url, '_blank');
      } else {
        console.error('Restaurant location data is incomplete');
      }
    },

    redirect() {
      this.$router.push('/Restaurant');
    },
    
    handleImageError(event) {
      event.target.src = placeholderImage;
      event.target.onerror = null; // Prevent infinite loop if placeholder also fails
    },
  }
}
</script>

<template>
  <!-- NAVBAR -->
  <div class="wrapper">
    <Sidebar />
    <div class="main">
      <div class="hero-section">
        <h1 class="fw-bold display-5" 
          style="background: linear-gradient(180deg, #0d2436 0%, #42a5f5 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;">EatWhatLa!</h1>
        <div class="search-container" ref="searchContainer">
          <SearchBar
            v-model="searchInput"
            :placeholder="getCurrentPlaceholder"
            :placeholderFading="placeholderFading"
            :recentSearches="recentSearches"
            @search="handleSearchSubmit"
            @select-history="selectHistoryItem"
            @input="handleInput"
          />
        </div>
      </div>

      <!-- Content Grid Layout -->
      <div class="content-grid" v-if="!searchInput">
        <!-- Left Column: Recommendations -->
        <div class="content-left">
          <RecommendationEngine 
            :userSearchHistory="userSearchHistory" 
            :trendingFoods="trendingFoods"
            :userLocation="userLocation" 
            :currentTime="new Date()" 
            @selectRecommendation="handleRecommendationSelect" 
          />
        </div>

        <!-- Right Column: Trending & Recent -->
        <div class="content-right order-2">
          <TrendingFoods
            :trendingFoods="trendingFoods"
            @select-food="selectTrendingFood"
          />
        </div>
      </div>

      <!-- Restaurant Results Section -->
      <RestaurantResults
        v-if="searchInput && filteredRestaurants.length > 0"
        :restaurants="filteredRestaurants"
        @view-details="viewRestaurantDetails"
        @get-directions="getDirectionsToRestaurant"
      />

      <!-- Empty State (shown when no search and no history) -->
      <div v-if="!searchInput && userSearchHistory.length === 0" class="text-center mt-5">
        <i class="bi bi-search fs-1 text-muted mb-3"></i>
        <p class="text-muted">Start searching for restaurants nearby!</p>
      </div>
    </div>
  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* New Compact Layout Styles */
.hero-section {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.hero-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(180deg, #0d2436 0%, #42a5f5 80%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
  align-items: start !important;
}

.content-left {
  min-height: 400px;
}

.content-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-self: start !important;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .content-right {
    order: -1;
  }
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }

  .trending-tags {
    justify-content: center;
  }

  .trending-tag {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
}

/* Original Styles */
.wrapper {
  display: flex;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

a {
  text-decoration: none !important;
}

/* Sidebar - Refined with Aligned Icons */

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}

    .main{ 
        min-height: 100vh;
        transition: margin-left 0.25s, width 0.25s;
        margin-left: 70px;
        background: 
          radial-gradient(circle at 20% 20%, rgba(187, 222, 251, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
       overflow: hidden;
        width: calc(100vw - 70px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #1e3a5f;
    }
      
    #sidebar.expand ~ .main {
        margin-left: 260px;
        width: calc(100vw - 260px);
    }
    
    .search-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 50vw;
        max-width: none;
        position: relative;
        margin-top: 2rem;
    }
</style>
