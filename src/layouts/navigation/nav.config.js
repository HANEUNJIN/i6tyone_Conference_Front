export default [
  {
    component: 'CNavGroup',
    name: '컨퍼런스',
    icon: 'cil-user',
    items: [
      {
        component: 'CNavItem',
        name: '등록팀 STAFF 조직도',
        to: '/conference/staffInfo',
        menuKey: 'conference.staffInfo',
      },
      {
        component: 'CNavItem',
        name: '통계보드',
        to: '/conference/DashBoard',
        menuKey: 'conference.dashBoard',
      },
      {
        component: 'CNavItem',
        name: '현장 입장 등록',
        to: '/conference/CheckIn',
        menuKey: 'conference.checkIn',
      },
      {
        component: 'CNavItem',
        name: '등록명단',
        to: '/conference/ConferenceList',
        menuKey: 'conference.conference',
      },
      // {
      //   component: 'CNavItem',
      //   name: '현장구매 명단',
      //   to: '/conference/OnSitePurchaseList',
      //   menuKey: 'conference.OnSitePurchaseList',
      // },
      // {
      //   component: 'CNavItem',
      //   name: '구역 우선 선택권',
      //   to: '/conference/SelectZone',
      //   menuKey: 'conference.selectZone',
      // },
      // {
      //   component: 'CNavItem',
      //   name: '이벤터스',
      //   to: '/conference/EventUs',
      //   menuKey: 'conference.eventUs',
      // },
    ],
  },
];
