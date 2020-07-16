import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

/**
 存储token，用的是localStorage，存储用户信息，我们用的是sessionStorage。
 毕竟用户信息我们不需要长久保存，保存了token信息，我们随时都可以初始化用户信息。
 */

export default new Vuex.Store({
  state: {
    token: '',
    userInfo: JSON.parse(sessionStorage.getItem("userInfo"))
  },
  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
      localStorage.setItem("token", token)
    },
    SET_USERINFO: (state, userInfo) => {
      state.userInfo = userInfo
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo))
    },
    REMOVE_INFO: (state) => {
      localStorage.setItem("token", '')
      sessionStorage.setItem("userInfo", JSON.stringify(''))
      state.userInfo = {}
    },
    DELETE_NOTE: (state, noteId) => {
      let key = "noteId_" + noteId
      let notesInfo = localStorage.getItem("notesInfo");
      notesInfo = JSON.parse(notesInfo)
      delete notesInfo[key]
      localStorage.setItem("notesInfo", JSON.stringify(notesInfo));
    }
  },
  getters: {

    getUser: state => {
      return state.userInfo
    },

    getVersion: (state, noteId) => {
      let key = "noteId_" + noteId
      let notesInfo = localStorage.getItem("notesInfo");
      /**
       * {
       *  note_1:
       *    {version: 1, update: 0},
       *
       *  note_2:
       *    {version: 2, update: 1}
       * }
       */
      notesInfo = JSON.parse(notesInfo)
      return notesInfo[key].version
    },
  },
  actions: {
  },
  modules: {
  }
})
