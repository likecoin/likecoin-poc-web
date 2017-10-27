<template>
  <div id="app">
    <router-view/>
    <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
    <link rel="stylesheet" href="//fonts.googleapis.com/icon?family=Material+Icons">
  </div>
</template>

<script>
export default {
  name: 'app',
  metaInfo: {
    title: 'Meme Generator - showcasing Content Footprint',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: 'favicon.png' },
    ],
  },
};
</script>

<style>
#app {
  font-family: 'Open Sans', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

body {
  background-color: #f7f7f7 !important;
}
</style>
