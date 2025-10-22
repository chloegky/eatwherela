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

      data() {
          return {
            searchInput: ''

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
        goToSearch() {
            this.$router.push('/Response');
        },
        
        redirect() {
            this.$router.push('/Restaurant');
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
        <h1>EatWhatLa!</h1>
        <div class="search-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input v-model="searchInput" @keydown.enter="goToSearch" class="search-input" placeholder="What are you craving?" />
        </div>
        <br>
        <div class="card mb-3" style="max-width: 300px;" v-on:click="redirect">
          <div class="row g-0">
            <div class="col-md-4">
                <img src="../assets/logos/braek.png" class="img-fluid rounded-start" alt="...">
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title">Braek</h5>
                <p class="card-text"><small class="text-muted">Dessert</small></p>
              </div>
            </div>
          </div>
        </div>
        <div class="card mb-3" style="max-width: 300px;" v-on:click="redirect">
          <div class="row g-0">
            <div class="col-md-4">
                <img src="../assets/logos/summer-acai.jpg" class="img-fluid rounded-start" alt="...">
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title">Summer Acai</h5>
                <p class="card-text"><small class="text-muted">Dessert</small></p>
              </div>
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
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

    .wrapper{ 
        display:flex;
    }
    
    a { 
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
    
    .sidebar-logo, .item-logo {
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
        justify-content: center;
        align-items: center;
    }
      
    #sidebar.expand ~ .main {
        margin-left: 260px;
        width: calc(100vw - 260px);
    }
    
    .search-wrapper {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 380px;
    }
    
    .search-icon {
        position: absolute;
        top: 50%;
        left: 10px;
        transform: translateY(-50%);
        color: gray;
        pointer-events: none;
    }
    
    .search-input {
        padding-left: 36px;
        height: 36px;
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 30px;
    }
    
    img {
        margin: 10px 20px;
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
