<template>
  <div v-if="restaurants.length > 0" class="restaurant-results">
    <h3>Found {{ restaurants.length }} restaurants near you</h3>
    <div class="restaurant-grid">
      <div 
        v-for="restaurant in restaurants" 
        :key="restaurant.id" 
        class="restaurant-card"
      >
        <img 
          :src="restaurant.img" 
          :alt="restaurant.name" 
          class="restaurant-image"
          @error="handleImageError($event)"
        >

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

          <div class="restaurant-actions">
            <button @click="viewDetails(restaurant)" class="btn-details">
              <i class="fas fa-info-circle"></i> Details
            </button>
            <button @click="getDirections(restaurant)" class="btn-directions">
              <i class="fas fa-directions"></i> Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import placeholderImage from '../../assets/placeholder.webp';

export default {
  name: 'RestaurantResults',
  props: {
    restaurants: {
      type: Array,
      default: () => []
    }
  },
  
  methods: {
    handleImageError(event) {
      event.target.src = placeholderImage;
    },
    
    viewDetails(restaurant) {
      this.$emit('view-details', restaurant);
    },
    
    getDirections(restaurant) {
      this.$emit('get-directions', restaurant);
    }
  }
};
</script>

<style scoped>
.restaurant-results {
  margin-top: 30px;
  padding: 20px;
}

.restaurant-results h3 {
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
}

.restaurant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.restaurant-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
    display: flex;
  flex-direction: column;
}

.restaurant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.restaurant-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.restaurant-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.restaurant-info h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e3a5f;
}

.restaurant-cuisine {
  color: #64b5f6;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 12px;
}

.restaurant-location,
.restaurant-distance {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.restaurant-location i,
.restaurant-distance i {
  color: #42a5f5;
}

.restaurant-rating {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 15px;
}

.restaurant-rating i {
  color: #ffc107;
}

.restaurant-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.btn-details,
.btn-directions {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-details {
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
  color: white;
}

.btn-details:hover {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-2px);
}

.btn-directions {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  color: white;
}

.btn-directions:hover {
  background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);
  transform: translateY(-2px);
}
</style>
