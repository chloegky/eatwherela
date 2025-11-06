<script setup>
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import { getAuth, signOut } from "firebase/auth";

const router = useRouter();

async function logout() {
  const auth = getAuth();
  try {
    await signOut(auth);
    alert("👋 You have been signed out successfully!");
    router.push("/");
  } catch (error) {
    console.error("Error signing out:", error);
    alert("❌ Failed to sign out. Please try again.");
  }
}

async function confirmLogout() {
  const auth = getAuth();
  try {
    await signOut(auth);
    alert("👋 You have been signed out successfully!");
    router.push("/");
  } catch (error) {
    console.error("Error signing out:", error);
    alert("❌ Failed to sign out. Please try again.");
  }
}

onMounted(() => {
  const hamburger = document.querySelector("#toggle-btn");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const sidebar = document.querySelector("#sidebar");
      if (sidebar) sidebar.classList.toggle("expand");
    });
  }
});
</script>

<template>
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
      <button id="navbar-item" type="button" @click="$router.push('/Profile/')">
        <i class="lni lni-user"></i>
      </button>
      <div class="item-logo ml-2">
        <RouterLink to="/Profile/">Profile</RouterLink>
      </div>
    </div>

    <div class="item d-flex align-items-center">
      <button id="navbar-item" type="button" @click="$router.push('/NearbyFav/')">
        <i class="lni lni-heart"></i>
      </button>
      <div class="item-logo ml-2">
        <RouterLink to="/NearbyFav/">Favourites</RouterLink>
      </div>
    </div>

    <div class="item d-flex align-items-center">
      <button id="navbar-item" type="button" @click="$router.push('/Map/')">
        <i class="lni lni-map"></i>
      </button>
      <div class="item-logo ml-2">
        <RouterLink to="/Map/">Map</RouterLink>
      </div>
    </div>

    <div class="item d-flex align-items-center">
      <button id="navbar-item" type="button" @click="$router.push('/Discounts/')">
        <i class="lni lni-ticket"></i>
      </button>
      <div class="item-logo ml-2">
        <RouterLink to="/Discounts/">Discounts</RouterLink>
      </div>
    </div>

    <div class="item d-flex align-items-center mt-auto mb-3">
      <button id="navbar-item" type="button" data-bs-toggle="modal" data-bs-target="#logoutModal">
        <i class="lni lni-exit"></i>
      </button>
      <div class="item-logo ml-2">
        <a href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">Logout</a>
      </div>
    </div>
  </aside>

  <!-- Logout Confirmation -->
  <div class="modal fade" id="logoutModal" tabindex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true">
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
          <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">
            Cancel
          </button>
          <button type="button" class="btn btn-dark px-4" @click="confirmLogout" data-bs-dismiss="modal">
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background: linear-gradient(180deg, #0d2436 0%, #42a5f5 100%);
  box-shadow: 2px 0 12px rgba(66, 165, 245, 0.3);
}

#sidebar.expand {
  width: 260px;
  min-width: 260px;
}

#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100% - 260px);
}

#toggle-btn,
#navbar-item {
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

#toggle-btn:hover,
#navbar-item:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

#toggle-btn i,
#navbar-item i {
  font-size: 1.4rem;
  color: #e3f2fd;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo a,
.item-logo a {
  color: #e3f2fd;
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

.sidebar-logo,
.item-logo {
  transition: width 0.28s ease, visibility 0s linear 0s;
  white-space: nowrap;
}

.item {
  margin: 0.25rem 0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.item:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
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
