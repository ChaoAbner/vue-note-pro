import axios from 'axios'
import Element from "element-ui";
import store from "./store";
import router from "./router";

axios.defaults.baseURL='http://localhost:8081'

axios.interceptors.request.use(config => {
    console.log("前置拦截")
    // 可以统一设置请求头
    let token = localStorage.getItem("token")
    if (token) {
        // 将token放到请求头发送给服务器,将token放在请求头中
        config.headers['Authorization'] = token;
        config.headers['Access-Control-Allow-Origin'] = '*';
    }
    return config
})

// axios.interceptors.response.use(response => {
//     const res = response.data;
//     console.log("后置拦截")
//     // 当结果的code是否为0的情况为成功访问
//     if (res.code === 0) {
//         return response
//     } else {
//         // 弹窗异常信息
//         Element.Message({
//             message: response.data.msg,
//             type: 'error',
//             duration: 2 * 1000
//         })
//         // 直接拒绝往下面返回结果信息
//         return Promise.reject(response.data.msg)
//     }
// },
// error => {
//     console.log('err' + error)// for debug
//     if(error.response.data) {
//         error.message = error.response.data.msg
//     }
//     // 根据请求状态觉得是否登录或者提示其他
//     if (error.response.status === 40004) {
//         store.commit('REMOVE_INFO');
//         router.push({
//             path: '/login'
//         });
//         error.message = '请重新登录';
//     }
//     if (error.response.status === 40003) {
//         error.message = '权限不足，无法访问';
//     }
//     Element.Message({
//         message: error.message,
//         type: 'error',
//         duration: 3 * 1000
//     })
//     return Promise.reject(error)
// })
