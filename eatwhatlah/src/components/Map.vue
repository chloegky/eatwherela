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
        this.$router.push("/");
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
        this.$router.push("/");
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
import { getDatabase, onValue} from 'firebase/database';

// Existing reactive variables
const selectedEmotion = ref("");
const hoveredEmotion = ref("");

// New reactive variables for review functionality
const restaurantName = ref("");
const reviewRating = ref(0);
const reviewText = ref("");
const uploadedImages = ref([]);
const hoveredStar = ref(0);

let map = null;
let currentMarkers = {};
let selectedPlace = null;

function roundCoord(coord) {
  return Math.round(coord * 1000) / 1000;
}

// Existing emotion submission function
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
        if (currentMarkers[auth.currentUser.uid]) {
          currentMarkers[auth.currentUser.uid].setMap(null);
          delete currentMarkers[auth.currentUser.uid];
        }
        
        const markerDiv = document.createElement("div");
        markerDiv.textContent = emotionIcons[newEntry.emotion];
        markerDiv.style.fontSize = "24px";

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: markerDiv,
          position: { lat: newEntry.lat, lng: newEntry.lng },
          title: `Restaurant Status: ${newEntry.emotion}`,
          zIndex: 9999,
        });

        currentMarkers[auth.currentUser.uid] = marker;
        alert(`Your "${newEntry.emotion}" status was saved!`);
      })
      .catch((error) => {
        console.error("Error saving emotion:", error);
        alert("❌ Failed to save status. Please try again.");
      });
  });
}

// New review functionality methods
function setRating(star) {
  reviewRating.value = star;
}

function hoverStar(star) {
  hoveredStar.value = star;
}

function resetHover() {
  hoveredStar.value = 0;
}

