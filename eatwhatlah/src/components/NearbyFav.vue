<script setup>
import { ref, computed, onMounted } from "vue";

let map;
let markers = [];

// Static list of restaurants (replace or extend as needed)
const restaurants = ref([
  {
    id: 1,
    title: "Bræk",
    description: "At Bræk., escape chaos in a nurturing space. Foster connections, spark conversations. Every visit promises unexpected happiness. Committed to a holistic journey, delivering quality and heartfelt attention.",
    category: "Category . $$ . 1.2 miles away . Crowded",
    stars: 3,
    img: "../assets/logos/braek.png",
  },
  {
    id: 2,
    title: "Summer Acai",
    description: "[translate:Enjoy Acai, Forget Anxiety!] Indulge in the goodness of our açaí bowls and let their vibrant flavors and nourishing ingredients bring you a moment of pure relaxation and joy. A delicious escape from the stress of the day!",
    category: "Category . $$ . 1.2 miles away . Crowded",
    stars: 3,
    img: "../assets/logos/summer-acai.jpg",
  }
]);




// Reactive favorites Set
const favorites = ref(new Set());

// Current filter: "nearby" or "favorites"
const filter = ref("nearby");

// Computed list of restaurants to display based on filter
const displayedRestaurants = computed(() => {
  if (filter.value === "favorites") {
    return restaurants.value.filter(r => favorites.value.has(r.id));
  }
  return restaurants.value;
});

// Toggle favorite status by restaurant id
function toggleFavorite(id) {
  if (favorites.value.has(id)) {
    favorites.value.delete(id);
  } else {
    favorites.value.add(id);
  }
}

// Change filter when filter buttons clicked
function setFilter(value) {
  filter.value = value;
}



onMounted(() => {
  const hamburger = document.querySelector("#toggle-btn");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const sidebar = document.querySelector("#sidebar");
      if (sidebar) {
        sidebar.classList.toggle("expand");
      }
    });
  }


  (g => {
    var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary",
      q = "__ib__", m = document, b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams,
      u = () => h || (h = new Promise(async (f, n) => {
        await (a = m.createElement("script"));
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => h = n(Error(p + " could not load."));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
      }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
  })({ key: "AIzaSyAb_Mphc8FUiyDLfOvWTYsVTYvipMLi7bo", v: "weekly", libraries: "places" });


  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        mapId: "DEMO_MAP_ID",
      });

      // Marker for user location
      new AdvancedMarkerElement({
        map,
        position,
        title: "You are here!",
      });

      // Places service instance
      const service = new google.maps.places.PlacesService(map);

      // Clear all markers
      function clearMarkers() {
        markers.forEach(marker => marker.setMap(null));
        markers = [];
      }

      // Search places by text query
      function searchPlaces(query) {
        if (!query) return;

        service.textSearch({ query }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            clearMarkers();
            results.forEach(place => {
              if (place.geometry && place.geometry.location) {
                const marker = new AdvancedMarkerElement({
                  map,
                  position: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  },
                  title: place.name,
                });
                markers.push(marker);
              }
            });
            // Center map at first result
            if (results.length > 0) {
              map.setCenter(results[0].geometry.location);
            }
          }
        });
      }

      // Hook search input keypress "Enter" event to searchPlaces
      const input = document.querySelector(".search-input");
      if (input) {
        input.addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            searchPlaces(input.value);
          }
        });
      }
    });
  } else {
    console.log("Geolocation not supported by this browser.");
  }
});
</script>



