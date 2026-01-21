import { ref, computed, watch } from 'vue';
import { useApiToast } from '@/composables/useApiToast';
import { SalesAPI } from '@/api/temp/sales';
import { useToast } from '@/composables/useToast';

export function useContacts(detailInfoRef) {
  const toast = useToast();
  const toastApi = useApiToast();

  const contactsRefs = ref([]);
  const isDupiFlag = ref(false); // 연락처 중복 상태
  const dupiList = ref([]); // 연락처 중복 리스트

  // 필드 이름을 인덱스에 맞춰 생성
  function propNameFor(base, idx) {
    return idx === 0 ? base : `${base}${idx}`;
  }

  function makeFieldRefFor(idx, base) {
    return computed({
      get() {
        const list = detailInfoRef.value.contacts || [];
        const obj = list[idx] || {};
        const i = idx === 0 ? 0 : idx + 1;
        const prop = propNameFor(base, i);
        return obj[prop] ?? '';
      },
      set(val) {
        const list = detailInfoRef.value.contacts || [];
        const i = idx === 0 ? 0 : idx + 1;
        const prop = propNameFor(base, i);
        const oldObj = list[idx] || {};
        const newObj = { ...oldObj, [prop]: val };

        if (idx >= list.length) {
          for (let i = list.length; i < idx; i++) detailInfoRef.value.contacts.push({});

          detailInfoRef.value.contacts.push(newObj);
        } else {
          detailInfoRef.value.contacts.splice(idx, 1, newObj);
        }
      },
    });
  }

  function buildFieldRefs() {
    const list = detailInfoRef.value.contacts || [];
    contactsRefs.value = list.map((_, idx) => {
      return {
        cType: makeFieldRefFor(idx, 'cType'),
        cNm: makeFieldRefFor(idx, 'cNm'),
        cPhoneNo: makeFieldRefFor(idx, 'cPhoneNo'),
      };
    });
  }
  // 연락처 추가
  function addCType(idx) {
    detailInfoRef.value.contacts.push({
      [`cType${idx}`]: 'A0701',
      [`cNm${idx}`]: '',
      [`cPhoneNo${idx}`]: '',
    });
  }
  // 연락처 삭제
  function removeCType(idx) {
    if (idx === 0) return;
    detailInfoRef.value.contacts.splice(idx, 1);
  }

  // 전화번호 중복 체크
  function isPhoneDuplicated() {
    const contacts = detailInfoRef.value.contacts;
    const phones = contacts
      .map((item, idx) => item[idx === 0 ? 'cPhoneNo' : `cPhoneNo${idx + 1}`])
      .filter(Boolean); // null, '', undefined 제거

    return new Set(phones).size !== phones.length;
  }

  // 전화번호 빈 값 체크
  function isPhoneEmpty() {
    const contacts = detailInfoRef.value.contacts;
    for (let i = 0; i < contacts.length; i++) {
      const nameKey = i === 0 ? 'cNm' : `cNm${i + 1}`;
      const phoneKey = i === 0 ? 'cPhoneNo' : `cPhoneNo${i + 1}`;
      const name = contacts[i]?.[nameKey]?.trim();
      const phone = contacts[i]?.[phoneKey]?.trim();

      if (!name || !phone) {
        toast.error(`${i + 1}번째 연락처의 이름과 전화번호를 모두 입력해주세요.`);
        return true;
      }
    }
  }

  // 영업 현황 등록시 중복 체크
  async function fetchDuplicatedCheck() {
    const contacts = detailInfoRef.value.contacts;

    // 중복 체크용 파라미터 생성
    const params = {};
    for (let i = 0; i < 3; i++) {
      const nameKey = i === 0 ? 'cNm' : `cNm${i + 1}`;
      const phoneKey = i === 0 ? 'cPhoneNo' : `cPhoneNo${i + 1}`;
      const contact = contacts[i] || {};

      let value = '';
      if (contact[nameKey]) {
        value = String(contact[nameKey]).trim();
        // 확인 필요 - 이름만 전달 시 조회가 가능 하나 번호까지 붙여서 전달하면 조회가 안 됌.
        // if (contact[phoneKey]) {
        //   value = (String(contact[nameKey]) + String(contact[phoneKey])).replace(/\s+/g, '');
        // }
      }
      params[`checkValue${i === 0 ? '' : i + 1}`] = value;
    }
    try {
      const res = await SalesAPI.getDuplicationCheck(params);
      if (!res.ok) {
        toastApi.errorFromResult(res);
        return;
      }
      dupiList.value = res.data?.resultData?.list ?? [];
      if (dupiList.value.length === 0) {
        isDupiFlag.value = false;
      } else {
        isDupiFlag.value = true;
      }
    } catch (e) {
      console.error(e);
      toastApi.errorFromException(e);
    }
  }

  watch(
    () => detailInfoRef.value.contacts,
    (v) => {
      buildFieldRefs();
    },
    { immediate: true, deep: true },
  );

  return {
    isDupiFlag,
    dupiList,
    contactsRefs,
    addCType,
    removeCType,
    fetchDuplicatedCheck,
    isPhoneDuplicated,
    isPhoneEmpty,
  };
}

export default useContacts;
