<script>
import { getAuth, signOut } from "firebase/auth";
import placeholderImg from "../assets/placeholder.webp";
import Sidebar from './subcomponents/Sidebar.vue';

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


import discountsData from "../components/scraped_discounts.json";

export default {
  components: {
    Sidebar,
  },

  data() {
    return {
      scraped_discounts: discountsData,
      selectedCategory: "All",
    };
  },

  computed: {
    discountCategories() {
      const categories = new Set();
      this.scraped_discounts.forEach(discount => {
        if (discount.Category) {
          discount.Category.split(',').forEach(cat => categories.add(cat.trim()));
        }
      });
      return ["All", ...Array.from(categories)];
    },

    filteredDiscounts() {
      if (this.selectedCategory === "All") {
        return this.scraped_discounts;
      }
      return this.scraped_discounts.filter(discount =>
        discount.Category &&
        discount.Category.split(',').map(c => c.trim()).includes(this.selectedCategory)
      );
    }
  },

  methods: {
    setCategory(category) {
      this.selectedCategory = category;
    },

    topFunction() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    handleImageError(event) {
      event.target.src = placeholderImg;
      event.target.onerror = null; 
    },
  },

  mounted() {
    const mybutton = document.getElementById("myBtn");
    window.addEventListener("scroll", function () {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
      } else {
        mybutton.style.display = "none";
      }
    });
  }
};
</script>

<template>
  <div class="wrapper">
    <Sidebar />
    <div class="main p-3">
      <button @click="topFunction" id="myBtn" title="Go to top">Back to Top</button>

      <h1 class="fw-bold display-5 text-center mt-4" style="background: linear-gradient(90deg, #274C91 0%, #36C4B2 60%, #1787FF 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Available Discounts</h1>
      <h5 class="text-center" style="color: #9ca3af;">Click on any of the deals to see more information!</h5>
              <hr class="w-25 mx-auto" style="opacity: 0.3; border-color: #374151;" />

      <div class="d-flex justify-content-center flex-wrap gap-2 mb-4 mt-4">
        <button v-for="category in discountCategories" :key="category" @click="setCategory(category)"
          :class="['btn', selectedCategory === category ? 'btn-grey' : 'btn-lightgrey']"
          style="text-transform:capitalize;">
          {{ category }}
        </button>
      </div>

      <div class="row p-5">
        <div class="discount-card-container"
          v-for="(discount, index) in filteredDiscounts" :key="index">
          <a :href="discount['Deal URL']" class="w-100" style="text-decoration:none;">
            <div class="card rounded h-100 d-flex flex-column" style="border-radius: 4%;">

              <img :src="discount['Deal Image']" class="card-img-top rounded-top" alt="Deal image"
                style="height:23rem" @error="handleImageError"/>

              <div class="card-body d-flex flex-column">
                <h3 class="card-title">{{ discount["Brand Name"] }}</h3>
                <h6 class="card-category text-secondary mb-1">
                  <span v-for="(cat, i) in discount['Category'].split(',')" :key="i">
                    {{ cat }}<span v-if="i < discount['Category'].split(',').length - 1"> &bull; </span>
                  </span>
                </h6>
                <p class="card-text" style="font-size: 20px;">
                  {{ discount["Deal Title"] }} <br />
                </p>
                <div>
                  <span v-if="discount['Other Details']" class="selected-badge" style="font-size: 18px;">
                    {{ discount["Other Details"] }}
                  </span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>

  </div>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.wrapper {
  display: flex;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0f1419;
}

a {
  text-decoration: none !important;
} 

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}

.main {
  min-height: 100vh;
  transition: margin-left 0.25s, width 0.25s;
  margin-left: 70px;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%);
  overflow: hidden;
  width: calc(100vw - 70px);
  display: flex;
  flex-direction: column;
  color: #e5e7eb;
}

#sidebar.expand~.main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

.discount-card-container {
  max-width: 400px;
  margin: 0 auto 2rem auto;
  display: flex;
  align-items: stretch;
  flex-direction: column;   
}

.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
  border: 1px solid #374151;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
  border-color: #4b5563;
}

.card-category {
  letter-spacing: 0.02em;
  color: #9ca3af;
}

.card-title {
  font-weight: bold;
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
  color: #f3f4f6;
}

.selected-badge {
  display: inline-block !important;
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  font-size: 0.97rem;
  font-weight: 500;
  border-radius: 0.4rem;
  padding: 0.18em 0.7em;
  letter-spacing: 1px;
  margin: 0.1em 0;
  white-space: nowrap !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  box-shadow: none !important;
  border: 1px solid #374151 !important;
}

.card-text {
  color: #d1d5db;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}


#myBtn {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 30px;
  z-index: 99;
  border: none;
  outline: none;
  background-color: #64b5f6;
  color: white;
  cursor: pointer;
  padding: 15px;
  border-radius: 10px;
  font-size: 18px;
}

#myBtn:hover {
  background-color: #42a5f5;
}




.btn {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.95em;
  border-radius: 22px;
  padding: 0.3em 1em;
  margin: 0 6px 10px 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(40, 40, 40, 0.03);
}

.btn-grey {
  background-color: #60a5fa;
  border-color: #60a5fa;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
  border: 1.5px solid #60a5fa;
}

.btn-grey:hover,
.btn-grey:focus {
  border-color: #3b82f6;
  color: #ffffff;
  transform: translateY(-2px);
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 6px 20px rgba(96, 165, 250, 0.5);
}

.btn-lightgrey {
  background-color: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
  border: 1.5px solid #374151;
}

.btn-lightgrey:hover,
.btn-lightgrey:focus {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%);
  border-color: #667eea;
  color: #ffffff;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px) scale(1.02);
}

#logoutModal .modal-content {
  border-radius: 12px;
}

#logoutModal .btn-dark {
  background-color: #222;
  border: none;
}

#logoutModal .btn-dark:hover {
  background-color: #444;
}
</style>
