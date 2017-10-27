<template>
  <div class="hello">
    <md-toolbar id="main-nav" class="nav">
      <router-link exact to="/">
        <img class="logo"
            src="../assets/like.png"
            srcset="../assets/like@2x.png 2x,
                    ../assets/like@3x.png 3x" />
      </router-link>
      <md-layout class="title-box"><h1 class="title">{{ title }}</h1>
        <div class="colorbar1" />
        <md-layout md-row><div style="flex:1"></div>
          <router-link :to="{ name: 'UploadImage' }" tag="md-button" class="upload-button md-raised"><md-icon>add</md-icon>Upload</router-link>
        </md-layout>
      </md-layout>
    </md-toolbar>
    <div class="inner-container"><router-view/></div>
    <div class="colorbar2" />
    <footer>
      <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
        <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" />
      </a>
      This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
    </footer>
  </div>
</template>

<script>
import EthHelper from '@/util/EthHelper';

export default {
  name: 'HelloWorld',
  data() {
    return {
      title: 'Meme Generator - showcasing Content Footprint',
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

#main-nav {
  background-color: white;
}

.logo {
  padding: 20px;
}

.title-box {
  flex: 1;
  height: 80px;
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

.upload-button {
  margin: 15px;
}

.inner-container {
  margin: 20px;
}

footer {
  margin-top: 20px;
}

.colorbar1 {
  width: 100%;
  height: 2px;
  background-image: linear-gradient(to right, #a8ff97, #69ecf1 30%, #77c9f5 51%, #b792ff 77%, #fe7ba0);
}

.colorbar2 {
  width: 100%;
  height: 2px;
  background-image: linear-gradient(to left, #a8ff97, #69ecf1 30%, #77c9f5 51%, #b792ff 77%, #fe7ba0);
}

a {
  color: #42b983;
}
</style>
