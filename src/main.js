// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueMaterial from 'vue-material';
import VueIntercom from 'vue-intercom';
import 'vue-material/dist/vue-material.css';

import App from './App';
import router from './router';

Vue.config.productionTip = false;
Vue.use(VueMaterial);

const intercomAppId = process.env.INTERCOM_APP_ID;
if (intercomAppId) Vue.use(VueIntercom, { appId: intercomAppId });
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App },
  watch: {
    '$intercom.ready': function ready() {
      this.$intercom.boot({ });
      this.$intercom.show();
    },
  },
});
