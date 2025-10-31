<script>
import { getAuth, signOut } from "firebase/auth";
import { ref as dbRef, get, push, query, orderByChild, limitToLast } from "firebase/database";
import { database } from '../firebase';
import databaseFunctions from '../services/databaseFunctions';
import RecommendationEngine from './RecommendationEngine.vue';
import placeholderImage from '../assets/placeholder.webp';

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
        RecommendationEngine
      },
      
      async mounted() {
          const hamburger = document.querySelector("#toggle-btn");
          if (hamburger) {
              hamburger.addEventListener("click", function () {
                  document.querySelector("#sidebar").classList.toggle("expand");
              });
          }

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
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
                // Use fallback trending foods directly
                this.trendingFoods = [
                    { query: "Nasi Lemak", trend: "Rising" },
                    { query: "Korean Corn Dogs", trend: "Hot" },
                    { query: "Bubble Tea", trend: "Stable" },
                    { query: "Mala Xiang Guo", trend: "Rising" },
                    { query: "Japanese Souffle Pancakes", trend: "Hot" }
                ];
            } catch (error) {
                console.error('Error fetching food trends:', error);
                this.trendingFoods = [];
            }
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
        <div class="hero-section">
            <h1>EatWhatLa!</h1>
            <div class="search-container" ref="searchContainer">
                <div class="search-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        v-model="searchInput" 
                        @keydown.enter="handleSearchSubmit" 
                        @focus="showRecentSearches = true"
                        @input="handleInput"
                        :class="['search-input', { 'placeholder-fading': placeholderFading }]"
                        :placeholder="getCurrentPlaceholder"
                    />
                    <button 
                        @click="handleSearchSubmit"
                        :disabled="!searchInput.trim()"
                        class="search-button"
                        type="button"
                    >
                        <i class="fas fa-search"></i>
                    </button>
                    
                    <!-- Recent Searches Dropdown -->
                    <div v-if="showRecentSearches && recentSearches.length > 0 && !searchInput" class="recent-searches-dropdown">
                        <div 
                            v-for="item in recentSearches" 
                            :key="item.id"
                            class="search-history-item"
                            @click="selectHistoryItem(item)"
                        >
                            <div class="history-main">
                                <i class="fas fa-history"></i>
                                <span class="history-query">{{ item.query }}</span>
                            </div>
                            <div class="history-meta">
                                <span class="history-category">{{ item.category }}</span>
                                <span class="history-time">{{ formatTimestamp(item.timestamp) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
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
            <div class="content-right">
                <!-- Trending Foods Section -->
                <div class="trending-foods" v-if="trendingFoods.length > 0">
                    <h4>🔥 TRENDING IN SINGAPORE</h4>
                    <div class="trending-tags">
                        <span 
                            v-for="(food, index) in trendingFoods" 
                            :key="index"
                            class="trending-tag"
                            @click="selectTrendingFood(food)"
                        >
                            {{ food.query }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Restaurant Results Section -->
        <div v-if="searchInput && filteredRestaurants.length > 0" class="restaurant-results">
            <h3>Found {{ filteredRestaurants.length }} restaurants near you</h3>
            <div class="restaurant-grid">
                <div v-for="restaurant in filteredRestaurants" :key="restaurant.id" class="restaurant-card">
                    <img :src="restaurant.img" :alt="restaurant.name" class="restaurant-image">
                    <div class="restaurant-info">
                        <h4>{{ restaurant.name }}</h4>
                        <p class="restaurant-cuisine">{{ restaurant.cuisine }}</p>
                        <p class="restaurant-location">
                            <i class="fas fa-map-marker-alt"></i> {{ restaurant.location }}
                        </p>
                        <p class="restaurant-distance" v-if="restaurant.distance">
                            <i class="fas fa-walking"></i> {{ restaurant.distance.toFixed(2) }} km away
                        </p>
                        <div class="restaurant-rating">
                            <i class="fas fa-star"></i> 
                            {{ restaurant.rating }} ({{ restaurant.user_ratings_total }} reviews)
                        </div>
                        <button class="view-details-btn" @click="viewRestaurantDetails(restaurant)">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Empty State (shown when no search and no history) -->
        <div v-if="!searchInput && userSearchHistory.length === 0" class="text-center mt-5">
            <i class="bi bi-search fs-1 text-muted mb-3"></i>
            <p class="text-muted">Start searching for restaurants nearby!</p>
        </div>
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

/* New Compact Layout Styles */
.hero-section {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.hero-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* Compact Trending Foods */
.trending-foods {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-radius: 15px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  height: 100%;
  min-height: 500px;
}

.trending-foods h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 600;
}

.trending-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trending-tag {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  text-align: center;
  width: 100%;
}

.trending-tag:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
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
        width: 50vw;
        max-width: none;
        position: relative;
        margin-top: 2rem;
    }

.search-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: none;
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
  padding: 0 50px 0 50px;
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

.search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #007bff;
  border: none;
  border-radius: 8px;
  color: white;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-50%) scale(1.05);
}

.search-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.search-button i {
  font-size: 0.9rem;
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
  opacity: 1;
}

.search-input.placeholder-fading::placeholder {
  opacity: 0;
}

    .restaurant-results {
      margin-top: 2rem;
      padding: 0 1rem;
    }

    .restaurant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .restaurant-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s;
    }

    .restaurant-card:hover {
      transform: translateY(-5px);
    }

    .restaurant-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .restaurant-info {
      padding: 1rem;
    }

    .restaurant-info h4 {
      margin: 0 0 0.5rem;
      color: #333;
    }

    .restaurant-info p {
      margin: 0.25rem 0;
      color: #666;
    }

    .restaurant-info i {
      margin-right: 0.5rem;
      color: #ff6b6b;
    }

    .view-details-btn {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .view-details-btn:hover {
      background-color: #ff5252;
    }

    /* Recent Searches Dropdown */
    .recent-searches-dropdown {
      position: relative;
      width: 100%;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-top: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      max-height: 300px;
      overflow-y: auto;
    }

    .search-history-item {
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }

    .search-history-item:last-child {
      border-bottom: none;
    }

    .search-history-item:hover {
      background-color: #f8f9fa;
    }

    .history-main {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .history-main i {
      color: #6c757d;
      font-size: 14px;
    }

    .history-query {
      font-weight: 500;
      color: #333;
    }

    .history-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #6c757d;
      margin-left: 22px;
    }

    .history-category {
      text-transform: capitalize;
      background: #e3f2fd;
      padding: 2px 8px;
      border-radius: 12px;
      color: #1976d2;
    }

    .restaurant-cuisine {
      color: #666;
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .restaurant-location,
    .restaurant-distance {
      color: #666;
      font-size: 0.85rem;
      margin: 0.25rem 0;
    }

    .restaurant-rating {
      color: #ffa500;
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .restaurant-rating i {
      color: #ffa500;
    }

    .search-wrapper {
      position: relative;
    }
</style>
