<!-- <script>
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
  document.head.appendChild(link);

  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
  document.head.appendChild(link2);

</script> -->


<!-- html  -->
<template>
    <div id="login-page">
        <div class="login border rounded p-5">
                <h3 class="text-dark-emphasis">Login to EatWhatLa!</h3>
                <p><small><em>Welcome back! Please login to continue.</em></small></p>
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
                <div class="mt-3 d-flex justify-content-center">
                    <button class="btn border bg-dark text-light" @click="login">Login</button>
                </div>
                <div class="register-link mt-2 d-flex justify-content-center">
                    <p><small><em><RouterLink to="/SignUp/">Don't have an account?</RouterLink></em></small>
                    </p>
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
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const email = ref("")
const password = ref("")
const errMsg = ref()
const router = useRouter()
const login = () => {
    // need .value because of ref()
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

</script>


<!-- css -->
<style scoped>
small,
em,
a {
    display: inline;
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
</style>
