import { FaTrashAlt, FaTimes } from "react-icons/fa";
import { useModalClose } from "./Clickouside";

export default function ConfirmDeleteModal({
  open,
  title = "Delete Record",
  message = "Are you sure you want to delete this item?",
  itemName = "",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { overlayProps, contentProps } = useModalClose(() => {
    if (!loading) onCancel();
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex justify-center items-center z-999"
      {...overlayProps}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-450px max-w-[95vw] overflow-hidden"
        {...contentProps}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-green-700 to-green-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaTrashAlt size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-green-100 text-sm">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="mt-4 border border-green-100 bg-green-50 rounded-lg p-4">
              <span className="text-sm text-gray-500">
                Selected Item
              </span>

              <h3 className="font-semibold text-green-800 text-lg mt-1">
                {itemName}
              </h3>
            </div>
          )}

        </div>

        {/* Footer */}

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">

          <button
            disabled={loading}
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            {cancelText}
          </button>

          <button
            disabled={loading}
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white transition flex items-center gap-2"
          >
            <FaTrashAlt />

            {loading ? "Deleting..." : confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}