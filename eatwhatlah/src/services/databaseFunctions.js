import { database } from '../firebase';
import { ref, set, get, update, remove, onValue } from "firebase/database";

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

  addEmotion(data){
    const emotionsRef = ref(database, 'emotions');
    return push(emotionsRef, data);
  }

  getAllEmotions(callback){
    const emotionsRef = ref(database,'emotions');
    return onValue(emotionsRef, callback)
    
  }


}

export default new databaseFunctions();
