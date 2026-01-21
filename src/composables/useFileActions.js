import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';

export const useFileActions = () => {
  const toast = useToast();
  const modal = useConfirmModal();

  const handleFile = async (source, options = {}) => {
    const {
      fileName = 'downloaded_document',
      showConfirmModal = true,
      confirmTitle = '확인',
      confirmMessage = '파일을 여시겠습니까?',
      confirmText = '열기',
      target = '_blank',
      download = false,
    } = options;

    if (!source) {
      toast.error('파일 소스가 제공되지 않았습니다.');
      return false;
    }

    if (showConfirmModal) {
      const confirm = await modal.show({
        title: confirmTitle,
        message: confirmMessage,
        confirmText: confirmText,
      });
      if (!confirm) return false;
    }

    let fileUrl = '';
    let objectUrl = null; // Blob에서 생성된 URL을 저장할 변수

    try {
      if (source instanceof Blob) {
        // MIME 타입 재지정 로직은 여기에 추가 가능
        if (source.type === 'application/octet-stream' && fileName) {
          const extension = fileName.split('.').pop();
          let correctMimeType = '';
          if (extension) {
            switch (extension.toLowerCase()) {
              case 'png':
                correctMimeType = 'image/png';
                break;
              case 'jpg':
              case 'jpeg':
                correctMimeType = 'image/jpeg';
                break;
              case 'pdf':
                correctMimeType = 'application/pdf';
                break;
              // ... 기타 타입
              default:
                correctMimeType = source.type; // 기본값 유지
            }
          }
          if (correctMimeType && correctMimeType !== source.type) {
            source = new Blob([source], { type: correctMimeType });
          }
        }
        objectUrl = URL.createObjectURL(source);
        fileUrl = objectUrl;
      } else if (typeof source === 'string') {
        fileUrl = source;
      } else {
        toast.error('지원하지 않는 파일 소스 형식입니다.');
        return false;
      }

      const link = document.createElement('a');
      link.href = fileUrl;
      link.rel = 'noopener noreferrer';

      if (download) {
        link.download = fileName;
        link.target = '_self';
      } else {
        link.target = target;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (error) {
      console.error('파일을 여는 중 오류가 발생했습니다:', error);
      toast.error('파일을 처리하는 데 실패했습니다. 다시 시도해 주세요.');
      return false;
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  return {
    handleFile,
  };
};
