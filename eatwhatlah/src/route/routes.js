import {
    createWebHistory,
    createRouter
} from "vue-router";

import MainMenu from '../components/MainMenu.vue';
import Login from '../components/Login.vue';
import SignUp from '../components/SignUp.vue';
import NearbyFav from '../components/NearbyFav.vue';
import Profile from '../components/Profile.vue';
import Discounts from '../components/Discounts.vue';
import Price_Comparison from '../components/Price_Comparison.vue';
import Map from '../components/Map.vue';
import Home from '../components/Home.vue';
import Restaurant from '../components/Restaurant.vue';
import Response from '../components/Response.vue';



const history = createWebHistory()
const routes = [
  {
    path: '/',
    component: MainMenu
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
    path: '/Response/',
    component: Response
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
    path: '/Discounts/',
    component: Discounts
  },
  {
    path: '/Restaurant/',
    component: Restaurant
  },
   {
    path: '/Price_Comparison/',
    component: Price_Comparison
  },
]

const router = createRouter({
    history,
    routes
  });

export default router;