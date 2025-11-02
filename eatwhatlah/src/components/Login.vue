<!-- html  -->
<template>
    <div id="main-body">
    <div id="login-page">
        <div class="login border rounded p-5">
                <h2 class="text-light-emphasis text-light" style="background: linear-gradient(180deg, #0d2436 0%, #42a5f5 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Login to EatWhatLa!</h2>
                <p class="text-dark"><small><em>Welcome back! Please login to continue.</em></small></p>
                
                <div class="input-group mt-4">
                    <span class="input-group-text"><i class='bx bxs-user'></i></span>
                    <input type="text" class="form-control" placeholder="Email" aria-label="Username"
                        aria-describedby="visible-addon" required v-model="email">
                </div>
                <div class="input-group mt-3">
                    <span class="input-group-text"><i class='bx bxs-lock-alt'></i></span>
                    <input type="password" class="form-control" placeholder="Password" aria-label="Password"
                        aria-describedby="visible-addon" required v-model="password">
                </div>
                
                <div class="mt-3 text-danger" v-if="errMsg">
                    {{ errMsg }}
                </div>
                
                <!-- Success message for password reset -->
                <div class="mt-3 text-success" v-if="resetSuccessMsg">
                    {{ resetSuccessMsg }}
                </div>
                
                <div class="mt-3 d-flex justify-content-between align-items-center form-narrow mx-auto">
                    <button class="btn border bg-dark text-light" @click="login">Login</button>
                    <span class="mx-2 text-secondary fw-bold" style="font-size:1.08rem;">or</span>
                    <button type="submit" class="btn border bg-dark text-light" @click="googleSignIn">
                        <i class='bx bxl-google' style="font-size: 24px; vertical-align: middle;"></i>
                        <span style="margin-left: 12px;">Login with Google</span>
                    </button>
                </div>

                
                <!-- Password Reset Button -->
                <div class="mt-3 d-flex justify-content-center">
                    <button type="button" class="btn border bg-dark text-light" @click="resetPassword">
                        <i class='bx bx-mail-send' style="font-size: 20px; vertical-align: middle;"></i>
                        <span style="margin-left: 8px;">Forgot Password?</span>
                    </button>
                </div>
                
                <div class="register-link mt-2 d-flex justify-content-center">
                    <p><small><em><RouterLink to="/SignUp/">Don't have an account?</RouterLink></em></small>
                    </p>
                </div>
        </div>
    </div>
    </div>
</template>




<script setup>
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
document.head.appendChild(link);


const link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
document.head.appendChild(link2);


// firebase login authentication
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail 
} from 'firebase/auth';


const email = ref("")
const password = ref("")
const errMsg = ref()
const resetSuccessMsg = ref()
const router = useRouter()


// Email/Password Login
const login = () => {
    signInWithEmailAndPassword(getAuth(), email.value, password.value)
        .then((userCredential) => {
            console.log("Login successful")
            console.log(getAuth().currentUser)
            router.push("/Home/")
        })
        .catch((error) => {
            console.log(error.code)
            switch (error.code) {
                case "auth/invalid-email":
                    errMsg.value = "Invalid email"
                    break
                case "auth/user-not-found":
                    errMsg.value = "No account with that email was found"
                    break
                case "auth/wrong-password":
                    errMsg.value = "Incorrect password"
                    break
                default:
                    errMsg.value = "Email or password was incorrect"
                    break
            }
        });
}


// Google Sign-In
const googleSignIn = () => {
    const provider = new GoogleAuthProvider()
    signInWithPopup(getAuth(), provider)
    .then((result) => {
        console.log(result.user)
        router.push('/Home/')
    })
    .catch((error) => {
        console.log(error.code)
        errMsg.value = error.message
    })
}


// Password Reset Function
const resetPassword = () => {
    if (!email.value) {
        errMsg.value = "Please enter your email address first"
        resetSuccessMsg.value = ""
        return
    }
    
    sendPasswordResetEmail(getAuth(), email.value)
        .then(() => {
            resetSuccessMsg.value = "Password reset email sent!"
            errMsg.value = ""
            console.log("Password reset email sent successfully")
        })
        .catch((error) => {
            console.log(error.code)
            resetSuccessMsg.value = ""
            switch (error.code) {
                case "auth/invalid-email":
                    errMsg.value = "Invalid email address"
                    break
                case "auth/user-not-found":
                    errMsg.value = "No account with that email was found"
                    break
                default:
                    errMsg.value = "Failed to send reset email. Please try again."
                    break
            }
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

.text-dark small em {
  color: #4a6fa5;
  font-size: 0.99rem;
}

#login-page {
    margin: 0;
    display: flex;
    place-items: center;
    min-width: 320px;
    min-height: 100vh;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
}


.login {
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

.btn .bx.bx-mail-send {
  color: #2faaff;
}


.text-danger {
  color: #ff6872 !important;
  background: transparent;
}
.text-success {
  color: #70ef91 !important;
}



#login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin:auto;
}

.register-link p {
  color: #afafbe;
  margin-top: 12px;
}
.register-link a,
.link-options a {
  color: #cc3000 !important;
  text-decoration: underline;
  transition: color 0.18s;
}

small, em, a {
  display: inline !important;
}

.login {
  animation: fadeIn 0.8s ease;
}

.form-narrow {
  max-width: 340px;
  width: 100%;
  margin: 0 auto;
}


@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}

</style>
