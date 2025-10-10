<script>
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
  document.head.appendChild(link);

    const link2 = document.createElement('link');
    link2.rel = 'stylesheet';
    link2.href = 'https://cdn.lineicons.com/4.0/lineicons.css';
    document.head.appendChild(link2);

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js';
  script.integrity = 'sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);

  export default {
    mounted() {
      console.log("Component mounted");
      const hamburger = document.querySelector("#toggle-btn");
      if (!hamburger) {
        console.error("#toggle-btn not found");
        return;
      }
      hamburger.addEventListener("click", function () {
        console.log("Toggle button clicked");
        document.querySelector("#sidebar").classList.toggle("expand");
      });
    }
  }
</script>

<template>
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
      <div class="main p-3">
          <div class="text-center">
              <h1>EatWhatLah!</h1>
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
    height: 100vh;
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
  }



</style>

