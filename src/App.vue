<script setup>
import { onBeforeMount } from 'vue';
import { useColorModes } from '@coreui/vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '@/stores/theme.js';
import UiToast from '@/components/ui/UiToast.vue';
import UiConfirmModal from '@/components/ui/UiConfirmModal.vue';

const { isColorModeSet, setColorMode } = useColorModes('coreui-free-vue-admin-template-theme');
const currentTheme = useThemeStore();
const route = useRoute();

onBeforeMount(() => {
  const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
  let theme = urlParams.get('theme');

  if (theme !== null && theme.match(/^[A-Za-z0-9\s]+/)) {
    theme = theme.match(/^[A-Za-z0-9\s]+/)[0];
  }

  if (theme) {
    setColorMode(theme);
    return;
  }

  if (isColorModeSet()) {
    return;
  }

  setColorMode(currentTheme.theme);
});
</script>

<template>
  <router-view />
  <UiToast v-if="route.meta.toasterScope === 'app'" />
  <UiConfirmModal v-if="route.meta.toasterScope === 'app'" />
</template>

<style lang="scss">
// Import Main styles for this application
@use 'styles/style';
</style>
