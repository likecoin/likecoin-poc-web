import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import UploadImage from '@/components/UploadImage';
import ViewImage from '@/components/ViewImage';

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
      ],
    },
  ],
});
