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
import api, { API_BASE_URL } from "../api/axios";
import useDragAndDrop from "../components/useDragAndDrop";
import { useModalClose } from "../components/Clickouside";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import useTableSort from "../components/useTableSort";
import SortableHeader from "../components/SortableHeader";
const TEMPLATE_PATH = "/Template";

const emptyForm = {
  name: "",
  office: [""],
  section: [""],
  frontBackground: null,
  frontFooter: null,
  backBackground: null,
  createdBy: null,
};
const IMAGE_FIELDS = [
  {
    key: "frontBackground",
    apiField: "FrontID_background_image",
    formKey: "FrontBackground",
    deleteType: "frontbackground",
    label: "Front ID Background",
  },
  {
    key: "frontFooter",
    apiField: "FrontID_Footer_image",
    formKey: "FrontFooter",
    deleteType: "frontfooter",
    label: "Front ID Footer",
  },
  {
    key: "backBackground",
    apiField: "BackID_background",
    formKey: "BackBackground",
    deleteType: "backbackground",
    label: "Back ID Background",
  },
];

export default function Template() {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [previewUrls, setPreviewUrls] = useState({
    frontBackground: "",
    frontFooter: "",
    backBackground: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    template: null,
  });

  const [deleting, setDeleting] = useState(false);
  // One preview URL per image slot, keyed by IMAGE_FIELDS[].key
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  // dynamic textbox list handlers (shared by Office and Section)
  const handleListItemChange = (type, index, value) => {
    setForm((prev) => {
      const updated = [...prev[type]];
      updated[index] = value;
      return { ...prev, [type]: updated };
    });
  };

  const addListItem = (type) => {
    setForm((prev) => ({ ...prev, [type]: [...prev[type], ""] }));
  };

  const removeListItem = (type, index) => {
    setForm((prev) => {
      const updated = prev[type].filter((_, i) => i !== index);
      return { ...prev, [type]: updated.length ? updated : [""] };
    });
  };

  // --- moved here, inside the component ---
  const makeImageDropHandler = (key) => (file) => {
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [key]: file }));
    setPreviewUrls((prev) => ({ ...prev, [key]: url }));
  };

  const frontBackgroundDrag = useDragAndDrop({
    onFile: makeImageDropHandler("frontBackground"),
  });
  const frontFooterDrag = useDragAndDrop({
    onFile: makeImageDropHandler("frontFooter"),
  });
  const backBackgroundDrag = useDragAndDrop({
    onFile: makeImageDropHandler("backBackground"),
  });
  const dragHandlersByKey = {
    frontBackground: frontBackgroundDrag,
    frontFooter: frontFooterDrag,
    backBackground: backBackgroundDrag,
  };
  // --- end moved block ---

  const getImageUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `${API_BASE_URL}/${path.replace(/^\//, "")}`;
  };

  //data loading
  const loadTemplates = async () => {
    try {
      const res = await api.get(TEMPLATE_PATH);
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const searchedTemplates = useMemo(() => {
    const q = search.toLowerCase();

    return templates.filter((t) => {
      return (
        (t.name || "").toLowerCase().includes(q) ||
        (t.createdByName || "").toLowerCase().includes(q)
      );
    });
  }, [templates, search]);

  const {
    sortedData: filteredTemplates,
    sortConfig,
    handleSort,
  } = useTableSort(searchedTemplates);

  //modal open/close
  const resetModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setPreviewUrls({
      frontBackground: "",
      frontFooter: "",
      backBackground: "",
    });
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
      office: item.office?.length ? item.office : [""],
      section: item.section?.length ? item.section : [""],
      frontBackground: null,
      frontFooter: null,
      backBackground: null,
      createdBy: item.createdBy || user?.id || 1,
    });

    setPreviewUrls({
      frontBackground: item.frontID_background_image
        ? getImageUrl(item.frontID_background_image)
        : "",
      frontFooter: item.frontID_Footer_image
        ? getImageUrl(item.frontID_Footer_image)
        : "",
      backBackground: item.backID_background
        ? getImageUrl(item.backID_background)
        : "",
    });

    setShowModal(true);
  };

  const openViewModal = (item) => setViewItem(item);
  const closeViewModal = () => setViewItem(null);

  const { overlayProps: createOverlayProps, contentProps: createContentProps } =
    useModalClose(resetModal);

  const { overlayProps: viewOverlayProps, contentProps: viewContentProps } =
    useModalClose(closeViewModal);

  //file selection (shared handler for all three slots)
  const handleFileChange = (key) => (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [key]: file }));
    setPreviewUrls((prev) => ({ ...prev, [key]: url }));
  };

  //remove one image slot
  const removeImage = async (field) => {
    if (editingItem?.templateID) {
      try {
        await api.delete(
          `${TEMPLATE_PATH}/${editingItem.templateID}/image/${field.deleteType}`,
        );
        await loadTemplates();
      } catch (err) {
        console.error(`Failed to remove ${field.label}`, err);
      }
    }
    setForm((prev) => ({ ...prev, [field.key]: null }));
    setPreviewUrls((prev) => ({ ...prev, [field.key]: "" }));
  };

  //save / delete
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("Name", form.name.trim());
      formData.append("CreatedBy", form.createdBy);

      form.office
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((v) => formData.append("Office", v));

      form.section
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((v) => formData.append("Section", v));

      IMAGE_FIELDS.forEach((field) => {
        if (form[field.key]) {
          formData.append(field.formKey, form[field.key]);
        }
      });

      if (editingItem) {
        await api.put(`${TEMPLATE_PATH}/${editingItem.templateID}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(TEMPLATE_PATH, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await loadTemplates();
      resetModal();
    } catch (err) {
      console.error("Save error", err);
      alert("Unable to save this record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.template) return;

    try {
      setDeleting(true);

      await api.delete(`${TEMPLATE_PATH}/${deleteModal.template.templateID}`);

      await loadTemplates();

      setDeleteModal({
        open: false,
        template: null,
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
          <h1 className="text-3xl font-bold text-green-800">Templates</h1>
          <p className="text-gray-600">Manage ID card templates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#2E7D32] hover:bg-green-700 text-white px-5 py-3 rounded-lg flex items-center gap-2"
        >
          <FaPlus />
          Add Template
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-end">
        <div className="relative w-80">
          <FaSearch className="absolute left-4 top-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
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
                sortKey="templateID"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <SortableHeader
                label="Name"
                sortKey="name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <th className="text-center py-3">Front Background</th>

              <th className="text-center py-3">Front Footer</th>

              <th className="text-center py-3">Back Background</th>

              <SortableHeader
                label="Creator"
                sortKey="createdByName"
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              <th className="text-center py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((item) => (
              <tr key={item.templateID} className="border-b hover:bg-green-50">
                <td className="p-4 text-center">{item.templateID}</td>
                <td className="pl-2 text-center">{item.name}</td>
                <td>
                  {item.frontID_background_image ? (
                    <img
                      src={getImageUrl(item.frontID_background_image)}
                      alt="front background"
                      className="w-14 h-10 object-contain border border-gray-200 bg-white rounded mx-auto"
                    />
                  ) : (
                    <div className="flex justify-center">
                      <span>—</span>
                    </div>
                  )}
                </td>
                <td>
                  {item.frontID_Footer_image ? (
                    <img
                      src={getImageUrl(item.frontID_Footer_image)}
                      alt="front footer"
                      className="w-14 h-10 object-contain border border-gray-200 bg-white rounded mx-auto"
                    />
                  ) : (
                    <div className="flex justify-center">
                      <span>—</span>
                    </div>
                  )}
                </td>
                <td>
                  {item.backID_background ? (
                    <img
                      src={getImageUrl(item.backID_background)}
                      alt="back background"
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
                          template: item,
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
            {filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No templates found.
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
            className="bg-white rounded-xl shadow-lg w-750px max-h-[92vh] overflow-y-auto p-6"
            {...createContentProps}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-green-800">
                {editingItem ? "Edit" : "Add"} Template
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
                placeholder="Template Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded"
              />
            </div>

            {/* Office list */}
            <div className="mt-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Office</p>
              {form.office.map((value, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`Office ${index + 1}`}
                    value={value}
                    onChange={(e) =>
                      handleListItemChange("office", index, e.target.value)
                    }
                    className="flex-1 border p-2 rounded"
                  />
                  {index === form.office.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => addListItem("office")}
                      title="Add another office"
                      className="bg-[#2E7D32] hover:bg-green-700 text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0"
                    >
                      <FaPlus size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeListItem("office", index)}
                      title="Remove"
                      className="text-red-500 hover:text-red-700 w-9 h-9 flex items-center justify-center shrink-0"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Section list */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Section</p>
              {form.section.map((value, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`Section ${index + 1}`}
                    value={value}
                    onChange={(e) =>
                      handleListItemChange("section", index, e.target.value)
                    }
                    className="flex-1 border p-2 rounded"
                  />
                  {index === form.section.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => addListItem("section")}
                      title="Add another section"
                      className="bg-[#2E7D32] hover:bg-green-700 text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0"
                    >
                      <FaPlus size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeListItem("section", index)}
                      title="Remove"
                      className="text-red-500 hover:text-red-700 w-9 h-9 flex items-center justify-center shrink-0"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Three image sections */}
            <div className="mt-6 border-t pt-5">
              <h3 className="font-semibold text-green-800 mb-3">
                Template Images
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {IMAGE_FIELDS.map((field) => {
                  const drag = dragHandlersByKey[field.key];
                  return (
                    <div key={field.key}>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </p>
                      <label
                        onDrop={drag.handleDrop}
                        onDragOver={drag.handleDragOver}
                        onDragLeave={drag.handleDragLeave}
                        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg cursor-pointer transition
        ${
          drag.isDragging
            ? "border-green-600 bg-green-100 scale-[1.02]"
            : "border-green-400 hover:bg-green-50"
        }
        ${previewUrls[field.key] ? "p-2" : "p-6"}`}
                      >
                        <FaFileUpload className="text-xl text-green-700" />
                        <span className="text-xs text-gray-600 text-center">
                          {previewUrls[field.key]
                            ? "Change image"
                            : drag.isDragging
                              ? "Drop image here"
                              : "Upload or drag image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange(field.key)}
                        />
                      </label>

                      {previewUrls[field.key] && (
                        <div className="mt-2 rounded-lg border p-2 bg-gray-50">
                          <div className="mx-auto flex h-20 w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                            <img
                              src={previewUrls[field.key]}
                              alt={field.label}
                              className="h-full w-full object-contain bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(field)}
                            className="mt-2 w-full flex items-center justify-center gap-1 text-red-600 hover:text-red-800 text-xs border rounded py-1.5"
                          >
                            <FaTrash size={10} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
            className="bg-white rounded-xl shadow-lg w-650px max-h-[92vh] overflow-y-auto p-6"
            {...viewContentProps}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-green-800">
                Template Details
              </h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <Field label="Name" value={viewItem.name} />
              <Field label="Office" value={viewItem.office?.join(", ")} />
              <Field label="Section" value={viewItem.section?.join(", ")} />
              <Field label="Created By" value={viewItem.createdByName} />
            </div>

            <div className="mt-6 border-t pt-5">
              <h3 className="font-semibold text-green-800 mb-3">
                Template Images
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {IMAGE_FIELDS.map((field) => (
                  <div key={field.key}>
                    <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                    {viewItem[
                      field.apiField.charAt(0).toLowerCase() +
                        field.apiField.slice(1)
                    ] ? (
                      <img
                        src={getImageUrl(
                          viewItem[
                            field.apiField.charAt(0).toLowerCase() +
                              field.apiField.slice(1)
                          ],
                        )}
                        alt={field.label}
                        className="h-20 w-full object-contain border rounded bg-white p-1"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </div>
                ))}
              </div>
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
        title="Delete Template"
        message="You are about to permanently remove this template from the system."
        itemName={deleteModal.template?.name}
        confirmText="Delete Template"
        onCancel={() =>
          setDeleteModal({
            open: false,
            template: null,
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
