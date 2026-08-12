import { useCallback, useState } from "react";

export default function useDragAndDrop({ onFile, accept = "image/" }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && (!accept || file.type.startsWith(accept))) {
        onFile(file);
      }
    },
    [onFile, accept],
  );

  return { isDragging, handleDragOver, handleDragLeave, handleDrop };
}