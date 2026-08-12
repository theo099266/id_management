import { useMemo, useState } from "react";

export default function useTableSort(data) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const sortedData = useMemo(() => {
    const result = [...data];

    if (!sortConfig.key) return result;

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA == null) valA = "";
      if (valB == null) valB = "";

      if (valA < valB)
        return sortConfig.direction === "asc" ? -1 : 1;

      if (valA > valB)
        return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

    return result;
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
  };
}