import { ROUTE } from '@/constants/routeName';

export default [
  {
    path: 'dashboard',
    name: ROUTE.Dashboard.Home,
    component: () => import('@/views/dashboard/Dashboard.vue'),
    meta: { title: '' },
  },
];
