<script setup>
import { computed, onMounted, ref } from 'vue';
import { ConferenceApi } from '@/api/conference';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import seat from '@/assets/images/seat.png';
import { formatMoney } from '@/utils/common';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const optionsLoading = ref(false);

const COLUMNS = [
  { key: 'day', label: '신청일', width: '3%' },
  { key: 'total', label: '합계', width: '3%', align: 'right' },
];

const COLUMNS2 = [
  { key: 'day', label: '신청일', width: '3%' },
  { key: 'superEarly', label: '슈퍼얼리', width: '3%', align: 'right' },
  { key: 'early1', label: '얼리 1차', width: '3%', align: 'right' },
  { key: 'early2', label: '얼리 2차', width: '3%', align: 'right' },
  { key: 'earlyTotal', label: '얼리 합계', width: '3%', align: 'right' },
  { key: 'regular', label: '공식', width: '3%', align: 'right' },
  { key: 'event', label: '이벤트', width: '3%', align: 'right' },
  { key: 'site', label: '현장구매', width: '3%', align: 'right' },
  { key: 'vip', label: 'VIP', width: '3%', align: 'right' },
  { key: 'total', label: '합계', width: '3%', align: 'right' },
];

const COLUMNS3 = [
  { key: 'a1', label: 'A1', width: '3%', align: 'right' },
  { key: 'b1', label: 'B1', width: '3%', align: 'right' },
  { key: 'c1', label: 'C1', width: '3%', align: 'right' },
  { key: 'd1', label: 'D1', width: '3%', align: 'right' },
  { key: 'a2_1', label: 'A2-1', width: '3%', align: 'right' },
  { key: 'a2_2', label: 'A2-2', width: '3%', align: 'right' },
  { key: 'b2_1', label: 'B2-1', width: '3%', align: 'right' },
  { key: 'b2_2', label: 'B2-2', width: '3%', align: 'right' },
  { key: 'c2_1', label: 'C2-1', width: '3%', align: 'right' },
  { key: 'c2_2', label: 'C2-2', width: '3%', align: 'right' },
  { key: 'd2_1', label: 'D2-1', width: '3%', align: 'right' },
  { key: 'd2_2', label: 'D2-2', width: '3%', align: 'right' },
  { key: 'e2_1', label: 'E2-1', width: '3%', align: 'right' },
  { key: 'e2_2', label: 'E2-2', width: '3%', align: 'right' },
  { key: 'f2_1', label: 'F2-1', width: '3%', align: 'right' },
  { key: 'f2_2', label: 'F2-2', width: '3%', align: 'right' },
  { key: 'g2_1', label: 'G2-1', width: '3%', align: 'right' },
  { key: 'g2_2', label: 'G2-2', width: '3%', align: 'right' },
  { key: '유아_장애', label: '유아&장애', width: '3%', align: 'right' },
  { key: '미지정', label: '미지정', width: '3%', align: 'right' },
];

const COLUMNS4 = [
  { key: 'yn', label: '', width: '3%' },
  { key: 'attend', label: '출석 건수', width: '3%', align: 'right' },
  { key: 'qrSms', label: 'QR 미생성 건수', width: '3%', align: 'right' },
  { key: 'notionSms', label: 'Notion 전송 건수', width: '3%', align: 'right' },
];

const COLUMNS5 = [
  { key: 'floor', label: '위치', width: '3%' },
  // { key: 'section', label: '구역', width: '3%' },
  { key: 'area', label: '구역', width: '5%' },
  { key: 'day', label: '신청일', width: '5%' },

  { key: 'availableCount', label: '좌석 수', width: '5%', align: 'right' },
  { key: 'count', label: '원데이, 올데이', width: '5%', align: 'right' },
  { key: 'totalCount', label: '원데이 + 올데이', width: '5%', align: 'right' },
  { key: 'remain', label: '남은 좌석 수', width: '5%', align: 'right' },
];

const COLUMNS6 = [
  { key: 'dateYmd', label: '날짜', width: '5%' },
  { key: 'day', label: '신청일', width: '5%' },
  { key: 'totalCount', label: '총 등록자 수', width: '5%', align: 'right' },
];

//통계
const summary = ref([]);
const totalAreaList = computed(() => [totalArea.value]);
const totalArea = ref({});
const totalAttend = ref({
  qrNotCreated: 0, //QR 미생성 건수
  qrCreated: 0, //QR 생성 건수
  smsNotSent: 0, //SMS 미전송 건수
  smsSent: 0, //SMS 전송 건수
  notAttendCount: 0, //미출석 건수
  attendCount: 0, //출석 건수
});
const areaRemaining = ref([]);
const totalDay = ref([]);

