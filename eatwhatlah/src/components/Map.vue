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

export default {}
</script>

<script setup>
import databaseFunctions from '../services/databaseFunctions';
import { ref, onMounted } from "vue";
import { getDatabase, onValue} from 'firebase/database';
import Sidebar from './subcomponents/Sidebar.vue';

const selectedEmotion = ref("");
const hoveredEmotion = ref("");

const restaurantName = ref("");
const reviewRating = ref(0);
const reviewText = ref("");
const uploadedImages = ref([]);
const hoveredStar = ref(0);
const reviewSubmitted = ref(false);
const tooltipVisible = ref(false);
const tooltipContent = ref({ name: "", rating: 0, review: "" });
const tooltipPosition = ref({ x: 0, y: 0 });
const restaurantEmotions = ref(new Map());

let map = null;
let currentMarkers = {};
let selectedPlace = null;

function roundCoord(coord) {
  return Math.round(coord * 1000) / 1000;
}

async function submitEmotion() {
  if (!selectedEmotion.value) {
    alert("Please select an emotion first!");
    return;
  }

  if (!restaurantName.value || !restaurantName.value.trim()) {
    alert("Please enter a restaurant name!");
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
      userId: auth.currentUser.uid,
      restaurantName: restaurantName.value.trim()
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
        markerDiv.style.cursor = "pointer";

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: markerDiv,
          position: { lat: newEntry.lat, lng: newEntry.lng },
          title: `Restaurant Status: ${newEntry.emotion}`,
          zIndex: 9999,
        });
        
        markerDiv.addEventListener('mouseenter', async (event) => {
          try {
            const reviewData = await databaseFunctions.getLatestReviewByUser(auth.currentUser.uid);
            if (reviewData) {
              tooltipContent.value = {
                name: reviewData.restaurantName || 'Unknown Restaurant',
                rating: reviewData.rating || 0,
                review: reviewData.reviewText || 'No review text'
              };
              tooltipVisible.value = true;
            }
          } catch (error) {
            console.error("Error fetching review data:", error);
          }
        });
        
        markerDiv.addEventListener('mousemove', (event) => {
          if (tooltipVisible.value) {
            tooltipPosition.value = {
              x: event.clientX,
              y: event.clientY
            };
          }
        });
        
        markerDiv.addEventListener('mouseleave', () => {
          tooltipVisible.value = false;
        });

        currentMarkers[auth.currentUser.uid] = marker;
        alert(`Your "${newEntry.emotion}" status was saved!`);
        
        selectedEmotion.value = "";
        restaurantName.value = "";
        reviewRating.value = 0;
        reviewText.value = "";
        reviewSubmitted.value = false;
      })
      .catch((error) => {
        console.error("Error saving emotion:", error);
        alert("❌ Failed to save status. Please try again.");
      });
  });
}

function setRating(star) {
  reviewRating.value = star;
}

function hoverStar(star) {
  hoveredStar.value = star;
}

function resetHover() {
  hoveredStar.value = 0;
}

function selectEmotion(emotion) {
  if (!reviewSubmitted.value) {
    alert("Please submit your review first before selecting an emoji!");
    return;
  }
  selectedEmotion.value = emotion;
}

function showEmojiTooltip(event, emotion) {
  if (reviewSubmitted.value && restaurantName.value) {
    tooltipContent.value = {
      name: restaurantName.value,
      rating: reviewRating.value,
      review: reviewText.value
    };
    tooltipPosition.value = {
      x: event.pageX || event.clientX + window.scrollX,
      y: event.pageY || event.clientY + window.scrollY
    };
    tooltipVisible.value = true;
    console.log("Tooltip shown:", tooltipContent.value);
  }
}

