import { ref, reactive, onBeforeUnmount } from 'vue';

function patternMatch(fileType, pattern) {
  // 예: 'image/*' 또는 'application/pdf'
  if (!pattern) return true;
  if (pattern.endsWith('/*')) return fileType.startsWith(pattern.slice(0, -1));
  return fileType === pattern;
}

export function useFileAttachments(options = {}) {
  const {
    accept = ['image/*', 'application/pdf'], // 허용 MIME 패턴
    maxCount = 10, // 최대 개수
    maxSize = 25 * 1024 * 1024, // 최대 용량(바이트)
    dedupe = true, // 중복 제거 여부(이름+사이즈+lastModified)
  } = options;

  const files = ref([]); // File[]
  const dz = reactive({ over: false });
  const fileInput = ref(null);

  // 안전한 URL API (Safari 호환)
  const urlApi = typeof window !== 'undefined' && (window.URL || window.webkitURL);
  // File -> objectURL 캐시 (파일 객체를 키로)
  const previewCache = new WeakMap();
  // 생성한 URL 전체 추적(정리용)
  const allocatedUrls = new Set();

  const acceptAttr = accept.join(',');

  function isAcceptedType(file) {
    return accept.length === 0 || accept.some((p) => patternMatch(file.type, p));
  }

  function addFiles(list) {
    const accepted = [];
    // 중복 방지 키셋(옵션)
    const existingKeys = dedupe
      ? new Set(files.value.map((f) => `${f.name}-${f.size}-${f.lastModified}`))
      : null;

    for (const f of list) {
      if (files.value.length + accepted.length >= maxCount) break;
      if (!isAcceptedType(f)) continue;
      if (f.size > maxSize) continue;

      if (dedupe) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
      }
      accepted.push(f);
    }
    if (accepted.length) files.value = [...files.value, ...accepted];
  }

  function onFilesPicked(e) {
    console.log(e);
    addFiles(Array.from(e.target.files || []));
    // 같은 파일 다시 선택 가능하도록 인풋 리셋
    e.target.value = '';
  }

  function handleDrop(e) {
    dz.over = false;
    addFiles(Array.from(e.dataTransfer?.files || []));
  }

  function openPicker() {
    fileInput.value?.click();
  }

  function getPreview(file) {
    if (!file) return '';
    // 서버에서 온 항목: fileUri가 있으면 절대/상대 경로 처리
    if (typeof file.fileUri === 'string' && file.fileUri.length > 0) {
      // 절대경로면 그대로, 상대경로면 API 베이스 붙이기
      const isAbs = /^https?:\/\//i.test(file.fileUri);
      const base = import.meta.env.VITE_APP_IMG_URL || '';
      return isAbs ? file.fileUri : `${base}${file.fileUri}`;
    }
    // 로컬 업로드 파일: objectURL 생성
    if (!urlApi) return '';
    let url = previewCache.get(file);
    if (!url) {
      url = urlApi.createObjectURL(file);
      previewCache.set(file, url);
      allocatedUrls.add(url);
    }
    return url;
  }

  function previewFile(file) {
    const url = getPreview(file);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  function revokeFor(file) {
    if (!file || !urlApi) return;
    const url = previewCache.get(file);
    if (url) {
      urlApi.revokeObjectURL(url); //  메모리 해제
      allocatedUrls.delete(url);
      previewCache.delete(file);
    }
  }

  function removeFile(index) {
    const f = files.value[index];
    revokeFor(f);
    files.value.splice(index, 1);
  }

  onBeforeUnmount(() => {
    //  컴포넌트 종료 시 남은 URL 전부 해제
    if (!urlApi) return;
    for (const url of allocatedUrls) urlApi.revokeObjectURL(url);
    allocatedUrls.clear();
  });

  return {
    // state
    files,
    dz,
    fileInput,
    acceptAttr,
    // actions
    addFiles,
    onFilesPicked,
    handleDrop,
    openPicker,
    removeFile,
    previewFile,
    getPreview,
  };
}

export default useFileAttachments;