const fetchStatistics = async () => {
  optionsLoading.value = true;

  try {
    // 티켓구분별·신청일자별 구매 수량 현황
    const detailRes = await ConferenceApi.getDetailOption();
    if (!detailRes.ok) {
      toastApi.errorFromResult(detailRes);
    }
    summary.value = detailRes.data?.data?.list;

    // 좌석별 통계
    const areaRes = await ConferenceApi.getArea();
    if (!areaRes.ok) {
      toastApi.errorFromResult(areaRes);
    }
    totalArea.value = areaRes.data?.data;

    //출석·전송별 통계
    const sendRes = await ConferenceApi.getSend();
    if (!sendRes.ok) {
      toastApi.errorFromResult(sendRes);
    }
    totalAttend.value = sendRes.data?.data?.list;

    // 남은 좌석별 통계
    const areaRemainingRes = await ConferenceApi.getAreaRemaining();
    if (!sendRes.ok) {
      toastApi.errorFromResult(areaRemainingRes);
    }
    areaRemaining.value = areaRemainingRes.data?.data?.list;

    // 날짜별 건수 통계
    const dayRes = await ConferenceApi.getDay();
    if (!dayRes.ok) {
      toastApi.errorFromResult(dayRes);
    }
    totalDay.value = dayRes.data?.data?.list;
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <CRow class="g-3">
    <CCol sm="4">


      <CCard class="mb-3">
        <CCardHeader>
          <p class="fw-bold mb-0">좌석 배치도</p>
        </CCardHeader>

        <CCardBody>
          <CImage :src="seat" />
        </CCardBody>
      </CCard>
    </CCol>

    <CCol sm="8">
      <CCard class="mb-3">
        <CCardHeader>
          <p class="fw-bold mb-0">티켓구분별·신청일자별 구매 수량 현황</p>
        </CCardHeader>

        <CCardBody>
          <UiDataTable
            :columns="COLUMNS2"
            :items="summary"
            :loading="optionsLoading"
            :row-clickable="true"
          >
            <template #cell-day="{ item }">
              {{ item.day === 'Total' ? '합계' : item.day }}
            </template>

            <template #cell-superEarly="{ item }">
              {{ formatMoney(item?.superEarly) }}
            </template>

            <template #cell-early1="{ item }">
              {{ formatMoney(item?.early1) }}
            </template>

            <template #cell-early2="{ item }">
              {{ formatMoney(item?.early2) }}
            </template>

            <template #cell-earlyTotal="{ item }">
              {{ formatMoney(item?.earlyTotal) }}
            </template>

            <template #cell-regular="{ item }">
              {{ formatMoney(item?.regular) }}
            </template>

            <template #cell-event="{ item }">
              {{ formatMoney(item?.event) }}
            </template>

            <template #cell-site="{ item }">
              {{ formatMoney(item?.site) }}
            </template>

            <template #cell-vip="{ item }">
              {{ formatMoney(item?.vip) }}
            </template>

            <template #cell-total="{ item }">
              {{ formatMoney(item?.total) }}
            </template>
          </UiDataTable>
        </CCardBody>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader>
          <p class="fw-bold mb-0">좌석별 통계</p>
        </CCardHeader>

        <CCardBody>
          <UiDataTable
            :columns="COLUMNS3"
            :items="totalAreaList"
            :loading="optionsLoading"
            :row-clickable="true"
          >
            <template #cell-a1="{ item }">
              {{ formatMoney(item?.a1) }}
            </template>

            <template #cell-b1="{ item }">
              {{ formatMoney(item?.b1) }}
            </template>

            <template #cell-c1="{ item }">
              {{ formatMoney(item?.c1) }}
            </template>

            <template #cell-d1="{ item }">
              {{ formatMoney(item?.d1) }}
            </template>

            <template #cell-a2_1="{ item }">
              {{ formatMoney(item?.a2_1) }}
            </template>

            <template #cell-a2_2="{ item }">
              {{ formatMoney(item?.a2_2) }}
            </template>

            <template #cell-b2_1="{ item }">
              {{ formatMoney(item?.b2_1) }}
            </template>

            <template #cell-b2_2="{ item }">
              {{ formatMoney(item?.b2_2) }}
            </template>

            <template #cell-c2_1="{ item }">
              {{ formatMoney(item?.c2_1) }}
            </template>

            <template #cell-c2_2="{ item }">
              {{ formatMoney(item?.c2_2) }}
            </template>

            <template #cell-d2_1="{ item }">
              {{ formatMoney(item?.d2_1) }}
            </template>

            <template #cell-d2_2="{ item }">
              {{ formatMoney(item?.d2_2) }}
            </template>

            <template #cell-e2_1="{ item }">
              {{ formatMoney(item?.e2_1) }}
            </template>

            <template #cell-e2_2="{ item }">
              {{ formatMoney(item?.e2_2) }}
            </template>

            <template #cell-f2_1="{ item }">
              {{ formatMoney(item?.f2_1) }}
            </template>

            <template #cell-f2_2="{ item }">
              {{ formatMoney(item?.f2_2) }}
            </template>

            <template #cell-g2_1="{ item }">
              {{ formatMoney(item?.g2_1) }}
            </template>

            <template #cell-g2_2="{ item }">
              {{ formatMoney(item?.g2_2) }}
            </template>

            <template #cell-유아_장애="{ item }">
              {{ formatMoney(item?.유아_장애) }}
            </template>
          </UiDataTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <CRow class="g-3">
    <CCol sm="4">
    </CCol>

    <CCol sm="4">
      <CCard class="mb-3">
        <CCardHeader>
          <p class="fw-bold mb-0">날짜별 건수 통계</p>
        </CCardHeader>

        <CCardBody>
          <UiDataTable
            :columns="COLUMNS6"
            :items="totalDay"
            :loading="optionsLoading"
            :row-clickable="true"
            :row-span-columns="['dateYmd']"
          >
            <template #cell-day="{ item }">
              <div class="fw-bold">
                <span v-if="item.day === '1'">화</span>
                <span v-if="item.day === '2'">수</span>
                <span v-if="item.day === '3'">목</span>
                <span v-if="item.day === '4'">3-day</span>
                <span v-else></span>
              </div>
            </template>

            <template #cell-totalCount="{ item }">
              {{ formatMoney(Number(item?.totalCount)) }}
            </template>
          </UiDataTable>
        </CCardBody>
      </CCard>
    </CCol>

    <CCol sm="4">
      <CCard class="mb-3">
        <CCardHeader>
          <p class="fw-bold mb-0">출석·전송별 통계</p>
        </CCardHeader>

        <CCardBody>
          <UiDataTable
            :columns="COLUMNS4"
            :items="totalAttend"
            :loading="optionsLoading"
            :row-clickable="true"
          >
            <template #cell-yn="{ item }">
              <div :class="item.yn === 'N' ? 'text-danger fw-bold' : ''">
                {{ item.yn === 'Y' ? '전송' : '미전송' }}
              </div>
            </template>

            <template #cell-attend="{ item }">
              <div :class="item.yn === 'N' ? 'text-danger fw-bold' : ''">
                {{ formatMoney(item?.attend) }}
              </div>
            </template>

            <template #cell-qrSms="{ item }">
              <div :class="item.yn === 'N' ? 'text-danger fw-bold' : ''">
                {{ formatMoney(item?.qrSms) }}
              </div>
            </template>

            <template #cell-notionSms="{ item }">
              <div :class="item.yn === 'N' ? 'text-danger fw-bold' : ''">
                {{ formatMoney(item?.notionSms) }}
              </div>
            </template>
          </UiDataTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!--  <CRow class="g-3">-->
  <!--    <CCol sm="4">-->
  <!--    </CCol>-->

  <!--    <CCol sm="8">-->
  <!--      <CCard class="mb-3">-->
  <!--        <CCardHeader>-->
  <!--          <p class="fw-bold mb-0">남은 좌석별 통계</p>-->
  <!--        </CCardHeader>-->

  <!--        <CCardBody>-->
  <!--          <UiDataTable-->
  <!--            :columns="COLUMNS5"-->
  <!--            :items="areaRemaining"-->
  <!--            :loading="optionsLoading"-->
  <!--            :row-clickable="true"-->
  <!--            :row-span-columns="['floor', 'area']"-->
  <!--          >-->
  <!--            <template #cell-day="{ item }">-->
  <!--              <div class="fw-bold">-->
  <!--                <span v-if="item.day === '1'">화</span>-->
  <!--                <span v-if="item.day === '2'">수</span>-->
  <!--                <span v-if="item.day === '3'">목</span>-->
  <!--                <span v-if="item.day === '4'">3-day</span>-->
  <!--                <span v-else></span>-->
  <!--              </div>-->
  <!--            </template>-->
  <!--          </UiDataTable>-->
  <!--        </CCardBody>-->
  <!--      </CCard>-->
  <!--    </CCol>-->
  <!--  </CRow>-->

  <!--  <CRow class="g-3">-->
  <!--    <CCol sm="3">-->
  <!--      <CCard class="mb-3">-->
  <!--        <CCardHeader>-->
  <!--          <p class="fw-bold mb-0">날짜별</p>-->
  <!--        </CCardHeader>-->

  <!--        <CCardBody>-->
  <!--          <CChart-->
  <!--            type="bar"-->
  <!--            :data="{-->
  <!--              labels: ['1 Day', '2 Day', '3 Day'],-->
  <!--              datasets: [-->
  <!--                {-->
  <!--                  label: '일별 등록자 수',-->
  <!--                  backgroundColor: ['#4e79a7', '#f28e2c', '#e15759'],-->
  <!--                  borderRadius: 6,-->
  <!--                  data: [totalDay.day1Count, totalDay.day2Count, totalDay.day3Count],-->
  <!--                },-->
  <!--              ],-->
  <!--            }"-->
  <!--            :options="{-->
  <!--              responsive: true,-->
  <!--              plugins: {-->
  <!--                legend: { labels: { font: { weight: 'bold' } } },-->
  <!--                tooltip: { enabled: true },-->
  <!--              },-->
  <!--              scales: {-->
  <!--                y: { beginAtZero: true, grid: { color: '#eee' } },-->
  <!--                x: { grid: { display: false } },-->
  <!--              },-->
  <!--            }"-->
  <!--          />-->
  <!--        </CCardBody>-->
  <!--      </CCard>-->
  <!--    </CCol>-->

  <!--    <CCol sm="3">-->
  <!--      <CCard class="mb-3">-->
  <!--        <CCardHeader>-->
  <!--          <p class="fw-bold mb-0">출석률</p>-->
  <!--        </CCardHeader>-->

  <!--        <CCardBody>-->
  <!--          <CChart-->
  <!--            type="doughnut"-->
  <!--            :data="{-->
  <!--              labels: [-->
  <!--                `출석 ${attendanceRate.attend}% (${totalAttend.attendCount}명)`,-->
  <!--                `미출석 ${attendanceRate.notAttend}% (${totalAttend.notAttendCount}명)`,-->
  <!--              ],-->
  <!--              datasets: [-->
  <!--                {-->
  <!--                  backgroundColor: ['#41B883', '#E46651'],-->
  <!--                  data: [attendanceRate.attend, attendanceRate.notAttend],-->
  <!--                },-->
  <!--              ],-->
  <!--            }"-->
  <!--          />-->
  <!--        </CCardBody>-->
  <!--      </CCard>-->
  <!--    </CCol>-->

  <!--    <CCol sm="6">-->
  <!--      <CCard class="mb-3">-->
  <!--        <CCardHeader>-->
  <!--          <p class="fw-bold mb-0">좌석별</p>-->
  <!--        </CCardHeader>-->

  <!--        <CCardBody>-->
  <!--          <CChart-->
  <!--            type="bar"-->
  <!--            :data="{-->
  <!--              labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],-->
  <!--              datasets: [-->
  <!--                {-->
  <!--                  label: '좌석별 수량',-->
  <!--                  backgroundColor: [-->
  <!--                    '#4e79a7',-->
  <!--                    '#59a14f',-->
  <!--                    '#f28e2c',-->
  <!--                    '#e15759',-->
  <!--                    '#76b7b2',-->
  <!--                    '#edc948',-->
  <!--                    '#b07aa1',-->
  <!--                    '#ff9da7',-->
  <!--                    '#9c755f',-->
  <!--                    '#bab0ab',-->
  <!--                  ],-->
  <!--                  borderRadius: 8,-->
  <!--                  data: [-->
  <!--                    totalArea.a,-->
  <!--                    totalArea.b,-->
  <!--                    totalArea.c,-->
  <!--                    totalArea.d,-->
  <!--                    totalArea.e,-->
  <!--                    totalArea.f,-->
  <!--                    totalArea.g,-->
  <!--                    totalArea.h,-->
  <!--                    totalArea.i,-->
  <!--                    totalArea.j,-->
  <!--                  ],-->
  <!--                },-->
  <!--              ],-->
  <!--            }"-->
  <!--            :options="{-->
  <!--              indexAxis: 'y',-->
  <!--              responsive: true,-->
  <!--              plugins: {-->
  <!--                legend: { labels: { font: { weight: 'bold' } } },-->
  <!--                tooltip: { enabled: true },-->
  <!--              },-->
  <!--              scales: {-->
  <!--                x: { beginAtZero: true, grid: { color: '#f2f2f2' } },-->
  <!--                y: { grid:   { display: false } },-->
  <!--              },-->
  <!--            }"-->
  <!--          />-->
  <!--        </CCardBody>-->
  <!--      </CCard>-->
  <!--    </CCol>-->
  <!--  </CRow>-->
</template>
