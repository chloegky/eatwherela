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
            <RouterLink to="/Home/">Home</RouterLink>
            </div>
        </div>
        <div class="item d-flex align-items-center">
            <button id= "navbar-item" type="button">
            <i class="lni lni-user"></i>
            </button>
            <div class="item-logo ml-2">
            <RouterLink to="/Profile/">Profile</RouterLink>
            </div>
        </div>
        <div class="item d-flex align-items-center">
            <button id= "navbar-item" type="button">
            <i class="lni lni-heart"></i>
            </button>
            <div class="item-logo ml-2">
            <RouterLink to="/NearbyFav/">Favourites</RouterLink>
            </div>
        </div>
        <div class="item d-flex align-items-center">
            <button id= "navbar-item" type="button">
            <i class="lni lni-map"></i>
            </button>
            <div class="item-logo ml-2">
            <RouterLink to="/Map/">Map</RouterLink>
            </div>
        </div>
        <div class="item d-flex align-items-center">
            <button id= "navbar-item" type="button">
            <i class="lni lni-ticket"></i>
            </button>
            <div class="item-logo ml-2">
            <RouterLink to="/Discounts/">Discounts</RouterLink>
            </div>
        </div>
        <div class="item d-flex align-items-center">
            <button id= "navbar-item" type="button">
            <i class="lni lni-dollar"></i>
            </button>
            <div class="item-logo ml-2">
            <RouterLink to="/Price_Comparison/">Filter by Price</RouterLink>
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

    
    #sidebar.expand ~ .main {
        margin-left: 260px;
        width: calc(100vw - 260px);
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
</style>
