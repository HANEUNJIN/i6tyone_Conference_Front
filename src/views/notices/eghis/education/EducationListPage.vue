<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { NoticesAPI } from '@/api/notices';
import { CommonAPI } from '@/api/temp/common';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { ROUTE } from '@/constants/routeName';

import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import newIcon from '@/assets/images/new-icon.gif';
import { BoardType } from '@/constants/boardTypes';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();

const eduInputTypeOptions = ref([]);
const eduChartVersion = ref('');
const eduInputType = ref('');

const BOARD_OPTIONS = {
  boardType: BoardType.Education,
};

// 차트 버전 옵션
const eduChartVersionOptions = [
  { value: '', label: '차트버전' },
  { value: 'A', label: '공통' },
  { value: '1.0', label: '1.0' },
  { value: '2.0', label: '2.0' },
];

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'eduChartVersion', label: '차트버전', width: '5%' },
  { key: 'eduInputType', label: '구분', width: '5%' },
  { key: 'subject', label: '제목', align: 'left' },
  { key: 'readCnt', label: '조회수', width: '7%' },
  { key: 'readYn', label: '읽음여부', width: '7%' },
  { key: 'userNm', label: '작성자', width: '7%' },
  { key: 'regDt', label: '작성일', width: '10%' },
];

// 구분 코드
async function getCommonCode() {
  try {
    const res = await CommonAPI.getCode('A46');
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    const list = res.data?.resultData?.list ?? [];
    const options = list.map((it) => ({
      value: it.codeId ?? '',
      label: it.codeNm ?? '',
    }));

    eduInputTypeOptions.value = [{ value: '', label: '구분' }, ...options];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onReset, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    autoSearchOnExtraChange: true,

    // 추가 필터(쿼리 동기화 + fetcher 인자 전달)
    extra: {
      eduChartVersion,
      eduInputType,
    },
  });

// 리스트 API 호출
async function fetchList({ page, size, keyword, eduChartVersion, eduInputType }) {
  const params = {
    id: auth.userInfo.userId,
    branch: auth.userInfo.branch,
    boardType: BOARD_OPTIONS.boardType,
    keyword: keyword || '',
    pageNum: page,
    pageSize: size,
    eduChartVersion: eduChartVersion || '',
    eduInputType: eduInputType || '',
  };
  try {
    const res = await NoticesAPI.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
}

// 상세 페이지 이동
function goDetail(item) {
  const seq = item.seqCry;

  if (!seq) return;
  router.push({
    name: ROUTE.Notices.Education.Detail,
    query: { ...route.query, seq: String(seq) },
  });
}

// 초기 진입: 쿼리 복원 + 조회
onMounted(() => {
  getCommonCode();
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        placeholder="제목/내용 검색"
        @submit="onSearch"
        @reset="onReset"
      >
        <template #extra-front>
          <CFormSelect v-model="eduChartVersion" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in eduChartVersionOptions" :key="idx" :value="opt.value">
              {{ opt.label }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="eduInputType" style="width: 120px" size="sm">
            <option
              v-for="(opt, idx) in eduInputTypeOptions"
              :key="opt.value || idx"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </CFormSelect>
        </template>
        <template #extra-btn>
          <CButton
            color="dark"
            size="sm"
            type="button"
            @click="() => router.push({ name: ROUTE.Notices.Education.Create })"
            >공지 등록
          </CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => goDetail(row)"
      >
        <!-- 본문 셀 구성은 부모에서 결정 -->
        <template #cell-subject="{ item }">
          {{ item?.subject ?? '(제목 없음)' }}
          <CImage
            v-if="item?.createNewFlag === 'Y' || item?.modifyNewFlag === 'Y'"
            :src="newIcon"
          />
        </template>
      </UiDataTable>

      <!-- 하단: 총 건수 + 페이징 -->
      <div v-if="total > 0" class="mt-auto">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :edge-count="4"
          :mid-count="3"
          :size-options="[15, 20, 50]"
          :total="total"
          @change="onPageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
</template>
