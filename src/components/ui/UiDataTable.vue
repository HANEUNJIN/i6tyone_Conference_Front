<script setup>
import UiLoading from '@/components/ui/UiLoading';
import { CCollapse, CTableFoot } from '@coreui/vue';
import { computed, nextTick } from 'vue';
import { formatMoney } from '@/utils/common';
import { AreaColor, DayColor } from '@/constants/areaColor';

const props = defineProps({
  columns: {
    // key: 이 컬럼이 행 데이터의 어떤 필드를 표시할지 결정.
    // label: 헤더에 보일 텍스트.
    // width: 헤더셀 CSS width. (예: '120px', '20%')
    // align: 본문 셀 정렬. ('left' | 'center' | 'right')
    // thClass, tdClass: 헤더/셀에 개별 클래스 추가(굵게, 색상 등ㄹ)
    type: Array,
    required: true,
  },
  items: { type: Array, default: () => [] }, // 표 데이터 (행 배열)
  loading: { type: Boolean, default: false },
  error: { type: [String, Object], default: null },
  emptyText: { type: String, default: '표시할 항목이 없습니다.' },
  rowKey: { type: [String, Function], default: 'id' }, // 각 행의 key, 문자열 키 이름 or (row, index) => 키값
  hover: { type: Boolean, default: true },
  bordered: { type: Boolean, default: true },
  small: { type: Boolean, default: true },
  collapsed: { type: Boolean, default: false },
  headColor: { type: String, default: 'secondary' }, // CTableHead color
  rowClass: { type: [String, Function], default: '' }, // 행 클래스 커스터마이즈
  rowClickable: { type: Boolean, default: false },
  isColSpan: { type: Function, default: () => false },
  rowSpanColumns: { type: Array, default: () => [] }, //['col1', 'col2']
  summary: { type: Boolean, default: false }, // 통계 표시 여부
  summaryItems: {
    type: Array,
    default: () => [
      {
        label: '합계',
        labelColSpan: 1,
        excludeColumns: [], // 제외 컬럼 예시
        format: (v) => formatMoney(v),
      },
    ],
  },
  isRowGroup: { type: Boolean, default: false }, // 그룹 컬럼 여부
});

const emit = defineEmits(['row-click']);

// 그룹 컬럼일 경우 자식만 flat
const flatColumns = computed(() =>
  props.isRowGroup
    ? props.columns.flatMap((col) => (col.group && col.children ? col.children : col))
    : props.columns,
);

function getKey(item, idx) {
  if (typeof props.rowKey === 'function') return props.rowKey(item, idx);
  return item?.[props.rowKey] ?? idx;
}

function getRowClass(row, idx) {
  const base = typeof props.rowClass === 'function' ? props.rowClass(row, idx) : props.rowClass;
  return [base, props.rowClickable ? 'cursor-pointer' : ''].filter(Boolean).join(' ');
}
async function onRowClick(row, idx, event) {
  if (!props.rowClickable) return;
  if (props.collapsed) {
    if (row.collapsed) {
      row.collapseVisible = false;
      return;
    }
    props.items.forEach((itemRow) => {
      if (itemRow !== row) {
        if (itemRow.collapsed || itemRow.collapseVisible) {
          itemRow.collapseVisible = false;
        }
      }
    });

    row.collapsed = true; // CTableRow를 DOM에 추가
    await nextTick(() => {
      row.collapseVisible = true; // CCollapse 펼치는 트랜지션 시작
    });
  }

  emit('row-click', { row, index: idx, event });
}

function handleCollapseHidden(row) {
  setTimeout(() => {
    if (row.collapseVisible === false) {
      row.collapsed = false;
    }
  }, 200);
}

