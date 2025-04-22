// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeComponent from '../components/HomeComponent.vue';
import CartComponent from '../components/CartComponent.vue';
import CheckoutComponent from '../components/CheckoutComponent.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeComponent
  },
  {
    path: '/cart',
    name: 'Cart',
    component: CartComponent
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: CheckoutComponent , props: route => ({ checkoutData: route.params.checkoutData })
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
