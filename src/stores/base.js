import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useBaseStore = defineStore(
  'base',
  () => {
    const storeMenuType = ref('E');
    const storeHospName = ref('');
    const storeHospCd = ref('');
    const storeLicenseCd = ref('');

    const setStoreMenuType = (v) => {
      storeMenuType.value = v;
    };

    const setStoreHospName = (v) => {
      storeHospName.value = v;
    };

    const setStoreHospCd = (v) => {
      storeHospCd.value = v;
    };

    const setStoreLicenseCd = (v) => {
      storeLicenseCd.value = v;
    };

    return {
      storeMenuType,
      storeHospName,
      setStoreMenuType,
      setStoreHospName,
      storeHospCd,
      setStoreHospCd,
      storeLicenseCd,
      setStoreLicenseCd,
    };
  },
  {
    // 영속화: 탭/브라우저를 닫아도 유지되도록 localStorage 사용
    // (세션만 유지하려면 storage: sessionStorage)
    persist: {
      key: 'base',
      storage: localStorage, // 또는 sessionStorage
      paths: ['storeMenuType'], // 민감도에 따라 ['user']만 저장도 가능
    },
  },
);
