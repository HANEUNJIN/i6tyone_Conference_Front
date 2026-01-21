<script setup>
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/vue';
import { coreuiModalState, useConfirmModal } from '@/composables/useConfirmModal';

const { confirm, cancel } = useConfirmModal();
</script>

<template>
  <CModal
    :visible="coreuiModalState.visible"
    :alignment="coreuiModalState.opts.alignment"
    :backdrop="coreuiModalState.opts.backdrop"
    :keyboard="coreuiModalState.opts.keyboard"
    :size="coreuiModalState.opts.size"
    @close="cancel()"
  >
    <CModalHeader :close-button="false">
      <CModalTitle>{{ coreuiModalState.opts.title }}</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <div class="preline">{{ coreuiModalState.opts.message }}</div>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancel()">
        {{ coreuiModalState.opts.cancelText }}
      </CButton>
      <CButton :color="coreuiModalState.opts.color" @click="confirm()">
        {{ coreuiModalState.opts.confirmText }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<style scoped>
.modal-body {
  font-size: 14px;
}
.preline {
  white-space: pre-line;
}
</style>