const summaryRows = computed(() => {
  if (!props.summary || !props.items.length) return [];

  return props.summaryItems.map((conf) => {
    // 제외 컬럼 필터링
    const columnsToSum = flatColumns.value
      .map((c) => c.key)
      .filter((key) => !conf.excludeColumns?.includes(key));

    const rowData = columnsToSum.reduce((acc, key) => {
      const values = props.items.map((row) => Number(row[key]));
      acc[key] = values.every((v) => !isNaN(v)) ? values.reduce((a, b) => a + b, 0) : '';
      return acc;
    }, {});

    return { ...conf, rowData };
  });
});

const rowSpanMap = computed(() => {
  const map = {};

  props.rowSpanColumns.forEach((colKey) => {
    let lastValue = null;
    let startIndex = 0;

    props.items.forEach((row, index) => {
      const value = row[colKey];

      if (!map[colKey]) map[colKey] = {};

      if (value !== lastValue) {
        startIndex = index;
        lastValue = value;
        map[colKey][index] = 1;
      } else {
        map[colKey][startIndex] += 1;
        map[colKey][index] = 0;
      }
    });
  });

  return map;
});
</script>

<template>
  <!-- 로딩 -->
  <UiLoading v-if="loading" />

  <div class="d-flex flex-column flex-grow-1">
    <div v-if="items.length > 0" class="table-responsive">
      <CTable :hover="hover" :bordered="bordered" :small="small">
        <CTableHead :color="headColor">
          <CTableRow>
            <template v-for="col in columns">
              <CTableHeaderCell
                v-if="!props.isRowGroup || !col.group"
                :key="col.key"
                :scope="'col'"
                rowspan="2"
                :style="{ width: col.width }"
                :class="[col.thClass, 'table-th']"
              >
                <pre>
                  {{ col.label }}
                </pre>
              </CTableHeaderCell>

              <CTableHeaderCell
                v-else
                :key="col.key"
                :scope="'col'"
                :colspan="col.children?.length"
                :style="{ width: col.width }"
                :class="[col.thClass, 'table-th']"
              >
                {{ col.label }}
              </CTableHeaderCell>
            </template>
          </CTableRow>

          <!-- 그룹 컬럼 여부 -->
          <CTableRow v-if="props.isRowGroup">
            <template v-for="col in props.columns">
              <template v-if="col.group && col.children">
                <CTableHeaderCell
                  v-for="child in col.children"
                  :key="child.key"
                  :style="{ width: child.width }"
                  :class="[child.thClass, 'table-th']"
                >
                  {{ child.label }}
                </CTableHeaderCell>
              </template>
            </template>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          <template v-for="(row, rIdx) in items" :key="getKey(row, rIdx)">
            <CTableRow :class="getRowClass(row, rIdx)" @click="onRowClick(row, rIdx, $event)">
              <template v-for="(col, cIdx) in flatColumns" :key="col.key">
                <!-- row 병합 셀 -->
                <CTableDataCell
                  v-if="props.rowSpanColumns.includes(col.key)"
                  v-show="rowSpanMap[col.key][rIdx] > 0"
                  :rowspan="rowSpanMap[col.key][rIdx]"
                  :class="[col.tdClass, 'table-td']"
                  :style="{
                    textAlign: col.align ? col.align : 'center',
                    backgroundColor:
                      col.key === 'area'
                        ? AreaColor[row[col.key]?.toLowerCase()?.trim()?.replaceAll('-', '_')]
                        : col.key === 'day'
                          ? DayColor[row[col.key]]
                          : '',
                    fontWeight: col.key === 'area' ? 'bold' : 'normal',
                  }"
                >
                  <slot :name="`cell-${col.key}`" :item="row" :row="row" :index="rIdx">
                    {{ row?.[col.key] }}
                  </slot>
                </CTableDataCell>

                <!-- col 병합 셀 -->
                <CTableDataCell
                  v-else-if="isColSpan(row) && col.colSpan"
                  :colspan="flatColumns.length - cIdx"
                  :class="[col.tdClass, 'table-td', 'colspan-cell']"
                  :style="{ textAlign: col.align || 'center' }"
                />
                <CTableDataCell
                  v-else-if="!isColSpan(row) || !columns.slice(0, cIdx).some((c) => c.colSpan)"
                  :class="[col.tdClass, 'table-td']"
                  :style="{
                    textAlign: col.align ? col.align : 'center',
                    backgroundColor:
                      col.key === 'area'
                        ? AreaColor[row[col.key]?.toLowerCase()?.trim()?.replaceAll('-', '_')]
                        : col.key === 'day'
                          ? DayColor[row[col.key]]
                          : '',
                    fontWeight: col.key === 'area' ? 'bold' : 'normal',
                  }"
                >
                  <!-- 기본값: row[col.key] -->
                  <!-- 셀 커스터마이즈: #cell-<key> 슬롯 사용 -->
                  <slot :name="`cell-${col.key}`" :item="row" :row="row" :index="rIdx">
                    <!-- 슬롯이 없으면 기본값: item[col.key] -->
                    {{ row?.[col.key] }}
                  </slot>
                </CTableDataCell>
              </template>
            </CTableRow>
            <!-- collapsed -->
            <CTableRow v-if="collapsed && row.collapsed" class="collapsed-tr">
              <CTableDataCell class="collapsed-td" :colspan="flatColumns.length">
                <CCollapse
                  :class="{ 'border-bottom': rIdx === items.length - 1 }"
                  :visible="row.collapseVisible"
                  :duration="200"
                  @hide="handleCollapseHidden(row)"
                >
                  <div class="collapsed-content-inner">
                    <slot name="row-collapsed" :item="row" :index="rIdx"></slot>
                  </div>
                </CCollapse>
              </CTableDataCell>
            </CTableRow>
          </template>
        </CTableBody>

        <!-- summary 표시 -->
        <CTableFoot v-if="summary && summaryRows.length">
          <CTableRow v-for="(summary, sIdx) in summaryRows" :key="sIdx">
            <!-- 합계(라벨) 영역 -->
            <CTableDataCell
              :colspan="summary.labelColSpan"
              style="text-align: center; font-weight: bold"
              class="bg-body-tertiary"
            >
              {{ summary.label ?? '합계' }}
            </CTableDataCell>

            <!-- 나머지 월별 셀들 -->
            <CTableDataCell
              v-for="col in flatColumns.slice(summary.labelColSpan)"
              :key="col.key"
              class="bg-body-tertiary"
            >
              <!-- MonthCell을 slot으로 렌더링 -->
              <template
                v-if="$slots['cell-summary'] && !['sumCusCnt', 'targetCnt'].includes(col.key)"
              >
                <slot
                  name="cell-summary"
                  :summary="summary"
                  :month="Number(col.key.replace(/\D/g, ''))"
                  :rowData="summary.rowData"
                />
              </template>
              <!-- 기본 숫자 렌더링 -->
              <template v-else>
                <span
                  v-if="summary.rowData[col.key] !== undefined"
                  :style="{
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: 'red',
                    display: 'block',
                  }"
                >
                  {{ formatMoney(summary.rowData[col.key]) }}
                </span>
              </template>
            </CTableDataCell>
          </CTableRow>
        </CTableFoot>
      </CTable>
    </div>
    <!-- 빈 상태 -->
    <div v-else class="d-flex flex-column flex-grow-1" style="min-height: 100px">
      <p v-if="!loading" class="flex-grow-1 align-content-center text-center text-muted mb-0">
        {{ emptyText }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.table-th {
  text-align: center;
  vertical-align: middle;
  font-size: 12px;
}

.table-td {
  font-size: 12px;
  vertical-align: middle;
}

.collapsed-tr {
  border-top: none;
  border-bottom: none;
}

.collapsed-td {
  padding: 0;
}

.border-bottom {
  border-bottom: var(--cui-border-width) solid var(--cui-border-color);
}

.collapsed-content-inner {
  padding: 10px;
}
</style>
