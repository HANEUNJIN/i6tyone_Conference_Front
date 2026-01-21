<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Datepicker from '@vuepic/vue-datepicker';
import { useBaseStore } from '@/stores/base';
import { datepickerFixed, formatYmd, getTodayYm, toYmdCompact } from '@/utils/common';
import { HospApi } from '@/api/temp/hosp';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import titleIconImg from '@/assets/images/customer/ic_img.png';
import eghisLogoImg from '@/assets/images/customer/ic_logo.png';
import summaryIconImg from '@/assets/images/customer/ic_summary.png';
import unpaidIconImg from '@/assets/images/customer/ic_money.png';
import detailIconImg from '@/assets/images/customer/ic_detail.png';
import UiLoading from '@/components/ui/UiLoading.vue';
import html2canvas from 'html2canvas';
import { useConfirmModal } from '@/composables/useConfirmModal';

// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const { storeLicenseCd, storeHospName, storeMenuType } = storeToRefs(base);
const toastApi = useApiToast();
const toast = useToast();
const modal = useConfirmModal();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const captureArea = ref(null);
const customerInfo = ref({});
const paymentList = ref([]);
const paymentMonthList = ref([]);
const dateFrom = ref(getCurrentYearJanuary());
const dateTo = ref(getTodayYm());
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchCustomerInfo = async () => {
  if (!storeLicenseCd.value) return toast.error('라이센스 정보가 없습니다.');
  try {
    const res = await HospApi.getCustomerInfo({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    customerInfo.value = res.data?.resultData;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchCustomerPayment = async () => {
  isLoading.value = true;
  const params = {
    licenseCd: storeLicenseCd.value,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    menuType: storeMenuType.value,
  };
  try {
    const [listRes, monthRes] = await Promise.all([
      HospApi.getHospPaymentList(params),
      HospApi.getHospPaymentListMonth(params),
    ]);
    if (!listRes.ok) return toastApi.errorFromResult(listRes);
    if (!monthRes.ok) return toastApi.errorFromResult(monthRes);

    paymentList.value = listRes.data?.resultData?.list ?? [];
    paymentMonthList.value = monthRes.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

// 올해 1월달 YYYY-MM 형식 문자열 반환
function getCurrentYearJanuary() {
  const now = new Date();
  const year = now.getFullYear();
  const month = '01';
  return `${year}-${month}`;
}

const handleSearch = () => {
  fetchCustomerPayment();
};

const handlePrint = async () => {
  const confirm = await modal.show({
    title: '사용내역서',
    message: '이미지출력 하시겠습니까?',
  });
  if (!confirm) return;

  html2canvas(captureArea.value).then((canvas) => {
    // 이미지 다운로드
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = '사용내역서.png';
    link.click();
  });
};

// 총 미수금 계산
const overdueAmount = computed(() => {
  if (!paymentList.value || paymentList.value.length === 0) {
    return '0';
  }

  let totalLastCost = 0;
  let paidOrProcessedCost = 0;

  for (const item of paymentList.value) {
    totalLastCost += item.lastCost;
    if (item.insYmd !== null) {
      paidOrProcessedCost += item.lastCost;
    }
  }

  const result = totalLastCost - paidOrProcessedCost;
  return result.toLocaleString('ko-KR') || '0';
});

// 총 합계 계산 (세부내역서 하단)
const totalSumLastCost = computed(() => {
  if (!paymentList.value || paymentList.value.length === 0) return '0';
  return paymentList.value.reduce((sum, item) => sum + item.lastCost, 0).toLocaleString('ko-KR');
});

// 납부 완료 금액 계산 (세부내역서 하단)
const totalPaidCost = computed(() => {
  if (!paymentList.value || paymentList.value.length === 0) return '0';
  return paymentList.value
    .reduce((sum, item) => sum + (item.insYmd === null ? 0 : item.lastCost), 0)
    .toLocaleString('ko-KR');
});

watch(storeLicenseCd, () => {
  fetchCustomerInfo();
  fetchCustomerPayment();
});

onMounted(() => {
  fetchCustomerInfo();
  fetchCustomerPayment();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        :loading="isLoading"
        :show-input="false"
        :show-reset="false"
        @submit="handleSearch"
      >
        <template #extra-front>
          <div class="d-flex flex-row align-items-center gap-2 flex-grow-1">
            <Datepicker
              v-model="dateFrom"
              v-bind="datepickerFixed"
              month-picker
              format="yyyy-MM"
              model-type="yyyy-MM"
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
            <span>~</span>
            <Datepicker
              v-model="dateTo"
              v-bind="datepickerFixed"
              month-picker
              format="yyyy-MM"
              model-type="yyyy-MM"
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </div>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>
  <CCard>
    <CCardHeader class="d-flex align-items-center justify-content-between">
      <h6 class="mb-0">
        <strong>{{ storeHospName }}</strong> 사용내역서
      </h6>
      <CButton color="success" size="sm" @click="handlePrint">이미지출력 </CButton>
    </CCardHeader>
    <CCardBody class="p-0">
      <div ref="captureArea" class="capture-area">
        <div class="wrap_pdf_page">
          <div class="loading-wrapper" v-if="isLoading">
            <UiLoading />
          </div>
          <div id="pdf_page">
            <header>
              <div class="pdf_title">
                <h1>
                  <CImage :src="titleIconImg" alt="titleIcon" />
                  <span class="text">사용내역서</span>
                </h1>
                <CImage :src="eghisLogoImg" alt="eghisLogo" />
              </div>
              <div class="pdf_client">
                <div>
                  <strong>상호명:</strong><span>{{ customerInfo.hospNm }}</span>
                </div>
                <div>
                  <strong>고객명:</strong><span>{{ customerInfo.mainDoctorNm }}</span>
                </div>
              </div>
            </header>
            <hr />
            <section>
              <div class="contentsBlock">
                <div class="left">
                  <h3>
                    <CImage :src="summaryIconImg" alt="summaryIcon" />
                    <span>청구내역 요약</span>
                  </h3>
                  <div>
                    <table>
                      <colgroup>
                        <col style="width: 23%" />
                        <col style="width: 30%" />
                        <col />
                      </colgroup>
                      <thead class="gray">
                        <tr>
                          <th scope="col">사용월</th>
                          <th scope="col">청구금액</th>
                          <th scope="col">출금일</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-if="paymentMonthList.length > 0">
                          <tr v-for="(item, idx) in paymentMonthList" :key="idx">
                            <td class="textRight">{{ formatYmd(item.startYmd) }}</td>
                            <td class="textRight">{{ item.lastCost.toLocaleString('ko-KR') }}</td>
                            <td class="textRight">{{ formatYmd(item.insYmd) }}</td>
                          </tr>
                        </template>
                        <template v-else>
                          <tr>
                            <td colspan="3" style="padding: 30px">조회 데이터가 없습니다.</td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="right">
                  <h3>
                    <CImage :src="unpaidIconImg" alt="unpaidIcon" />
                    <span>미수내역</span>
                  </h3>
                  <div class="unpaidTable">
                    <div>
                      <strong>미수금</strong>
                      <span class="orange">
                        {{ overdueAmount }}
                        원
                      </span>
                    </div>
                    <div><strong>입금 계좌</strong><span>140-011-698241</span></div>
                    <div><strong></strong><span>신한은행/이지스헬스케어</span></div>
                  </div>
                  <div class="phone">
                    <span>☎</span>
                    금액 관련 문의 :
                    <span>02-6204-2023</span>
                  </div>
                </div>
              </div>
              <div class="contentsBlock">
                <div class="single">
                  <h3>
                    <CImage :src="detailIconImg" alt="detailIcon" />
                    <span>세부내역서</span>
                  </h3>
                  <div>
                    <table class="tableOrange">
                      <colgroup>
                        <col />
                        <col style="width: 27%" />
                        <col style="width: 17.3%" />
                        <col style="width: 8.3%" />
                        <col style="width: 17.2%" />
                        <col style="width: 17.2%" />
                      </colgroup>
                      <thead class="gray">
                        <tr>
                          <th scope="col">사용월</th>
                          <th scope="col">상품</th>
                          <th scope="col">단가</th>
                          <th scope="col">수량</th>
                          <th scope="col">청구금</th>
                          <th scope="col">출금일</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-if="paymentList.length > 0">
                          <tr v-for="(item, idx) in paymentList" :key="idx">
                            <template v-if="item.itemNum == 1">
                              <td :rowspan="item.rowNum" class="class-white">
                                {{ formatYmd(item.startYmd) }}
                              </td>
                            </template>
                            <td class="textLeft">{{ item.itemNm }}</td>
                            <td class="textRight">
                              {{ item.price.toLocaleString('ko-KR') }}
                            </td>
                            <td class="textRight">
                              {{ item.qty }}
                            </td>
                            <td class="textRight">
                              {{ item.lastCost.toLocaleString('ko-KR') }}
                            </td>
                            <td align="center" class="class-white">
                              <template v-if="item.insYmd != null">
                                {{ formatYmd(item.insYmd) }}
                              </template>
                            </td>
                          </tr>

                          <tr>
                            <td colspan="4" class="totalText">소계</td>
                            <template v-if="paymentList.length > 0">
                              <td class="totalPrice orange textRight" colspan="2">
                                총합계 : {{ totalSumLastCost }} 원<br />
                                납부완료 : {{ totalPaidCost }} 원<br />
                                미수금 : {{ overdueAmount }} 원
                              </td>
                            </template>
                          </tr>
                        </template>
                        <template v-else>
                          <tr>
                            <td colspan="6">조회 데이터가 없습니다.</td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </CCardBody>
  </CCard>
</template>

<style scoped>
.wrap_pdf_page {
  position: relative;
  padding: 20px;
  background-color: #666;
  overflow-y: auto;
}

.loading-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  z-index: 1000;
}

#pdf_page {
  margin: 0 auto;
  width: 842px;
  //min-width: 550px;
  min-height: 1190px;
  padding: 50px 40px;
  background-color: #fff;
  color: #1a1a1a;
}
#pdf_page * {
  box-sizing: border-box;
}

#pdf_page .pdf_title {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
#pdf_page .pdf_title > h1 {
  margin: 0;
  padding: 0;
}
#pdf_page .pdf_title > h1 > img {
  width: 64px;
  vertical-align: middle;
}
#pdf_page .pdf_title > h1 > span {
  margin-left: 5px;
  font-size: 40px;
  font-weight: bold;
  vertical-align: middle;
}

#pdf_page .pdf_client {
  float: right;
  margin: 24px 8px 20px 0;
}
#pdf_page .pdf_client > div {
  display: flex;
}
#pdf_page .pdf_client > div > strong {
  display: inline-block;
  width: 80px;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 4px;
  text-align: left;
}

