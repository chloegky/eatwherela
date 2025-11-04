import { database } from '../firebase';
import { ref, set, get, update, remove, onValue, push} from "firebase/database";

class databaseFunctions {
  // Write restaurant data
  createRestaurant(restaurantId, data) {
    return set(ref(database, 'restaurants/' + restaurantId), data);
  }

  // Read restaurant data (one-time)
  getRestaurant(restaurantId) {
    return get(ref(database, 'restaurants/' + restaurantId));
  }

  // Listen to real-time updates
  watchRestaurant(restaurantId, callback) {
    const restaurantRef = ref(database, 'restaurants/' + restaurantId);
    return onValue(restaurantRef, callback);
  }

  // Update restaurant data
  updateRestaurant(restaurantId, updates) {
    return update(ref(database, 'restaurants/' + restaurantId), updates);
  }

  // Delete restaurant
  deleteRestaurant(restaurantId) {
    return remove(ref(database, 'restaurants/' + restaurantId));
  }

  // Get all restaurants
  async getAllRestaurants() {
    const restaurantsRef = ref(database, 'restaurants');
    const snapshot = await get(restaurantsRef);
    if (snapshot.exists()) {
      // Convert the object to an array of restaurants with their IDs
      return Object.entries(snapshot.val()).map(([id, data]) => ({
        id,
        ...data
      }));
    }
    return [];
  }

  updateUserEmotion(userId, data) {
    const userEmotionRef = ref(database, `userEmotions/${userId}`);
    return push(userEmotionRef, data);
  }

  getUserEmotion(userId, callback) {
    const userEmotionRef = ref(database, `userEmotions/${userId}`);
    return onValue(userEmotionRef, callback);
  }

  getAllEmotions(callback) {
    const userEmotionsRef = ref(database, 'userEmotions');
    return onValue(userEmotionsRef, callback);
  }

  getAllUserEmotions(callback) {
    const userEmotionsRef = ref(database, 'userEmotions');
    return onValue(userEmotionsRef, callback);
  }

  saveReview(userId, reviewData) {
    return set(ref(database, `reviews/${userId}/${Date.now()}`), reviewData);
  }

  // Add a restaurant to user's favorites
  addFavorite(userId, restaurantData) {
    const favoriteRef = ref(database, `favorites/${userId}/${restaurantData.place_id}`);
    return set(favoriteRef, {
      place_id: restaurantData.place_id,
      title: restaurantData.title,
      description: restaurantData.description,
      category: restaurantData.category,
      stars: restaurantData.stars,
      img: restaurantData.img,
      lat: restaurantData.lat,
      lng: restaurantData.lng,
      rating: restaurantData.rating,
      user_ratings_total: restaurantData.user_ratings_total,
      addedAt: Date.now()
    });
  }

  // Remove a restaurant from user's favorites
  removeFavorite(userId, placeId) {
    const favoriteRef = ref(database, `favorites/${userId}/${placeId}`);
    return remove(favoriteRef);
  }

  // Get all favorites for a user (one-time read)
  getUserFavorites(userId) {
    const favoritesRef = ref(database, `favorites/${userId}`);
    return get(favoritesRef);
  }

  // Watch user's favorites in real-time
  watchUserFavorites(userId, callback) {
    const favoritesRef = ref(database, `favorites/${userId}`);
    return onValue(favoritesRef, callback);
  }

  // Check if a restaurant is favorited
  async isFavorite(userId, placeId) {
    const favoriteRef = ref(database, `favorites/${userId}/${placeId}`);
    const snapshot = await get(favoriteRef);
    return snapshot.exists();
  }

  // ========== REVIEW FUNCTIONS ==========

