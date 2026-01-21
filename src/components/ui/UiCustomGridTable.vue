<script setup>
/**
 * fields 정의:
 * cols: [
 *     { label: '라벨1', value: '값1', isShow: true, key: 'colA', labelWidth: 2, valueWidth: 4 },
 *     { label: '라벨2', value: '값2', isShow: true, key: 'colB', labelWidth: 2, valueWidth: 4 },
 *     // N개까지 추가 가능
 *     { label: '라벨N', value: '값N', isShow: true, key: 'colN', labelWidth: 2, valueWidth: 4 },
 *   ],
 *   colspan: false, // 이 row 전체가 colspan이면 true
 *   isShowRow: true
 * }
 */

const props = defineProps({
  fields: { type: Array, default: () => [] },
});

const isFullWidthRow = (row) => row.colspan === true;
const isRowShown = (row) => (row && row.hasOwnProperty('isShowRow') ? row.isShowRow : true);
const isColShown = (col) => (col && col.hasOwnProperty('isShow') ? col.isShow : true);

const defaultLabelWidth = 2; // 기본 라벨 CCol sm 너비
const defaultValueWidth = 4; // 기본 값 CCol sm 너비 (2개 항목일 때)
</script>

<template>
  <div class="grid-table">
    <template v-for="(row, rIdx) in fields" :key="rIdx">
      <CRow v-if="isRowShown(row)">
        <template v-if="isFullWidthRow(row)">
          <!-- colspan이 true인 경우: 하나의 라벨과 하나의 전체 너비 값 -->
          <template v-for="(col, cIdx) in row.cols" :key="`${rIdx}-${cIdx}`">
            <!-- 일반적으로 colspan일 때는 첫 번째 col의 라벨과 값을 사용 -->
            <template v-if="cIdx === 0 && isColShown(col)">
              <CCol :sm="col.labelWidth || 2" class="grid-header">{{ col.label }}</CCol>
              <CCol :sm="col.valueWidth || 10" class="grid-value">
                <slot :name="`value-${col.key || 'fullwidth'}`" :row="row" :col="col">
                  {{ col.value }}
                </slot>
              </CCol>
            </template>
          </template>
        </template>

        <template v-else>
          <!-- colspan이 false인 경우: N개의 라벨/값 쌍 -->
          <template v-for="(col, cIdx) in row.cols" :key="`${rIdx}-${cIdx}`">
            <template v-if="isColShown(col)">
              <CCol :sm="col.labelWidth || defaultLabelWidth" class="grid-header">
                {{ col.label }}
              </CCol>
              <CCol :sm="col.valueWidth || defaultValueWidth" class="grid-value">
                <slot :name="`value-${col.key || `col-${cIdx}`}`" :row="row" :col="col">
                  {{ col.value }}
                </slot>
              </CCol>
            </template>
          </template>
        </template>
      </CRow>
    </template>
  </div>
</template>

<style scoped>
.grid-table {
  border: 1px solid var(--cui-border-color);
}

.grid-table .row {
  margin: 0;
  border-bottom: 1px solid var(--cui-border-color);
}

.grid-table .row:last-child {
  border-bottom: none;
}

.grid-table [class*='col-sm-'] {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-right: 1px solid var(--cui-border-color);
}

/* 각 row의 마지막 CCol에만 border-right: none 적용 */
.grid-table .row > :last-child {
  border-right: none;
}

.grid-header {
  background-color: var(--cui-gray-100);
  font-weight: 600;
  align-content: center;
}

.grid-value {
  background-color: #fff;
  align-content: center;
}
</style>
