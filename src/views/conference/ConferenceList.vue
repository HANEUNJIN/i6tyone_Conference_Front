<script setup>
import { formatMoney, formatPhoneKR, getTodayYmd } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { ConferenceApi } from '@/api/conference';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { useConfirmModal } from '@/composables/useConfirmModal';
import ConferenceModifyModal from '@/views/conference/ConferenceModifyModal.vue';
import ConferenceCreateModal from '@/views/conference/ConferenceCreateModal.vue';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { CONF_COLUMNS } from '@/constants/conference/ConfColumns';
import { CCallout, CFormSelect } from '@coreui/vue';
import CIcon from '@coreui/icons-vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();
const { downloadExcel } = useExcelDownload();

const optionsLoading = ref(false);
const isModifyModalVisible = ref(false);
const isModifyCreateVisible = ref(false);
const uniqueId = ref('');

const ticket = ref(''); //티켓구분
const ticketOptions = ref([]);

const days = ref(''); //신청일
const daysOptions = ref([]);

const area = ref('ALL'); //좌석구분
const areaOptions = ref([]);

const check = ref(false);
const allCheck = ref(false);
const attend = ref(false);

//통계
const totalUsers = ref(0);
const totalTicket = ref(0);
const totalDay = ref({
  day1Count: 0,
  day2Count: 0,
  day3Count: 0,
});
const totalArea = ref({
  a: 0,
  b: 0,
  c: 0,
  d: 0,
  e: 0,
  f: 0,
  g: 0,
  h: 0,
  i: 0,
  j: 0,
});
const totalAttend = ref({
  qrNotCreated: 0, //QR 미생성 건수
  qrCreated: 0, //QR 생성 건수
  smsNotSent: 0, //SMS 미전송 건수
  smsSent: 0, //SMS 전송 건수
  notAttendCount: 0, //미출석 건수
  attendCount: 0, //출석 건수
});

const extraMap = {
  'D1': 200, //VIP 200, 대구 90
  'C2-1': 100, //대만 100
  'D2-1': 100, //대만 100
  'E2-1': 100 //대만 100
};

