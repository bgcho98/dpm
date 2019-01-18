import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from 'axios'

Vue.config.productionTip = false;

axios.defaults.headers.common['Cache-control'] = 'no-store, no-cache, must-revalidate'
axios.defaults.headers.common['Pragma'] = 'no-cache'
axios.defaults.headers.common['Expires'] = '0'

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
