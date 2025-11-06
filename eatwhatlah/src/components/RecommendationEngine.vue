<template>
  <div class="recommendations-container">
    <div v-if="recommendations.length > 0" class="recommendations-section">
      <h4 class="recommendations-title">
        <i class="fas fa-magic"></i> 
        {{ getRecommendationTitle() }}
      </h4>
      <div class="recommendations-grid">
        <div 
          v-for="(rec, index) in recommendations.slice(0, 6)" 
          :key="index"
          class="recommendation-card"
          @click="$emit('selectRecommendation', rec)">
          <div class="rec-icon">
            <i :class="rec.icon || 'fas fa-utensils'"></i>
          </div>
          <div class="rec-content">
            <h5 class="rec-title">{{ rec.title }}</h5>
            <p class="rec-reason">{{ rec.reason }}</p>
            <div class="rec-score">
              <span class="score-badge" :class="getScoreClass(rec.score)">
                {{ Math.round(rec.score) }}% match
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-recommendations">
      <i class="fas fa-compass"></i>
      <p>Discovering your taste preferences...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecommendationEngine',
  props: {
    userSearchHistory: {
      type: Array,
      default: () => []
    },
    trendingFoods: {
      type: Array,
      default: () => []
    },
    userLocation: {
      type: Object,
      default: () => null
    },
    currentTime: {
      type: Date,
      default: () => new Date()
    }
  },
  
  data() {
    return {
      recommendations: [],
      googleTrendsData: {},
      foodDatabase: {
        breakfast: [
          { name: 'Kaya Toast', keywords: ['toast', 'kaya', 'coffee'], cuisine: 'local', icon: 'fas fa-bread-slice' },
          { name: 'Dim Sum', keywords: ['dimsum', 'dumplings', 'chinese'], cuisine: 'chinese', icon: 'fas fa-utensils' },
          { name: 'Pancakes', keywords: ['pancakes', 'western', 'sweet'], cuisine: 'western', icon: 'fas fa-utensils' },
          { name: 'Congee', keywords: ['porridge', 'congee', 'chinese'], cuisine: 'chinese', icon: 'fas fa-utensils' },
          { name: 'Roti Prata', keywords: ['roti', 'prata', 'indian'], cuisine: 'indian', icon: 'fas fa-circle' }
        ],
        lunch: [
          { name: 'Chicken Rice', keywords: ['chicken', 'rice', 'hainanese'], cuisine: 'local', icon: 'fas fa-drumstick-bite' },
          { name: 'Laksa', keywords: ['laksa', 'noodles', 'spicy'], cuisine: 'local', icon: 'fas fa-fire' },
          { name: 'Nasi Lemak', keywords: ['nasi', 'lemak', 'coconut'], cuisine: 'local', icon: 'fas fa-seedling' },
          { name: 'Ramen', keywords: ['ramen', 'japanese', 'noodles'], cuisine: 'japanese', icon: 'fas fa-utensils' },
          { name: 'Burger', keywords: ['burger', 'western', 'beef'], cuisine: 'western', icon: 'fas fa-hamburger' },
          { name: 'Sushi', keywords: ['sushi', 'japanese', 'fish'], cuisine: 'japanese', icon: 'fas fa-fish' }
        ],
        dinner: [
          { name: 'Hotpot', keywords: ['hotpot', 'chinese', 'soup'], cuisine: 'chinese', icon: 'fas fa-utensils' },
          { name: 'BBQ', keywords: ['bbq', 'barbecue', 'meat'], cuisine: 'korean', icon: 'fas fa-fire' },
          { name: 'Pasta', keywords: ['pasta', 'italian', 'western'], cuisine: 'italian', icon: 'fas fa-utensils' },
          { name: 'Thai Food', keywords: ['thai', 'spicy', 'tom yum'], cuisine: 'thai', icon: 'fas fa-pepper-hot' },
          { name: 'Indian Curry', keywords: ['curry', 'indian', 'spicy'], cuisine: 'indian', icon: 'fas fa-seedling' }
        ],
        snacks: [
          { name: 'Bubble Tea', keywords: ['bubble', 'tea', 'boba'], cuisine: 'taiwanese', icon: 'fas fa-mug-hot' },
          { name: 'Ice Cream', keywords: ['ice', 'cream', 'dessert'], cuisine: 'dessert', icon: 'fas fa-ice-cream' },
          { name: 'Cookies', keywords: ['cookies', 'sweet', 'dessert'], cuisine: 'dessert', icon: 'fas fa-cookie' },
          { name: 'Fruit Juice', keywords: ['juice', 'fruit', 'healthy'], cuisine: 'healthy', icon: 'fas fa-apple-alt' }
        ]
      }
    }
  },
  
  watch: {
    userSearchHistory: {
      handler() {
        this.generateRecommendations();
      },
      deep: true
    },
    trendingFoods: {
      handler() {
        this.generateRecommendations();
      },
      deep: true
    }
  },
  
  mounted() {
    this.fetchGoogleTrends();
    this.generateRecommendations();
    setInterval(() => {
      this.generateRecommendations();
    }, 5 * 60 * 1000);
    
    setInterval(() => {
      this.fetchGoogleTrends();
    }, 24 * 60 * 60 * 1000);
  },
  
  methods: {
    async fetchGoogleTrends() {
      console.log('Fetching Google Trends data from API...');
      
      try {
        const response = await fetch('https://us-central1-eatwhatlah-b6d02.cloudfunctions.net/getTrendingFoods', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            this.googleTrendsData = result.data;
            console.log('Google Trends data fetched successfully:', this.googleTrendsData);
            this.generateRecommendations();
          } else {
            throw new Error('Invalid response from Firebase Function');
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to fetch Google Trends data:', error);
        this.googleTrendsData = {};
      }
    },
    
    generateRecommendations() {
      console.log('Generating recommendations...');
      
      const timeScore = this.calculateTimeBasedScore();
      const historyScore = this.calculateHistoryBasedScore();
      const trendingScore = this.calculateTrendingScore();
      
      const allFoods = [
        ...this.foodDatabase.breakfast,
        ...this.foodDatabase.lunch,
        ...this.foodDatabase.dinner,
        ...this.foodDatabase.snacks
      ];
      
      const scoredRecommendations = allFoods.map(food => {
        const timeWeight = timeScore[food.name] || 0;
        const historyWeight = historyScore[food.name] || 0;
        const trendingWeight = trendingScore[food.name] || 0;
        const finalScore = (timeWeight * 0.4) + (historyWeight * 0.4) + (trendingWeight * 0.2);
        
        return {
          ...food,
          score: finalScore,
          title: food.name,
          icon: food.icon || 'fas fa-utensils',
          reason: this.generateReasonText(food, timeWeight, historyWeight, trendingWeight)
        };
      });
      this.recommendations = scoredRecommendations
        .sort((a, b) => b.score - a.score)
        .filter(rec => rec.score > 20) 
        .slice(0, 6);
      
      console.log('Generated recommendations:', this.recommendations);
      
      this.$emit('recommendationsUpdated', this.recommendations);
    },
    
    calculateTimeBasedScore() {
      const hour = this.currentTime.getHours();
      const scores = {};
      
      if (hour >= 6 && hour < 11) {
        this.foodDatabase.breakfast.forEach(food => {
          scores[food.name] = 90 - Math.abs(hour - 8) * 5; 
        });
      }
      else if (hour >= 11 && hour < 15) {
        this.foodDatabase.lunch.forEach(food => {
          scores[food.name] = 90 - Math.abs(hour - 12) * 8; 
        });
      }
      else if (hour >= 17 && hour < 22) {
        this.foodDatabase.dinner.forEach(food => {
          scores[food.name] = 90 - Math.abs(hour - 19) * 5; 
        });
      }
      this.foodDatabase.snacks.forEach(food => {
        if (hour >= 14 && hour < 17) {
          scores[food.name] = 70; 
        } else if (hour >= 22 || hour < 6) {
          scores[food.name] = 50; 
        } else {
          scores[food.name] = 30; 
        }
      });
      
      return scores;
    },
    
    calculateHistoryBasedScore() {
      const scores = {};
      
      if (!this.userSearchHistory || this.userSearchHistory.length === 0) {
        return scores;
      }
      const categoryCount = {};
      const cuisineCount = {};
      const recentSearches = this.userSearchHistory.slice(0, 10);
      
      recentSearches.forEach((search, index) => {
        const weight = 1 - (index * 0.1); 
        
        categoryCount[search.category] = (categoryCount[search.category] || 0) + weight;

        const query = search.query.toLowerCase();
        
        Object.values(this.foodDatabase).flat().forEach(food => {
          let matchScore = 0;
          
          food.keywords.forEach(keyword => {
            if (query.includes(keyword)) {
              matchScore += 20 * weight;
            }
          });
          
          if (categoryCount[food.cuisine]) {
            matchScore += categoryCount[food.cuisine] * 10;
          }
          
          scores[food.name] = (scores[food.name] || 0) + matchScore;
        });
      });
      
      const maxScore = Math.max(...Object.values(scores), 1);
      Object.keys(scores).forEach(key => {
        scores[key] = (scores[key] / maxScore) * 100;
      });
      
      return scores;
    },
    
    calculateTrendingScore() {
      const scores = {};
      
      Object.values(this.foodDatabase).flat().forEach(food => {
        const foodNameLower = food.name.toLowerCase();
        
        let maxTrendScore = 0;
        Object.keys(this.googleTrendsData).forEach(trendKey => {
          if (foodNameLower.includes(trendKey) || 
              food.keywords.some(kw => kw.includes(trendKey) || trendKey.includes(kw))) {
            maxTrendScore = Math.max(maxTrendScore, this.googleTrendsData[trendKey]);
          }
        });
        
        if (maxTrendScore > 0) {
          scores[food.name] = maxTrendScore;
        }
      });
      
      if (this.trendingFoods && this.trendingFoods.length > 0) {
        this.trendingFoods.forEach((trending, index) => {
          const trendingQuery = trending.query.toLowerCase();
          const baseScore = 80 - (index * 10);
          
          Object.values(this.foodDatabase).flat().forEach(food => {
            food.keywords.forEach(keyword => {
              if (trendingQuery.includes(keyword) || keyword.includes(trendingQuery)) {
                scores[food.name] = Math.max(scores[food.name] || 0, baseScore);
              }
            });
          });
        });
      }
      
      return scores;
    },
    
    generateReasonText(food, timeWeight, historyWeight, trendingWeight) {
      const reasons = [];
      
      if (timeWeight > 50) {
        const hour = this.currentTime.getHours();
        if (hour >= 6 && hour < 11) {
          reasons.push("Perfect for breakfast");
        } else if (hour >= 11 && hour < 15) {
          reasons.push("Great lunch option");
        } else if (hour >= 17 && hour < 22) {
          reasons.push("Ideal dinner choice");
        } else {
          reasons.push("Good snack option");
        }
      }
      
      if (historyWeight > 40) {
        reasons.push("Based on your preferences");
      }
      
      if (trendingWeight > 30) {
        reasons.push("Trending in Singapore");
      }
      
      if (reasons.length === 0) {
        reasons.push("Popular choice nearby");
      }
      
      return reasons.join(" • ");
    },
    
    getRecommendationTitle() {
      const hour = this.currentTime.getHours();
      
      if (hour >= 6 && hour < 11) {
        return "🌅 Morning Recommendations";
      } else if (hour >= 11 && hour < 15) {
        return "☀️ Lunch Recommendations";
      } else if (hour >= 15 && hour < 17) {
        return "🍵 Afternoon Picks";
      } else if (hour >= 17 && hour < 22) {
        return "🌆 Dinner Suggestions";
      } else {
        return "🌙 Late Night Options";
      }
    },
    
    getScoreClass(score) {
      if (score >= 80) return 'score-excellent';
      if (score >= 60) return 'score-good';
      if (score >= 40) return 'score-fair';
      return 'score-low';
    }
  }
}
</script>

