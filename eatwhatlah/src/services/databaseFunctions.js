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
    return set(userEmotionRef, data);
  }

  getUserEmotion(userId, callback) {
    const userEmotionRef = ref(database, `userEmotions/${userId}`);
    return onValue(userEmotionRef, callback);
  }

  getAllEmotions(callback) {
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
  
}

export default new databaseFunctions();
