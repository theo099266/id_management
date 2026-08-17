import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import Pop_up_view from "./Pop_up_view";
import api, { API_BASE_URL } from "../api/axios";
import { startSignature } from "../Components/TopazService";
import useDragAndDrop from "../components/useDragAndDrop";
import { useModalClose } from "../components/Clickouside";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DatePicker from "../components/DatePicker";
import { removeBackground } from "@imgly/background-removal";
const ENDPOINT = "/ProjectOfficers";

const BLOOD_TYPES = [
  "A",
  "A+",
  "A-",
  "B",
  "B+",
  "B-",
  "AB",
  "AB+",
  "AB-",
  "O",
  "O+",
  "O-",
  "N/A",
];

const emptyForm = {
  name: "",
  office: "",
  employeeIdNo: "",
  address: "",
  contactNum: "",
  dateOfBirth: "",
  issueDate: "",
  section: "",
  expirationDate: "",
  bloodType: "",
  emergencyConName: "",
  emergencyCon: "",
  validatedBy: "",
  templateId: "",
  image: null,
  signature: null,
  backgroundColor: "",
  removeImageBackground: false,
   removeImage: false,
  createdBy: null,
};

export default function ProjectOfficers() {
  const [officers, setOfficers] = useState([]);
  const [officeType, setOfficeType] = useState(
    () => sessionStorage.getItem("officeTypeFilter") || "",
  );
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [search, setSearch] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [administratives, setAdministratives] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isRenaming, setIsRenaming] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSignatureDropFile = useCallback(
    (file) => {
      if (signaturePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreviewUrl);
      }

      const url = URL.createObjectURL(file);

      setForm((prev) => ({
        ...prev,
        signature: file,
      }));

      setSignaturePreviewUrl(url);
    },
    [signaturePreviewUrl],
  );
  const {
    isDragging: isDraggingSignature,
    handleDragOver: handleSignatureDragOver,
    handleDragLeave: handleSignatureDragLeave,
    handleDrop: handleSignatureDrop,
  } = useDragAndDrop({
    onFile: handleSignatureDropFile,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    officer: null,
  });

  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(emptyForm);

  //new  userofficetype be back on track if u want to have create acct
  const user = JSON.parse(localStorage.getItem("user") || "null");
  //const userOfficeType = user?.officeType?.trim() || "";
  const [isLoading, setIsLoading] = useState(true);

  const loadOfficers = async () => {
    try {
      const res = await api.get(ENDPOINT);
      setOfficers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch project officers:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRemoveBackgroundClick = async () => {
  setIsRemovingBg(true);
  try {
    // Use the freshly-selected file if there is one, otherwise
    // grab whatever image is currently shown (e.g. existing server image)
    const source = form.image || imagePreviewUrl;
    if (!source) return;

    const resultBlob = await removeBackground(source);
    const file = new File([resultBlob], "photo.png", { type: "image/png" });

    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const newUrl = URL.createObjectURL(resultBlob);
    setForm((prev) => ({ ...prev, image: file }));
    setImagePreviewUrl(newUrl);
  } catch (err) {
    console.error("Background removal failed", err);
    alert("Couldn't remove the background. Try again.");
  } finally {
    setIsRemovingBg(false);
  }
};

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

  const loadAdministratives = async () => {
    try {
      const res = await api.get("/Administrative");
      setAdministratives(res.data);
    } catch (err) {
      console.error("Failed to load administratives", err);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get("/Template");
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };
  useEffect(() => {
    sessionStorage.setItem("officeTypeFilter", officeType);
  }, [officeType]);

  useEffect(() => {
    loadOfficers();
    loadAdministratives();
    loadTemplates();
  }, []);
  const cycleOfficeType = () => {
    const options = ["", ...templates.map((t) => t.name)];
    const currentIndex = options.indexOf(officeType);
    const nextIndex = (currentIndex + 1) % options.length;
    setOfficeType(options[nextIndex]);
  };

  const filteredOfficers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = officers.filter((o) => {
      const matchesSearch =
        !q ||
        (o.name || "").toLowerCase().includes(q) ||
        (o.office || "").toLowerCase().includes(q) ||
        (o.employee_Id_NO || o.employeeIdNo || "").toLowerCase().includes(q);

      const matchesOfficeType =
        !officeType ||
        (o.templateName || "").trim().toLowerCase() ===
          officeType.trim().toLowerCase();

      return matchesSearch && matchesOfficeType;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (typeof valA === "string") {
          valA = valA.toLowerCase();
        }

        if (typeof valB === "string") {
          valB = valB.toLowerCase();
        }

        if (valA == null) valA = "";
        if (valB == null) valB = "";

        if (valA < valB) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }

        if (valA > valB) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }

        return 0;
      });
    }

    return result;
  }, [officers, search, sortConfig, officeType]);
  const SortableHeader = ({ label, sortKey }) => (
    <th
      className="text-center cursor-pointer select-none hover:bg-green-600 transition px-2 py-3"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1">
        <span className="leading-tight">{label}</span>
        <span className="inline-block w-2.5 text-xs shrink-0">
          {sortConfig.key === sortKey
            ? sortConfig.direction === "asc"
              ? "▲"
              : "▼"
            : ""}
        </span>
      </div>
    </th>
  );

  const resetModal = () => {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    if (signaturePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }

    setShowModal(false);
    setEditingItem(null);
    setImagePreviewUrl("");
    setSignaturePreviewUrl("");
    setErrors({});
    setForm({
      ...emptyForm,
      createdBy: user?.id || 1,
    });
  };
  const { overlayProps, contentProps } = useModalClose(resetModal);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  /*const openCreateModal = () => {
    setErrors({});
    setShowModal(true);
    const matchedTemplate = templates.find((t) => t.name === officeType);
    setForm({
      ...emptyForm,
      templateId: matchedTemplate ? matchedTemplate.templateID : "",
      createdBy: user?.id || 1,
    });
  };*/

  /*const matchedTemplate = templates.find(
    (t) =>
      t.name?.trim().toLowerCase() ===
      userOfficeType.toLowerCase()
  );

  setForm({
    ...emptyForm,
    templateId: matchedTemplate?.templateID || "",
    createdBy: user?.id || 1,
  });*/

  const openCreateModal = () => {
    setErrors({});
    setShowModal(true);

    // ADMINISTRATOR:
    // Prefill from whatever office type filter is currently selected (if any),
    // otherwise leave blank for manual selection.
    if (user?.role === "Administrator") {
      const matchedTemplate = templates.find(
        (t) =>
          t.name?.trim().toLowerCase() === officeType?.trim().toLowerCase(),
      );

      setForm({
        ...emptyForm,
        templateId: matchedTemplate?.templateID || "",
        createdBy: user?.id || 1,
      });
      return;
    }

    // EMPLOYEE:
    // templateId now comes straight from login (numeric), no name matching needed.
    setForm({
      ...emptyForm,
      templateId: user?.templateId || "",
      createdBy: user?.id || 1,
    });
  };
  /*const matchedTemplate = templates.find(
    (t) =>
      t.name?.trim().toLowerCase() ===
      userOfficeType.toLowerCase()
  );

  setForm({
    ...emptyForm,
    templateId: matchedTemplate?.templateID || "",
    createdBy: user?.id || 1,
  });*/

  const openEditModal = (item) => {
    setErrors({});
    setEditingItem(item);
    const officeLines = (item.office || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const matchedTemplate = templates.find(
      (t) => String(t.templateID) === String(item.templateID),
    );
    const validOffices = matchedTemplate?.office || [];
    const validSections = matchedTemplate?.section || [];

    // Check each line against the template's real arrays — no keyword guessing
    const office =
      officeLines.find((line) => validOffices.includes(line)) || "";
    const section =
      officeLines.find((line) => validSections.includes(line)) || "";
    setForm({
      name: item.name || "",
      section,
      office,
      employeeIdNo: item.employee_Id_NO || "",
      address: item.address || "",
      contactNum: formatPhoneForDisplay(item.contact_Num || ""),
      dateOfBirth: item.date_of_Birth || "",
      issueDate: item.issueDate || "",
      expirationDate: item.expiration_date || "",
      bloodType: item.blood_Type || "",
      emergencyConName: (item.emergency_Con_Name || "").toUpperCase(),
      emergencyCon: formatPhoneForDisplay(item.emergency_Con || ""),
      validatedBy: item.validated_by || "",
      templateId: item.templateID || "",
      image: null,
      signature: null,
      backgroundColor: "",
      removeSignatureImage: false,
      createdBy: item.createdBy || user?.id || 1,
    });
    setImagePreviewUrl(item.imagePath ? getImageUrl(item.imagePath) : "");
    setSignaturePreviewUrl(
      item.signaturepath ? getImageUrl(item.signaturepath) : "",
    );
    setShowModal(true);
  };
  const capitalizeWords = (text = "") => {
    return text.replace(/\S+/gu, (word) => {
      const chars = Array.from(word);

      if (chars.length === 0) return word;

      return (
        chars[0].toLocaleUpperCase("en-US") +
        chars.slice(1).join("").toLocaleLowerCase("en-US")
      );
    });
  };

  const formatPhoneForDisplay = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    if (!digits) return "";
    const withoutCountryCode = digits.startsWith("63")
      ? digits.slice(2)
      : digits;
    return withoutCountryCode.replace(/^0+/, "");
  };

  const combinedOffice = [form.section, form.office].filter(Boolean).join("\n");

  const formatPhoneForSave = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    if (!digits) return "";
    const cleanDigits = digits.startsWith("63") ? digits.slice(2) : digits;
    const trimmed = cleanDigits.replace(/^0+/, "");
    return `0${trimmed}`;
  };

  const isValidPhilippineMobile = (value) => {
    const digits = formatPhoneForDisplay(value);
    return /^\d{10}$/.test(digits);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Full name is required.";
    if (!form.employeeIdNo.trim())
      newErrors.employeeIdNo = "Employee ID is required.";
    if (!form.address.trim()) newErrors.address = "Address is required.";
    if (!form.contactNum.trim()) {
      newErrors.contactNum = "Contact number is required.";
    } else if (!isValidPhilippineMobile(form.contactNum)) {
      newErrors.contactNum =
        "Contact number must be 11 digits starting with 0.";
    }
    if (!form.bloodType) newErrors.bloodType = "Please select a blood type.";
    if (!form.templateId)
      newErrors.templateId = "Please select an office type.";

    if (!form.emergencyConName.trim())
      newErrors.emergencyConName = "Emergency contact name is required.";

    if (!form.emergencyCon.trim()) {
      newErrors.emergencyCon = "Emergency contact number is required.";
    } else if (!isValidPhilippineMobile(form.emergencyCon)) {
      newErrors.emergencyCon =
        "Emergency contact number must be 11 digits starting with 0.";
    }

    if (!form.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required.";
    if (!form.issueDate) newErrors.issueDate = "Issue date is required.";
    if (!form.expirationDate)
      newErrors.expirationDate = "Expiration date is required.";
    if (!form.validatedBy) newErrors.validatedBy = "Please select a validator.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openViewModal = (item) => setViewItem(item);
  const closeViewModal = () => setViewItem(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") {
      handleImageFile(file);
    } else {
      const url = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, signature: file }));
      setSignaturePreviewUrl(url);
    }
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const url = URL.createObjectURL(file);
     setForm((prev) => ({ ...prev, image: file, removeImage: false }));
    setImagePreviewUrl(url);
  };

  const {
    isDragging: isDraggingImage,
    handleDragOver: handleImageDragOver,
    handleDragLeave: handleImageDragLeave,
    handleDrop: handleImageDrop,
  } = useDragAndDrop({ onFile: handleImageFile });

  const handlePhoneInput = (field, value) => {
    const displayValue = formatPhoneForDisplay(value);
    setForm((prev) => ({ ...prev, [field]: displayValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

      if (editingItem && !form.signature) {
        try {
          await api.post(`${ENDPOINT}/${editingItem.id}/reprocess`, {
            backgroundColor: hex,
          });
          await loadOfficers();
          setSignaturePreviewUrl(
            `${getImageUrl(editingItem.signaturepath)}?t=${Date.now()}`,
          );
        } catch (err) {
          console.error("Reprocess failed", err);
          alert("Background removal failed. Try again.");
        }
      }
    };
  };
  const handleRenameAllImages = async () => {
  if (isRenaming) return;

  const confirmed = window.confirm(
    "This will rename ALL profile and signature images on the server. Continue?"
  );
  if (!confirmed) return;

  setIsRenaming(true);
  try {
    const res = await api.post(`${ENDPOINT}/rename-all-images`);
    console.log("Rename result:", res.data);
    alert(
      `Done!\nProfiles renamed: ${res.data.profilesRenamed}\nSignatures renamed: ${res.data.signaturesRenamed}\nTotal officers: ${res.data.totalOfficers}`
    );
    await loadOfficers();
  } catch (err) {
    console.error("Failed to rename images:", err);
    console.error("Status:", err.response?.status);
    console.error("Response:", err.response?.data);
    alert("Failed to rename images. Check console for details.");
  } finally {
    setIsRenaming(false);
  }
};


const handleExportZip = async () => {
  if (isExporting) return;

  setIsExporting(true);
  try {
    const res = await api.get(`${ENDPOINT}/export-zip`, {
      responseType: "blob",
    });

    // Try to pull the filename the backend set, otherwise fall back
    const disposition = res.headers["content-disposition"];
    let filename = `Project_Officers_${Date.now()}.zip`;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to export zip:", err);
    console.error("Status:", err.response?.status);
    console.error("Response:", err.response?.data);
    alert("Failed to export data. Check console for details.");
  } finally {
    setIsExporting(false);
  }
};

  const removeImage = async () => {
  if (!editingItem?.id) {
    console.warn("[removeImage] No editingItem.id — aborting");
    return;
  }

  console.log("[removeImage] Deleting image for id:", editingItem.id);

  try {
    const res = await api.delete(`${ENDPOINT}/${editingItem.id}/image`);
    console.log("[removeImage] Success:", res.status);

    setForm((prev) => ({
      ...prev,
      image: null,
    }));

    setImagePreviewUrl("");

    await loadOfficers();
  } catch (err) {
    console.error("Failed to remove image:", err);
    console.error("Status:", err.response?.status);
    console.error("Response:", err.response?.data);
  }
};

  const removeSignature = async () => {
    if (editingItem?.id) {
      try {
        await api.delete(`${ENDPOINT}/${editingItem.id}/signature`);
        await loadOfficers();
      } catch (err) {
        console.error("Failed to remove signature", err);
      }
    }
    setForm((prev) => ({ ...prev, signature: null, backgroundColor: "" }));
    setSignaturePreviewUrl("");
  };

  const performSave = async () => {
    let savedId;
    const formData = new FormData();
    formData.append("Name", form.name);
    const combinedOffice = [form.section, form.office]
      .filter(Boolean)
      .join("\n");

    formData.append("Office", combinedOffice);
    formData.append("Employee_Id_NO", form.employeeIdNo);
    formData.append("Address", form.address);
    formData.append("Contact_Num", formatPhoneForSave(form.contactNum));
    if (form.dateOfBirth) formData.append("Date_of_Birth", form.dateOfBirth);
    if (form.issueDate) formData.append("IssueDate", form.issueDate);
    if (form.expirationDate)
      formData.append("Expiration_date", form.expirationDate);
    formData.append("Blood_Type", form.bloodType);
    formData.append("Emergency_Con_Name", form.emergencyConName);
    formData.append("Emergency_Con", formatPhoneForSave(form.emergencyCon));
    formData.append("CreatedBy", form.createdBy);
    if (form.validatedBy) formData.append("Validated_by", form.validatedBy);
    if (form.templateId) formData.append("TemplateID", form.templateId);
    if (form.image) formData.append("Image", form.image);
    if (form.removeImage) formData.append("RemoveImage", "true");

    if (form.signature) formData.append("Signature", form.signature);
    if (form.backgroundColor)
      formData.append("BackgroundColor", form.backgroundColor);
    formData.append(
      "RemoveImageBackground",
      form.removeImageBackground ? "true" : "false",
    );

      if (editingItem) {
    await api.put(`${ENDPOINT}/${editingItem.id}`, formData);
    savedId = editingItem.id;
  } else {
    const createRes = await api.post(ENDPOINT, formData);
    savedId = createRes.data?.id ?? createRes.data?.ID;
  }

  const res = await api.get(ENDPOINT);
  const freshOfficers = res.data || [];
  setOfficers(freshOfficers);

  const savedOfficer =
    freshOfficers.find((o) => o.id === savedId) ||
    freshOfficers.find((o) => o.employee_Id_NO === form.employeeIdNo);

  return savedOfficer;
};

  const selectedTemplate = useMemo(
    () =>
      templates.find((t) => String(t.templateID) === String(form.templateId)),
    [templates, form.templateId],
  );

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await performSave();
      resetModal();
    } catch (err) {
      console.error("SAVE ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("SERVER RESPONSE:", err.response?.data);

      alert(
        JSON.stringify(
          err.response?.data || "Unable to save this record.",
          null,
          2,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };
  const handleRemoveImage = () => {
  if (imagePreviewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreviewUrl);
  }

  setForm((prev) => ({
    ...prev,
    image: null,
    removeImage: true,
  }));

  setImagePreviewUrl("");
};

  const handleSaveAndPreview = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const savedOfficer = await performSave();
      resetModal();
      if (savedOfficer) {
        setPreviewItem(savedOfficer);
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Unable to save this record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.officer) return;

    try {
      setDeleting(true);

      await api.delete(`${ENDPOINT}/${deleteModal.officer.id}`);

      await loadOfficers();

      setDeleteModal({
        open: false,
        officer: null,
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
    <h1 className="text-3xl font-bold text-green-800">
      Placeholder
    </h1>
    <p className="text-gray-600">
      Manage employee ID cards and personal information. s
    </p>
  </div>
  <div className="flex gap-3">
    <button
      onClick={handleRenameAllImages}
      disabled={isRenaming}
      className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 disabled:opacity-60"
    >
      {isRenaming ? "Renaming..." : "Rename All Images"}
    </button>
    <button
      onClick={handleExportZip}
      disabled={isExporting}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 disabled:opacity-60"
    >
      {isExporting ? "Exporting..." : "Download All Data"}
    </button>
    <button
      onClick={openCreateModal}
      className="bg-[#2E7D32] hover:bg-green-700 text-white px-5 py-3 rounded-lg flex items-center gap-2"
    >
      <FaPlus />
      Add Officer
    </button>
  </div>
</div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-80">
            <FaSearch className="absolute left-4 top-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search by name, office, employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg py-3 pl-12 pr-4
                        focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Office Type filter: All + one per Template */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={cycleOfficeType}
              className="px-5 py-3 rounded-lg font-medium transition bg-green-700 text-white hover:bg-green-800 min-w-36"
            >
              {officeType || "All"}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#76d47b] text-white">
            <tr>
              <SortableHeader label="ID" sortKey="id" />
              <th className="text-center ">Photo</th>
              <SortableHeader label="Name" sortKey="name" />
              <SortableHeader label="Office" sortKey="office" />
              <SortableHeader label="Employee ID" sortKey="employee_Id_NO" />
              <SortableHeader label="Contact" sortKey="contact_Num" />
              <SortableHeader label="Blood Type" sortKey="blood_Type" />
              <th className="text-center">Signature</th>
              <SortableHeader label="Creator" sortKey="createdByName" />
              <SortableHeader label="Validator" sortKey="validatedByName" />
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-6 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-10 w-10 bg-gray-200 rounded-full mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-27 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-35 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-19 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-15 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-5 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-10 w-14 bg-gray-200 rounded mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-19 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-27 mx-auto text-center" />
                  </td>
                  <td>
                    <div className="h-4 bg-gray-200 rounded w-11 mx-auto text-center" />
                  </td>
                </tr>
              ))
            ) : (
              <>
                {filteredOfficers.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-green-50 ">
                    <td className="p-4 text-center">{item.id}</td>
                    <td>
                      {item.imagePath ? (
                        <img
                          src={getImageUrl(item.imagePath)}
                          alt={item.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 mx-auto"
                        />
                      ) : (
                        <div className="flex justify-center">
                          <span>—</span>
                        </div>
                      )}
                    </td>
                    <td className="pl-2 text-center">{item.name}</td>
                    <td className="text-center employee-office2">
                      {item.office}
                    </td>
                    <td className="text-center">{item.employee_Id_NO}</td>
                    <td className="text-center">{item.contact_Num}</td>
                    <td className="text-center">{item.blood_Type}</td>
                    <td className="text-center">
                      {item.signaturepath ? (
                        <img
                          src={getImageUrl(item.signaturepath)}
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
                    <td className="text-center">
                      {item.validatedByName?.trim() || "—"}
                    </td>
                    <td className="text-center">
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
                              officer: item,
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
                {filteredOfficers.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-gray-400">
                      No project officers found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          {...overlayProps}
        >
          <div
            className="bg-white rounded-xl shadow-lg w-237.5 max-h-[92vh] overflow-y-auto p-6"
            {...contentProps}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-green-800">
                {editingItem ? "Edit" : "Add"} Project Officer
              </h2>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* LEFT: full body photo */}
              <div className="col-span-1">
                <h3 className="font-semibold text-green-800 mb-3">
                  Full Body Photo
                </h3>
                <label
                  onDrop={handleImageDrop}
                  onDragOver={handleImageDragOver}
                  onDragLeave={handleImageDragLeave}
                  className={`
    flex flex-col items-center justify-center gap-2
    rounded-lg cursor-pointer transition-all duration-200
    border-2 border-dashed
    ${
      isDraggingImage
        ? "border-green-600 bg-green-100 scale-[1.02]"
        : "border-green-400 hover:bg-green-50"
    }
    ${imagePreviewUrl ? "p-1" : "p-8"}
  `}
                  style={{ minHeight: "20rem" }}
                >
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Full body preview"
                      className="w-full object-contain rounded"
                      style={{ maxHeight: "22rem" }}
                    />
                  ) : (
                    <>
                      <div className="text-center">
                        <FaFileUpload className="mx-auto text-4xl text-green-700 mb-3" />

                        <p className="font-semibold text-gray-700">
                          Drag & Drop Photo Here
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse
                        </p>

                        <p className="text-xs text-gray-400 mt-3">
                          PNG, JPG, JPEG
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "image")}
                  />
                </label>
                {imagePreviewUrl && (
  <div className="mt-2 space-y-2">
    <button
      type="button"
      onClick={handleRemoveBackgroundClick}
      disabled={isRemovingBg}
      className="w-full flex items-center justify-center gap-2 text-green-700 hover:text-green-900 text-sm border rounded-lg py-2 disabled:opacity-60"
    >
      {isRemovingBg ? "Removing background..." : "Remove background from photo"}
    </button>

    <button
      type="button"
      onClick={handleRemoveImage}
      className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-800 text-sm border rounded-lg py-2"
    >
      <FaTrash size={12} /> Remove photo
    </button>
  </div>
)}
              </div>

              {/* RIGHT: text fields */}
              <div className="col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          name: e.target.value.toUpperCase(),
                        });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      className={`w-full rounded-lg p-2 border transition
        ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <select
                      value={form.templateId}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          templateId: e.target.value,
                          office: "",
                          section: "",
                        });
                        if (errors.templateId)
                          setErrors({ ...errors, templateId: "" });
                      }}
                      className={`w-full rounded-lg p-2 border transition
      ${errors.templateId ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                    >
                      <option value="" disabled>
                        Select Office Type
                      </option>
                      {templates.map((t) => (
                        <option key={t.templateID} value={t.templateID}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {errors.templateId && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.templateId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={form.office}
                      onChange={(e) => {
                        setForm({ ...form, office: e.target.value });
                        if (errors.office) setErrors({ ...errors, office: "" });
                      }}
                      disabled={!selectedTemplate}
                      className={`w-full rounded-lg p-2 border transition disabled:bg-gray-100 disabled:cursor-not-allowed
        ${errors.office ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                    >
                      <option value="">
                        {selectedTemplate
                          ? "Select Office (optional)"
                          : "Select Office Type first"}
                      </option>
                      {(selectedTemplate?.office || []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {errors.office && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.office}
                      </p>
                    )}
                  </div>

                  <div>
                    <select
                      value={form.section}
                      onChange={(e) => {
                        setForm({ ...form, section: e.target.value });
                        if (errors.section)
                          setErrors({ ...errors, section: "" });
                      }}
                      disabled={!selectedTemplate}
                      className={`w-full rounded-lg p-2 border transition disabled:bg-gray-100 disabled:cursor-not-allowed
        ${errors.section ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                    >
                      <option value="">
                        {selectedTemplate
                          ? "Select Section"
                          : "Select Office Type first"}
                      </option>
                      {(selectedTemplate?.section || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.section && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.section}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      placeholder="Employee ID No."
                      value={form.employeeIdNo}
                      onChange={(e) => {
                        setForm({ ...form, employeeIdNo: e.target.value });
                        if (errors.employeeIdNo)
                          setErrors({ ...errors, employeeIdNo: "" });
                      }}
                      className={`w-full rounded-lg p-2 border transition
        ${errors.employeeIdNo ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                    />
                    {errors.employeeIdNo && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.employeeIdNo}
                      </p>
                    )}
                  </div>

                  <div>
                    <select
                      value={form.bloodType}
                      onChange={(e) => {
                        setForm({ ...form, bloodType: e.target.value });
                        if (errors.bloodType)
                          setErrors({ ...errors, bloodType: "" });
                      }}
                      className={`w-full rounded-lg p-2 border transition
        ${errors.bloodType ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"}`}
                    >
                      <option value="" disabled>
                        Blood Type
                      </option>
                      {BLOOD_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                    {errors.bloodType && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.bloodType}
                      </p>
                    )}
                  </div>
                </div>
                <input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      address: capitalizeWords(e.target.value),
                    });
                    if (errors.address) setErrors({ ...errors, address: "" });
                  }}
                  className={`w-full rounded-lg p-2 border transition
      ${
        errors.address
          ? "border-red-500 focus:ring-red-500"
          : "border-gray-300 focus:ring-green-500"
      }`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div
                      className={`flex items-center rounded-lg border bg-white transition ${
                        errors.contactNum
                          ? "border-red-500 focus-within:ring-red-500"
                          : "border-gray-300 focus-within:ring-green-500"
                      }`}
                    >
                      <span className="px-3 text-sm font-medium text-gray-700">
                        +63
                      </span>
                      <input
                        placeholder="Contact Number"
                        value={form.contactNum}
                        onChange={(e) =>
                          handlePhoneInput("contactNum", e.target.value)
                        }
                        className="w-full rounded-r-lg p-2 focus:outline-none"
                      />
                    </div>
                    {errors.contactNum && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.contactNum}
                      </p>
                    )}
                  </div>

                  <div>
                    <select
                      value={form.validatedBy}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          validatedBy: Number(e.target.value),
                        });
                        if (errors.validatedBy)
                          setErrors({ ...errors, validatedBy: "" });
                      }}
                      className={`w-full rounded-lg p-2 border transition
                        ${
                          errors.validatedBy
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-green-500"
                        }`}
                    >
                      <option value="" disabled>
                        Select Validator
                      </option>
                      {administratives.map((admin) => (
                        <option
                          key={admin.administrativeID}
                          value={admin.administrativeID}
                        >
                          {admin.name?.trim() || "—"}
                        </option>
                      ))}
                    </select>
                    {errors.validatedBy && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.validatedBy}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      placeholder="Emergency Contact Name"
                      value={form.emergencyConName}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          emergencyConName: e.target.value.toUpperCase(),
                        });

                        if (errors.emergencyConName) {
                          setErrors({ ...errors, emergencyConName: "" });
                        }
                      }}
                      className={`w-full p-2 rounded border ${
                        errors.emergencyConName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.emergencyConName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.emergencyConName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div
                      className={`flex items-center rounded border bg-white ${
                        errors.emergencyCon
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <span className="px-3 text-sm font-medium text-gray-700">
                        +63
                      </span>
                      <input
                        placeholder="Emergency Contact Number"
                        value={form.emergencyCon}
                        onChange={(e) =>
                          handlePhoneInput("emergencyCon", e.target.value)
                        }
                        className="w-full p-2 focus:outline-none"
                      />
                    </div>
                    {errors.emergencyCon && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.emergencyCon}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Date of Birth
                    </label>
                    <DatePicker
                      value={form.dateOfBirth}
                      onChange={(val) => {
                        setForm((prev) => ({ ...prev, dateOfBirth: val }));
                        setErrors((prev) =>
                          prev.dateOfBirth
                            ? { ...prev, dateOfBirth: "" }
                            : prev,
                        );
                      }}
                      error={!!errors.dateOfBirth}
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Issue Date
                    </label>
                    <DatePicker
                      value={form.issueDate}
                      onChange={(val) => {
                        setForm((prev) => ({ ...prev, issueDate: val }));
                        setErrors((prev) =>
                          prev.issueDate ? { ...prev, issueDate: "" } : prev,
                        );
                      }}
                      error={!!errors.issueDate}
                    />
                    {errors.issueDate && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.issueDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Expiration Date
                    </label>
                    <DatePicker
                      value={form.expirationDate}
                      onChange={(val) => {
                        setForm((prev) => ({ ...prev, expirationDate: val }));
                        setErrors((prev) =>
                          prev.expirationDate
                            ? { ...prev, expirationDate: "" }
                            : prev,
                        );
                      }}
                      error={!!errors.expirationDate}
                    />
                    {errors.expirationDate && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.expirationDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM: signature section */}
            <div className="mt-6 border-t pt-5">
              <h3 className="font-semibold text-green-800 mb-3">Signature</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    onDrop={handleSignatureDrop}
                    onDragOver={handleSignatureDragOver}
                    onDragLeave={handleSignatureDragLeave}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-green-400 rounded-lg cursor-pointer hover:bg-green-50 transition
                     ${
                       isDraggingSignature
                         ? "border-green-600 bg-green-100 scale-[1.02]"
                         : "border-green-400 hover:bg-green-50"
                     }
                      ${signaturePreviewUrl ? "p-2" : "p-6"}`}
                  >
                    <FaFileUpload className="text-2xl text-green-700" />
                    <span className="text-sm text-gray-600">
                      {signaturePreviewUrl
                        ? "Change upload"
                        : isDraggingSignature
                          ? "Drop signature here"
                          : "Upload a signature image, or drag it here"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "signature")}
                    />
                  </label>
                  {signaturePreviewUrl && (
                    <div className="mt-3 rounded-lg border p-3 bg-gray-50">
                      <p className="text-sm text-gray-500 mb-2">
                        Click on the preview to sample the background color to
                        remove
                      </p>
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

                        {/* Color Picker */}
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
                        removeSignatureImage: false,
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

              <button
                onClick={handleSaveAndPreview}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save & Preview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(viewItem || previewItem) && (
        <Pop_up_view
          employee={viewItem || previewItem}
          onClose={() => {
            setViewItem(null);
            setPreviewItem(null);
          }}
          onEdit={(employeeToEdit) => {
            setViewItem(null);
            setPreviewItem(null);
            openEditModal(employeeToEdit);
          }}
        />
      )}
      <ConfirmDeleteModal
        open={deleteModal.open}
        loading={deleting}
        title="Delete Project Officer"
        message="You are about to permanently remove this project officer from the system."
        itemName={deleteModal.officer?.name}
        confirmText="Delete Officer"
        onCancel={() =>
          setDeleteModal({
            open: false,
            officer: null,
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
