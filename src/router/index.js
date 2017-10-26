import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import UploadImage from '@/components/UploadImage';
import ViewImage from '@/components/ViewImage';
import ViewList from '@/components/ViewList';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: HelloWorld,
      children: [
        {
          path: '/upload',
          name: 'UploadImage',
          component: UploadImage,
          props: true,
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
          props: true,
        },
      ],
    },
  ],
});
