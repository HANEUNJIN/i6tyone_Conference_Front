import { ref, onBeforeUnmount } from 'vue';

export function useImageUpload(opts = {}) {
  const {
    allowed = ['image/jpeg', 'image/png', 'image/webp'],
    maxSize = 5 * 1024 * 1024, // 5MB
    multiple = false,
  } = opts;

  const file = ref(null); // 단일 파일
  const files = ref([]); // 다중 파일
  const preview = ref(null); // 단일 미리보기 URL
  const previews = ref([]); // 다중 미리보기 URL
  const error = ref(''); // 마지막 검증 에러 메시지
  const inputEl = ref(null); // 연결된 <input type="file">

  // 파일 input 엘리먼트 ref를 내부에 등록
  const setInputEl = (el) => {
    inputEl.value = el;
  };

  // 이전 blob URL들 전부 해제(메모리 관리)
  function revokeAll() {
    if (preview.value) URL.revokeObjectURL(preview.value);
    previews.value.forEach((u) => URL.revokeObjectURL(u));
    preview.value = null;
    previews.value = [];
  }

  // 파일/미리보기/에러/인풋 값을 모두 초기화
  function clear() {
    revokeAll();
    file.value = null;
    files.value = [];
    if (inputEl.value) inputEl.value.value = '';
  }

  // <input type="file" @change>에 직접 연결
  function onChange(e) {
    const target = e?.target;
    if (target && !inputEl.value) inputEl.value = target;

    const list = Array.from(target?.files || []);
    console.log(list);
    if (list.length === 0) return;

    // 검증: 형식/용량
    for (const f of list) {
      if (!allowed.includes(f.type)) {
        console.log(f.type);
        error.value = '이미지 파일만 업로드 가능합니다. (jpg, png, webp)';
        target && (target.value = '');
        return;
      }
      if (f.size > maxSize) {
        error.value = '파일 용량은 5MB 이하여야 합니다.';
        target && (target.value = '');
        return;
      }
    }

    error.value = '';
    revokeAll();

    if (multiple) {
      files.value = list;
      previews.value = list.map((f) => URL.createObjectURL(f));
    } else {
      file.value = list[0];
      preview.value = file.value ? URL.createObjectURL(file.value) : null;
    }
  }

  // 단일: clear(), 다중: i번째만 제거(+해제)
  function remove(index = 0) {
    if (!multiple) {
      clear();
      return;
    }
    const url = previews.value.splice(index, 1)[0];
    if (url) URL.revokeObjectURL(url);
    files.value.splice(index, 1);
    if (inputEl.value && files.value.length === 0) inputEl.value.value = '';
  }

  onBeforeUnmount(revokeAll);

  return { file, files, preview, previews, error, onChange, clear, remove, setInputEl };
}
