import { formatDate } from "../styles/formDate";

export default function RecentProjectOfficers({ officers = [] }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-xl text-green-800">
          Recent ID
        </h2>
        <span className="text-sm text-gray-500">Latest 5</span>
      </div>

      {officers.length === 0 ? (
        <p className="text-gray-500">No project officers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  ID
                </th>

                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Employee ID
                </th>

                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Issue Date
                </th>
              </tr>
            </thead>

            <tbody>
              {officers.slice(0, 5).map((officer) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {officer.id}
                  </td>

                  <td className="px-4 py-2 text-sm font-medium text-green-700">
                    {officer.name}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-500">
                    {officer.employee_Id_NO}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-500">
                    {formatDate(officer.issueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}