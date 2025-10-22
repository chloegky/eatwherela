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

export default {
  mounted() {
    const hamburger = document.querySelector("#toggle-btn");
    if (hamburger) {
      hamburger.addEventListener("click", function () {
        document.querySelector("#sidebar").classList.toggle("expand");
      });
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
  }
}

</script>

<script setup>
import databaseFunctions from '../services/databaseFunctions';
import { ref, onMounted } from "vue";

const selectedEmotion = ref("");
const hoveredEmotion = ref(""); // ✅ Add this since you referenced it in template


async function submitEmotion() {
  if (!selectedEmotion.value) {
    alert("Please select an emotion first!");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation not supported!");
    return;
  }

  const auth = getAuth();
  if (!auth.currentUser) {
    alert("Please sign in to share your emotion!");
    return;
  }

  // ✅ Get current location and save entry to Firebase
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const newEntry = {
      emotion: selectedEmotion.value,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      timestamp: Date.now(),
      userId: auth.currentUser.uid
    };

    databaseFunctions.updateUserEmotion(auth.currentUser.uid, newEntry)
      .then(() => {
        console.log("Emotion saved:", newEntry);
        alert(`Your "${newEntry.emotion}" emotion was saved!`);
      })
      .catch((error) => {
        console.error("Error saving emotion:", error);
        alert("❌ Failed to save emotion. Please try again.");
      });
  });
}
const emotionIcons = {
  delicious: "😋",
  meh: "😐",
  disappointing: "🤢",
  crowded: "👥",
  longWait: "⏳",
};

onMounted(() => {
  // Load Google Maps JS API
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
  
  // After maps loaded, get location and render
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };


      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      const map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        mapId: "DEMO_MAP_ID",
      });

      // Styling the you are here marker
      const youAreHereDiv = document.createElement("div");
      youAreHereDiv.style.width = "22px";
      youAreHereDiv.style.height = "22px";
      youAreHereDiv.style.backgroundColor = "#007bff"; // blue
      youAreHereDiv.style.border = "3px solid white";
      youAreHereDiv.style.borderRadius = "50%";
      youAreHereDiv.style.boxShadow = "0 0 10px rgba(0, 123, 255, 0.7)"; // glowing effect

      new AdvancedMarkerElement({
        map,
        position,
        content: youAreHereDiv,
        title: "You are here!",
        zIndex:9999,
      });


      const plotEmotionsFromFirebase = async () => {
        try {
          // Clear existing emotion markers (except 'You are here' marker)
          if (map.overlays) {
            map.overlays.forEach(overlay => {
              if (overlay.getTitle() !== "You are here!") {
                overlay.setMap(null);
              }
            });
          }

          // Get all emotions from Firebase
          databaseFunctions.getAllEmotions((snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Plot each user's emotion
            Object.entries(data).forEach(([userId, userData]) => {
              const emoji = emotionIcons[userData.emotion] || "❓";
              const markerDiv = document.createElement("div");
              markerDiv.textContent = emoji;
              markerDiv.style.fontSize = "24px";

              new google.maps.marker.AdvancedMarkerElement({
                map,
                content: markerDiv,
                position: { lat: userData.lat, lng: userData.lng },
                title: `Restaurant Status: ${userData.emotion}`,
                zIndex: 9999,
              });
            });
          });
        } catch (error) {
          console.error("Error plotting emotions:", error);
        }
      }
      plotEmotionsFromFirebase();

      //sets a 5 min refresh
      setInterval(() => {
        plotEmotionsFromFirebase();
      }, 300000)

      // Places Service for Nearby Search
      const service = new google.maps.places.PlacesService(map);

      // Search Nearby Restaurants
      service.nearbySearch({
        location: position,
        radius: 1500,
        type: "restaurant"
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach(place => {
            if (place.geometry && place.geometry.location) {
              new AdvancedMarkerElement({
                map,
                position: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                title: place.name
              });
            }
          });
        }
      });

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


    <div class="main p-3">
      <!-- <h3>Map</h3> -->
      <div class="emotion-input-container">
        <!-- Restaurant status indicators -->
        <h5>How would you describe this restaurant?</h5> 
        <div class="emoji-grid" >
          <button v-for="(emoji,emotion) in emotionIcons" :key="emotion"
          class="emoji-button" style="margin: auto;" 
          :class="{
            hovered: hoveredEmotion === emotion && selectedEmotion !== emotion,
            active: selectedEmotion === emotion
          }"
          @mouseover="hoveredEmotion = emotion"
          @mouseleave="hoveredEmotion= ''"
          @click="selectedEmotion = emotion; submitEmotion();">
          <span> {{ emoji }}</span>
          <small> {{ emotion }}</small>
        </button>
        </div>
      </div>
      <div id="map"></div>
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
#map {
  height: 950px;
  width: 100%;
}

h3 {
  text-align: center;
  font-family: Arial, sans-serif;
}

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
  width: calc(100vw - 260px);}

.emotion-input-container {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.emoji-button {
  background: white;
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  font-size: 24px;
  transition: 0.2s ease;
}

.emoji-button small {
  display: block;
  font-size: 12px;
  color: #555;
}

.emoji-button.hovered {
  transform: scale(1.15);
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.4);
}

.emoji-button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  transform: scale(1.1);
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





