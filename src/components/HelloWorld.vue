<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div v-if="test">
    <hr />
      <h2>Test buttons</h2>
      <button @click='onClick'>click</button>
      <button @click='onClickGet'>get</button>
    </div>
    <hr />
    <h2>Links</h2>
    <ul>
      <li><router-link :to="{ name: 'UploadImage' }">
        Upload Image
      </router-link></li>
      <br />
      <li @click="test=!test">Test buttons</li>
    </ul>
    <hr />
    <router-view/>
  </div>
</template>

<script>
import EthHelper from '@/util/EthHelper';

export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: 'LikeCoin Media chain POC',
      test: false,
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