#pdf_page .pdf_client > div > span {
  flex-grow: 1;
  min-width: 121px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
}

#pdf_page .pdf_client > div > .orange {
  font-size: 15px;
  font-weight: bold;
  color: #f60;
}

#pdf_page hr {
  clear: both;
  margin: 0;
  border: none;
  border-top: 1px solid #fb8450;
}

#pdf_page .contentsBlock {
  margin: 20px 0 32px 0;
  display: flex;
  justify-content: space-between;
}

#pdf_page .contentsBlock > div > h3 {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  font-size: 19px;
  font-weight: bold;
}
#pdf_page .contentsBlock > div > h3 > img {
  margin-right: 4px;
}

#pdf_page .contentsBlock .left {
  flex-grow: 1;
}

#pdf_page .contentsBlock .right {
  margin-left: 2.5%;
  width: 40.3%;
}

#pdf_page .contentsBlock .single {
  width: 100%;
}

/* #pdf_page table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #ddd;
  border-style: hidden;
  overflow: hidden;
} */
#pdf_page table thead {
  height: 31px;
  font-weight: bold;
}
#pdf_page table thead .gray {
  background: #f2f2f2;
}

#pdf_page table thead tr > th {
  padding: 4.5px 16px;
  border: 1px solid #ddd;
  font-size: 15px;
  font-weight: bold;
  text-align: center;
}

