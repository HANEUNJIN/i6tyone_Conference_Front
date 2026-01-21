import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { UserAPI } from '@/api/temp/user';
import { msUntilExpiry, isTokenExpired, getJwtPayload } from '@/utils/jwt';

// 만료된 토큰은 isAuthed=false → 라우터 가드에서 차단
// App 시작 시 initAuth() 호출(예: main.js에서)
// Authorization 헤더 부착은 main.js의 provideAuthToken에서 일괄 처리 (여기서는 헤더 건드리지 않음)

export const useAuthStore = defineStore(
  'auth',
  () => {
    // 스토어(메모리) 상태
    const token = ref(null);
    const userInfo = ref(null);

    // 만료까지 고려(스큐 10초)
    const isAuthed = computed(() => !!token.value && !isTokenExpired(token.value, 10000));

    let _expTimer = null;

    function _armExpiryTimer() {
      clearTimeout(_expTimer);
      const ms = msUntilExpiry(token.value); // exp 없으면 -1 → 타이머 미장착, 즉시 만료 취급

      if (ms > 0) {
        _expTimer = setTimeout(() => logout(), Math.max(ms - 5000, 0)); // 만료 5초 전 자동 로그아웃
      }
    }

    async function login(params) {
      const res = await UserAPI.getLogin(params);
      if (!res.ok || !res.data?.token) throw new Error('LOGIN_FAILED');

      token.value = res.data.token;
      // 서버가 userInfo를 주지 않으면 JWT payload로 대체
      userInfo.value = res.data.user ?? { ...getJwtPayload(res.data.token) };

      _armExpiryTimer();
      return res;
    }

    function logout() {
      clearTimeout(_expTimer);
      _expTimer = null;
      token.value = null;
      userInfo.value = null;
      // 헤더는 main.js의 provideAuthToken이 자동으로 빈 값으로 처리
    }

    // 앱 재시작 시(저장된 토큰이 있다면) 타이머 재장착
    function initAuth() {
      if (token.value) {
        _armExpiryTimer();
      }
    }

    // 토큰이 바뀌면 타이머 재설정
    watch(token, (t) => {
      if (t) _armExpiryTimer();
    });

    return { token, userInfo, isAuthed, login, logout, initAuth };
  },
  {
    // Pinia persistedstate 옵션
    // 영속화: 탭/브라우저를 닫아도 유지되도록 localStorage 사용
    // (세션만 유지하려면 storage: sessionStorage)
    persist: {
      key: 'auth', // 저장 키
      storage: localStorage, // 또는 sessionStorage
      paths: ['token', 'userInfo'], // 민감도에 따라 ['user']만 저장도 가능
    },
  },
);
