<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { CustUpdNoticesAPI } from '@/api/notices';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { ROUTE } from '@/constants/routeName';

import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import newIcon from '@/assets/images/new-icon.gif';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'programTypeNm', label: '공지차트', width: '10%' },
  { key: 'title', label: '제목', width: '50%', align: 'left' },
  { key: 'readYn', label: '읽음여부', width: '10%' },
  { key: 'entEmpl', label: '작성자', width: '10%' },
  { key: 'startYmd', label: '작성일', width: '10%' },
];

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
  });

// 리스트
async function fetchList({ page, size, keyword }) {
  try {
    const params = {
      id: auth.userInfo.userId,
      keyword: keyword || '',
      pageNum: page,
      pageSize: size,
    };
    const res = await CustUpdNoticesAPI.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
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

// 초기 진입: 쿼리 복원 + 조회
onMounted(init);

function goDetail(item) {
  const seq = item.seqCry;
  const readLogSeq = item.seq;
  if (!seq || !readLogSeq) return;
  router.push({
    name: ROUTE.Notices.CustUpd.Detail,
    query: { ...route.query, seq: String(seq), readLogSeq: Number(readLogSeq) },
  });
}
</script>
<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody
      ><UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="제목/내용 검색"
        @submit="onSearch"
      />
    </CCardBody>
  </CCard>
  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-key="(row, idx) => row.totNo ?? idx"
        :row-clickable="true"
        @row-click="({ row }) => goDetail(row)"
      >
        <template #cell-subject="{ item }">
          {{ item?.subject ?? '(제목 없음)' }}
          <CImage
            v-if="item?.createNewFlag === 'Y' || item?.modifyNewFlag === 'Y'"
            :src="newIcon"
          />
        </template>
      </UiDataTable>
      <!-- 하단: 총 건수 + 페이징 -->
      <div class="mt-auto" v-if="total > 0">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :total="total"
          :size-options="[15, 20, 50]"
          :edge-count="4"
          :mid-count="3"
          @change="onPageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
</template>
