export default function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
}) {
  return (
    <th
      className="text-center cursor-pointer select-none hover:bg-green-600 transition px-2 py-3"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>

        <span className="inline-block w-3 text-xs">
          {sortConfig.key === sortKey
            ? sortConfig.direction === "asc"
              ? "▲"
              : "▼"
            : ""}
        </span>
      </div>
    </th>
  );
}