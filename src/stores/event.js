import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEventStore = defineStore('eventStore', () => {
  // 상태
  const isTriggered = ref(false);
  const payload = ref(null);

  // 액션
  const triggerSupport = (data) => {
    payload.value = data;
    isTriggered.value = true;
  };

  const resetEvent = () => {
    isTriggered.value = false;
    payload.value = null;
  };

  return {
    isTriggered,
    payload,
    triggerSupport,
    resetEvent,
  };
});
