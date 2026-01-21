import { RouterView } from 'vue-router';
import { ROUTE } from '@/constants/routeName';

export default [
  {
    path: 'conference',
    name: 'Conference',
    component: RouterView,
    meta: { title: '컨퍼런스' },
    redirect: { name: '' },
    children: [
      {
        path: 'staffInfo',
        name: ROUTE.Conference.Conference.staffInfo,
        component: () => import('@/views/conference/staffInfo.vue'),
        meta: { title: '등록팀 STAFF 조직도', menuKey: 'conference.staffInfo' },
      },
      {
        path: 'DashBoard',
        name: ROUTE.Conference.Conference.DashBoard,
        component: () => import('@/views/conference/DashBoard.vue'),
        meta: { title: '대시보드', menuKey: 'conference.dashBoard' },
      },
      {
        path: 'ConferenceList',
        name: ROUTE.Conference.Conference.List,
        component: () => import('@/views/conference/ConferenceList.vue'),
        meta: { title: '등록명단', menuKey: 'conference.conference' },
      },
      {
        path: 'CheckIn',
        name: ROUTE.Conference.Conference.CheckIn,
        component: () => import('@/views/conference/CheckIn.vue'),
        meta: { title: '현장 입장 등록', menuKey: 'conference.checkIn' },
      },
      {
        path: 'OnSitePurchaseList',
        name: ROUTE.Conference.Conference.OnSitePurchaseList,
        component: () => import('@/views/conference/OnSitePurchaseList.vue'),
        meta: { title: '현장구매 명단', menuKey: 'conference.OnSitePurchaseList' },
      },
      {
        path: 'SelectZone',
        name: ROUTE.Conference.Conference.SelectZone,
        component: () => import('@/views/conference/SelectZone.vue'),
        meta: { title: '구역 우선 선택권', menuKey: 'conference.selectZone' },
      },
      {
        path: 'EventUs',
        name: ROUTE.Conference.Conference.EventUs,
        component: () => import('@/views/conference/EventUs.vue'),
        meta: { title: '이벤터스', menuKey: 'conference.EventUs' },
      },
    ],
  },
];