#pdf_page table > tbody > tr > td {
  padding: 5px 14px;
  height: 31px;
  border: 1px solid #ddd;
  font-size: 14px;
  font-weight: 300;
  text-align: center;
  color: #1a1a1a;
}
#pdf_page table > tbody > tr > td .month {
  background-color: #f2f2f2;
}

#pdf_page .totalText {
  font-size: 15px;
  font-weight: bold;
}

#pdf_page table .totalPrice {
  font-size: 14px;
  font-weight: bold;
}

#pdf_page .unpaidTable {
  margin: 12px 0;
  padding: 9px 0;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  border-radius: 6px;
  background-color: #fff8f5;
}

#pdf_page .unpaidTable div strong {
  display: inline-block;
  padding: 4.5px 15px;
  width: 32.2%;
  font-size: 15px;
  text-align: left;
  color: #1a1a1a;
}

#pdf_page .unpaidTable div span {
  display: inline-block;
  padding: 5px 15px;
  width: 67.4%;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  color: #1a1a1a;
}
#pdf_page .unpaidTable .orange {
  font-size: 15px;
  font-weight: bold;
  color: #f60;
}

#pdf_page .tableOrange > thead > tr th {
  background-color: #fb8450;
  color: #fff;
}

#pdf_page .tableOrange > tbody > tr:nth-child(odd) {
  background-color: #fafafa;
}

#pdf_page .tableOrange > tbody > tr:last-child {
  background-color: #fff8f5;
}

#pdf_page .phone {
  margin: 5px 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  color: #1a1a1a;
}
#pdf_page .phone > span {
  font-weight: bold;
}

#pdf_page .textLeft {
  text-align: left;
}

#pdf_page .textRight {
  text-align: right;
}

#pdf_page .orange {
  color: #f60;
}

#pdf_page .class-white {
  background: #ffffff;
}

@page {
  size: A4;
  margin: 0;
}

td[rowspan] {
  z-index: 50;
  background-color: white;
  position: relative;
}
</style>