function hideEmojiTooltip() {
  tooltipVisible.value = false;
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
    
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
    
    reviewSubmitted.value = true;
    
    uploadedImages.value = [];
  } catch (error) {
    console.error("Error submitting review:", error);
    alert("❌ Failed to submit review. Please try again.");
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

async function loadAllEmotions(hoursAgo = 24) {
  try {
    const allEmotions = await databaseFunctions.getAllUserEmotions();
    
    if (!allEmotions) {
      console.log("No emotion data found");
      return;
    }

    const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);
    restaurantEmotions.value.clear();

    Object.values(allEmotions).forEach(userData => {
      Object.values(userData).forEach(emotionData => {
        if (emotionData.timestamp && emotionData.timestamp < cutoffTime) {
          return;
        }

        const restaurantKey = `${emotionData.lat}_${emotionData.lng}`;
        
        if (!restaurantEmotions.value.has(restaurantKey)) {
          restaurantEmotions.value.set(restaurantKey, {
            delicious: 0,
            meh: 0,
            disappointing: 0,
            crowded: 0,
            longWait: 0
          });
        }

        const emotions = restaurantEmotions.value.get(restaurantKey);
        if (emotionData.emotion && emotions.hasOwnProperty(emotionData.emotion)) {
          emotions[emotionData.emotion]++;
        }
      });
    });

    console.log(`Loaded emotions for ${restaurantEmotions.value.size} restaurants`);
  } catch (error) {
    console.error("Error loading emotions:", error);
  }
}

function isDeliciousRestaurant(lat, lng, name) {
  // Try exact coordinate match first
  const exactKey = `${lat}_${lng}`;
  let emotions = restaurantEmotions.value.get(exactKey);
  
  // If no exact match, try GPS proximity match (75m radius)
  if (!emotions) {
    for (const [key, value] of restaurantEmotions.value.entries()) {
      const [eLat, eLng] = key.split('_').map(Number);
      const distance = getDistance(lat, lng, eLat, eLng);
      
      if (distance < 75) {
        emotions = value;
        break;
      }
    }
  }
  
  if (!emotions) {
    return false;
  }

  const totalEmotions = Object.values(emotions).reduce((sum, count) => sum + count, 0);
  if (totalEmotions === 0) {
    return false;
  }

  const deliciousCount = emotions.delicious || 0;
  const deliciousPercentage = (deliciousCount / totalEmotions) * 100;
  
  return deliciousPercentage >= 90;
}


