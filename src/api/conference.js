import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const ConferenceApi = {
  // 대상자 조회
  getList(params) {
    return client.post(`/api/Register/list`, params);
  },

  // 대상자 조회
  getOnSiteList(params) {
    return client.post(`/api/OnSiteRegister/onsite-list`, params);
  },

  // 대상자 상세조회
  getDetail(uniqueIdKey) {
    return client.post(`/api/Register/detail?uniqueIdKey=${encodeURIComponent(uniqueIdKey)}`);
  },

  // 대상자 수정
  postModify(params) {
    return client.post(`/api/Register/update`, params);
  },

  // 대상자 등록
  postCreate(params) {
    return client.post(`/api/Register/sign-up`, params);
  },

  // 티켓구분 목록 조회
  getOptions() {
    const url = buildUrl(`/api/Conference/options`);
    return client.get(url);
  },

  // 신청일 목록 조회
  getDays() {
    const url = buildUrl(`/api/Conference/days`);
    return client.get(url);
  },

  // 좌석구역 목록 조회
  getAreas() {
    const url = buildUrl(`/api/Conference/areas`);
    return client.get(url);
  },

  // 날짜별 통계
  getDaily() {
    const url = buildUrl(`/api/Statistics/daily`);
    return client.get(url);
  },

  //티켓구분별·신청일자별 구매 수량 현황
  getDetailOption() {
    const url = buildUrl(`/api/Statistics/ticket-option-summary`);
    return client.get(url);
  },

  // 좌석별 통계
  getArea() {
    const url = buildUrl(`/api/Statistics/area`);
    return client.get(url);
  },

  // 출석·전송별 통계
  getSend() {
    const url = buildUrl(`/api/Statistics/send`);
    return client.get(url);
  },

  // 현장 입장 등록
  postCheckIn(keyword) {
    return client.post(`/api/Register/check-in?uniqueIdKey=${encodeURIComponent(keyword)}`);
  },

  // 컨퍼런스 등록 폐기
  postDispose(uniqueIdKey) {
    return client.post(`/api/Register/dispose?uniqueIdKey=${encodeURIComponent(uniqueIdKey)}`);
  },

  // 현장등록자 결제완료 및 연동
  postPaymentsComplete(uniqueIdKey) {
    return client.post(`/api/OnSiteRegister/payments/complete?uniqueIdKey=${encodeURIComponent(uniqueIdKey)}`);
  },

  getExcel(params) {
    const url = buildUrl(`/api/Register/excel`);
    return client.download(url);
  },

  // 특정 등록자 QR·SMS 발송
  postQrCodeSmsSend(params) {
    return client.post(`/api/Register/qrcode-single`, params);
  },

  // 이벤터스 CSV 파일 동기화
  postEventUsUpload(formDataOrJson) {
    const url = buildUrl('/api/Excel/eventus-sheet');
    return client.post(url, formDataOrJson);
  },

  // 남은 좌석별 통계
  getAreaRemaining(params) {
    const url = buildUrl(`/api/Statistics/area/remaining`);
    return client.get(url);
  },

  // 날짜별 건수 통계
  getDay() {
    const url = buildUrl(`/api/Statistics/day`);
    return client.get(url);
  },

  // 이벤터스 Google Sheet 연동
  getGoogleSheetInterlock() {
    const url = buildUrl(`/api/Excel/google-sheet`);
    return client.get(url);
  },

  // 현장등록 Google Sheet 연동
  getOnsiteGoogleSheetInterlock() {
    const url = buildUrl(`/api/Excel/onsite-google-sheet`);
    return client.get(url);
  }
};
