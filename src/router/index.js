import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import UploadImage from '@/components/UploadImage';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: HelloWorld,
      children: [
        {
          path: 'upload',
          name: 'UploadImage',
          component: UploadImage,
          props: true,
        },
      ],
    },
  ],
});
