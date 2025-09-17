document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM fully loaded");
  const hamburger = document.querySelector("#toggle-btn");
  if (!hamburger) {
    console.error("#toggle-btn not found");
    return;
  }
  hamburger.addEventListener("click", function () {
    console.log("Toggle button clicked");
    document.querySelector("#sidebar").classList.toggle("expand");
  });
});


document.querySelectorAll('.favorite-heart').forEach(heart => {
  heart.addEventListener('click', () => {
    heart.classList.toggle('fa-heart-o'); // empty heart
    heart.classList.toggle('fa-heart');   // filled heart
    heart.classList.toggle('favorited');  // optional color toggle
    
    // Optional: perform actions like saving favorites here
  });
});
