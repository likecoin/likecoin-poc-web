<template>
  <div class="view">
    <img :src="imgUrl" />
    <ul>
      <li v-for="(value, key) in metadata">
        <span>{{ key }} : {{ value }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import * as api from '@/api/api';

export default {
  name: 'ViewImage',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
      uid: '',
      ipfsHash: '',
      metadata: {},
    };
  },
  computed: {
    imgUrl() {
      return `https://ipfs.io/ipfs/${this.ipfsHash}`;
    },
  },
  mounted() {
    const uid = this.$route.params.uid;
    if (!this.ipfsHash || this.uid !== uid) {
      api.apiGetMetadata(uid)
      .then((result) => {
        this.metadata = result.data;
        this.ipfsHash = result.data.ipfs;
        this.uid = uid;
      });
    }
  },
  beforeRouteUpdate(to, from, next) {
    const uid = to.params.uid;
    if (!this.ipfsHash || this.uid !== uid) {
      api.apiGetMetadata(to.params.uid)
      .then((result) => {
        this.metadata = result.data;
        this.ipfsHash = result.data.ipfs;
        this.uid = uid;
      });
    }
    next();
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