function createClickableRestaurantMarker(place, service) {
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const isDelicious = isDeliciousRestaurant(lat, lng, place.name);
  
  console.log(`Creating marker for ${place.name}: isDelicious=${isDelicious}`);
  
  let markerContent;
  
  if (isDelicious) {
    console.log(`  → Creating STAR marker for ${place.name}`);
    // Create sleek star icon for delicious restaurants
    const starDiv = document.createElement("div");
    starDiv.innerHTML = "⭐";
    starDiv.style.fontSize = "24px";
    starDiv.style.cursor = "pointer";
    starDiv.style.transform = "translateY(-50%)";
    starDiv.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.4))";
    starDiv.style.transition = "transform 0.2s ease";
    markerContent = starDiv;
  } else {
    // Use default red marker for other restaurants
    markerContent = undefined; // This will use the default Google Maps pin
  }
  
  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: { lat, lng },
    title: place.name,
    content: markerContent
  });

  marker.addListener('click', () => {
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
              markerDiv.style.cursor = "pointer";

              try {
                const marker = new AdvancedMarkerElement({
                  map,
                  content: markerDiv,
                  position: { lat: userData.lat, lng: userData.lng },
                  title: `Restaurant Status: ${userData.emotion}`,
                  zIndex: 9999,
                });
                
                markerDiv.addEventListener('mouseenter', async (event) => {
                  try {
                    const reviewData = await databaseFunctions.getLatestReviewByUser(userId);
                    if (reviewData) {
                      tooltipContent.value = {
                        name: reviewData.restaurantName || 'Unknown Restaurant',
                        rating: reviewData.rating || 0,
                        review: reviewData.reviewText || 'No review text'
                      };
                      tooltipVisible.value = true;
                    }
                  } catch (error) {
                    console.error("Error fetching review data:", error);
                  }
                });
                
                markerDiv.addEventListener('mousemove', (event) => {
                  if (tooltipVisible.value) {
                    tooltipPosition.value = {
                      x: event.clientX,
                      y: event.clientY
                    };
                  }
                });
                
                markerDiv.addEventListener('mouseleave', () => {
                  tooltipVisible.value = false;
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

      // Load emotion data for all restaurants
      await loadAllEmotions(24);
      console.log('Emotions loaded in Map.vue, restaurantEmotions size:', restaurantEmotions.value.size);

      const service = new google.maps.places.PlacesService(map);

      service.nearbySearch({
        location: position,
        radius: 1500,
        type: "restaurant"
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`Found ${results.length} restaurants, creating markers...`);
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
    <Sidebar />
    <div class="main p-3">
       <div class="page-header">
        <h1 class="page-title" style="background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Leave a review!</h1>
      </div>
      <div class="content-wrapper">
        <div class="combined-container">
          <div class="section-header">
            <h2 class="main-title">🍽️ Restaurant Feedback</h2>
          </div>
          
          <div class="emoticon-section">
            <h3 class="section-title">How would you describe this restaurant?</h3> 
            <p v-if="!reviewSubmitted" class="emoji-instruction">⚠️ Submit your review below first to select an emoji!</p>
            <div class="emoji-grid">
              <button v-for="(emoji,emotion) in emotionIcons" :key="emotion"
              class="emoji-button"
              :class="{
                hovered: hoveredEmotion === emotion && selectedEmotion !== emotion,
                active: selectedEmotion === emotion,
                disabled: !reviewSubmitted
              }"
              @mouseover="hoveredEmotion = emotion; showEmojiTooltip($event, emotion)"
              @mouseleave="hoveredEmotion= ''; hideEmojiTooltip()"
              @click="selectEmotion(emotion)">
                <span class="emoji-icon">{{ emoji }}</span>
                <span class="emoji-label">{{ emotion }}</span>
              </button>
            </div>
            
            <button 
              v-if="selectedEmotion && reviewSubmitted" 
              class="btn btn-success submit-emoji-btn mt-3"
              @click="submitEmotion"
            >
              Submit Emoji Reaction
            </button>
          </div>

          <hr class="section-divider">

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

        <div class="map-container">
          <div id="map"></div>
        </div>
      </div>
    </div>
  </div>

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

  <div 
    v-if="tooltipVisible" 
    class="emoji-tooltip"
    :style="{
      left: (tooltipPosition.x - 125) + 'px',
      top: (tooltipPosition.y - 130) + 'px'
    }"
  >
    <div class="tooltip-header">🍽️ {{ tooltipContent.name }}</div>
    <div class="tooltip-rating">⭐ Rating: {{ tooltipContent.rating }}/5</div>
    <div class="tooltip-review">"{{ tooltipContent.review }}"</div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.wrapper {
  display: flex;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  height: 100vh;
  overflow: hidden;
  background: #0f1419;
}

a {
  text-decoration: none !important;
}

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}

.page-header {
  width: 100%;
  max-width: 1600px;
  text-align: center;
  margin-bottom: 12px;
  padding: 12px 0;
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  font-weight: 700;
  font-size: 32px;
  letter-spacing: -1px;
}

.main { 
  height: 100vh;
  overflow: hidden;
  transition: margin-left 0.25s, width 0.25s;
  margin-left: 72px;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%);
  width: calc(100vw - 72px);
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  color: #e5e7eb;
}

#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

.content-wrapper {
  display: flex;
  flex-direction: row-reverse; 
  gap: 12px;
  width: 100%;
  max-width: 100%;
  height: calc(100vh - 100px);
  align-items: stretch;
  flex: 1;
}

.combined-container {
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid #374151;
  flex: 0 0 auto;
  width: 480px;
  height: 100%;
  display: flex; 
  flex-direction: column;
  overflow-y: auto;
}

.map-container {
  flex: 1;
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  height: 100%;
}

#map { 
  height: 100% !important; 
  width: 100% !important;
  border-radius: 0;
}

.section-header {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #374151;
  flex-shrink: 0; 
}

.main-title {
  margin: 0;
  color: #60a5fa;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.emoticon-section {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.section-title {
  margin-bottom: 8px;
  color: #60a5fa;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: -0.2px;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  padding: 0;
}

.emoji-icon {
  display: block;
  font-size: 20px;
  line-height: 1;
}

.emoji-label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emoji-button {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 8px;
  padding: 4px 8px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s ease;
  min-width: 70px;
  flex: 0 0 auto;
  font-size: 11px;
}

.emoji-button.hovered {
  transform: scale(1.08);
  border-color: #60a5fa;
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
}

.emoji-button.active {
  background-color: #60a5fa;
  color: white;
  border-color: #42a5f5;
}

.emoji-button.active .emoji-label {
  color: white;
}

.emoji-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.emoji-instruction {
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-bottom: 6px;
  font-weight: 500;
  text-align: center;
}

.submit-emoji-btn {
  width: 100%;
  padding: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  margin-top: 8px;
  flex-shrink: 0;
}

.emoji-tooltip {
  position: fixed;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 12px;
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  max-width: 280px;
  min-width: 200px;
  border: 2px solid #42a5f5;
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
  color: #64b5f6;
  border-bottom: 1px solid rgba(100, 181, 246, 0.3);
  padding-bottom: 4px;
}

.tooltip-rating {
  font-size: 12px;
  margin-bottom: 6px;
  color: #ffd700;
  font-weight: 600;
}

.tooltip-review {
  font-size: 11px;
  line-height: 1.4;
  color: #ecf0f1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-style: italic;
}

.section-divider {
  border: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, #374151 20%, #374151 80%, transparent);
  margin: 12px 0;
  flex-shrink: 0;
}

.review-section {
  padding-top: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
  color: #e5e7eb;
  font-size: 12px;
  letter-spacing: -0.1px;
}

.form-control {
  width: 100%;
  padding: 6px 8px;
  border: 2px solid #374151;
  border-radius: 6px;
  font-size: 12px;
  transition: border-color 0.2s;
  background: #1a1f2e;
  color: #e5e7eb;
}

.form-control:focus {
  outline: none;
  border-color: #60a5fa;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
  max-height: 100px;
}

.text-muted {
  color: #9ca3af;
  font-size: 10px;
  margin-top: 3px;
  display: block;
}

.star-rating {
  display: flex;
  gap: 4px;
  font-size: 20px;
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

.upload-area {
  margin-bottom: 8px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 11px;
  background-color: #1f2937;
  border: 2px solid #374151;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #e5e7eb;
}

.upload-button:hover {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%);
  border-color: #667eea;
  color: #ffffff;
  transform: translateY(-1px);
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.image-preview {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #ddd;
  flex-shrink: 0;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: 12px;
}

.remove-image:hover {
  transform: scale(1.1);
}

.submit-review-btn {
  width: 100%;
  padding: 10px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 13px;
  border-radius: 16px;
  border: 2px solid transparent;
  background-color: #555555;
  color: #f0f0f0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: auto;
  flex-shrink: 0;
}

.submit-review-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%);
  color: #ffffff;
  transform: translateY(-1px);
}

