import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Login from "../views/Login.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    // 需要登录才能访问
    // meta: {
    //   requireAuth: true
    // }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  }
  // {
  //   path: '/blogs',
  //   name: 'Blogs',
  //   // 懒加载
  //   component: () => import('../views/Blogs.vue')
  // },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: routes
})

export default router