const formattedTotal = computed(() => {
  const item = items.value?.[0];
  if (!item)
    return formatMoney(0);

  const extra = item.day === 4 ? (extraMap[item.area] || 0) : 0;
  return formatMoney(item.countTotal + extra);
});

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    // 티켓구분
    const ticketRes = await ConferenceApi.getOptions();
    if (!ticketRes.ok) {
      toastApi.errorFromResult(ticketRes);
    }
    const ticketList = ticketRes.data?.data?.list ?? [];
    ticketOptions.value = [{ key: '', value: '티켓구분' }, ...ticketList];

    // 신청일
    const dayRes = await ConferenceApi.getDays();
    if (!dayRes.ok) {
      toastApi.errorFromResult(dayRes);
    }
    const dayList = dayRes.data?.data?.list ?? [];
    daysOptions.value = [{ key: '', value: '신청일' }, ...dayList];

    //좌석구분
    const areaRes = await ConferenceApi.getAreas();
    if (!areaRes.ok) {
      toastApi.errorFromResult(areaRes);
    }
    const areaList = areaRes.data?.data?.list ?? [];
    areaOptions.value = [{ key: 'ALL', value: '좌석구분' }, ...areaList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchStatistics = async () => {
  optionsLoading.value = true;

  try {
    // 등록자별 통계
    // const userRes = await ConferenceApi.getRegistration();
    // if (!userRes.ok) {
    //   toastApi.errorFromResult(userRes);
    // }
    // totalUsers.value = userRes.data?.data?.total_users;

    // 티켓 구매 수량 통계
    // const ticketRes = await ConferenceApi.getTicket();
    // if (!ticketRes.ok) {
    //   toastApi.errorFromResult(ticketRes);
    // }
    // totalTicket.value = ticketRes.data?.data?.ticket;

    // 날짜별 통계
    const dayRes = await ConferenceApi.getDaily();
    if (!dayRes.ok) {
      toastApi.errorFromResult(dayRes);
    }
    totalDay.value = dayRes.data?.data;

    // 좌석별 통계
    const areaRes = await ConferenceApi.getArea();
    if (!areaRes.ok) {
      toastApi.errorFromResult(areaRes);
    }
    totalArea.value = areaRes.data?.data;

    //전송별 통계
    const sendRes = await ConferenceApi.getSend();
    if (!sendRes.ok) {
      toastApi.errorFromResult(sendRes);
    }
    totalAttend.value = sendRes.data?.data;
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchList = async ({ page, size, keyword }) => {
  const params = {
    option: ticket.value ? [ticket.value] : [],
    day: days.value ? [days.value] : [],
    keyword: keyword,
    area: [area.value ?? ''],
    attend: String(attend.value) === 'true' ? 'Y' : 'N',
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await ConferenceApi.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.data?.list.map((item, index) => {
      return { ...item, no: index + 1 };
    });
    const total = list[0]?.total ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onReset, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    extra: { ticket, days, area, attend },
    autoSearchOnExtraChange: true,
  });

const onAllCheck = () => {
  const allChecked = items.value.every((item) => item.check);

  items.value.forEach((item) => {
    item.check = !allChecked;
  });
};

const onCreate = async () => {
  isModifyCreateVisible.value = true;
};

const onSms = async () => {};

const excelDownload = async () => {
  const excelRes = await ConferenceApi.getExcel();
  downloadExcel(excelRes, `2026 Solus CHRISTUS CONFERENCE 등록자 명단(${getTodayYmd()})`);
};

const goModify = (key) => {
  uniqueId.value = key;
  isModifyModalVisible.value = true;

  // router.push({
  //   name: ROUTE.Conference.Conference.Modify,
  //   query: { ...route.query, uniqueId: key },
  // });
};

const onDelete = async (item) => {
  // const disposeCount = items.value.filter((item) => item.check).map((item) => item.uniqueId);
  // if (disposeCount.length === 0) return;

  const uniqueId = item.uniqueId;

  const ok = await modal.show({
    title: `[${item.buyer}] 정보 폐기`,
    message: `해당 정보를 폐기하시겠습니까?\n삭제된 정보는 담당자한테 문의 바랍니다.`,
    confirmText: '폐기',
  });
  if (!ok) return;

  try {
    const res = await ConferenceApi.postDispose(uniqueId);
    if (!res.ok) return toastApi.errorFromResult(res);

    toast.success('폐기되었습니다.');
    init();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const sendQrCode = async (row) => {
  const ok = await modal.show({
    title: `[${row.buyer}] QR Code 전송`,
    message: `QR Code를 전송 하시겠습니까?\n 60p 포인트가 차감됩니다.`,
    confirmText: '전송',
  });
  if (!ok) return;

  try {
    const res = await ConferenceApi.postQrCodeSmsSend(row.uniqueId);
    if (res.data?.resultCd !== '0000')
      return toast.error(res.data?.resultMsg);

    toast.success('전송되었습니다.');
    init();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const onInterlock = async () => {
  const confirm = await modal.show({
    title: '이벤터스 연동.xlsx',
    message: '데이터를 연동 하시겠습니까?',
    confirmText: '연동',
  });
  if (!confirm)
    return;

  try {
    const res = await ConferenceApi.getGoogleSheetInterlock();
    if (res.data?.resultCd !== '0000')
      return toast.error(res.data?.resultMsg);

    const successCount = res.data?.data?.successCount;
    toast.success(`${successCount}건의 데이터가 연동되었습니다.`);
    init();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const onSite = async () => {
  const confirm = await modal.show({
    title: '현장구매 연동.xlsx',
    message: '데이터를 연동 하시겠습니까?',
    confirmText: '연동',
  });
  if (!confirm)
    return;

  try {
    const res = await ConferenceApi.getOnsiteGoogleSheetInterlock();
    if (res.data?.resultCd !== '0000')
      return toast.error(res.data?.resultMsg);

    const successCount = res.data?.data?.successCount;
    toast.success(`${successCount}건의 데이터가 연동되었습니다.`);
    init();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const onAttend = async (item) => {
  const uniqueId = item.uniqueId;

  const ok = await modal.show({
    title: `[${item.buyer}] 출석 처리`,
    message: '출석 처리하시겠습니까?',
    confirmText: '출석',
  });
  if (!ok) return;

  try {
    const res = await ConferenceApi.postCheckIn(uniqueId);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('출석 처리되었습니다.');
    init();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchSearchOptions();
  fetchStatistics();
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0 fw-bold">📌 등록명단</h6>
    </CCardHeader>

    <CCardBody>
      <div class="mb-2">
        <span class="fw-bold">ℹ️ 이벤터스 연동 방법 안내</span><br />
        1. <span class="text-info text-decoration-underline">이벤터스 연동.xlsx</span> 파일을 기준으로 등록 명단을 연동해 주시기 바랍니다.<br />
        2. 연동 완료 및 데이터 확인 후, 해당 파일은 <span class="text-danger">초기화</span>해 주시기 바랍니다.
      </div>

      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        placeholder="구매자, 참석자, 전화번호, 교회, 교단, 메모"
        @submit="onSearch"
        @reset="onReset"
      >
        <template #extra-front>
          <!--                    <UiMultiSelect v-model="ticket" :options="ticketOptions" size="sm" style="width: 120px" />-->

          <!--티켓구분-->
          <CFormSelect v-model="ticket" size="sm" style="width: 120px">
            <option v-for="opt in ticketOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>

          <!--신청일-->
          <CFormSelect v-model="days" size="sm" style="width: 120px">
            <option v-for="opt in daysOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>
        </template>

        <template #extra-back>
          <!--좌석구역-->
          <CFormSelect v-model="area" size="sm" style="width: 120px">
            <option v-for="opt in areaOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>

          <div class="d-flex align-items-center">
            <CFormCheck class="checkbox" id="attend" label="출석여부" v-model="attend" />
          </div>
        </template>

        <template #extra-btn>
          <CButton color="dark" size="sm" type="button" @click="onCreate">등록</CButton>
          <!--          <CButton color="warning" size="sm" type="button" @click="onSms">SMS 전송</CButton>-->
          <CButton color="success" size="sm" type="button" @click="excelDownload">엑셀</CButton>
          <CButton color="primary" size="sm" @click="onInterlock">이벤터스 연동</CButton>
          <CButton color="info" size="sm" @click="onSite">현장구매 연동</CButton>

          <!--          <CFormCheck-->
          <!--            class="checkbox"-->
          <!--            id="allCheck"-->
          <!--            label="전체선택"-->
          <!--            v-model="allCheck"-->
          <!--            @click="onAllCheck"-->
          <!--          />-->
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardHeader>
      <h6 class="mb-0 fw-bold">
        총 수량
        <span class="text-danger">{{ formatMoney(items?.[0]?.countTotal) }}</span>건
      </h6>
    </CCardHeader>

    <CCardBody>
      <UiDataTable :columns="CONF_COLUMNS" :items="items" :loading="loading" :row-clickable="true">
        <template #cell-check="{ item }">
          <CFormCheck class="checkbox" id="check" v-model="item.check" />
        </template>

        <template #cell-attend="{ item }">
          <div v-if="item.attend === 'N'">
            <CButton
              color="warning"
              variant="outline"
              size="sm"
              type="button"
              @click="onAttend(item)"
            >
              출석
            </CButton>
          </div>
          <div v-else-if="item.attend === 'Y'" class="text-warning fw-bold">O</div>
          <div v-else class="text-secondary fw-bold">
            {{ item.attend }}
          </div>
        </template>

        <template #cell-newBelieverYn="{ item }">
          <span v-if="item.newBelieverYn === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.newBelieverYn === 'Y'" class="text-info fw-bold"> O </span>
        </template>

        <template #cell-option="{ item }">
          <span v-if="item.option === 1">슈퍼얼리</span>
          <span v-if="item.option === 2">얼리 1차</span>
          <span v-if="item.option === 3">얼리 2차</span>
          <span v-if="item.option === 4">공식</span>
          <span v-if="item.option === 5">이벤트</span>
          <span v-if="item.option === 6">현장구매</span>
          <span v-if="item.option === 7">VIP</span>
          <span v-else></span>
        </template>

        <template #cell-day="{ item }">
          <div class="fw-bold">
            <span v-if="item.day === 1">화</span>
            <span v-if="item.day === 2">수</span>
            <span v-if="item.day === 3">목</span>
            <span v-if="item.day === 4">3-day</span>
            <span v-else></span>
          </div>
        </template>

        <!-- QR 전송 -->
        <template #cell-createQR="{ item }">
          <div v-if="item.createQR === 'N'">
            <CButton
              color="success"
              variant="outline"
              size="sm"
              type="button"
              @click="sendQrCode(item)"
            >
              전송
            </CButton>
          </div>
          <div v-else-if="item.createQR === 'Y'" class="text-success fw-bold">O</div>
          <div v-else class="text-secondary fw-bold">
            {{ item.createQR }}
          </div>
        </template>

        <!-- 가이드북 전송 -->
        <template #cell-notionSmsYn="{ item }">
          <span v-if="item.notionSmsYn === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.notionSmsYn === 'Y'" class="text-info fw-bold"> O </span>
        </template>

        <template #cell-phone="{ item }">
          {{ formatPhoneKR(item.phone) }}
        </template>

        <template #cell-modify="{ item }">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            type="button"
            @click="goModify(item.uniqueId)"
          >
            <CIcon name="cil-pencil" />
          </CButton>
        </template>

        <template #cell-delete="{ item }">
          <CButton color="danger" variant="outline" size="sm" type="button" @click="onDelete(item)">
            <CIcon name="cil-pencil" />
          </CButton>
        </template>

        <template #cell-sms01="{ item }">
          <span v-if="item.sms01 === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.sms01 === 'Y'" class="text-info fw-bold"> O </span>
        </template>

        <template #cell-sms02="{ item }">
          <span v-if="item.sms02 === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.sms02 === 'Y'" class="text-info fw-bold"> O </span>
        </template>

        <template #cell-sms03="{ item }">
          <span v-if="item.sms03 === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.sms03 === 'Y'" class="text-info fw-bold"> O </span>
        </template>

        <template #cell-sms04="{ item }">
          <span v-if="item.sms04 === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.sms04 === 'Y'" class="text-info fw-bold"> O </span>
        </template>
      </UiDataTable>

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

  <ConferenceModifyModal
    v-model:visible="isModifyModalVisible"
    :model-value="uniqueId"
    @confirm="init"
  />
  <ConferenceCreateModal v-model:visible="isModifyCreateVisible" @confirm="init" />
</template>
