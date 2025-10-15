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
          <RouterLink to="/Favourites/">Favourites</RouterLink>
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
    
<div class="main p-3">
    <h1> Home </h1>
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




</style>
