<script>
import { getAuth, onAuthStateChanged, updatePassword, signOut } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Sidebar from './subcomponents/Sidebar.vue';

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
  components: {
    Sidebar  
  },

  data() {
    return {
      username: "",
      profileImage: "",
      userId: "",
      newPassword: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      isLoadingProfile: true,
    };
  },

  mounted() {
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
        this.isLoadingProfile = false;
      } else {
        this.userId = "";
        this.$router.push("/Login");
      }
    });
  },

  methods: {
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
  <div class="wrapper">
    <Sidebar />
    <div class="main p-3">
      <div class="text-center mt-3 mb-4">
        <h1 class="fw-bold display-5 gradient-title">My Profile</h1>
        <h5 class="text-center text-secondary">Manage your account details</h5>
        <hr class="w-25 mx-auto opacity-50" />
      </div>

      <div class="container-fluid">
        <div class="card shadow-lg p-4 rounded border-0 mx-auto profile-card">
          <div class="row align-items-center gy-4">
            <!-- PROFILE IMAGE -->
            <div class="col-12 col-sm-6 col-md-5 col-lg-4 text-center">
              <img
                :src="profileImage || 'https://www.w3schools.com/howto/img_avatar.png'"
                alt="Profile"
                class="rounded-circle mb-3 shadow profile-img"
              />
              <div class="mt-2">
                <label class="btn btn-lightgrey btn-sm">
                  <i class="bi bi-camera me-1"></i> Change Picture
                  <input type="file" @change="handleImageUpload" hidden />
                </label>
              </div>
            </div>

            <!-- PROFILE INFO -->
            <div class="col-12 col-sm-6 col-md-7 col-lg-8">
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
                  class="btn btn-grey d-flex align-items-center gap-2 px-3 py-1.5"
                  data-bs-toggle="modal"
                  data-bs-target="#changePasswordModal"
                >
                  <i class="bi bi-key-fill"></i>
                  <span>Change Password</span>
                </button>
              </div>

              <div class="text-end">
                <button class="btn btn-grey mt-3 px-4" @click="saveChanges">
                  <i class="bi bi-save me-1"></i> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PASSWORD MODAL -->
      <div
        class="modal fade"
        id="changePasswordModal"
        tabindex="-1"
        aria-labelledby="changePasswordLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-3">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold" id="changePasswordLabel">
                Change Password
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
              <button class="btn btn-lightgrey" data-bs-dismiss="modal">
                Cancel
              </button>
              <button class="btn btn-grey" @click="changePassword">
                Save Changes
              </button>
            </div>
          </div>
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

/* MAIN SECTION */
.main {
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
  padding: 1rem;
}

/* Sidebar expand adjustment */
#sidebar.expand ~ .main {
  margin-left: 260px;
  width: calc(100vw - 260px);
}

.gradient-title {
  background: linear-gradient(180deg, #0d2436 0%, #42a5f5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* PROFILE CARD */
.profile-card {
  max-width: 850px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

/* IMAGE */
.profile-img {
  width: 200px;
  height: 200px;
  object-fit: cover;
}

.btn {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.95em;
  border-radius: 22px;
  padding: 0.3em 1em;
  margin: 0 6px 10px 0;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(40, 40, 40, 0.03);
}

/* BUTTON COLORS */
.btn-grey {
  background-color: #90caf9;
  border-color: #90caf9;
  color: #1e3a5f;
  box-shadow: 0 4px 12px rgba(66, 165, 245, 0.25);
}

.btn-grey:hover {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%);
  color: #fff;
  transform: translateY(-2px);
}

.btn-lightgrey {
  background-color: #e0e0e0;
  color: #555;
}

.btn-lightgrey:hover {
  background: linear-gradient(135deg, #667eea 0%, #17a2b8 100%);
  color: #fff;
}

/* ============================
   RESPONSIVE BREAKPOINTS
============================ */

/* Extra Small (XS) - Phones (keeps sidebar visible) */
@media (max-width: 575px) {
  .main {
    margin-left: 70px;
    width: calc(100vw - 70px);
    padding: 0.5rem;
  }

  h1.display-5 {
    font-size: 1.3rem;
    margin-bottom: 0.3rem;
  }

  h5 {
    font-size: 0.85rem;
  }

  hr {
    margin: 0.5rem 0 !important;
  }

  .profile-card {
    padding: 0.75rem;
    max-width: 100%;
  }

  .profile-img {
    width: 100px;
    height: 100px;
  }

  .btn {
    font-size: 0.75em;
    padding: 0.3em 0.6em;
    margin: 0 0 6px 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-sm {
    font-size: 0.7em;
    padding: 0.25em 0.5em;
    width: auto;
  }

  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }

  .form-control {
    font-size: 0.9rem;
    padding: 0.4rem 0.6rem;
  }

  .text-end {
    text-align: center;
  }

  /* Row adjustments */
  .row.align-items-center {
    gap: 0.5rem !important;
  }

  .col-12 {
    min-width: 0;
  }

  /* Modal adjustments */
  .modal-dialog {
    margin: 0.5rem;
    max-width: calc(100vw - 90px);
  }

  .modal-content {
    padding: 0.75rem !important;
  }

  .modal-header {
    padding: 0 0 0.75rem 0 !important;
  }

  .modal-body {
    padding: 0.5rem 0 !important;
  }

  .modal-footer {
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.75rem 0 0 0 !important;
  }

  .modal-footer .btn {
    width: 100%;
    margin: 0;
  }

  /* Icon positioning */
  .form-group .bi {
    font-size: 1rem;
  }
}

/* Small devices (tablets, 576px+) */
@media (min-width: 576px) and (max-width: 767px) {
  .main {
    margin-left: 70px;
    width: calc(100vw - 70px);
    padding: 0.75rem;
  }

  .profile-card {
    padding: 1.25rem;
  }

  .profile-img {
    width: 130px;
    height: 130px;
  }

  h1.display-5 {
    font-size: 1.6rem;
  }

  .btn {
    font-size: 0.82em;
    padding: 0.35em 0.75em;
  }
}

/* Medium devices (tablets, 768px+) */
@media (min-width: 768px) and (max-width: 991px) {
  .main {
    margin-left: 70px;
    width: calc(100vw - 70px);
  }

  .profile-img {
    width: 160px;
    height: 160px;
  }

  .profile-card {
    padding: 2rem;
  }
}

/* Large devices (desktops, 992px+) */
@media (min-width: 992px) {
  .profile-img {
    width: 200px;
    height: 200px;
  }
}
</style>


