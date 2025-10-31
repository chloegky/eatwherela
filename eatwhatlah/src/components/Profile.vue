<script>
import { getAuth, onAuthStateChanged, updatePassword, signOut } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
  data() {
  return {
    username: "",
    profileImage: "",
    userId: "",
    newPassword: "",
    confirmPassword: "",
    showPassword: false, // 👈 this controls visibility
    showConfirmPassword: false, // 👈 added: fixes confirm-password eye toggle
  };
},

  mounted() {
  const hamburger = document.querySelector("#toggle-btn");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const sidebar = document.querySelector("#sidebar");
      if (sidebar) sidebar.classList.toggle("expand");
    });
  }

  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      this.userId = user.uid;
      const db = getDatabase();
      const snapshot = await get(ref(db, "users/" + user.uid));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        this.username = userData.username || "";
        this.profileImage = userData.profileImage || "";
      }
    } else {
      this.userId = "";
      this.$router.push("/Login"); // 🚀 Secure redirect
    }
  });
},


  methods: {

    async logout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        alert("👋 You have been signed out successfully!");
        this.$router.push("/"); // redirect to login page
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
        this.$router.push("/");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("❌ Failed to sign out. Please try again.");
      }
    },

    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },

    async saveChanges() {
      const auth = getAuth();
      const db = getDatabase();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to update your profile.");
        return;
      }

      try {
        await update(ref(db, "users/" + this.userId), {
          username: this.username,
        });

        await updateProfile(user, {
          displayName: this.username,
        });

        alert("✅ Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("❌ Failed to update profile. Please try again.");
      }
    },

    // ✅ Change password with confirmation & visibility toggle
    async changePassword() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to change your password.");
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        alert("⚠️ Passwords do not match!");
        return;
      }

      try {
        await updatePassword(user, this.newPassword);
        alert("✅ Password updated successfully!");
        this.newPassword = "";
        this.confirmPassword = "";
      } catch (error) {
        console.error("Error changing password:", error);
        alert("❌ Failed to change password. Try re-logging in.");
      }
    },

    // ✅ Handle image upload
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const storage = getStorage();
      const fileRef = storageRef(storage, "profileImages/" + this.userId + ".jpg");

      try {
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        const db = getDatabase();
        await update(ref(db, "users/" + this.userId), { profileImage: url });

        this.profileImage = url;
        alert("✅ Profile picture updated successfully!");
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("❌ Failed to upload image. Please try again.");
      }
    },
  },
};
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
     <div class="main p-3">
        <div class="text-center mt-3 mb-4">
          <h1 class="fw-bold display-5" style="color: #42a5f5;">My Profile</h1>
          <p class="text-muted">Manage your account details</p>
          <hr class="w-25 mx-auto opacity-50" />
        </div>

        <div class="container"> 
          <div class="card shadow-lg p-4 rounded border-0 mx-auto" style="max-width: 850px;">
            <div class="row align-items-center">
              <!-- Profile Picture -->
            <div class="col-md-4 text-center">
              <img
                :src="profileImage || 'https://www.w3schools.com/howto/img_avatar.png'"
                alt="Profile"
                class="rounded-circle mb-3 shadow"
                width="200"
                height="200"
              />

              <div class="mt-3">
                <label class="btn btn-outline-dark btn-sm">
                  <i class="bi bi-camera me-1"></i> Change Picture
                  <input type="file" @change="handleImageUpload" hidden />
                </label>
              </div>
            </div>
             <div class="col-md-8">
              <div class="form-group mb-3">
                <label class="fw-semibold">Username</label>
                <input
                  type="text"
                  name="Username"
                  class="form-control"
                  placeholder="Enter Username"
                  v-model="username"
                />
              </div>

              <div class="form-group mb-3">
                <label class="fw-semibold">Password</label><br />
                <button
                  class="btn btn-secondary d-flex align-items-center gap-2 px-3 py-1.5"
                  data-bs-toggle="modal"
                  data-bs-target="#changePasswordModal"
                >
                  <i class="bi bi-key-fill"></i>
                  <span>Change Password</span>
                </button>
              </div>

              <div class="text-end">
                <button class="btn btn-dark mt-3 px-4" @click="saveChanges">
                  <i class="bi bi-save me-1"></i> Save Changes
                </button>
              </div>

              <div
                class="modal fade"
                id="changePasswordModal"
                tabindex="-1"
                aria-labelledby="changePasswordLabel"
                aria-hidden="true"
                ref="changePasswordModal"
              >
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content p-3">
                    <div class="modal-header border-0">
                      <h5 class="modal-title fw-bold" id="changePasswordLabel">
                        Change Password
                      </h5>
                      <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      ></button>
                    </div>

                    <div class="modal-body">
                      <div class="form-group mb-3 position-relative">
                        <label>New Password</label>
                        <input
                          :type="showPassword ? 'text' : 'password'"
                          v-model="newPassword"
                          class="form-control"
                          placeholder="Enter new password"
                        />
                        <i
                          class="bi"
                          :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"
                          @click="showPassword = !showPassword"
                          style="position: absolute; right: 12px; top: 38px; cursor: pointer;"
                        ></i>
                      </div>

                      <div class="form-group mb-3 position-relative">
                        <label>Confirm Password</label>
                        <input
                          :type="showConfirmPassword ? 'text' : 'password'"
                          v-model="confirmPassword"
                          class="form-control"
                          placeholder="Re-enter new password"
                        />
                        <i
                          class="bi"
                          :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"
                          @click="showConfirmPassword = !showConfirmPassword"
                          style="position: absolute; right: 12px; top: 38px; cursor: pointer;"
                        ></i>
                      </div>

                    </div>

                    <div class="modal-footer border-0">
                      <button
                        type="button"
                        class="btn btn-secondary"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="btn btn-dark"
                        @click="changePassword"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
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
  background: linear-gradient(180deg, #64b5f6 0%, #42a5f5 100%);
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
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

#toggle-btn i, #navbar-item i {
  font-size: 1.4rem;
  color: #e3f2fd;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo a, .item-logo a {
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
  background-color: rgba(255, 255, 255, 0.2);
}

.d-flex.align-items-center {
  display: flex !important;
  align-items: center !important;
}

  .main{ 
    min-height: 100vh;
    transition: margin-left 0.25s, width 0.25s;
    margin-left: 70px;
    background: 
    radial-gradient(circle at 20% 20%, rgba(187, 222, 251, 0.3) 0%, transparent 50%),
    linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
    overflow: hidden;
    width: calc(100vw - 70px);
    display: flex;
    flex-direction: column;
  }

  #sidebar.expand ~ .main {
    margin-left: 260px;
    width: calc(100vw - 260px);
  }

  #logoutModal .modal-content {
    border-radius: 12px;
  }

  #logoutModal .btn-dark {
    background-color: #90caf9;
    border: none;
    color: #1e3a5f;
  }

  #logoutModal .btn-dark:hover {
    background-color: #64b5f6;
  }


</style>
