export const SEARCH_TYPE_OPTIONS = [
  { codeId: '', codeNm: '검색명타입' },
  { codeId: '1', codeNm: '문의사항' },
  { codeId: '2', codeNm: '병원명' },
  { codeId: '3', codeNm: '처리자' },
  { codeId: '4', codeNm: '인수자' },
  { codeId: '5', codeNm: '인수처리내용' },
  { codeId: '6', codeNm: 'CS팀처리' },
];
// 테이블 헤더 정의
export const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'regDt', label: '요청일', width: '10%' },
  { key: 'hospNm', label: '병원명', width: '10%' },
  { key: 'purposeTot', label: '목적', width: '6%' },
  { key: 'reqMatters', label: '문의사항', width: 'auto', align: 'left' },
  { key: 'procEr', label: '처리자', width: '5%' },
  { key: 'procDate', label: '처리일', width: '10%' },
  { key: 'procCondNm', label: '결과', width: '8%' },
  { key: 'passEr', label: '인수자', width: '6%' },
  { key: 'passDate', label: '인수처리일', width: '6%' },
];

export const COLLAPSED_FIELDS = [
  { label1: '문의사항', key: 'reqMatters', colspan: true },
  { label1: 'CS팀처리', key: 'procWay', colspan: true },
  { label1: '인수처리내용', key: 'passWay', colspan: true },
  { label1: '첨부이미지', key: 'fileImages', colspan: true },
];
