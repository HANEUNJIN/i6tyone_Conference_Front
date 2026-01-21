/**
 * 현재 시간의 시(Hour)를 두 자리 24시간 형식 문자열로 반환합니다.
 * 한 자리 숫자일 경우 앞에 '0'이 붙습니다. (예: 9 -> '09', 15 -> '15')
 * @returns {string} '00'부터 '23'까지의 문자열
 */
export const getCurrentHour = () => {
  const now = new Date();
  const hour = now.getHours();
  return String(hour).padStart(2, '0');
};

/**
 * 현재 시간의 분(Minute)을 두 자리 문자열로 반환합니다.
 * 한 자리 숫자일 경우 앞에 '0'이 붙습니다. (예: 5 -> '05', 30 -> '30')
 * @returns {string} '00'부터 '59'까지의 문자열
 */
export const getCurrentMinute = () => {
  const now = new Date();
  const minute = now.getMinutes();
  return String(minute).padStart(2, '0');
};

/**
 * (참고용) 현재 시간을 'HH:mm' 형식의 문자열로 반환합니다.
 * (이전 답변에 있던 것과 동일하며, 위 두 함수를 활용합니다.)
 * @returns {string} 예: '09:05', '14:30'
 */
export const getCurrentTimeFormatted = () => {
  const hour = getCurrentHour();
  const minute = getCurrentMinute();
  return `${hour}:${minute}`;
};

/**
 * (참고용) 현재 시간을 'HH시 MM분' 형식의 문자열로 반환합니다.
 * (padStart를 적용한 버전)
 * @returns {string} 예: '09시 05분', '14시 30분'
 */
export const getCurrentTimeKoreanFormattedPadded = () => {
  const hour = getCurrentHour();
  const minute = getCurrentMinute();
  // '09시 05분'과 같이 두자리로 표현됩니다.
  // 만약 '9시 5분'처럼 숫자 그대로를 원한다면 `getCurrentHour()` 와 `getCurrentMinute()`를 사용해야 합니다.
  return `${hour}시 ${minute}분`;
};

export const hourOptions = [
  { codeId: '00', codeNm: '00시' },
  { codeId: '01', codeNm: '01시' },
  { codeId: '02', codeNm: '02시' },
  { codeId: '03', codeNm: '03시' },
  { codeId: '04', codeNm: '04시' },
  { codeId: '05', codeNm: '05시' },
  { codeId: '06', codeNm: '06시' },
  { codeId: '07', codeNm: '07시' },
  { codeId: '08', codeNm: '08시' },
  { codeId: '09', codeNm: '09시' },
  { codeId: '10', codeNm: '10시' },
  { codeId: '11', codeNm: '11시' },
  { codeId: '12', codeNm: '12시' },
  { codeId: '13', codeNm: '13시' },
  { codeId: '14', codeNm: '14시' },
  { codeId: '15', codeNm: '15시' },
  { codeId: '16', codeNm: '16시' },
  { codeId: '17', codeNm: '17시' },
  { codeId: '18', codeNm: '18시' },
  { codeId: '19', codeNm: '19시' },
  { codeId: '20', codeNm: '20시' },
  { codeId: '21', codeNm: '21시' },
  { codeId: '22', codeNm: '22시' },
  { codeId: '23', codeNm: '23시' },
];

export const minuteOptions = [
  { codeId: '00', codeNm: '00분' },
  { codeId: '01', codeNm: '01분' },
  { codeId: '02', codeNm: '02분' },
  { codeId: '03', codeNm: '03분' },
  { codeId: '04', codeNm: '04분' },
  { codeId: '05', codeNm: '05분' },
  { codeId: '06', codeNm: '06분' },
  { codeId: '07', codeNm: '07분' },
  { codeId: '08', codeNm: '08분' },
  { codeId: '09', codeNm: '09분' },
  { codeId: '10', codeNm: '10분' },
  { codeId: '11', codeNm: '11분' },
  { codeId: '12', codeNm: '12분' },
  { codeId: '13', codeNm: '13분' },
  { codeId: '14', codeNm: '14분' },
  { codeId: '15', codeNm: '15분' },
  { codeId: '16', codeNm: '16분' },
  { codeId: '17', codeNm: '17분' },
  { codeId: '18', codeNm: '18분' },
  { codeId: '19', codeNm: '19분' },
  { codeId: '20', codeNm: '20분' },
  { codeId: '21', codeNm: '21분' },
  { codeId: '22', codeNm: '22분' },
  { codeId: '23', codeNm: '23분' },
  { codeId: '24', codeNm: '24분' },
  { codeId: '25', codeNm: '25분' },
  { codeId: '26', codeNm: '26분' },
  { codeId: '27', codeNm: '27분' },
  { codeId: '28', codeNm: '28분' },
  { codeId: '29', codeNm: '29분' },
  { codeId: '30', codeNm: '30분' },
  { codeId: '31', codeNm: '31분' },
  { codeId: '32', codeNm: '32분' },
  { codeId: '33', codeNm: '33분' },
  { codeId: '34', codeNm: '34분' },
  { codeId: '35', codeNm: '35분' },
  { codeId: '36', codeNm: '36분' },
  { codeId: '37', codeNm: '37분' },
  { codeId: '38', codeNm: '38분' },
  { codeId: '39', codeNm: '39분' },
  { codeId: '40', codeNm: '40분' },
  { codeId: '41', codeNm: '41분' },
  { codeId: '42', codeNm: '42분' },
  { codeId: '43', codeNm: '43분' },
  { codeId: '44', codeNm: '44분' },
  { codeId: '45', codeNm: '45분' },
  { codeId: '46', codeNm: '46분' },
  { codeId: '47', codeNm: '47분' },
  { codeId: '48', codeNm: '48분' },
  { codeId: '49', codeNm: '49분' },
  { codeId: '50', codeNm: '50분' },
  { codeId: '51', codeNm: '51분' },
  { codeId: '52', codeNm: '52분' },
  { codeId: '53', codeNm: '53분' },
  { codeId: '54', codeNm: '54분' },
  { codeId: '55', codeNm: '55분' },
  { codeId: '56', codeNm: '56분' },
  { codeId: '57', codeNm: '57분' },
  { codeId: '58', codeNm: '58분' },
  { codeId: '59', codeNm: '59분' },
];

export const cardMm = [
  { codeId: '01', codeNm: '01' },
  { codeId: '02', codeNm: '02' },
  { codeId: '03', codeNm: '03' },
  { codeId: '04', codeNm: '04' },
  { codeId: '05', codeNm: '05' },
  { codeId: '06', codeNm: '06' },
  { codeId: '07', codeNm: '07' },
  { codeId: '08', codeNm: '08' },
  { codeId: '09', codeNm: '09' },
  { codeId: '10', codeNm: '10' },
  { codeId: '11', codeNm: '11' },
  { codeId: '12', codeNm: '12' },
];

export const cardYy = [
  { codeId: '24', codeNm: '24' },
  { codeId: '25', codeNm: '25' },
  { codeId: '26', codeNm: '26' },
  { codeId: '27', codeNm: '27' },
  { codeId: '28', codeNm: '28' },
  { codeId: '29', codeNm: '29' },
  { codeId: '30', codeNm: '30' },
  { codeId: '31', codeNm: '31' },
  { codeId: '32', codeNm: '32' },
  { codeId: '33', codeNm: '33' },
  { codeId: '34', codeNm: '34' },
  { codeId: '35', codeNm: '35' },
];
