import { createApp } from 'vue'
import router from './route/routes.js' // for routing 
import App from './App.vue'


const app = createApp(App)
app.use(router).mount('#app')
