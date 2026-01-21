<script setup>
import { onMounted } from 'vue';
import { NoticesAPI } from '@/api/notices';
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

const BOARD_OPTIONS = {
  boardType: BoardType.Press,
};

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '7%' },
  { key: 'inputTypeNm', label: '공지타입', width: '10%' },
  { key: 'subject', label: '제목', width: '30%', align: 'left' },
  { key: 'readCnt', label: '조회수', width: '5%' },
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
  });

// 리스트 API 호출
async function fetchList({ page, size, keyword }) {
  const params = {
    id: auth.userInfo.userId,
    branch: auth.userInfo.branch,
    boardType: BOARD_OPTIONS.boardType,
    keyword: keyword || '',
    pageNum: page,
    pageSize: size,
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
    name: ROUTE.Notices.Press.Detail,
    query: { ...route.query, seq: String(seq) },
  });
}

// 초기 진입: 쿼리 복원 + 조회
onMounted(init);
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="제목/내용 검색"
        @submit="onSearch"
      >
        <template #extra-btn>
          <CButton
            color="dark"
            size="sm"
            type="button"
            @click="() => router.push({ name: ROUTE.Notices.Press.Create })"
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
