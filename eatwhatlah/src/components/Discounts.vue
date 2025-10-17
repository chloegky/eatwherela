<script>
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
      scraped_discounts: discountsData
    };
  },

  methods: {
  topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  mounted() {
    const hamburger = document.querySelector("#toggle-btn");
    if (hamburger) {
      hamburger.addEventListener("click", function () {
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
        <button id="navbar-item" type="button">
          <i class="lni lni-user"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Profile/">Profile</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button">
          <i class="lni lni-heart"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/NearbyFav/">Favourites</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button">
          <i class="lni lni-map"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Map/">Map</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button">
          <i class="lni lni-ticket"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Discounts/">Discounts</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button">
          <i class="lni lni-dollar"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Price_Comparison/">Filter by Price</RouterLink>
        </div>
      </div>
    </aside>

    <div class="main p-3">
      <button @click="topFunction" id="myBtn" title="Go to top">Back to Top</button>

      <h1 class="text-center mt-4">Available Discounts</h1>
      <h5 class="text-center text-secondary">Click on any of the deals to see more information!</h5>

      <div class="row p-5">
        <div class="col-12 col-md-6 col-lg-3 mb-5 px-4 d-flex align-items-stretch" v-for="(discount, index) in scraped_discounts" :key="index">
          <a :href="discount['Deal URL']" class="w-100" style="text-decoration: none;">
            <div class="card rounded h-100 d-flex flex-column" style="border-radius: 4%;">
              <!-- image -->
              <img :src="discount['Deal Image']" class="card-img-top rounded-top" alt="Deal image" style="height:23rem"/>
              <!-- deal details -->
              <div class="card-body d-flex flex-column">
                <h3 class="card-title">{{discount["Brand Name"]}}</h3>
                <h6 class="card-category text-secondary mb-1">
                  <span v-for="(cat, i) in discount['Category'].split(',')" :key="i">
                    {{ cat }}<span v-if="i < discount['Category'].split(',').length-1"> &bull; </span>
                  </span>
                </h6>
                <p class="card-text" style="font-size: 20px;">
                  {{discount["Deal Title"]}} <br>
                </p>
              <div>
                <span v-if="discount['Other Details']" class="selected-badge" style="font-size: 18px;">
                  {{discount["Other Details"]}}
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

.wrapper {
  display: flex;
}
a {
  text-decoration: none !important;
}
#sidebar {
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 70px;
  min-width: 70px;
  z-index: 1000;
  transition: all 0.25s ease-in-out;
  display: flex;
  flex-direction: column;
  background-color: rgb(26, 26, 28);
}
#sidebar.expand {
  width: 260px;
  min-width: 260px;
}
#toggle-btn {
  background-color: transparent;
  cursor: pointer;
  border: 0;
  padding: 1rem 1.5rem;
}
#toggle-btn i {
  font-size: 1.5rem;
  color: #fff;
}
#navbar-item {
  background-color: transparent;
  cursor: pointer;
  border: 0;
  padding: 1rem 1.5rem;
}
#navbar-item i {
  font-size: 1.5rem;
  color: #fff;
}
.sidebar-logo a {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}
.item-logo a {
  color: #fff;
  font-size: 18px;
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
  transition: visibility 0s linear 0.25s, width 0.25s ease;
}
.sidebar-logo,
.item-logo {
  transition: width 0.25s ease, visibility 0s linear 0s;
  white-space: nowrap;
}
.item:hover {
  background-color: rgb(180, 177, 177);
  border-radius: 10px;
}
.main {
  min-height: 100vh;
  transition: margin-left 0.25s, width 0.25s;
  margin-left: 70px;
  background-color: rgb(239, 239, 239);
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

</style>
