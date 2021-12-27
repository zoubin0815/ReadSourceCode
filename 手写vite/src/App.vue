<template>
    <div>
        <h1>大家好，欢迎来到vite</h1>
    </div>
    <h2>
        <span>count is {{count++}}</span>
        <button @click="count++"> +1</button>
    </h2>
</template>
<script>
import { ref } from 'vue'
import "./index.css"
export default {
    setup() {
        const count = ref(6);
        function add(){
            count.value++;
        }
        return{
            count
        }
    },
}
</script>
