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
            <div class="d-flex">
                <button id="toggle-btn" type="button">
                    <i class="lni lni-grid-alt"></i>
                </button>
                <div class="sidebar-logo">
                    <a href="#">HOME</a>
                </div>
            </div>
            <ul class="sidebar-nav">
                <li class="sidebar-item">
                    <a href="#" class="sidebar-link">
                        <i class="lni lni-user"></i>
                        <span>Profile</span>
                    </a>
                </li>
                <li class="sidebar-item">
                    <a href="#" class="sidebar-link">
                        <i class="lni lni-heart"></i>
                        <span>Favourites</span>
                    </a>
                </li>
                <li class="sidebar-item">
                    <a href="#" class="sidebar-link">
                        <i class="lni lni-map"></i>
                        <span>Map</span>
                    </a>
                </li>
                <li class="sidebar-item">
                    <a href="#" class="sidebar-link">
                        <i class="lni lni-ticket"></i>
                        <span>Discounts</span>
                    </a>
                </li>
                <li class="sidebar-item">
                    <a href="#" class="sidebar-link">
                        <i class="lni lni-dollar"></i>
                        <span>Filter</span>
                    </a>
                </li>
            </ul>
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

::after,
::before {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

a {
    text-decoration: none;
}

li {
    list-style: none;
}

h1 {
    font-weight: 600;
    font-size: 1.5rem;
}

body {
    font-family: 'Poppins', sans-serif;
}

.wrapper{ 
    display:flex;
}

.main{ 
    min-height:100vh;
    width:100%; 
    overflow: hidden;
    transition: all 0.35s ease-in-out;
    background-color: rgb(228, 237, 240);
}

#sidebar{ 
    width:70px;
    min-width: 70px;
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

.sidebar-logo{ 
    margin: auto 0;
}

.sidebar-logo a { 
    color: #fff;
    font-size: 18px;
    font-weight: 600;
}

#sidebar:not(.expand) .sidebar-logo, 
#sidebar:not(.expand) a.sidebar-link span{ 
    display:none;
} 

.sidebar-nav{ 
    padding: 2rem 0; 
    flex: 1 1 auto;
}

a.sidebar-link{
    padding: .625rem 1.625rem; 
    color: #fff; 
    display: block;
    font-size: 18px;
    white-space: nowrap;
    border-left: 3px solid transparent;
}

.sidebar-link i{ 
    font-size: 1.1rem;
    margin-right: .75rem;
}

a.sidebar-link:hover{ 
    background-color: rgb(180, 181, 181);
    border-radius: 15px;
}

.sidebar-item{ 
    position:relative;
}

#sidebar:not(.expand) .sidebar-item .sidebar-dropdown{ 
    position: absolute;
    top:0;
    left:70px;
    background-color: black;
    padding: 0;
    min-width: 15rem;
    display: none;
}

#sidebar:not(.expand) .sidebar-item:hover .has-dropdown+.sidebar-dropdown{ 
    display: block;
    max-height: 15em;
    width: 100%;
    opacity: 1;
}

#sidebar.expand .sidebar-link[data-bs-toggle="collapse"]::after{ 
    border:solid;
    border-width:0 .075rem .075rem 0;
    content: "";
    display: inline-block;
    padding:2px;
    position: absolute;
    right: 1.5rem;
    top: 1.4rem; 
    transform: rotate(-135deg); 
    transition: all .2s ease-out;
}

#sidebar.expand .sidebar-link[data-bs-toggle="collapse"].collapsed::after{
    transform: rotate(45deg); 
    transition: all .2s ease-out;
}

.sidebar-link, .sidebar-logo a{
    text-decoration: none;
}


#toggle-btn i {
  font-size: 1.8rem; 
}

.sidebar-link i {
  font-size: 1.5rem; 
  margin-right: 1rem; 
}

.sidebar-link span {
  font-size: 1em;
}
</style>
