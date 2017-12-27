import Vue from 'vue';
import Router from 'vue-router';
import Meta from 'vue-meta';
import HelloWorld from '@/components/HelloWorld';
import ViewImage from '@/components/ViewImage';
import ViewList from '@/components/ViewList';

Vue.use(Router);
Vue.use(Meta);

export default new Router({
  routes: [
    {
      path: '/',
      component: HelloWorld,
      children: [
        {
          path: '/upload',
          name: 'UploadImage',
          component: ViewImage,
        },
        {
          path: '/view/:uid',
          name: 'ViewImage',
          component: ViewImage,
        },
        {
          path: '/',
          name: 'ViewList',
          component: ViewList,
        },
        {
          path: '/all',
          name: 'ViewAll',
          props: { showGraphOnly: true },
          component: ViewList,
        },
      ],
    },
    { path: '/view', redirect: { name: 'UploadImage' } },
  ],
});
