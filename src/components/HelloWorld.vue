<template>
  <div class="hello">
    <md-toolbar class="nav md-transparent">
      <img src="../assets/like.png"
           srcset="../assets/like@2x.png 2x,
                   ../assets/like@3x.png 3x" />
      <h1 class="title">{{ title }}</h1>
    </md-toolbar>
    <h2>Links</h2>
    <ul>
      <li><router-link :to="{ name: 'UploadImage' }">
        Upload Image
      </router-link></li>
      <br />
    </ul>
    <hr />
    <router-view/>
    <div class="footer">
      <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
        <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" />
      </a>
      This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
    </div>
  </div>
</template>

<script>
import EthHelper from '@/util/EthHelper';

export default {
  name: 'HelloWorld',
  data() {
    return {
      title: 'Meme Generator - with content footprint',
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

.title {
  background-image: linear-gradient(93deg, #55a8e5, #7850d9 50%, #730a70);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
  text-align: left;
  font-size: 40px;
  font-weight: 300;
  height: 50px;
  margin: 0;
}

a {
  color: #42b983;
}
</style>