function handleImageUpload(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImages.value.push({
          src: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  }
}

function removeImage(index) {
  uploadedImages.value.splice(index, 1);
}

async function submitReview() {
  if (!restaurantName.value) {
    alert("Please enter a restaurant name or click on a restaurant marker!");
    return;
  }
  if (reviewRating.value === 0) {
    alert("Please select a star rating!");
    return;
  }
  if (!reviewText.value.trim()) {
    alert("Please write a review!");
    return;
  }

  const auth = getAuth();
  if (!auth.currentUser) {
    alert("Please sign in to submit a review!");
    return;
  }

  const reviewData = {
    restaurantName: restaurantName.value,
    rating: reviewRating.value,
    reviewText: reviewText.value,
    images: uploadedImages.value,
    userId: auth.currentUser.uid,
    timestamp: Date.now()
  };

  try {
    await databaseFunctions.saveReview(auth.currentUser.uid, reviewData);
    
    // Show success modal instead of alert
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
    
    // Reset form
    restaurantName.value = "";
    reviewRating.value = 0;
    reviewText.value = "";
    uploadedImages.value = [];
  } catch (error) {
    console.error("Error submitting review:", error);
    alert("❌ Failed to submit review. Please try again.");
  }
}


function createClickableRestaurantMarker(place, service) {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    },
    title: place.name
  });

  // Create InfoWindow for emoji counts
  const emojiInfoWindow = new google.maps.InfoWindow();

  // Hover event to show emoji counts
  marker.addListener('mouseenter', () => {
    const lat = roundCoord(place.geometry.location.lat());
    const lng = roundCoord(place.geometry.location.lng());
    const locationKey = `${lat},${lng}`;
    
    const db = getDatabase();
    const emotionsRef = dbRef(db, "emotions");
    
    onValue(emotionsRef, (snapshot) => {
      const data = snapshot.val();
      const countsByLocation = {};

      if (data) {
        Object.values(data).forEach((entry) => {
          const entryLat = roundCoord(entry.lat);
          const entryLng = roundCoord(entry.lng);
          const entryKey = `${entryLat},${entryLng}`;

          const hour = new Date(entry.timestamp).getHours();
          const emotion = entry.emotion;

          if (!countsByLocation[entryKey]) {
            countsByLocation[entryKey] = {};
          }
          if (!countsByLocation[entryKey][hour]) {
            countsByLocation[entryKey][hour] = {};
          }
          if (!countsByLocation[entryKey][hour][emotion]) {
            countsByLocation[entryKey][hour] = 0;
          }

          countsByLocation[entryKey][hour][emotion]++;
        });
      }

      const now = new Date();
      const currentHour = now.getHours();
      const hourData = countsByLocation[locationKey]?.[currentHour] || {};

      // Build styled popup content
      let emojiContent = `
        <div style='padding: 12px; min-width: 200px; font-family: Inter, sans-serif;'>
          <div style='margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;'>
            <b style='display: block; font-size: 15px; color: #1f2937;'>${place.name}</b>
          </div>
          <div style='margin-top: 8px;'>
            <b style='color: #6b7280; font-size: 13px; display: block; margin-bottom: 6px;'>Current Emotions (Hour ${currentHour}):</b>
      `;
      
      if (Object.keys(hourData).length > 0) {
        for (const [emoji, count] of Object.entries(hourData)) {
          emojiContent += `
            <div style='display: flex; align-items: center; justify-content: space-between; margin: 4px 0; padding: 4px 8px; background: #f9fafb; border-radius: 6px;'>
              <span style='font-size: 18px;'>${emoji}</span>
              <span style='color: #374151; font-weight: 600; font-size: 14px;'>×${count}</span>
            </div>
          `;
        }
      } else {
        emojiContent += `
          <div style='color: #9ca3af; font-size: 12px; font-style: italic; padding: 8px; text-align: center;'>
            No emotions recorded this hour
          </div>
        `;
      }
      emojiContent += "</div></div>";

      emojiInfoWindow.setContent(emojiContent);
      emojiInfoWindow.open({
        anchor: marker,
        map
      });
    }, { onlyOnce: true });
  });

  // Hide emoji popup on mouse leave
  marker.addListener('mouseleave', () => {
    emojiInfoWindow.close();
  });

  // Click event to fill review form
  marker.addListener('click', () => {
    emojiInfoWindow.close(); // Close emoji popup when clicking
    restaurantName.value = place.name;
    selectedPlace = place;
    document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  return marker;
}

const emotionIcons = {
  delicious: "😋",
  meh: "😐",
  disappointing: "🤢",
  crowded: "👥",
  longWait: "⏳",
};

onMounted(() => {
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

      const youAreHereDiv = document.createElement("div");
      youAreHereDiv.style.width = "22px";
      youAreHereDiv.style.height = "22px";
      youAreHereDiv.style.backgroundColor = "#007bff";
      youAreHereDiv.style.border = "3px solid white";
      youAreHereDiv.style.borderRadius = "50%";
      youAreHereDiv.style.boxShadow = "0 0 10px rgba(0, 123, 255, 0.7)";

      new AdvancedMarkerElement({
        map,
        position,
        content: youAreHereDiv,
        title: "You are here!",
        zIndex: 9999,
      });

      const plotEmotionsFromFirebase = async () => {
        try {
          console.log("Starting to plot emotions...");
          
          Object.values(currentMarkers).forEach(marker => {
            marker.setMap(null);
          });
          currentMarkers = {};
          
          console.log("Cleared existing markers...");

          databaseFunctions.getAllEmotions((snapshot) => {
            const data = snapshot.val();
            console.log("Received Firebase data:", data);
            if (!data) {
              console.log("No emotion data found");
              return;
            }

            Object.entries(data).forEach(([userId, userData]) => {
              console.log("Processing user:", userId);
              
              if (currentMarkers[userId]) {
                console.log("User already has a marker, skipping");
                return;
              }

              if (!userData || !userData.emotion || !userData.lat || !userData.lng) {
                console.log("Invalid user data, skipping");
                return;
              }

              console.log("Creating emoji for:", userData.emotion);
              const emoji = emotionIcons[userData.emotion];
              if (!emoji) {
                console.log("No emoji found for emotion:", userData.emotion);
                return;
              }

              const markerDiv = document.createElement("div");
              markerDiv.textContent = emoji;
              markerDiv.style.fontSize = "24px";

              try {
                const marker = new AdvancedMarkerElement({
                  map,
                  content: markerDiv,
                  position: { lat: userData.lat, lng: userData.lng },
                  title: `Restaurant Status: ${userData.emotion}`,
                  zIndex: 9999,
                });
                
                currentMarkers[userId] = marker;
                console.log("Successfully added marker for user:", userId);
              } catch (err) {
                console.error("Error creating marker:", err);
              }
            });
          });
        } catch (error) {
          console.error("Error plotting emotions:", error);
        }
      }
      plotEmotionsFromFirebase();

      setInterval(() => {
        plotEmotionsFromFirebase();
      }, 300000)

      const service = new google.maps.places.PlacesService(map);

      service.nearbySearch({
        location: position,
        radius: 1500,
        type: "restaurant"
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach(place => {
            if (place.geometry && place.geometry.location) {
              createClickableRestaurantMarker(place, service);
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
  <div class="wrapper">
    <aside id="sidebar">
      <!-- Sidebar content remains the same -->
      <div class="d-flex align-items-center mb-3">
        <button id="toggle-btn" type="button">
          <i class="lni lni-grid-alt"></i>
        </button>
        <div class="sidebar-logo ml-2">
          <RouterLink to="/Home/">Home</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Profile/')">
          <i class="lni lni-user"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Profile/">Profile</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/NearbyFav/')">
          <i class="lni lni-heart"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/NearbyFav/">Favourites</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Map/')">
          <i class="lni lni-map"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Map/">Map</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Discounts/')">
          <i class="lni lni-ticket"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Discounts/">Discounts</RouterLink>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id="navbar-item" type="button" @click="$router.push('/Price_Comparison/')">
          <i class="lni lni-dollar"></i>
        </button>
        <div class="item-logo ml-2">
          <RouterLink to="/Price_Comparison/">Filter by Price</RouterLink>
        </div> 
      </div>

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
       <div class="page-header">
        <h1 class="text-white page-title">Leave a review!</h1>
      </div>
      <!-- NEW: Content Wrapper for Side-by-Side Layout -->
      <div class="content-wrapper">
        <!-- COMBINED CONTAINER (Form) -->
        <div class="combined-container">
          <!-- Section Header -->
          <div class="section-header">
            <h2 class="main-title">🍽️ Restaurant Feedback</h2>
          </div>
          
          <!-- Emoticons Section -->
          <div class="emoticon-section">
            <h3 class="section-title">How would you describe this restaurant?</h3> 
            <div class="emoji-grid">
              <button v-for="(emoji,emotion) in emotionIcons" :key="emotion"
              class="emoji-button"
              :class="{
                hovered: hoveredEmotion === emotion && selectedEmotion !== emotion,
                active: selectedEmotion === emotion
              }"
              @mouseover="hoveredEmotion = emotion"
              @mouseleave="hoveredEmotion= ''"
              @click="selectedEmotion = emotion; submitEmotion();">
                <span class="emoji-icon">{{ emoji }}</span>
                <span class="emoji-label">{{ emotion }}</span>
              </button>
            </div>
          </div>

          <!-- Divider -->
          <hr class="section-divider">

          <!-- Review Section -->
          <div class="review-section" id="review-section">
            <h3 class="section-title">📝 Write a Restaurant Review</h3>
            
            <div class="form-group">
              <label class="form-label">Restaurant Name</label>
              <input 
                v-model="restaurantName" 
                type="text" 
                class="form-control" 
                placeholder="Click a restaurant marker or type the name"
              />
              <small class="text-muted">💡 Tip: Click on a restaurant marker on the map to auto-fill</small>
            </div>

            <div class="form-group">
              <label class="form-label">Your Rating</label>
              <div class="star-rating">
                <span 
                  v-for="star in 5" 
                  :key="star"
                  class="star"
                  :class="{ 
                    'filled': star <= (hoveredStar || reviewRating),
                    'hovered': star <= hoveredStar 
                  }"
                  @click="setRating(star)"
                  @mouseover="hoverStar(star)"
                  @mouseleave="resetHover"
                >
                  ★
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Your Review</label>
              <textarea 
                v-model="reviewText" 
                class="form-control" 
                rows="4" 
                placeholder="Share your experience..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Upload Photos (Optional)</label>
              <div class="upload-area">
                <input 
                  type="file" 
                  id="imageUpload" 
                  multiple 
                  accept="image/*" 
                  @change="handleImageUpload"
                  style="display: none;"
                />
                <label for="imageUpload" class="upload-button">
                  <i class="bi bi-camera"></i> Choose Images
                </label>
              </div>
              
              <div v-if="uploadedImages.length > 0" class="image-preview-container">
                <div 
                  v-for="(image, index) in uploadedImages" 
                  :key="index" 
                  class="image-preview"
                >
                  <img :src="image.src" :alt="image.name" />
                  <button class="remove-image" @click="removeImage(index)">
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              </div>
            </div>

            <button class="btn btn-primary submit-review-btn" @click="submitReview">
              Submit Review
            </button>
          </div>
        </div>

        <!-- MAP CONTAINER -->
        <div class="map-container">
          <div id="map"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Logout Modal -->
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






  <!-- Success Modal -->
<div
  class="modal fade"
  id="successModal"
  tabindex="-1"
  aria-labelledby="successModalLabel"
  aria-hidden="true"
  data-bs-backdrop="static"
  data-bs-keyboard="false"
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content success-modal-content border-0 shadow-lg">
      <div class="modal-body text-center p-5">
        <!-- Success Icon with Animation -->
        <div class="success-checkmark">
          <div class="check-icon">
            <span class="icon-line line-tip"></span>
            <span class="icon-line line-long"></span>
            <div class="icon-circle"></div>
            <div class="icon-fix"></div>
          </div>
        </div>
        
        <h3 class="success-title mt-4 mb-3">Review Submitted Successfully!</h3>
        <p class="success-message text-muted mb-4">
          Thank you for sharing your experience! Your review helps others make better dining decisions.
        </p>
        
        <button
          type="button"
          class="btn success-btn"
          data-bs-dismiss="modal"
        >
          OK
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

/* ========== SIDEBAR ========== */
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
  background: linear-gradient(180deg, #1e3a5f 0%, #152d47 100%);
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


.page-header {
  width: 100%;
  max-width: 1600px;
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-title {
  margin: 0;
  font-weight: 700;
  font-size: 42px;
  letter-spacing: -1px;
}

/* ========== MAIN CONTENT ========== */
.main { 
  min-height: 100vh;
  transition: margin-left 0.25s, width 0.25s;
  margin-left: 72px;
  background: 
    radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
    #0a0a0f;    
  overflow-x: hidden;
  width: calc(100vw - 72px);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center; 
    flex-direction: column;

}

#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

/* ========== CONTENT WRAPPER (Side-by-Side Layout) ========== */
.content-wrapper {
  display: flex;
  flex-direction: row-reverse; 
  gap: 20px;
  width: 100%;
  max-width: 1600px;
  align-items: stretch; 
}

/* ========== COMBINED CONTAINER ========== */
.combined-container {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-width: 400px;
  max-width: 550px;
  display: flex; 
  flex-direction: column; 
}

/* ========== MAP CONTAINER ========== */
.map-container {
  flex: 1;
  min-width: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex; 
}

#map { 
  height: 100% !important; 
  width: 100% !important;
  min-height: 600px;
  border-radius: 0;
}



/* ========== SECTION HEADER ========== */
.section-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  flex-shrink: 0; 
}

.main-title {
  margin: 0;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 24px;
  letter-spacing: -0.5px;
}

/* ========== EMOTICON SECTION ========== */
.emoticon-section {
  margin-bottom: 20px;
  flex-shrink: 0; 
}

.section-title {
  margin-bottom: 16px;
  color: #374151;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.2px;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 5px 0;
  max-width: 600px;
  margin: 0 auto;
}

.emoji-icon {
  display: block;
  font-size: 28px;
  line-height: 1;
}

.emoji-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: capitalize;
}

.emoji-button {
  background: white;
  border: 2px solid #ddd;
  border-radius: 10px;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s ease;
  min-width: 85px;
  flex: 0 0 auto;
}

.emoji-button.hovered {
  transform: scale(1.1);
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.4);
}

.emoji-button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  transform: scale(1.05);
}

.emoji-button.active .emoji-label {
  color: white;
  font-weight: 600;
}

/* ========== DIVIDER ========== */
.section-divider {
  border: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
  margin: 24px 0;
  flex-shrink: 0; 
}

/* ========== REVIEW SECTION ========== */
.review-section {
  padding-top: 0;
  flex: 1; 
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  letter-spacing: -0.1px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
}

.text-muted {
  color: #6c757d;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

/* ========== STAR RATING ========== */
.star-rating {
  display: flex;
  gap: 6px;
  font-size: 26px;
  cursor: pointer;
}

.star {
  color: #e4e5e9;
  transition: color 0.15s ease, transform 0.1s ease;
  user-select: none;
}

.star.filled {
  color: #f5a623;
}

.star:hover,
.star.hovered {
  color: #ffb84d;
  transform: scale(1.05);
}

/* ========== UPLOAD AREA ========== */
.upload-area {
  margin-bottom: 12px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 14px;
  background-color: #e0e0e0;
  border: 2px solid #bdbdbd;
  border-radius: 22px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #555555;
  outline: none;
  box-shadow: 0 2px 6px rgba(40,40,40,0.03);
}

.upload-button:hover {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%);
  border-color: #667eea;
  color: #ffffff;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px) scale(1.02);
}


/* ========== IMAGE PREVIEW ========== */
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #ddd;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: 16px;
  transition: transform 0.2s;
}

.remove-image:hover {
  transform: scale(1.1);
}

/* ========== SUBMIT BUTTON ========== */
.submit-review-btn {
  width: 100%;
  padding: 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 15px;
  border-radius: 22px;
  border: 2px solid transparent;
  background-color: #555555;
  color: #f0f0f0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  outline: none;
}

.submit-review-btn:hover {
  background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%);
  border-color: #4facfe;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(86, 204, 242, 0.35);
}

/* ========== LOGOUT MODAL ========== */
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

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 1200px) {
  .main {
    align-items: flex-start; 
  }
  
  .content-wrapper {
    flex-direction: column;
  }
  
  .combined-container,
  .map-container {
    max-width: 100%;
    min-width: 100%;
  }
  
  #map {
    height: 500px !important;
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .main {
    padding: 12px;
  }
  
  .combined-container {
    padding: 20px;
  }
  
  .emoji-button {
    min-width: 75px;
    padding: 6px 10px;
  }
  
  .emoji-icon {
    font-size: 24px;
  }
}


