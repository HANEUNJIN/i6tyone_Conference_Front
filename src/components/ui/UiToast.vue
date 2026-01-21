<script setup>
import { computed } from 'vue'
import { CToaster, CToast, CToastHeader, CToastBody } from '@coreui/vue'
import { coreuiToastState, useToast } from '@/composables/useToast'

const props = defineProps({
  placement: { type: String, default: 'bottom-center' }, // 토스트 위치: top-start | top-center | top-end | bottom-start | bottom-center | bottom-end
  inverse: { type: Boolean, default: true }, // 배경색 대비용 흰색 텍스트 사용 여부
  max: { type: Number, default: 3 }, // 최대 표시 개수 (초과분은 큐 뒤로)
})

const { remove } = useToast()
const textClass = computed(() => (props.inverse ? 'text-white' : ''))
const bgClass = (c) => `bg-${c || 'info'}`

// 표시 개수 제한
const items = computed(() => coreuiToastState.items.slice(-props.max))
</script>

<template>
  <CToaster :placement="placement">
    <CToast
      v-for="t in items"
      :key="t.key"
      :visible="true"
      :autohide="t.autohide"
      :delay="t.delay"
      @close="remove(t.key)"
      :class="[textClass, bgClass(t.color)]"
    >
      <!-- <CToastHeader close-button v-if="t.title">{{ t.title }}</CToastHeader> -->
      <CToastBody class="d-flex align-items-center justify-content-between">
        <span>{{ t.content }}</span>
        <CCloseButton v-if="!t.autohide" white @click="remove(t.key)" />
      </CToastBody>
    </CToast>
  </CToaster>
</template>

<style scoped>
.toaster {
  bottom: 30px !important;
  padding-inline: var(--cui-sidebar-occupy-start, 0) var(--cui-sidebar-occupy-end, 0);
}
</style>