<template>
  <!-- NAVBAR -->
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

    <!-- SEARCH BAR -->
    <div class="main p-3">
      <div class="container">
        <!-- Search -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="search-container">
              <input type="text" class="form-control search-input" placeholder="  Search Places" />
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>
        </div>

        <!-- Map -->
        <div class="row justify-content-center mt-3">
          <div class="col">
            <div class="map-container">
              <div id="map"></div>
            </div>
          </div>
        </div>

        <!-- Filter buttons -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="buttonfilter-container">
              <div id="buttonfilter" class="d-flex justify-content-center gap-2">
                <button 
                  type="button" 
                  class="btn" 
                  :class="filter === 'nearby' ? 'btn-primary' : 'btn-secondary'" 
                  @click="setFilter('nearby')"
                >
                  Near By
                </button>
                <button 
                  type="button" 
                  class="btn" 
                  :class="filter === 'favorites' ? 'btn-primary' : 'btn-secondary'" 
                  @click="setFilter('favorites')"
                >
                  Favourites
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Restaurants list -->
        <div v-for="restaurant in displayedRestaurants" :key="restaurant.id" class="card mb-3 my-custom-card mt-5">
          <div class="row no-gutters align-items-center flex-md-row flex-column">
            <div class="col-md-3 col-12 d-flex align-items-center justify-content-center">
              <img :src="restaurant.img" class="card-img my-card-img" />
            </div>
            <div class="col-md-9 col-12">
              <div class="card-body p-4 position-relative">
                <h5 class="card-title">{{ restaurant.title }}</h5>
                <p class="card-text" v-html="restaurant.description"></p>
                <div class="star-rating">
                  <span 
                    v-for="n in 5" 
                    :key="n" 
                    class="star" 
                    :class="n <= restaurant.stars ? 'filled' : ''"
                  >&#9733;</span>
                </div>
                <div class="card-footer-row d-flex justify-content-between align-items-center mt-2">
                  <div>
                    <div class="category-review text-muted">{{ restaurant.category }}</div>
                    <div class="review-line text-muted">Real time reviews: Have it loop through recent reviews</div>
                  </div>
                  <button 
                    type="button" 
                    class="btn" 
                    :class="favorites.has(restaurant.id) ? 'btn-danger' : 'btn-outline-danger'" 
                    @click="toggleFavorite(restaurant.id)"
                  >
                    <i class="bi bi-heart"></i> 
                    {{ favorites.has(restaurant.id) ? 'Remove from Favourites' : 'Add to Favourites' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
  .wrapper{ 
    display:flex;
  }

  a{ 
    text-decoration: none !important;
  }

  #sidebar{ 
    min-height: 100vh; 
    position: fixed; 
    top: 0;
    left: 0;
    bottom: 0;
    width:70px;
    min-width:70px;
    z-index:1000;
    transition: all .25s ease-in-out;
    display: flex;
    flex-direction: column;
    background-color: rgb(26, 26, 28);
  }

  #sidebar.expand{ 
    width: 260px;
    min-width: 260px; 
  } 
  
#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100% - 260px);
}



  #toggle-btn{ 
      background-color: transparent;
      cursor: pointer;
      border: 0;
      padding: 1rem 1.5rem;
  }

  #toggle-btn i{ 
      font-size: 1.5rem;
      color: #fff;
  }

  #navbar-item{ 
    background-color: transparent;
    cursor: pointer;
    border: 0;
    padding: 1rem 1.5rem;
  }

  #navbar-item i{ 
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
  #sidebar:not(.expand) .item-logo{ 
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

  .item:hover{ 
    background-color: rgb(180, 177, 177);
    border-radius: 10px;    
  }


  .main{ 
    min-height:100vh;
    width:100%; 
    overflow: hidden;
    transition: all 0.35s ease-in-out;
    background-color: rgb(239, 239, 239);
    margin-left: 70px;   
    transition: margin-left 0.25s;
  }

  .search-container {
    position: relative;
  }

.search-input {
  height: 50px;
  border-radius: 30px;
  padding-left: 40px; 
  border: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  caret-color: #000; 
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  color: #888;
  pointer-events: none;
}


  #map {
    height: 400px;
    width: 100%;
  }

  .buttonfilter-container{ 
    margin-top: 50px;
  }

  #buttonfilter button:hover{ 
    background-color:rgb(180, 177, 177);
    border-color: rgb(180, 177, 177);
  }

  #buttonfilter button{ 
    font-size:18px;
  }

  .my-custom-card {
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    background: #fff;
  }

  .my-card-img {
    height: 180px;
    width: 100%;
    object-fit: contain;
    border-radius: 0;
    background: #fff;
  }

  .star {
      font-size: 1.5em; 
      color: #ccc; 
    }

  .star.filled {
    color: #ffc107;
  }


  .card-body {
    position: relative;
    min-height: 200px;    
    padding-bottom: 3.4rem; 
  }


  .card-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .category-review,
  .review-line {
    margin-bottom: 0.3rem;
  }

  #addToFavoritesBtn {
    margin-left: 2rem;
    white-space: nowrap;
  }







  @media (max-width: 768px) {
    .my-custom-card .row.no-gutters {
      flex-direction: column !important;
    }

    .my-card-img {
      height: 120px;
      max-width: 250px;
      margin: 0 auto 1rem auto;
      display: block;
    }

    .card-body {
      position: relative;
      padding-bottom: 1.2rem !important; 
    }

    #addToFavoritesBtn {
      position: static !important; 
      width: 100%;
      margin-top: 1rem;
      display: block;
      text-align: center;
      margin-left: 0;

    }

    .card-footer-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.7rem;
    }

  }


  @media (max-width: 576) { 
    #buttonfilter {
      flex-direction: column !important;
      gap: 12px; 
      align-items: stretch; 
      display: flex;
    justify-content: center;     
    align-items: center;  
    }
    #buttonfilter .btn {
      width: 100%;
    }
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
