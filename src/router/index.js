import { createRouter, createWebHashHistory, createWebHistory, RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ROUTE } from '@/constants/routeName';
import DefaultLayout from '@/layouts/DefaultLayout';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useBaseStore } from '@/stores/base';

import dashboard from './modules/dashboard';

import conference from './modules/conference';

NProgress.configure({ showSpinner: false, speed: 400, trickleSpeed: 150 });

// 라우트 정의
const routes = [
  // 공개 라우트: 로그인
  // {
  //   path: '/login',
  //   name: ROUTE.Auth.Login,
  //   component: () => import('@/views/auth/Login.vue'),
  //   meta: { public: true, toasterScope: 'app' },
  // },
  // {
  //   path: '/join',
  //   name: ROUTE.Auth.Join,
  //   component: () => import('@/views/auth/Join.vue'),
  //   meta: { public: true, toasterScope: 'app' },
  // },

  // 보호 라우트: 기본 레이아웃 아래 자식들
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true }, // 부모에 메타를 걸면 자식에도 적용
    redirect: { name: ROUTE.Dashboard.Home }, // 처음 들어오면 대시보드로
    children: [
      ...dashboard,
      ...conference,
    ],
  },
  // (선택) 기타 페이지 묶음 — 공개 라우트로 유지
  {
    path: '/pages',
    redirect: '/pages/404',
    name: 'Page',
    meta: { public: true },
    component: RouterView,
    children: [
      {
        path: '404',
        name: ROUTE.Pages._404,
        component: () => import('@/views/pages/Page404'),
      },
      {
        path: '500',
        name: ROUTE.Pages._500,
        component: () => import('@/views/pages/Page500'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: ROUTE.Pages._404 },
  },
];

const router = createRouter({
  // history: createWebHistory('/'),
  history: createWebHashHistory('/'),
  routes,
  //뒤로가기 시 savedPosition 복원 가능
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// 경로 기반 동기화 규칙
function detectMenuTypeByPath(to) {
  const path = (to?.path || '').toLowerCase();
  const name = to?.name;
  // 닉스: "/nix/..." → 'N'
  if (path.startsWith('/nix/')) return 'N';
  // 대시보드만 중립
  if (name === ROUTE.Dashboard.Home || path === '/dashboard' || path.startsWith('/dashboard/')) {
    return null;
  }
  // 그 외 전부 E 취급
  return 'E';
}

function syncMenuType(to) {
  try {
    const base = useBaseStore();
    const nextType = detectMenuTypeByPath(to);
    if (nextType && base.storeMenuType !== nextType) {
      base.setStoreMenuType(nextType);
    }
  } catch {
    // 스토어 초기화 타이밍 이슈는 무시
  }
}

// 라우터 가드
// 라우터 생성 직후, 내보내기(export default router) 이전에 훅 연결
router.beforeEach((to, from) => {
  // 같은 경로로 이동하는 경우 NProgress 시작하지 않음
  if (to.fullPath !== from.fullPath) {
    NProgress.start();
  }

  // 경로 기반 storeMenuType 선제 동기화(앞으로 가기 포함)
  syncMenuType(to);

  const auth = useAuthStore();
  // 현재 라우트 또는 조상 라우트 중 requiresAuth가 있는지 검사
  const needsAuth = to.matched.some((record) => record.meta?.requiresAuth);

  // 인증 필요한데 토큰 없음 → 로그인으로
  // if (needsAuth && !auth.isAuthed) {
  //   return { name: ROUTE.Auth.Login, query: { redirect: to.fullPath } };
  // }
});

router.afterEach(() => {
  // 라우트 확정 후 NProgress 종료
  NProgress.done();
});

router.onError(() => {
  // 에러 발생 시에도 NProgress 종료
  NProgress.done();
});

export default router;
