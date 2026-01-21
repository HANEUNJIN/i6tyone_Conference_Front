<script setup>
/**
 * fields 정의:
 *   label1: string,   // 첫 번째 라벨
 *   value1: string,   // 첫 번째 값
 *   isShow1: boolean, // 첫 번째 노출 여부
 *   label2: string,   // 두 번째 라벨 (colspan이 아닐 때)
 *   value2: string,   // 두 번째 값 (colspan이 아닐 때)
 *   isShow2: boolean  // 두 번째 노출 여부
 *   colspan: boolean, // true면 전체 너비
 *   key: string,      // 슬롯 사용 시 식별자 (선택)
 *   isShowRow: boolean// 로우 노출 여부
 * }
 */

const props = defineProps({
  fields: { type: Array, default: () => [] },
});

const isFullWidth = (row) => row.colspan === true;
const isRowShown = (row) => (row && row.hasOwnProperty('isShowRow') ? row.isShowRow : true);
const isCol1Shown = (row) => (row && row.hasOwnProperty('isShow1') ? row.isShow1 : isRowShown(row));
const isCol2Shown = (row) => (row && row.hasOwnProperty('isShow2') ? row.isShow2 : isRowShown(row));
</script>

<template>
  <div class="grid-table">
    <template v-for="(row, idx) in fields" :key="idx">
      <CRow v-if="isRowShown(row)">
        <template v-if="isFullWidth(row)">
          <CCol sm="2" class="grid-header" v-if="isCol1Shown(row)">{{ row.label1 }}</CCol>
          <CCol sm="10" class="grid-value" v-if="isCol1Shown(row)">
            <slot :name="`value-${row.key}`" :row="row">
              {{ row.value1 }}
            </slot>
          </CCol>
        </template>

        <template v-else>
          <CCol sm="2" class="grid-header" v-if="isCol1Shown(row)">{{ row.label1 }}</CCol>
          <CCol
            :class="{
              'col-sm-4': isCol2Shown(row),
              'col-sm-10': !isCol2Shown(row),
            }"
            class="grid-value"
            v-if="isCol1Shown(row)"
          >
            <slot :name="`value-${row.key1}`" :row="row">
              {{ row.value1 }}
            </slot>
          </CCol>
          <CCol
            sm="2"
            class="grid-header"
            v-if="isCol2Shown(row) && row.label2 !== undefined && row.label2 !== null"
          >
            {{ row.label2 }}
          </CCol>
          <CCol
            :class="{
              'col-sm-4': isCol1Shown(row),
              'col-sm-10': !isCol1Shown(row),
            }"
            class="grid-value"
            v-if="isCol2Shown(row) && (row.key2 || row.value2 !== undefined)"
          >
            <slot :name="`value-${row.key2}`" :row="row">
              {{ row.value2 }}
            </slot>
          </CCol>
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

.grid-table .col-sm-2,
.grid-table .col-sm-4,
.grid-table .col-sm-10 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-right: 1px solid var(--cui-border-color);
}

.grid-table .col-sm-2:last-child,
.grid-table .col-sm-4:last-child,
.grid-table .col-sm-10:last-child {
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
