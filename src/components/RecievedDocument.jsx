export default function RecentDocuments({ documents = [] }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-xl text-green-800">Recent Documents</h2>
        <span className="text-sm text-gray-500">Latest 5</span>
      </div>

      {documents.length === 0 ? (
        <p className="text-gray-500">No documents yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b ">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Reference No
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Recipient
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Subject
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.documentID} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {doc.referenceNo || "No reference"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {doc.recipient || "No recipient"}
                  </td>
                  <td className="px-4 py-2 text-sm text-green-700 font-medium">
                    {doc.subject || "New document"}
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
