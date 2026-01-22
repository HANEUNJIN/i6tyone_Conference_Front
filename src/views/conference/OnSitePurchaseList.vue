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
import { CONF_COLUMNS, CONF_ONSITE_COLUMNS } from '@/constants/conference/ConfColumns';
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

const area = ref(''); //좌석구분
const areaOptions = ref([]);

const check = ref(false);
const allCheck = ref(false);

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
  D1: 200, //VIP 200, 대구 90
  'C2-1': 100, //대만 100
  'D2-1': 100, //대만 100
  'E2-1': 100, //대만 100
};

const formattedTotal = computed(() => {
  const item = items.value?.[0];
  if (!item) return formatMoney(0);

  const extra = item.day === 4 ? extraMap[item.area] || 0 : 0;
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
    areaOptions.value = [{ key: '', value: '좌석구분' }, ...areaList];
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
    area: area.value ? [area.value] : [],
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await ConferenceApi.getOnSiteList(params);
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
    extra: { ticket, days, area },
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

const onPay = async (item) => {
  const uniqueId = item.uniqueId;

  const ok = await modal.show({
    title: `[${item.buyer}] 결제 완료 확인`,
    message: `결제가 정상적으로 완료되었는지\n다시 한 번 확인해주세요.`,
    confirmText: '확인',
  });
  if (!ok)
    return;

  try {
    const res = await ConferenceApi.postPaymentsComplete(uniqueId);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('등록명단에 연동되었습니다.');
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
    const params = {
      buyer: row.buyer,
      phone: row.phone,
    };

    const res = await ConferenceApi.postQrCodeSmsSend(params);
    console.log(res);
    // if (!res.ok)
    //   return toastApi.errorFromResult(res);

    toast.success('전송되었습니다.');
    init();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const onInterlock = async () => {
  const confirm = await modal.show({
    title: '구글시트 연동.xlsx',
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

onMounted(() => {
  fetchSearchOptions();
  fetchStatistics();
  init();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader>
      <div class="d-flex gap-3">
        <h6 class="mb-0 fw-bold">📌 현장구매 명단</h6>
        현장 구매자가 구글폼을 통해 제출된 명단
      </div>
    </CCardHeader>

    <CCardBody>
      <div class="mb-2">
        <span class="fw-bold">ℹ️ 현장 등록 연동 방법 안내</span><br />
        1. <span class="text-info text-decoration-underline">26 conf. 현장 등록(응답).xlsx</span> 파일을 기준으로 등록 명단을 확인해 주시기 바랍니다.<br />
        2. 결제 확인 후 <strong>[결제완료]</strong> 버튼을 클릭하시면 <strong>[등록명단]</strong> 페이지에서 조회하실 수 있습니다.
      </div>

      <!-- 검색 -->
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        placeholder="구매자, 참석자, 전화번호, 교회, 교단"
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
        </template>

        <template #extra-btn>
          <CButton color="primary" size="sm" @click="onInterlock">구글시트 연동</CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardHeader>
      <h6 class="mb-0 fw-bold">
        총 수량
        <span class="text-danger">{{ formattedTotal }}</span
        >건
      </h6>
    </CCardHeader>

    <CCardBody>
      <UiDataTable
        :columns="CONF_ONSITE_COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
      >
        <template #cell-check="{ item }">
          <CFormCheck class="checkbox" id="check" v-model="item.check" />
        </template>

        <template #cell-attend="{ item }">
          <span v-if="item.attend === 'N'" class="text-danger fw-bold"> X </span>
          <span v-else-if="item.attend === 'Y'" class="text-info fw-bold"> O </span>
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

        <template #cell-payYn="{ item }">
          <CButton
            v-if="item.payYn === 'N'"
            color="success"
            variant="outline"
            size="sm"
            type="button"
            @click="onPay(item)"
          >
            결제완료
          </CButton>
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
</template>
