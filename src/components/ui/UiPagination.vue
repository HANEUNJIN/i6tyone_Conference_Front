<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true }, // v-model:page 현재 페이지
  total: { type: Number, required: true }, // totCnt 총 데이터 수
  size: { type: Number, required: true }, // v-model:size 페이지 크기
  sizeOptions: { type: Array, default: () => [10, 20, 50] }, // 사이즈 드롭다운 옵션
  showSizeSelect: { type: Boolean, default: true }, // 사이즈 드롭다운 표시 여부
  edgeCount: { type: Number, default: 4 }, // 처음/끝에서 보이는 숫자 갯수
  midCount: { type: Number, default: 3 }, // 중앙에서 보이는 숫자 갯수
})
const emit = defineEmits(['update:page', 'update:size', 'change']) // change는 페이지/사이즈 변동 시 호출

// 총 페이지 계산
const pagesCount = computed(() => Math.max(1, Math.ceil(props.total / props.size)))

const visiblePages = computed(() => {
  const pcs = pagesCount.value
  const p = props.page
  const edge = props.edgeCount // 양 끝에서 보여줄 개수(기본 4)
  const mid = props.midCount // 중앙에서 보여줄 개수(기본 3)

  // 전체 페이지가 매우 적으면 그냥 전부 노출
  if (pcs <= Math.max(edge, mid)) return Array.from({ length: pcs }, (_, i) => i + 1)

  // 왼쪽 엣지 (page가 매우 앞일 때)
  if (p <= Math.ceil(edge / 2)) return Array.from({ length: edge }, (_, i) => i + 1)

  // 오른쪽 엣지 (page가 매우 뒤일 때)
  if (p >= pcs - Math.floor(edge / 2))
    return Array.from({ length: edge }, (_, i) => pcs - edge + 1 + i)

  // 중앙 (예: mid=3 → p-1, p, p+1)
  const half = Math.floor(mid / 2)
  const start = Math.max(1, p - half)
  const end = Math.min(pcs, start + mid - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 양옆 점(dots) 노출 여부
const showLeftDots = computed(() => visiblePages.value[0] > 2)
const showRightDots = computed(() => visiblePages.value.at(-1) < pagesCount.value - 1)

function onSizeChange(e) {
  const s = Number(e.target.value)
  emit('update:size', s)
  emit('update:page', 1)
  emit('change', { page: 1, size: s })
}
function emitAndFetch(p) {
  emit('update:page', p)
  emit('change', { page: p, size: props.size })
}

function goFirst() {
  if (props.page !== 1) emitAndFetch(1)
}
function goPrev() {
  if (props.page > 1) emitAndFetch(props.page - 1)
}
function goNext() {
  if (props.page < pagesCount.value) emitAndFetch(props.page + 1)
}
function goLast() {
  if (props.page !== pagesCount.value) emitAndFetch(pagesCount.value)
}
function goPage(p) {
  if (p !== props.page) emitAndFetch(p)
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between">
    <div class="d-flex align-items-center gap-3">
      <div>총 {{ total.toLocaleString() }}건</div>
      <!-- 페이지 크기 선택(옵션) -->
      <CFormSelect v-if="showSizeSelect" :value="size" @change="onSizeChange" style="width: 120px">
        <option v-for="o in sizeOptions" :key="o" :value="o">{{ o }}개</option>
      </CFormSelect>
    </div>

    <!-- 숫자 페이지 -->
    <CPagination size="sm" class="mb-0 justify-content-end" :aria-label="'페이지 네비게이션'">
      <CPaginationItem :disabled="page === 1" @click.prevent="goFirst">«</CPaginationItem>
      <CPaginationItem :disabled="page === 1" @click.prevent="goPrev">‹</CPaginationItem>

      <CPaginationItem v-if="showLeftDots" disabled>…</CPaginationItem>

      <CPaginationItem
        v-for="p in visiblePages"
        :key="p"
        :active="p === page"
        @click.prevent="goPage(p)"
      >
        {{ p }}
      </CPaginationItem>

      <CPaginationItem v-if="showRightDots" disabled>…</CPaginationItem>

      <CPaginationItem :disabled="page === pagesCount" @click.prevent="goNext">›</CPaginationItem>
      <CPaginationItem :disabled="page === pagesCount" @click.prevent="goLast">»</CPaginationItem>
    </CPagination>
  </div>
</template>

<style>
.pagination,
[data-coreui-theme='dark'] {
  --cui-pagination-color: #fff;
}

.pagination,
[data-coreui-theme='light'] {
  --cui-pagination-color: inherit;
}
</style>