  // Get all reviews for a specific restaurant (real-time listener)
  watchReviewsByRestaurant(restaurantName, callback) {
    const reviewsRef = ref(database, 'reviews');
    
    return onValue(reviewsRef, (snapshot) => {
      const reviews = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Iterate through all users
        Object.keys(data).forEach(userId => {
          const userReviews = data[userId];
          
          // Iterate through each user's reviews
          Object.keys(userReviews).forEach(timestamp => {
            const review = userReviews[timestamp];
            
            // Filter by restaurant name
            if (review.restaurantName === restaurantName) {
              reviews.push({
                ...review,
                id: timestamp,
                userId: userId
              });
            }
          });
        });
        
        // Sort by timestamp (most recent first)
        reviews.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      callback(reviews);
    });
  }

  // Get recent reviews for a specific restaurant (one-time fetch with limit)
  async getRecentReviewsByRestaurant(restaurantName, limit = 3) {
    const reviewsRef = ref(database, 'reviews');
    
    try {
      const snapshot = await get(reviewsRef);
      const reviews = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Iterate through all users
        Object.keys(data).forEach(userId => {
          const userReviews = data[userId];
          
          // Iterate through each user's reviews
          Object.keys(userReviews).forEach(timestamp => {
            const review = userReviews[timestamp];
            
            // Filter by restaurant name
            if (review.restaurantName === restaurantName) {
              reviews.push({
                ...review,
                id: timestamp,
                userId: userId
              });
            }
          });
        });
        
        // Sort by timestamp (most recent first) and limit
        reviews.sort((a, b) => b.timestamp - a.timestamp);
        return reviews.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  // Get all reviews for a specific user
  async getUserReviews(userId) {
    const userReviewsRef = ref(database, `reviews/${userId}`);
    
    try {
      const snapshot = await get(userReviewsRef);
      const reviews = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        Object.keys(data).forEach(timestamp => {
          reviews.push({
            ...data[timestamp],
            id: timestamp,
            userId: userId
          });
        });
        
        // Sort by timestamp (most recent first)
        reviews.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      return reviews;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }
  }

  // Get the latest review for a specific user
  async getLatestReviewByUser(userId) {
    const userReviewsRef = ref(database, `reviews/${userId}`);
    
    try {
      const snapshot = await get(userReviewsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const reviews = [];
        
        Object.keys(data).forEach(timestamp => {
          reviews.push({
            ...data[timestamp],
            id: timestamp,
            userId: userId,
            timestamp: parseInt(timestamp)
          });
        });
        
        // Sort by timestamp (most recent first) and return the first one
        reviews.sort((a, b) => b.timestamp - a.timestamp);
        return reviews[0] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching latest review:', error);
      return null;
    }
  }

  // Watch all reviews for a specific user (real-time)
  watchUserReviews(userId, callback) {
    const userReviewsRef = ref(database, `reviews/${userId}`);
    
    return onValue(userReviewsRef, (snapshot) => {
      const reviews = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        Object.keys(data).forEach(timestamp => {
          reviews.push({
            ...data[timestamp],
            id: timestamp,
            userId: userId
          });
        });
        
        // Sort by timestamp (most recent first)
        reviews.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      callback(reviews);
    });
  }

  // Get all reviews from all users (admin function)
  async getAllReviews() {
    const reviewsRef = ref(database, 'reviews');
    
    try {
      const snapshot = await get(reviewsRef);
      const reviews = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        Object.keys(data).forEach(userId => {
          const userReviews = data[userId];
          
          Object.keys(userReviews).forEach(timestamp => {
            reviews.push({
              ...userReviews[timestamp],
              id: timestamp,
              userId: userId
            });
          });
        });
        
        // Sort by timestamp (most recent first)
        reviews.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      return reviews;
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return [];
    }
  }

  // Delete a specific review
  deleteReview(userId, reviewId) {
    const reviewRef = ref(database, `reviews/${userId}/${reviewId}`);
    return remove(reviewRef);
  }

  // Update a specific review
  updateReview(userId, reviewId, updates) {
    const reviewRef = ref(database, `reviews/${userId}/${reviewId}`);
    return update(reviewRef, updates);
  }
}

export default new databaseFunctions();
