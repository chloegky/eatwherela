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
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
  border-radius: 15px;
  padding: 30px 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  min-height: 500px;
  color: #e5e7eb;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid #374151;
}

.trending-foods h4 {
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0 5px;
  color: #e5e7eb;
}

.trending-tags {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 5px;
}

.trending-tag {
  background: rgba(31, 41, 55, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 18px 20px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #e5e7eb;
  text-align: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 60px;
  width: 100%;
  box-sizing: border-box;
}

.trending-tag:hover {
  background: rgba(45, 55, 72, 0.8);
  transform: translateY(-2px);
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
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
