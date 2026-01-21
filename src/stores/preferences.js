import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePrefsStore = defineStore(
  'preferences',
  () => {
    // 전역 페이지 크기 (모든 리스트 공통)
    const storePageSize = ref(15);

    const setStorePageSize = (size) => {
      const n = Math.floor(+size || 15);
      storePageSize.value = Math.min(200, Math.max(5, n));
    };

    return { storePageSize, setStorePageSize };
  },
  {
    persist: {
      key: 'preferences',
      storage: localStorage,
      paths: ['pageSize'],
    },
  },
);