/* ========== SUCCESS MODAL ========== */
.success-modal-content {
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.success-modal-content .modal-body {
  background: white;
  position: relative;
}

.success-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.success-message {
  font-size: 16px;
  line-height: 1.6;
  color: #6b7280;
}

.success-btn {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 40px;
  border-radius: 22px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(86, 204, 242, 0.35);
}

.success-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(86, 204, 242, 0.5);
}

/* Animated Success Checkmark */
.success-checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  position: relative;
}

.check-icon {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  box-sizing: content-box;
  border: 4px solid #4ade80;
  background-color: #f0fdf4;
}

.icon-line {
  height: 5px;
  background-color: #4ade80;
  display: block;
  border-radius: 2px;
  position: absolute;
  z-index: 10;
}

.icon-line.line-tip {
  top: 40px;
  left: 14px;
  width: 25px;
  transform: rotate(45deg);
  animation: checkmark-tip 0.75s;
}

.icon-line.line-long {
  top: 35px;
  right: 8px;
  width: 47px;
  transform: rotate(-45deg);
  animation: checkmark-long 0.75s;
}

.icon-circle {
  top: -4px;
  left: -4px;
  z-index: 10;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: absolute;
  box-sizing: content-box;
  border: 4px solid rgba(74, 222, 128, 0.2);
  animation: checkmark-circle 0.6s ease-in-out;
}

.icon-fix {
  top: 8px;
  width: 5px;
  left: 26px;
  z-index: 1;
  height: 85px;
  position: absolute;
  transform: rotate(-45deg);
  background-color: white;
}

@keyframes checkmark-tip {
  0% {
    width: 0;
    left: 1px;
    top: 19px;
  }
  54% {
    width: 0;
    left: 1px;
    top: 19px;
  }
  70% {
    width: 50px;
    left: -8px;
    top: 37px;
  }
  84% {
    width: 17px;
    left: 21px;
    top: 48px;
  }
  100% {
    width: 25px;
    left: 14px;
    top: 40px;
  }
}

@keyframes checkmark-long {
  0% {
    width: 0;
    right: 46px;
    top: 54px;
  }
  65% {
    width: 0;
    right: 46px;
    top: 54px;
  }
  84% {
    width: 55px;
    right: 0px;
    top: 35px;
  }
  100% {
    width: 47px;
    right: 8px;
    top: 35px;
  }
}

@keyframes checkmark-circle {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.1);
    opacity: 1;
  }
}


</style>
