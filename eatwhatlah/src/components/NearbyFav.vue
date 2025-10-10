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

export default {
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
          <a href="#">HOME</a>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button">
          <i class="lni lni-user"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#">Profile</a>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button">
          <i class="lni lni-heart"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#">Favourites</a>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button">
          <i class="lni lni-map"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#">Map</a>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button">
          <i class="lni lni-ticket"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#">Discounts</a>
        </div>
      </div>
      <div class="item d-flex align-items-center">
        <button id= "navbar-item" type="button">
          <i class="lni lni-dollar"></i>
        </button>
        <div class="item-logo ml-2">
          <a href="#">Filter by Price</a>
        </div>
      </div>
    </aside>

    <!-- SEARCH BAR -->
    <div class="main p-3">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col">
            <div class="search-container">
              <input type="text" class="form-control search-input" placeholder="  Search Places">
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>
        </div>

        <!-- MAP  -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="map-container">
                <div id="map"></div>
            </div>
          </div>
        </div>

        <!-- FILTER BUTTON -->
        <div class="row justify-content-center">
          <div class="col">
            <div class="buttonfilter-container">
                <div id="buttonfilter" class="d-flex justify-content-center gap-2">
                  <button type="button" class="btn btn-secondary">Near By</button>
                  <button type="button" class="btn btn-secondary">Favourites</button>
                </div>
            </div>
          </div>
        </div>

        <!-- RESTAURANTS -->
        <div class="card mb-3 my-custom-card mt-5">
        <div class="row no-gutters align-items-center flex-md-row flex-column">
          <div class="col-md-3 col-12 d-flex align-items-center justify-content-center">
            <img src="../assets/logos/braek.png" class="card-img my-card-img">
          </div>
          <div class="col-md-9 col-12">
            <div class="card-body p-4 position-relative">
              <h5 class="card-title">Bræk</h5>
              <p class="card-text">At Bræk., escape chaos in a nurturing space. Foster connections, spark conversations. Every visit promises unexpected happiness. Committed to a holistic journey, delivering quality and heartfelt attention.</p>
              <div class="star-rating">
                <span class="star filled">&#9733;</span>
                <span class="star filled">&#9733;</span>
                <span class="star filled">&#9733;</span>
                <span class="star">&#9733;</span>
                <span class="star">&#9733;</span>
              </div>
              <div class="card-footer-row d-flex justify-content-between align-items-center mt-2">
              <div>
                <div class="category-review text-muted">
                  Category . $$ . 1.2 miles away . Crowded
                </div>
                <div class="review-line text-muted">
                  Real time reviews: Have it loop through recent reviews
                </div>
              </div>
              <button type="button" class="btn btn-outline-danger" id="addToFavoritesBtn">
                <i class="bi bi-heart"></i> Add to Favourites
              </button>
              </div>
              </div>
            </div>
          </div>
        </div>




        <div class="card mb-3 my-custom-card mt-5">
        <div class="row no-gutters align-items-center flex-md-row flex-column">
          <div class="col-md-3 col-12 d-flex align-items-center justify-content-center">
            <img src="../assets/logos/summer-acai.jpg" class="card-img my-card-img">
          </div>
          <div class="col-md-9 col-12">
            <div class="card-body p-4 position-relative">
              <h5 class="card-title">Summer Acai</h5>
              <p class="card-text">Enjoy Acai, Forget Anxiety! Indulge in the goodness of our açaí bowls 
                            and let their vibrant flavors and nourishing ingredients bring you a moment of pure 
                            relaxation and joy. A delicious escape from the stress of the day!</p>
              <div class="star-rating">
                <span class="star filled">&#9733;</span>
                <span class="star filled">&#9733;</span>
                <span class="star filled">&#9733;</span>
                <span class="star">&#9733;</span>
                <span class="star">&#9733;</span>
              </div>
              <div class="card-footer-row d-flex justify-content-between align-items-center mt-2">
              <div>
                <div class="category-review text-muted">
                  Category . $$ . 1.2 miles away . Crowded
                </div>
                <div class="review-line text-muted">
                  Real time reviews: Have it loop through recent reviews
                </div>
              </div>
              <button type="button" class="btn btn-outline-danger" id="addToFavoritesBtn">
                <i class="bi bi-heart"></i> Add to Favourites
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
    padding-left: 35px;
    border: none;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.search-icon {
    position: absolute;
    top: 50%;
    left: 15px;
    transform: translateY(-50%);
    color: #888;
}

#map {
  height: 400px;
  width: 100%;
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


</style>
