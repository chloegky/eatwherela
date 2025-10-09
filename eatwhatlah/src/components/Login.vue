<script>
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
  document.head.appendChild(link);

  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
  document.head.appendChild(link2);

</script>


<!-- html  -->
<template>
    <div class="login border bg-light rounded p-5" >
        <form action="">
            <h3 class="text-dark-emphasis">Login to EatWhatLa!</h3>
            <p><small><em>Welcome back! Please login to continue.</em></small></p>
            <div class="input-group mt-4">
                <span class="input-group-text"><i class='bx bxs-user'></i></span>
                <input type="text" class="form-control" placeholder="Username" aria-label="Username" aria-describedby="visible-addon" required>
            </div>
            <div class="input-group mt-3">
                <span class="input-group-text"><i class='bx bxs-lock-alt'></i></span>
                <input type="password" class="form-control" placeholder="Password" aria-label="Password" aria-describedby="visible-addon" required>
            </div>
            <div class="mt-3 d-flex justify-content-center">
                <button type="submit" class="btn border bg-dark text-light">Login</button>
            </div>
            <div class="register-link mt-2 d-flex justify-content-center">
                <p><small><em>Don't have an account? Sign Up<RouterLink to="/SignUp/">Here</RouterLink></em></small></p>
            </div>
        </form>
    </div>
</template>


<!-- css -->
<style scoped>

small, em, a {
  display: inline;
}


</style>
