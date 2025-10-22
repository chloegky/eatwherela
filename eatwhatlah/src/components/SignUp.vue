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
        <div class="signup border rounded p-5">
            <!-- <h3 class="text-dark-emphasis">eatwhatla!</h3> -->
            <h3 class="text-dark-emphasis">Create a New Account</h3>
            <p class="text-dark"><small><em>Glad to have you here at EatWhatLa!</em></small></p>
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
            <div class="mt-3 text-danger" v-if="errorMsg">
                {{ errorMsg }}
            </div>
            <div class="mt-3 text-dark">
                <!-- <small>Password should contain:</small> -->
                <ul>
                    <li><small>8 characters minimum</small></li>
                    <li><small>One uppercase character</small></li>
                    <li><small>One special character</small></li>
                    <li><small>One numeric character</small></li>
                </ul>
            </div>
            <!-- <div class="input-group mt-3">
                    <span class="input-group-text"><i class='bx bxs-lock-alt'></i></span>
                    <input type="password" class="form-control" placeholder="Confirm Password"
                        aria-label="Confirm Password" aria-describedby="visible-addon" required v-model="password2">
                </div> -->
            <!-- <div id="pwMismatch" class="text-danger mt-3" v-if="password != password2">
                Please make sure your passwords match
            </div> -->
            <div class="mt-3 d-flex justify-content-center">
                <button class="btn border bg-dark text-light" @click="register">Submit</button>
            </div>
            <div class="mt-3 d-flex justify-content-center">
                    <button type="submit" class="btn border bg-dark text-light" @click="googleSignUp">
                        <i class='bx bxl-google' style="font-size: 24px; vertical-align: middle;"></i>
                        <span style="margin-left: 12px;">Sign up with Google</span>
                    </button>
                </div>
            <div class="register-link mt-2 d-flex justify-content-center">
                <p><small><em><RouterLink to="/">Already have an account?</RouterLink></em></small></p>
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
small,
em,
a {
    display: inline;
}

li {
    text-align: left;
}


#signup-page {
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

.signup {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 15px;
    color: #fff;
    height: auto;
}


#main-body{ 
    background-color: rgb(198, 198, 198);
}
</style>
