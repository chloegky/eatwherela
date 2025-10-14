<script>
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


</script>


<!-- html  -->
<template>
    <div id="signup-page">
        <div class="signup border rounded p-5">
            <form action="">
                <h3 class="text-dark-emphasis">Sign Up to EatWhatLa!</h3>
                <p><small><em>Glad that you will be signing up with us!</em></small></p>
                <div class="input-group mt-4">
                    <span class="input-group-text"><i class='bx bxs-user'></i></span>
                    <input type="text" class="form-control" placeholder="Email" aria-label="Username"
                        aria-describedby="visible-addon" required v-model="email">
                </div>
                <div class="input-group mt-3">
                    <span class="input-group-text"><i class='bx bxs-lock-alt'></i></span>
                    <input type="password" class="form-control" placeholder="Password (at least 6 chars)" aria-label="Password"
                        aria-describedby="visible-addon" required v-model="password">
                </div>
                <div class="input-group mt-3">
                    <span class="input-group-text"><i class='bx bxs-lock-alt'></i></span>
                    <input type="password" class="form-control" placeholder="Confirm Password"
                        aria-label="Confirm Password" aria-describedby="visible-addon" required v-model="password2">
                </div>

                <div id="pwMismatch" class="text-danger mt-3" v-if="password != password2">
                    Please make sure your passwords match
                </div>
                <div class="mt-3 d-flex justify-content-center">
                    <button type="submit" class="btn border bg-dark text-light" @click="register">Submit</button>
                </div>
                <div class="mt-3 d-flex justify-content-center">
                    <button type="submit" class="btn border bg-dark text-light" @click="registerGoogle">Sign up with
                        Google</button>
                </div>
                <div class="register-link mt-2 d-flex justify-content-center">
                    <p><small><em>Back to<RouterLink to="/Login/">Login</RouterLink></em></small></p>
                </div>
            </form>
        </div>
    </div>
</template>


<!-- css -->
<style scoped>
small,
em,
a {
    display: inline;
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
</style>
