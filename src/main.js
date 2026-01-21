import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import App from './App.vue';
import router from './router';

import CoreuiVue from '@coreui/vue';
import CIcon from '@coreui/icons-vue';
import { iconsSet as icons } from '@/assets/icons';

import { Ckeditor } from '@ckeditor/ckeditor5-vue';

// http 주입 유틸
import { provideAuthToken, provideOnUnauthorized } from '@/utils/http';
import { useAuthStore } from '@/stores/auth';
import { ROUTE } from '@/constants/routeName';

const app = createApp(App);

// pinia 인스턴스 생성
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// Router/3rd party
app.use(router);
app.use(CoreuiVue);
app.provide('icons', icons);
app.component('CIcon', CIcon);
app.component('ckeditor', Ckeditor);

// Pinia가 준비된 뒤에 스토어를 얻고, http에 주입
const auth = useAuthStore();
provideAuthToken(() => auth.token || null); // 매 요청에 Authorization 자동 첨부

// 동시 다발 401 방지 락
let handling401 = false;
provideOnUnauthorized(() => {
  if (handling401) return;
  handling401 = true;

  auth.logout();

  const curr = router.currentRoute.value;
  // 이미 로그인 화면이면 루프 방지
  if (curr?.name !== ROUTE.Auth.Login) {
    router.replace({
      name: ROUTE.Auth.Login,
      query: { redirect: curr?.fullPath || '/' },
    });
  }

  // 잠깐 후 락 해제(중복 호출 억제)
  setTimeout(() => {
    handling401 = false;
  }, 1500);
});

// 앱 시작 시 토큰 만료 타이머 재장착
auth.initAuth();

// 초깃값 라우트가 완전히 준비된 뒤 마운트 → 초기 깜빡임/NProgress 이슈 방지
router.isReady().then(() => {
  app.mount('#app');
});
