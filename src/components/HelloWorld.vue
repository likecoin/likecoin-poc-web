<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <router-view/>
    <h2>Essential Links</h2>
    <ul>
      <li><router-link :to="{ name: 'UploadImage', params: { wallet } }">
        Upload Image
      </router-link></li>
    </ul>
    <h2>Test buttons</h2>
    <button @click='onClick'>click</button>
    <button @click='onClickGet'>get</button>
  </div>
</template>

<script>
import EthHelper from '@/util/EthHelper';

export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  methods: {
    onClick() {
      EthHelper.onClick();
    },
    onClickGet() {
      EthHelper.onClickGet();
    },
  },
  mounted() {
    EthHelper.initApp();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
