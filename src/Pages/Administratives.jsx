import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaFileUpload,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import SignaturePad from "../components/Signature_Pad";
import api, { API_BASE_URL } from "../api/axios";
import { startSignature } from "../Components/TopazService";
import { useModalClose } from "../components/Clickouside";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import useTableSort from "../components/useTableSort";
import SortableHeader from "../components/SortableHeader";
const ENDPOINT = "/Administrative";

const emptyForm = {
  name: "",
  office: "",
  signature: null,
  backgroundColor: "",
  createdBy: null,
};

export default function Administrative() {
  const [administratives, setAdministratives] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    administrative: null,
  });

  const [deleting, setDeleting] = useState(false);

  const BACKEND_URL = "https://id-management-api.runasp.net";

const getImageUrl = (path) => {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:image") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
};

  //data loading
  const loadAdministratives = async () => {
    try {
      const res = await api.get(ENDPOINT);
      setAdministratives(res.data || []);
    } catch (err) {
      console.error("Failed to fetch administratives:", err);
    }
  };

  useEffect(() => {
    loadAdministratives();
  }, []);

  useEffect(() => {
    return () => {
      if (signaturePreviewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(signaturePreviewUrl);
    };
  }, [signaturePreviewUrl]);

  const searchedAdministratives = useMemo(() => {
    const q = search.toLowerCase();

    return administratives.filter((a) => {
      return (
        (a.name || "").toLowerCase().includes(q) ||
        (a.office || "").toLowerCase().includes(q) ||
        (a.createdByName || "").toLowerCase().includes(q)
      );
    });
  }, [administratives, search]);

  const {
    sortedData: filteredAdministratives,
    sortConfig,
    handleSort,
  } = useTableSort(searchedAdministratives);
  const captureTopazSignature = () => {
    startSignature((result) => {
      if (!result.isSigned) {
        alert(result.errorMsg);
        return;
      }
      const dataUrl = `data:image/png;base64,${result.imageData}`;
      const file = dataURLtoFile(dataUrl, "signature.png");
      setForm((prev) => ({
        ...prev,
        signature: file,
        backgroundColor: "",
      }));
      setSignaturePreviewUrl(dataUrl);
    });
  };

  //modal open/close
  const resetModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setSignaturePreviewUrl("");
    setForm({ ...emptyForm, createdBy: user?.id || 1 });
  };

  const openCreateModal = () => {
    resetModal();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);

    setForm({
      name: item.name ?? "",
      office: item.office ?? "",
      signature: null,
      backgroundColor: "",
      createdBy: item.createdBy || user?.id || 1,
    });

    setSignaturePreviewUrl(
      item.signatureImage_AD ? getImageUrl(item.signatureImage_AD) : "",
    );

    setShowModal(true);
  };

  const openViewModal = (item) => setViewItem(item);
  const closeViewModal = () => setViewItem(null);
  const { overlayProps: createOverlayProps, contentProps: createContentProps } =
    useModalClose(() => {
      if (!isSignatureModalOpen) resetModal();
    });

  const { overlayProps: viewOverlayProps, contentProps: viewContentProps } =
    useModalClose(closeViewModal);

  //file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, signature: file }));
    setSignaturePreviewUrl(url);
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  //background color sampling / removal
  const handleSignaturePreviewClick = async (e) => {
    if (!signaturePreviewUrl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = signaturePreviewUrl;

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const rect = e.target.getBoundingClientRect();
      const scaleX = canvas.width / e.target.clientWidth;
      const scaleY = canvas.height / e.target.clientHeight;
      const x = Math.max(
        0,
        Math.min(
          canvas.width - 1,
          Math.floor((e.clientX - rect.left) * scaleX),
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          canvas.height - 1,
          Math.floor((e.clientY - rect.top) * scaleY),
        ),
      );

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;

      setForm((prev) => ({ ...prev, backgroundColor: hex }));

      // If editing an existing record and no new signature file was chosen,
      // reprocess the existing signature on the server right away.
      if (editingItem && !form.signature) {
        try {
          await api.post(
            `${ENDPOINT}/${editingItem.administrativeID}/reprocess`,
            {
              backgroundColor: hex,
            },
          );
          await loadAdministratives();
          setSignaturePreviewUrl(
            `${getImageUrl(editingItem.signatureImage_AD)}?t=${Date.now()}`,
          );
        } catch (err) {
          console.error("Reprocess failed", err);
          alert("Background removal failed. Try again.");
        }
      }
    };
  };

  //remove signature
  const removeSignature = async () => {
    if (editingItem?.administrativeID) {
      try {
        await api.delete(`${ENDPOINT}/${editingItem.administrativeID}/image`);
        await loadAdministratives();
      } catch (err) {
        console.error("Failed to remove signature", err);
      }
    }
    setForm((prev) => ({ ...prev, signature: null, backgroundColor: "" }));
    setSignaturePreviewUrl("");
  };

  //save / delete
  const handleSave = async () => {
    setIsSaving(true);
    const name = form.name.trim().toUpperCase();
    const office = form.office.trim();

    try {
      const formData = new FormData();
      formData.append("Name", name);
      formData.append("Office", office);
      formData.append("CreatedBy", form.createdBy);
      if (form.signature) formData.append("SignatureImage", form.signature);
      if (form.backgroundColor)
        formData.append("BackgroundColor", form.backgroundColor);

      if (editingItem) {
        await api.put(`${ENDPOINT}/${editingItem.administrativeID}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(ENDPOINT, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await loadAdministratives();
      resetModal();
    } catch (err) {
      console.error("Save error", err);
      alert("Unable to save this record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.administrative) return;

    try {
      setDeleting(true);

      await api.delete(
        `${ENDPOINT}/${deleteModal.administrative.administrativeID}`,
      );

      await loadAdministratives();

      setDeleteModal({
        open: false,
        administrative: null,
      });
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 bg-[#F5FFF5] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Administratives</h1>
          <p className="text-gray-600">Manage administrative signatories</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#2E7D32] hover:bg-green-700 text-white px-5 py-3 rounded-lg flex items-center gap-2"
        >
          <FaPlus />
          Add Administrative
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-end">
        <div className="relative w-80">
          <FaSearch className="absolute left-4 top-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or office..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#76d47b] text-white">
            <tr>
              <SortableHeader
                label="ID"
                sortKey="administrativeID"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Name"
                sortKey="name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Office"
                sortKey="office"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <th className="px-4 py-3 text-center">Signature</th>

              <SortableHeader
                label="Creator"
                sortKey="createdByName"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdministratives.map((item) => (
              <tr key={item.administrativeID} className="px-4 py-3 text-center">
                <td className="p-4">{item.administrativeID}</td>
                <td className="px-4 py-3 text-center">
                  {(item.name ?? "").toUpperCase()}
                </td>

                <td className="px-4 py-3 text-center">{item.office ?? ""}</td>
                <td className="text-center">
                  {item.signatureImage_AD ? (
                    <img
                      src={getImageUrl(item.signatureImage_AD)}
                      alt="signature"
                      className="w-14 h-10 object-contain border border-gray-200 bg-white rounded mx-auto"
                    />
                  ) : (
                    <div className="flex justify-center">
                      <span>—</span>
                    </div>
                  )}
                </td>
                <td className="text-center">{item.createdByName ?? "—"}</td>
                <td>
                  <div className="flex gap-3 mx-auto w-max">
                    <button
                      onClick={() => openViewModal(item)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteModal({
                          open: true,
                          administrative: item,
                        })
                      }
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAdministratives.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No administratives found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          {...createOverlayProps}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-650px max-h-[92vh] overflow-y-auto p-6"
            {...createContentProps}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-green-800">
                {editingItem ? "Edit" : "Add"} Administrative
              </h2>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Office"
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                className="w-full border p-2 rounded"
              />
            </div>

            {/* Signature section */}
            <div className="mt-6 border-t pt-5">
              <h3 className="font-semibold text-green-800 mb-3">Signature</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-green-400 rounded-lg cursor-pointer hover:bg-green-50 transition
                    ${signaturePreviewUrl ? "p-2" : "p-6"}`}
                  >
                    <FaFileUpload className="text-2xl text-green-700" />
                    <span className="text-sm text-gray-600">
                      {signaturePreviewUrl
                        ? "Change upload"
                        : "Upload a signature image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {signaturePreviewUrl && (
                    <div className="mt-3 rounded-lg border p-3 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-2">
                        Click on the preview to sample the background color to
                        remove
                      </p>

                      {/* Flex row: preview + color picker */}
                      <div className="flex items-start gap-4">
                        {/* Preview */}
                        <div className="flex-1">
                          <div className="mx-auto flex h-28 w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                            <img
                              src={signaturePreviewUrl}
                              alt="signature preview"
                              className="h-full w-full object-contain bg-white cursor-crosshair"
                              onClick={handleSignaturePreviewClick}
                            />
                          </div>
                        </div>

                        {/* Color Picker on the right */}
                        <div className="flex flex-col items-center">
                          <input
                            type="color"
                            value={form.backgroundColor || "#ffffff"}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                backgroundColor: e.target.value,
                              })
                            }
                            className="w-12 h-12 cursor-pointer"
                          />
                          <span className="mt-2 text-xs text-gray-500 text-center">
                            Pick Color <br />
                            to remove
                          </span>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={removeSignature}
                        className="mt-3 w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-800 text-sm border rounded-lg py-2"
                      >
                        <FaTrash size={12} /> Remove signature
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    Don't have a scanned signature? Draw one instead.
                  </p>
                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded"
                  >
                    Write Signature
                  </button>
                </div>
              </div>
            </div>

            {/* draw-signature sub-modal */}
            {isSignatureModalOpen && (
              <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-60">
                <div
                  className="bg-white p-6 rounded-lg shadow-lg"
                  style={{ width: "min(92vw, 900px)" }}
                >
                  <h2 className="text-lg font-bold mb-4">
                    Draw Your Signature
                  </h2>
                  <SignaturePad
                    onSave={(dataUrl) => {
                      const file = dataURLtoFile(dataUrl, "signature.png");
                      setForm((prev) => ({
                        ...prev,
                        signature: file,
                        backgroundColor: "",
                      }));
                      setSignaturePreviewUrl(dataUrl);
                      setIsSignatureModalOpen(false);
                    }}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setIsSignatureModalOpen(false)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetModal} className="px-5 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-green-700 text-white rounded disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View-only modal */}
      {viewItem && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          {...viewOverlayProps}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-550px max-h-92vh overflow-y-auto p-6"
            {...viewContentProps}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-green-800">
                Administrative Details
              </h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <Field label="Name" value={(viewItem.name ?? "").toUpperCase()} />

              <Field label="Office" value={viewItem.office ?? ""} />
              <Field label="Created By" value={viewItem.createdByName} />
            </div>

            <div className="mt-6 border-t pt-5">
              <h3 className="font-semibold text-green-800 mb-3">Signature</h3>
              {viewItem.signatureImage_AD ? (
                <img
                  src={getImageUrl(viewItem.signatureImage_AD)}
                  alt="signature"
                  className="h-28 object-contain border rounded bg-white p-2"
                />
              ) : (
                <span className="text-gray-400">No signature on file</span>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeViewModal}
                className="px-5 py-2 border rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDeleteModal
        open={deleteModal.open}
        loading={deleting}
        title="Delete Administrative"
        message="You are about to permanently remove this administrative signatory from the system."
        itemName={deleteModal.administrative?.name || ""}
        confirmText="Delete Administrative"
        onCancel={() =>
          setDeleteModal({
            open: false,
            administrative: null,
          })
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex text-sm">
      <span className="w-48 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-800">{value || "—"}</span>
    </div>
  );
}
