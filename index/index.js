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