.success-modal-content {
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.success-modal-content .modal-body {
  background: linear-gradient(135deg, #1f2937 0%, #2d3748 100%);
}

.success-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: #f3f4f6;
}

.success-message {
  font-size: 14px;
  line-height: 1.5;
  color: #d1d5db;
}

.success-btn {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 30px;
  border-radius: 16px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%);
  color: white;
  cursor: pointer;
}

.success-btn:hover {
  transform: translateY(-2px);
}

.success-checkmark {
  width: 60px;
  height: 60px;
  margin: 0 auto;
}

.check-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #4ade80;
  background-color: #f0fdf4;
}

.icon-line {
  height: 4px;
  background-color: #4ade80;
  display: block;
  border-radius: 2px;
  position: absolute;
}

.icon-line.line-tip {
  top: 30px;
  left: 10px;
  width: 18px;
  transform: rotate(45deg);
  animation: checkmark-tip 0.75s;
}

.icon-line.line-long {
  top: 25px;
  right: 6px;
  width: 35px;
  transform: rotate(-45deg);
  animation: checkmark-long 0.75s;
}

@keyframes checkmark-tip {
  0% { width: 0; left: 1px; top: 14px; }
  54% { width: 0; }
  100% { width: 18px; left: 10px; top: 30px; }
}

@keyframes checkmark-long {
  0% { width: 0; right: 34px; top: 39px; }
  65% { width: 0; }
  100% { width: 35px; right: 6px; top: 25px; }
}

@media (max-width: 1024px) {
  .combined-container {
    width: 400px;
  }
  
  #map {
    min-height: auto !important;
  }
}

@media (max-width: 768px) {
  .main {
    margin-left: 0;
    width: 100vw;
    padding: 8px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .content-wrapper {
    flex-direction: column;
    height: auto;
    max-height: calc(100vh - 80px);
  }
  
  .combined-container {
    width: 100%;
    height: 45vh;
    max-height: 45vh;
  }
  
  .map-container {
    width: 100%;
    height: 50vh;
    max-height: 50vh;
  }
  
  .emoji-button {
    min-width: 60px;
  }
}
</style>


