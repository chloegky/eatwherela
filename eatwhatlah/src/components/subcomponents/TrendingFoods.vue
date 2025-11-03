<template>
  <div class="trending-foods" v-if="trendingFoods.length > 0">
    <h4 class="text-white">Trending in Singapore</h4>
    <div class="trending-tags">
      <span 
        v-for="(food, index) in trendingFoods" 
        :key="index" 
        class="trending-tag"
        @click="selectFood(food)"
      >
        {{ food.query }}
        <span class="trend-label" :class="getTrendClass(food.trend)">
          {{ food.trend }}
        </span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrendingFoods',
  props: {
    trendingFoods: {
      type: Array,
      default: () => []
    }
  },
  
  methods: {
    selectFood(food) {
      this.$emit('select-food', food);
    },
    
    getTrendClass(trend) {
      if (trend === 'Hot') return 'trend-hot';
      if (trend === 'Rising') return 'trend-rising';
      return 'trend-stable';
    }
  }
};
</script>

<style scoped>
.trending-foods {
  background: #90caf9;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(66, 165, 245, 0.2);
  min-height: 500px;
  color: #1e3a5f;
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
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 181, 246, 0.3);
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #1e3a5f;
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trending-tag:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  border-color: #42a5f5;
}

.trend-label {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trend-hot {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.trend-rising {
  background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 167, 38, 0.3);
}

.trend-stable {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 187, 106, 0.3);
}
</style>
