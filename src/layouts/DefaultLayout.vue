<script setup>
import { CContainer } from '@coreui/vue';
import AppFooter from '@/layouts/partials/AppFooter.vue';
import AppHeader from '@/layouts/partials/AppHeader.vue';
import AppSidebar from '@/layouts/partials/AppSidebar.vue';
import UiToast from '@/components/ui/UiToast.vue';
import UiConfirmModal from '@/components/ui/UiConfirmModal.vue';
import HospSearchModal from '@/components/modal/HospSearchModal.vue';
import { useHospSearchModal } from '@/composables/useHospSearchModal';

const { hospSearchModalState } = useHospSearchModal();
</script>

<template>
  <div>
    <AppSidebar />
    <div class="wrapper d-flex flex-column min-vh-100">
      <AppHeader />
      <div class="body d-flex flex-grow-1">
        <CContainer class="container px-4" lg>
          <router-view />
        </CContainer>
      </div>
      <AppFooter />
    </div>
    <HospSearchModal />
    <UiToast placement="bottom-center" :max="3" />
    <UiConfirmModal />
  </div>
</template>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
}
</style>
