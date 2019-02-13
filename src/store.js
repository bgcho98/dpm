import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isLoading: false,
    requestCount: 0
  },
  mutations: {
    startLoading(state) {
      state.requestCount = state.requestCount <= 0 ? 1 : state.requestCount++;
      Vue.set(state, "isLoading", true);
    },
    endLoading(state) {
      state.requestCount--;
      if (state.requestCount <= 0) {
        Vue.set(state, "isLoading", false);
      }
    }
  },
  actions: {}
});
