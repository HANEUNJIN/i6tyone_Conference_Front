<script setup>
import { ref, onMounted } from 'vue';
import { NoticesAPI } from '@/api/notices';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';

import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { ROUTE } from '@/constants/routeName';
import { NixBoardType } from '@/constants';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();

const eduChartVersion = ref('');
const eduInputType = ref('');

const BOARD_OPTIONS = { boardType: NixBoardType.Education };

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '7%' },
  { key: 'inputTypeNm', label: '공지타입', width: '10%' },
  { key: 'subject', label: '제목', width: '30%' },
  { key: 'readCnt', label: '조회수', width: '10%' },
  { key: 'readYn', label: '읽음여부', width: '10%' },
  { key: 'userNm', label: '작성자', width: '10%' },
  { key: 'regDt', label: '작성일', width: '10%' },
];

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
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

async function fetchList({ page, size, keyword, eduChartVersion, eduInputType }) {
  const params = {
    id: auth.userInfo.userId,
    boardType: BOARD_OPTIONS.boardType,
    branch: auth.userInfo.branch,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
    eduChartVersion: eduChartVersion,
    eduInputType: eduInputType,
  };

  try {
    const res = await NoticesAPI.getList(params);

    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const { list = [], totCnt } = res.data?.resultData ?? {};
    const total = Number(totCnt ?? list[0]?.totCnt ?? 0);

    return { items: list, total };
  } catch (e) {
    toastApi.errorFromException(e);
  }
}

const addNotice = () => router.push({ name: ROUTE.NixNotices.Education.Create });

const rowClick = (row) => {
  if (!row.seqCry) return;

  router.push({
    name: ROUTE.NixNotices.Education.Detail,
    query: { ...route.query, seq: String(row.seqCry) },
  });
};

onMounted(() => {
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-2">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="제목/내용 검색"
        @submit="onSearch"
      >
        <template #extra-btn>
          <CButton type="button" size="sm" color="dark" @click="addNotice"> 등록 </CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-fill">
    <CCardBody>
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => rowClick(row)"
      />

      <div v-if="total > 0" class="mt-auto">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :total="total"
          @change="onPageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
</template>
