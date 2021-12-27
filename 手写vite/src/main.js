// import {str} from './moduleA.js';
import { createApp,h} from "vue";
import App from './App.vue'
// const App = {
//     render(){
//         return h('div',null,[h('div',null,'Hello word')])
//     }
// }
createApp(App).mount('#app')