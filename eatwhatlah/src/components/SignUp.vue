<!-- <script>
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
document.head.appendChild(link);

const link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
document.head.appendChild(link2);

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export default {

    data() {
        return {
            email: '',
            password: '',
            password2: '',
        }
    },
    methods: {
        register() {
            // Tries to register new user
            if (this.password == this.password2) {
                this.$router.push('/Home')
                createUserWithEmailAndPassword(getAuth(), this.email, this.password)
                    .then((data) => {
                        console.log("Registration successful!")
                    })
                    .catch((error) => {
                        console.log(error.code);
                        alert(error.message);
                    });
            } else {
                alert("Passwords do not match!")
            }
        },
    }
}


</script> -->

<!-- html  -->
<template>
  <div id="main-body">
    <div id="signup-page">
      <div class="signup border rounded p-5 mx-auto">
        <h2 class="text-light-emphasis text-light fw-bold" style="background: linear-gradient(180deg, #0d2436 0%, #42a5f5 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Create a New Account</h2>
        <p class="text-dark"><small><em>Glad to have you here at EatWhatLa!</em></small></p>
        <div class="input-group mt-4 form-narrow mx-auto">
          <span class="input-group-text"><i class='bx bxs-user'></i></span>
          <input type="text" class="form-control" placeholder="Email" aria-label="Username"
                 aria-describedby="visible-addon" required v-model="email">
        </div>
        <div class="input-group mt-3 form-narrow mx-auto">
          <span class="input-group-text"><i class='bx bxs-lock-alt'></i></span>
          <input type="password" class="form-control" placeholder="Password" aria-label="Password"
                 aria-describedby="visible-addon" required v-model="password">
        </div>
        <div class="mt-3 text-danger" v-if="errorMsg">
          {{ errorMsg }}
        </div>
        <div class="mt-3 text-light">
          <ul class="text-start ms-3 text-dark">
            <li><small>8 characters minimum</small></li>
            <li><small>One uppercase character</small></li>
            <li><small>One special character</small></li>
            <li><small>One numeric character</small></li>
          </ul>
        </div>
        <div class="mt-4 d-flex justify-content-between align-items-center form-narrow mx-auto">
          <button class="btn border bg-dark text-light" @click="register">Submit</button>
          <span class="mx-2 text-secondary fw-bold" style="font-size:1.08rem;">or</span>
          <button type="button" class="btn border bg-dark text-light d-flex align-items-center" @click="googleSignUp">
            <i class='bx bxl-google' style="font-size: 24px; vertical-align: middle;"></i>
            <span style="margin-left: 12px;">Sign up with Google</span>
          </button>
        </div>
        <div class="register-link mt-4 d-flex justify-content-center">
          <p><small><em>
            <RouterLink to="/" class="text-danger">Already have an account?</RouterLink>
          </em></small></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// bootstrap
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
document.head.appendChild(link);
const link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
document.head.appendChild(link2);

// Firebase sign up
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, createUserWithEmailAndPassword, validatePassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const email = ref("")
const password = ref("")
const errorMsg = ref()
const router = useRouter()
const register = () => {
    // need .value because of ref()
    createUserWithEmailAndPassword(getAuth(), email.value, password.value)
        .then((userCredential) => {
            validatePassword(getAuth(), password.value)
                .then((status) => {
                    if (!status.isValid) {
                        // Password could not be validated. Use the status to show what
                        // requirements are met and which are missing.

                        // If a criterion is undefined, it is not required by policy. If the
                        // criterion is defined but false, it is required but not fulfilled by
                        // the given password. For example:
                        // const needsLowerCase = status.containsLowercaseLetter !== true;
                        console.log(status)
                    } else {
                        console.log("Registration successful!")
                        router.push('/Home/')
                    }
                })
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode)
            alert(errorMessage)
        });
}

// Google sign up
const googleSignUp = () => {
    const provider = new GoogleAuthProvider()
    signInWithPopup(getAuth(), provider)
    .then((result) => {
        console.log(result.user)
        router.push('/Home/')
    })
    .catch((error) => {
        console.log(error.code)
        alert(error.message)
    })
}

</script>


<!-- css -->
<style scoped>

h2.text-light-emphasis {
  font-size: 2.05rem;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: 'Inter', 'Montserrat', sans-serif;
  color: #42a5f5 !important;
}

#main-body {
  background: linear-gradient(120deg, #e3f2fd 0%, #bbdefb 100%);
  min-height: 100vh;
  height: 100vh;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-dark small em {
  color: #4a6fa5;
  font-size: 0.99rem;
}

#signup-page {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 320px;
  min-height: 100vh;
  text-align: center;
  max-width: 1280px;
}

.signup {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(66, 165, 245, 0.25);
  color: #1e3a5f;
  padding: 60px 50px 60px 50px;
  width: 500px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: fadeIn 0.8s ease;
}

.input-group-text {
  border: none;
  border-radius: 10px 0 0 10px;
  font-size: 1.19rem;
}

.form-control {
  background: #ffffff;
  color: #1e3a5f;
  border: 1px solid #bbdefb;
  border-radius: 0 10px 10px 0;
  font-size: 1rem;
  padding-left: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 60%;
}

.form-narrow {
  max-width: 340px;
  width: 100%;
  margin: 0 auto;
}

.register-link a,
.link-options a {
  color: #cc3000 !important;
  text-decoration: underline;
  transition: color 0.18s;
}

.btn {
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  transition: background 0.22s, color 0.18s, box-shadow 0.20s;
  box-shadow: 0 1px 5px rgba(30, 30, 48, 0.07);
}

.bg-dark {
  border: none;
}

.btn:hover, .btn:focus {
  background: linear-gradient(90deg, #64b5f6 0%, #42a5f5 70%, #64b5f6 100%);
  color: #ffffff !important;
  box-shadow: 0 3px 18px rgba(66, 165, 245, 0.4);
}

.btn .bx.bxl-google {
  color: #ea4335;
}

.text-danger {
  color: #ff6872 !important;
  background: transparent;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}

</style>
