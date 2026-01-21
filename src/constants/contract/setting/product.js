export const DETAIL_TABLE_FIELDS = [
  {
    cols: [{ label: '제품 카테고리명', key: 'categoryNm', labelWidth: 3, valueWidth: 9 }],
    colspan: true,
  },
  {
    cols: [{ label: '제품 설명', key: 'categoryExplan', labelWidth: 3, valueWidth: 9 }],
    colspan: true,
  },
  {
    cols: [
      { label: '제품 노출 진료과', key: 'deptCd', labelWidth: 3, valueWidth: 3 },
      { label: '제품 노출 타입', key: 'viewCd', labelWidth: 3, valueWidth: 3 },
    ],
  },
  {
    cols: [
      { label: '사용여부', key: 'useYn', labelWidth: 3, valueWidth: 3 },
      { label: '해지 후 추가 가능', key: 'cancelYn', labelWidth: 3, valueWidth: 3 },
    ],
  },
];

export const CONFIG_TABLE_FIELDS = [
  { cols: [{ label: '항목', key: 'items' }], colspan: true },
  {
    cols: [
      { label: '기본 라이선스 수', key: 'licenseCnt' },
      { label: '금액 수정 가능', key: 'price' },
    ],
  },
  {
    cols: [
      { label: '프리패스권 가능', key: 'freePass' },
      { label: '자동 검수 신청', key: 'autoCheck' },
    ],
  },
  { cols: [{ label: '자동 검수 금액', key: 'autoCheckPrice' }], colspan: true },
  { cols: [{ label: '서브 아이템', key: 'subItems' }], colspan: true },
];
