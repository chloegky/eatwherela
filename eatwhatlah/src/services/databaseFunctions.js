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
  getAllRestaurants(callback) {
    const restaurantsRef = ref(database, 'restaurants');
    return onValue(restaurantsRef, callback);
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
  
}

export default new databaseFunctions();
