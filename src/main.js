import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import VueGoodTablePlugin from "vue-good-table";
import Gantt from "./components/gantt/gantt.vue";
import flatPickr from "vue-flatpickr-component";

import "./styles/app.scss";

// Usesages
Vue.use(require("vue-moment"));

// Styles
import "flatpickr/dist/flatpickr.css";

import "vue-good-table/dist/vue-good-table.css";

library.add(fas);

Vue.component("font-awesome-icon", FontAwesomeIcon);

Vue.component("flatPickr", flatPickr);
Vue.component("Gantt", Gantt);

Vue.use(BootstrapVue);
Vue.use(VueGoodTablePlugin);
Vue.config.productionTip = false;

axios.defaults.headers.common["Cache-control"] =
  "no-store, no-cache, must-revalidate";
axios.defaults.headers.common["Pragma"] = "no-cache";
axios.defaults.headers.common["Expires"] = "0";

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
