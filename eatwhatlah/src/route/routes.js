import {
    createWebHistory,
    createRouter
} from "vue-router";

import MainMenu from '../components/MainMenu.vue';
import Login from '../components/Login.vue';
import SignUp from '../components/SignUp.vue';
import Home from '../components/Home.vue';
import NearbyFav from '../components/NearbyFav.vue';
import Profile from '../components/Profile.vue';
import Favourites from '../components/Favourites.vue';
import Discounts from '../components/Discounts.vue';
import Price_Comparison from '../components/Price_Comparison.vue';
import Map from '../components/Map.vue';
import Restaurant from '../components/Restaurant.vue';



const history = createWebHistory()
const routes = [
  {
    path: '/',
    component: MainMenu
  },

  {
    path: '/Home/',
    component: Home
  },

  {
    path: '/Login/',
    component: Login
  },
  {
    path: '/SignUp/',
    component: SignUp
  },
  {
    path: '/Home/',
    component: Home
  },
  {
    path: '/NearbyFav/',
    component: NearbyFav
  },

  {
    path: '/Map/',
    component: Map
  },
  {
    path: '/Profile/',
    component: Profile
  },
  {
    path: '/Favourites/',
    component: Favourites
  },
  {
    path: '/Discounts/',
    component: Discounts
  },
  {
    path: '/Restaurant/',
    component: Restaurant
  },
]

const router = createRouter({
    history,
    routes
  });

export default router;