<template>
  <div class="search-wrapper">
    <i class="fas fa-search search-icon"></i>
    <input 
      v-model="searchInput" 
      @keydown.enter="handleEnter" 
      @focus="showRecent = true"
      @input="handleInput" 
      :class="['search-input', { 'placeholder-fading': placeholderFading }]"
      :placeholder="placeholder" 
    />
    <button 
      @click="handleSearch" 
      :disabled="!searchInput.trim()" 
      class="search-button" 
      type="button"
    >
      <i class="fas fa-search"></i>
    </button>

    <!-- Recent Searches Dropdown -->
    <div 
      v-if="showRecent && recentSearches.length > 0 && !searchInput"
      class="recent-searches-dropdown"
    >
      <div 
        v-for="item in recentSearches" 
        :key="item.id" 
        class="search-history-item"
        @click="selectHistoryItem(item)"
      >
        <div class="history-main">
          <i class="fas fa-history"></i>
          <span>{{ item.query }}</span>
        </div>
        <span class="history-category">{{ item.category }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'What are you craving?'
    },
    placeholderFading: {
      type: Boolean,
      default: false
    },
    recentSearches: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      searchInput: this.modelValue,
      showRecent: false
    };
  },
  
  watch: {
    modelValue(newVal) {
      this.searchInput = newVal;
    },
    searchInput(newVal) {
      this.$emit('update:modelValue', newVal);
    }
  },
  
  methods: {
    handleSearch() {
      if (this.searchInput.trim()) {
        this.$emit('search', this.searchInput);
        this.showRecent = false;
      }
    },
    
    handleEnter() {
      this.handleSearch();
    },
    
    handleInput() {
      this.$emit('input', this.searchInput);
    },
    
    selectHistoryItem(item) {
      this.$emit('select-history', item);
      this.showRecent = false;
    }
  }
};
</script>

<style scoped>
.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #64b5f6;
  font-size: 1.2rem;
  z-index: 1;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 16px 60px 16px 55px;
  font-size: 1rem;
  border: 2px solid rgba(100, 181, 246, 0.3);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #42a5f5;
  box-shadow: 0 6px 20px rgba(66, 165, 245, 0.2);
  background: white;
}

.search-input.placeholder-fading::placeholder {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-50%) scale(1.05);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recent-searches-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-history-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-history-item:last-child {
  border-bottom: none;
}

.search-history-item:hover {
  background: rgba(66, 165, 245, 0.05);
}

.history-main {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
}

.history-main i {
  color: #64b5f6;
}

.history-category {
  font-size: 0.85rem;
  color: #999;
  text-transform: capitalize;
}
</style>
