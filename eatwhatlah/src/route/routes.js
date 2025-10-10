import {
    createWebHistory,
    createRouter
} from "vue-router";

import MainMenu from '../components/MainMenu.vue';
import Login from '../components/Login.vue';
import SignUp from '../components/SignUp.vue';
import NearbyFav from '../components/NearbyFav.vue';
import Profile from '../components/Profile.vue';
import Favourites from '../components/Favourites.vue';
import Discounts from '../components/Discounts.vue';
import Price_Comparison from '../components/Price_Comparison.vue';
import Map from '../components/Map.vue';


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
    path: '/Price_Comparison/',
    component: Price_Comparison
  },
]

const router = createRouter({
    history,
    routes
  });

export default router;