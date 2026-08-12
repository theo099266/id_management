export default function StatCard({
  title,
  value,
  className = "",
}) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 ${className}`}>
      <h3 className="text-gray-500">
        {title}
      </h3>

      <p className="text-4xl font-bold text-green-700 mt-3">
        {value}
      </p>
    </div>
  );
}