<style scoped>
.recommendations-container {
  margin: 0;
}

.recommendations-section {
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
  border-radius: 15px;
  padding: 20px;
  color: #e5e7eb;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  height: 100%;
  min-height: 500px;
  border: 1px solid #374151;
}

.recommendations-title {
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e5e7eb;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.recommendation-card {
  background: rgba(31, 41, 55, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.recommendation-card:hover {
  background: rgba(45, 55, 72, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(96, 165, 250, 0.3);
  border-color: #60a5fa;
}

.rec-icon {
  width: 35px;
  height: 35px;
  background: rgba(96, 165, 250, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  color: #e5e7eb;
}

.rec-content {
  flex: 1;
  min-width: 0;
}

.rec-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #f3f4f6;
}

.rec-reason {
  font-size: 0.8rem;
  margin: 0 0 8px 0;
  color: #9ca3af;
  line-height: 1.3;
}

.rec-score {
  display: flex;
  justify-content: flex-start;
}

.score-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.score-excellent {
  background: rgba(34, 197, 94, 0.8);
  color: white;
}

.score-good {
  background: rgba(59, 130, 246, 0.8);
  color: white;
}

.score-fair {
  background: rgba(245, 158, 11, 0.8);
  color: white;
}

.score-low {
  background: rgba(156, 163, 175, 0.8);
  color: white;
}

.no-recommendations {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.no-recommendations i {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .recommendation-card {
    padding: 12px;
  }
  
  .rec-title {
    font-size: 0.9rem;
  }
  
  .rec-reason {
    font-size: 0.75rem;
  }
}
</style>