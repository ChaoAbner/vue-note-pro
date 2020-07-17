import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Qs from 'qs'

import Element from 'element-ui'
import "element-ui/lib/theme-chalk/index.css"

import axios from 'axios'
import VueAxios from 'vue-axios'
// import VueCookies from 'vue-cookies'

import './axios'

const axios_instance = axios.create({
  transformRequest: [function (data) {
    data = Qs.stringify(data);
    return data;
  }],
  // headers:{
  //   'Content-Type':'application/x-www-form-urlencoded',
  // }
})
// 全局引用
Vue.prototype.$axios = axios

// Vue.use(VueCookies)
Vue.use(VueAxios, axios_instance);
// 使用
Vue.use(Element)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
