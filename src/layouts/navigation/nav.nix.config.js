export default [
  {
    component: 'CNavItem',
    name: '공지사항',
    icon: 'cil-notes',
    items: [
      {
        component: 'CNavItem',
        name: '닉스공지사항',
        to: '/nix/notices/HqList',
        menuKey: 'nix.notices.hq',
      },
      {
        component: 'CNavItem',
        name: 'v2.0 업데이트 완료 공지',
        to: '/nix/notices/V2UpdEndList',
        menuKey: 'nix.notices.v2UpdEnd',
      },
      {
        component: 'CNavItem',
        name: 'v2.0 고객업데이트 공지',
        to: '/nix/notices/V2CustUpdList',
        menuKey: 'nix.notices.v2CustUpd',
      },
      {
        component: 'CNavItem',
        name: 'v5.0 업데이트 완료 공지',
        to: '/nix/notices/V5UpdEndList',
        menuKey: 'nix.notices.v5UpdEnd',
      },
      {
        component: 'CNavItem',
        name: 'v5.0 고객업데이트 공지',
        to: '/nix/notices/V5CustUpdList',
        menuKey: 'nix.notices.v5CustUpd',
      },
      {
        component: 'CNavItem',
        name: 'NIXPEN 2.0 수정요청',
        to: '/nix/notices/Nixpen2List',
        menuKey: 'nix.notices.nixpen2',
      },
      {
        component: 'CNavItem',
        name: 'NIXPEN 5.0 수정요청',
        to: '/nix/notices/Nixpen5List',
        menuKey: 'nix.notices.nixpen5',
      },
      {
        component: 'CNavItem',
        name: '차트관련교육자료',
        to: '/nix/notices/EducationList',
        menuKey: 'nix.notices.education',
      },
      {
        component: 'CNavItem',
        name: 'Tip & 기타',
        to: '/nix/notices/TipAndEtcList',
        menuKey: 'nix.notices.tipAndEtc',
      },
    ],
  },
  {
    component: 'CNavGroup',
    name: '고객',
    icon: 'cil-people',
    items: [
      {
        component: 'CNavItem',
        name: '고객상세',
        to: '/nix/customers/CustomerDetail',
        menuKey: 'customers.detail',
      },
      {
        component: 'CNavItem',
        name: '사용내역서',
        to: '/nix/customers/CustomerPayment',
        menuKey: 'customers.payment',
      },
      {
        component: 'CNavItem',
        name: '고객서비스',
        to: '/nix/customers/CustomerService',
        menuKey: 'customers.service',
      },
      {
        component: 'CNavItem',
        name: '고객서비스(과거자료)',
        to: '/nix/customers/CustomerServicePast',
        menuKey: 'customers.past',
      },
      {
        component: 'CNavItem',
        name: '이관내역',
        to: '/nix/customers/CustomerTransfer',
        menuKey: 'customers.transfer',
      },
    ],
  },
  {
    component: 'CNavGroup',
    name: '영업',
    icon: 'cil-calendar',
    items: [
      {
        component: 'CNavItem',
        name: '영업현황 정보',
        to: '/nix/sales/ReportList',
        menuKey: 'sales.report',
      },
      {
        component: 'CNavItem',
        name: '영업현황 등록',
        to: '/nix/sales/ReportCreate',
        menuKey: 'sales.report.create',
      },
    ],
  },
  {
    component: 'CNavGroup',
    name: '컨퍼런스',
    icon: 'cil-layers',
    items: [
      {
        component: 'CNavItem',
        name: '신청내역',
        to: '/nix/etcbiz/ApplicationList',
        menuKey: 'nix.etcbiz.application',
      },
      {
        component: 'CNavItem',
        name: '헬로100',
        to: '/nix/etcbiz/Hello100List',
        menuKey: 'nix.etcbiz.hello100',
      },
      {
        component: 'CNavItem',
        name: '키오스크설치현황',
        to: '/nix/etcbiz/KioskList',
        menuKey: 'nix.etcbiz.kiosk',
      },
      {
        component: 'CNavItem',
        name: '단말기설치현황',
        to: '/nix/etcbiz/terminalInstallList',
        menuKey: 'nix.etcbiz.terminalInstall',
      },
    ],
  },
  {
    component: 'CNavGroup',
    name: '전자계약서 설정',
    icon: 'cilClipboard',
    items: [
      {
        component: 'CNavItem',
        name: '전자계약서 기본',
        to: '/nix/contract/setting/baseSetting',
        menuKey: 'contract.setting.baseSetting',
      },
      {
        component: 'CNavItem',
        name: '전자계약서 제품',
        to: '/nix/contract/setting/productSetting',
        menuKey: 'contract.setting.productSetting',
      },
    ],
  },
];
