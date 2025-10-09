import {
    createWebHistory,
    createRouter
} from "vue-router";

import LandingPage from '../components/LandingPage.vue';
import Map from '../components/Map.vue';

const history = createWebHistory()
const routes = [
  {
    path: '/',
    component: LandingPage
  },

  {
    path: '/Map/',
    component: Map
  },

]

const router = createRouter({
    history,
    routes
  });

export default router;