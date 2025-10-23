<script>
import { getAuth, signOut } from "firebase/auth";

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
  data() {
    return {
      scraped_discounts: discountsData,
      selectedCategory: "All",
    };
  },
  computed: {
    // Compute unique discount categories from data
    discountCategories() {
      const categories = new Set();
      this.scraped_discounts.forEach(discount => {
        if (discount.Category) {
          discount.Category.split(',').forEach(cat => categories.add(cat.trim()));
        }
      });
      return ["All", ...Array.from(categories)];
    },
    // Filter discounts based on selected category
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
    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/Login"); // redirect to login page
      } catch (error) {
        console.error("Error signing out:", error);
        alert("❌ Failed to sign out. Please try again.");
      }
    },

    async confirmLogout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/Login");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("❌ Failed to sign out. Please try again.");
      }
    },

    setCategory(category) {
      this.selectedCategory = category;
    },
    topFunction() {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  mounted() {
    const hamburger = document.querySelector("#toggle-btn");
    if (hamburger) {
      hamburger.addEventListener("click", function() {
        document.querySelector("#sidebar").classList.toggle("expand");
      });
    }

    const mybutton = document.getElementById("myBtn");
    window.addEventListener("scroll", function() {
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
    <aside id="sidebar">
      <div class="d-flex align-items-center mb-3">
        <button id="toggle-btn" type="button">
          <i class="lni lni-grid-alt"></i>
        </button>
        <div class="sidebar-logo ml-2">
          <RouterLink to="/Home/">Home</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Profile/')">
          <i class="lni lni-user"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Profile/">Profile</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/NearbyFav/')">
          <i class="lni lni-heart"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/NearbyFav/">Favourites</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Map/')">
          <i class="lni lni-map"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Map/">Map</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Discounts/')">
          <i class="lni lni-ticket"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Discounts/">Discounts</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button" @click="$router.push('/Price_Comparison/')">
          <i class="lni lni-dollar"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Price_Comparison/">Filter by Price</RouterLink>
        </div>
      </div>

      <!-- Logout Button -->
        <div class="item d-flex align-items-center mt-auto mb-3">
          <button
            id="navbar-item"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#logoutModal"
          >
            <i class="lni lni-exit"></i>
          </button>
          <div class="item-logo ml-2">
            <a href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">Logout</a>
          </div>
        </div>

    </aside>

    <div class="main p-3">
  <button @click="topFunction" id="myBtn" title="Go to top">Back to Top</button>

  <h1 class="fw-bold display-5 text-white text-center mt-4">Available Discounts</h1>
  <h5 class="text-center text-secondary">Click on any of the deals to see more information!</h5>

  <!-- Category filter buttons -->
  <div class="d-flex justify-content-center flex-wrap gap-2 mb-4 mt-4">
    <button
      v-for="category in discountCategories"
      :key="category"
      @click="setCategory(category)"
      :class="['btn', selectedCategory === category ? 'btn-grey' : 'btn-lightgrey']"
      style="text-transform:capitalize;"
    >
      {{ category }}
    </button>
  </div>

  <div class="row p-5">
    <div
      class="col-12 col-md-6 col-lg-3 mb-5 px-4 d-flex align-items-stretch"
      v-for="(discount, index) in filteredDiscounts"
      :key="index"
    >
      <a :href="discount['Deal URL']" class="w-100" style="text-decoration:none;">
        <div class="card rounded h-100 d-flex flex-column" style="border-radius: 4%;">

          <img
            :src="discount['Deal Image']"
            class="card-img-top rounded-top"
            alt="Deal image"
            style="height:23rem"
          />

          <div class="card-body d-flex flex-column">
            <h3 class="card-title">{{ discount["Brand Name"] }}</h3>
            <h6 class="card-category text-secondary mb-1">
              <span v-for="(cat, i) in discount['Category'].split(',')" :key="i">
                {{ cat }}<span v-if="i < discount['Category'].split(',').length-1"> &bull; </span>
              </span>
            </h6>
            <p class="card-text" style="font-size: 20px;">
              {{ discount["Deal Title"] }} <br/>
            </p>
            <div>
              <span
                v-if="discount['Other Details']"
                class="selected-badge"
                style="font-size: 18px;"
              >
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

  <!-- Logout Confirmation Modal -->
  <div
    class="modal fade"
    id="logoutModal"
    tabindex="-1"
    aria-labelledby="logoutModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-3 border-0 shadow-lg rounded">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold" id="logoutModalLabel">
            Confirm Logout
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body text-center">
          <i class="bi bi-box-arrow-right fs-1 text-danger mb-3"></i>
          <p class="mb-0 fs-5">Are you sure you want to log out?</p>
        </div>

        <div class="modal-footer border-0 d-flex justify-content-center gap-3">
          <button
            type="button"
            class="btn btn-secondary px-4"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-dark px-4"
            @click="confirmLogout"
            data-bs-dismiss="modal"
          >
            Yes, Log Out
          </button>
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
}

a {
  text-decoration: none !important;
}

/* Sidebar - Refined with Aligned Icons */
#sidebar {
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 72px;
  min-width: 72px;
  z-index: 1000;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a1c 0%, #16161a 100%);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

#sidebar.expand {
  width: 260px;
  min-width: 260px;
}

#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100% - 260px);
}

#toggle-btn, #navbar-item {
  background-color: transparent;
  cursor: pointer;
  border: 0;
  padding: 1rem 1.25rem;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 56px;
}

#toggle-btn:hover, #navbar-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

#toggle-btn i, #navbar-item i {
  font-size: 1.4rem;
  color: #e8eaed;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo a, .item-logo a {
  color: #e8eaed;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

#sidebar:not(.expand) .sidebar-logo,
#sidebar:not(.expand) .item-logo {
  visibility: hidden;
  width: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  pointer-events: none;
  transition: visibility 0s linear 0.28s, width 0.28s ease;
}

.sidebar-logo, .item-logo {
  transition: width 0.28s ease, visibility 0s linear 0s;
  white-space: nowrap;
}

.item {
  margin: 0.25rem 0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}


.main {
  min-height: 100vh;
  transition: margin-left 0.25s, width 0.25s;
  margin-left: 70px;
  background: 
  radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
  #0a0a0f;

  overflow: hidden;
  width: calc(100vw - 70px);
  display: flex;
  flex-direction: column;
}
#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.card-category {
  letter-spacing: 0.02em;
}

.card-title {
  font-weight: bold;
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.selected-badge {
  display: inline-block !important;
  background: #eaf6fe;
  color: #18a1d7;
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
  border: none !important;
}

.card-text {
  color: #535353;
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
  background-color: rgb(73, 71, 71);
  color:white; 
  cursor: pointer; 
  padding: 15px; 
  border-radius: 10px; 
  font-size: 18px; 
}

#myBtn:hover {
  background-color: #aba5a5; 
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
  box-shadow: 0 2px 6px rgba(40,40,40,0.03);
}

.btn-grey {
  background-color: #555555;
  border-color: #555555;
  color: #f0f0f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-grey:hover,
.btn-grey:focus {
  border-color: #4facfe;
  color: #ffffff;
  transform: translateY(-2px);
  background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%);
  box-shadow: 0 6px 20px rgba(86, 204, 242, 0.35);
}

.btn-lightgrey {
  background-color: #e0e0e0;
  border-color: #bdbdbd;
  color: #555555;
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
