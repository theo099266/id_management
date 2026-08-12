
import { useCallback } from "react";

export const useModalClose = (onClose) => {
  const handleOverlayClick = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const overlayProps = {
    onClick: handleOverlayClick,
    style: { cursor: "pointer" },
  };

  const contentProps = {
    onClick: stopPropagation,
    style: { cursor: "default" },
  };

  return { overlayProps, contentProps };
};