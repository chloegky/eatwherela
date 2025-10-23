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
  }, 
  
  mounted() {
    const hamburger = document.querySelector("#toggle-btn");
    if (hamburger) {
      hamburger.addEventListener("click", function () {
        document.querySelector("#sidebar").classList.toggle("expand");
      });
    }
  }
}
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
    </div>

    <div class="main">
        <h2>Restaurant Name</h2>
        <!-- <h1>{{restaurantName}}</h1> -->

    </div>
    
    <div class='container-fluid my-5'>
        <div class='row'>
            <div class='col-md-6 d-flex align-items-center justify-content-center mb-4 mb-md-0'>
                <p>Restaurant description</p>
            </div>

            <!-- carousel -->
            <div class='col-md-6'>
                <div id="restaurantPics" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-indicators">
                        <button type="button" data-bs-target="#restaurantPics" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
                        <button type="button" data-bs-target="#restaurantPics" data-bs-slide-to="1" aria-label="Slide 2"></button>
                        <button type="button" data-bs-target="#restaurantPics" data-bs-slide-to="2" aria-label="Slide 3"></button>
                    </div>

                    <div class="carousel-inner">
                        <div class="carousel-item active">
                        <img src="https://via.placeholder.com/800x400" class="d-block w-100" alt="...">
                        <div class="carousel-caption d-none d-md-block">
                            <h5>First slide</h5>
                            <p>Some extra info.</p>
                        </div>
                        </div>
                        <div class="carousel-item">
                        <img src="https://via.placeholder.com/800x400" class="d-block w-100" alt="...">
                        <div class="carousel-caption d-none d-md-block">
                            <h5>Second slide</h5>
                            <p>blah blah blah</p>
                        </div>
                        </div>
                        <div class="carousel-item">
                        <img src="https://via.placeholder.com/800x400" class="d-block w-100" alt="...">
                        <div class="carousel-caption d-none d-md-block">
                            <h5>Third slide</h5>
                            <p>Some representative placeholder content for the third slide.</p>
                        </div>
                        </div>
                    </div>

                    <button class="carousel-control-prev" type="button" data-bs-target="#restaurantPics" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#restaurantPics" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Next</span>
                    </button>
                </div>
            </div>
        </div>
    </div> 


    <div class="container my-5">
        <h4>Real-time Reviews</h4>
        <!-- <p v-for="value in source" :key="value">{{value}}</p> -->
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


    body {
        margin: 0;
        padding: 0;
        background-color: rgb(239, 239, 239);
    }

    .main {
        background-color: rgb(239, 239, 239);
        padding-top: 40px;
        text-align: center;
    }

    .main h2 {
        font-size: 2.5rem;
        font-weight: 600;
        margin-bottom: 20px;
    }

    .restaurant-section {
        padding: 40px 20px;
    }

    .carousel img {
        border-radius: 10px;
    }

    .carousel-caption {
        background: rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        padding: 10px;
    }

    .reviews {
        background-color: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.05);
    }

    @media (max-width: 768px) {
        .main h2 {
            font-size: 2rem;
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
