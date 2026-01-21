import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';

//엑셀 다운로드 훅
export function useExcelDownload() {
  const toast = useToast();
  const modal = useConfirmModal();

  const downloadExcel = async (excelRes, excelTitle = '') => {
    try {
      const showConfirmModal = true;
      const confirmTitle = `${excelTitle}`;
      const confirmMessage = '엑셀 파일을 다운로드하시겠습니까?';
      const confirmText = '다운로드';

      if (showConfirmModal) {
        const confirm = await modal.show({
          title: confirmTitle,
          message: confirmMessage,
          confirmText: confirmText,
        });
        if (!confirm)
          return false;
      }

      const blob = new Blob([excelRes.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `${excelTitle}.xls`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error(e.message || '엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return { downloadExcel };
}
