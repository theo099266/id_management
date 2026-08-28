import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import FrontID from "../components/id-card/FrontID";
import BackID from "../components/id-card/BackID";
import "../styles/dashboard.css";
import { FaEdit } from "react-icons/fa";
import { API_BASE_URL } from "../api/axios";

// Converts an image URL to a base64 data URL, sidestepping CORS entirely
const toDataUrl = async (url, { retries = 2, delayMs = 400 } = {}) => {
  if (!url) return null;

  const token = localStorage.getItem("token"); // match however your axios.js stores it

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        mode: "cors",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        console.error("Failed to convert image to data URL:", url, err);
        return null;
      }
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
};
const inlineImages = async (svgEl) => {
  const imageEls = svgEl.querySelectorAll("image");

  await Promise.all(
    Array.from(imageEls).map(async (imageEl) => {
      const href =
        imageEl.getAttribute("href") || imageEl.getAttribute("xlink:href");

      if (!href || href.startsWith("data:")) return;

      try {
        const res = await fetch(href);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        imageEl.setAttribute("href", dataUrl);
        imageEl.removeAttribute("xlink:href");
      } catch (err) {
        console.error("Failed to inline SVG image href:", href, err);
      }
    }),
  );
};
const cmToPx = (cm, dpi = 300) => Math.round((cm / 2.54) * dpi);

const CARD_W_CM = 5.4;
const CARD_H_CM = 8.56;

const resizeProfilePhoto = (src, width = 432, height = 642) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      const scale = Math.max(width / img.width, height / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      const x = (width - drawWidth) / 2;
      const y = 0;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
    img.src = src;
  });

const Pop_up_view = ({ employee, onClose, onEdit }) => {
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const [resolvedImages, setResolvedImages] = useState({
    photo: null,
    signature: null,
    validatedSignature: null,
    loading: true,
  });
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

  const clean = path.replace(/^\/+/, ""); // strip leading slash if any

  if (clean.startsWith("uploads/templates/")) {
    // matches FilesController's [HttpGet("templates/{**path}")]
    const filename = clean.slice("uploads/templates/".length);
    return `${BACKEND_URL}/api/files/templates/${filename}`;
  }

  // matches FilesController's [HttpGet("uploads/{**path}")]
  // (clean already starts with "uploads/" for photos etc.)
  return `${BACKEND_URL}/api/files/${clean}`;
};
  // Signatures are normalized server-side on every request — route them
  // through the normalize endpoint instead of the raw uploaded file.
    const getNormalizedSignatureUrl = (path) => {
    if (!path) return "";
    return `${BACKEND_URL}/api/signatures/normalized?path=${encodeURIComponent(path)}`;
  };

  const employeeData = employee
    ? {
        employeeId: employee.employee_Id_NO || "",
        name: employee.name || "",
        office: employee.office || "",
        address: employee.address || "",
        contactNumber: employee.contact_Num || "",
        dateOfBirth: employee.date_of_Birth || "",
        bloodType: employee.blood_Type || "",
        emergencyName: (employee.emergency_Con_Name || "").toUpperCase(),
        emergencyNumber: employee.emergency_Con || "",
        validatedBy: employee.validatedByName || "",
        validatedPosition: employee.validatedByOffice || "",
        validatedSignature: employee.validatedBySignature
          ? getNormalizedSignatureUrl(employee.validatedBySignature)
          : null,
        issuedDate: employee.issueDate || "",
        expiryDate: employee.expiration_date || "",
        photo: employee.imagePath ? getImageUrl(employee.imagePath) : null,
        signature: employee.signaturepath
          ? getNormalizedSignatureUrl(employee.signaturepath)
          : null,
        templateFrontBackground: employee.templateFrontBackground
          ? getImageUrl(employee.templateFrontBackground)
          : null,
        templateFrontFooter: employee.templateFrontFooter
          ? getImageUrl(employee.templateFrontFooter)
          : null,
        templateBackBackground: employee.templateBackBackground
          ? getImageUrl(employee.templateBackBackground)
          : null,
      }
    : null;

  // Pre-convert all images to data URLs as soon as the popup opens
  useEffect(() => {
    if (!employeeData) return;
    let cancelled = false;

    (async () => {
      const rawPhoto = await toDataUrl(employeeData.photo);

      const [
        photo,
        signature,
        validatedSignature,
        templateFrontBackground,
        templateFrontFooter,
        templateBackBackground,
      ] = await Promise.all([
        rawPhoto ? resizeProfilePhoto(rawPhoto, 600, 900) : null,
        toDataUrl(employeeData.signature),
        toDataUrl(employeeData.validatedSignature),
        toDataUrl(employeeData.templateFrontBackground),
        toDataUrl(employeeData.templateFrontFooter),
        toDataUrl(employeeData.templateBackBackground),
      ]);

      if (!cancelled) {
        setResolvedImages({
          photo,
          signature,
          validatedSignature,
          templateFrontBackground,
          templateFrontFooter,
          templateBackBackground,
          loading: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employee]);

  if (!employee) return null;

  // Merge resolved data-URL images over the original data
  const finalEmployeeData = {
    ...employeeData,
    photo: resolvedImages.photo || employeeData.photo,
    signature: resolvedImages.signature || employeeData.signature,
    validatedSignature:
      resolvedImages.validatedSignature || employeeData.validatedSignature,
    templateFrontBackground:
      resolvedImages.templateFrontBackground ||
      employeeData.templateFrontBackground,
    templateFrontFooter:
      resolvedImages.templateFrontFooter || employeeData.templateFrontFooter,
    templateBackBackground:
      resolvedImages.templateBackBackground ||
      employeeData.templateBackBackground,
  };
  const downloadSvgAsJpg = async (
  svgRef,
  filename,
  { outWidth, outHeight, background = "#ffffff" } = {},
) => {
  const svgEl = svgRef.current;
  if (!svgEl) return;

  if (document.fonts?.ready) await document.fonts.ready;

  const viewBox = svgEl.viewBox.baseVal;
  const vbWidth = viewBox?.width || svgEl.clientWidth;
  const vbHeight = viewBox?.height || svgEl.clientHeight;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("width", vbWidth);
  clone.setAttribute("height", vbHeight);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  await inlineImages(clone);

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, outWidth, outHeight);
    ctx.drawImage(img, 0, 0, outWidth, outHeight); // SVG scales cleanly, same ratio → no crop

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

  const downloadHtmlAsJpg = async (
  ref,
  filename,
  { outWidth, outHeight, background = "#ffffff" } = {},
) => {
  if (!ref.current) return;
   if (document.fonts?.ready) await document.fonts.ready;
  const unscaledWidth = ref.current.offsetWidth || ref.current.clientWidth;
  const unscaledHeight = ref.current.offsetHeight || ref.current.clientHeight;

  const clone = ref.current.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.margin = "0";
  clone.style.zIndex = "-1";
  clone.style.transform = "none";
  clone.style.width = `${unscaledWidth}px`;
  clone.style.height = `${unscaledHeight}px`;

  document.body.appendChild(clone);

  const exportStyles = {
    ".employee-photo": { transform: "translateY(0px)" },
    ".employee-signature": { transform: "translateY(4.5px)" },
    ".employee-name": { letterSpacing: "1.2px" },
    ".name-lines": { letterSpacing: "normal" }, 
    ".employee-office": { marginTop: "4px", letterSpacing: "normal" },
    ".info-column": { transform: "translateY(-6px)" },
  };
  Object.entries(exportStyles).forEach(([selector, css]) => {
    const element = clone.querySelector(selector);
    if (!element) return;
    Object.assign(element.style, css);
  });

  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );

  // render at a high internal scale for crispness, then resample down/up
  // to the exact target pixel size in a second pass
  const renderScale = Math.max(outWidth / unscaledWidth, outHeight / unscaledHeight, 1);

  const rawCanvas = await html2canvas(clone, {
    scale: renderScale,
    useCORS: true,
    backgroundColor: background,
  });

  document.body.removeChild(clone);

  // final canvas locked to the exact card size
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = outWidth;
  finalCanvas.height = outHeight;
  const ctx = finalCanvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, outWidth, outHeight);
  ctx.drawImage(rawCanvas, 0, 0, outWidth, outHeight); // same aspect ratio → no crop, no distortion

  const link = document.createElement("a");
  link.download = filename;
  link.href = finalCanvas.toDataURL("image/jpeg", 0.95);
  link.click();
};

  const handleDownloadFront = (frontRef, finalEmployeeData) =>
  downloadHtmlAsJpg(
    frontRef,
    `${finalEmployeeData.name || "employee"}_front.jpg`,
    { outWidth: cmToPx(CARD_W_CM), outHeight: cmToPx(CARD_H_CM) },
  );

const handleDownloadBack = (backRef, finalEmployeeData) =>
  downloadSvgAsJpg(
    backRef,
    `${finalEmployeeData.name || "employee"}_back.jpg`,
    { outWidth: cmToPx(CARD_W_CM), outHeight: cmToPx(CARD_H_CM) },
  );

  const handleDownloadBoth = async (frontRef, backRef, finalEmployeeData) => {
  const dims = { outWidth: cmToPx(CARD_W_CM), outHeight: cmToPx(CARD_H_CM) };

  await downloadHtmlAsJpg(
    frontRef,
    `${finalEmployeeData.name || "employee"}_front.jpg`,
    dims,
  );
  await downloadSvgAsJpg(
    backRef,
    `${finalEmployeeData.name || "employee"}_back.jpg`,
    dims,
  );
};

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
      style={{ cursor: "pointer" }}
    >
      <div
        className="bg-white shadow-xl popup-scrollbar"
        style={{
          width: "90%",
          maxWidth: "1000px",
          maxHeight: "96vh",
          overflowY: "auto",
          borderRadius: "22px",
          border: "1px solid rgba(30, 120, 40, 0.2)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
          cursor: "default",
          scrollbarGutter: "stable",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-3 text-white"
          style={{
            background: "linear-gradient(135deg, #1f7a2e, #2e9f43)",
            position: "relative",
            borderTopLeftRadius: "22px",
            borderTopRightRadius: "22px",
          }}
        >
          {/* Left Side */}
          <div
            className="flex items-center gap-3"
            style={{ marginLeft: "56px" }}
          >
            <div>
              <h3 className="mb-0 font-bold text-white text-lg">
                Officer ID Preview
              </h3>
              <small className="text-white/70">
                National Irrigation Administration
              </small>
            </div>

            {onEdit && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-white/70 px-4 py-2 text-white text-sm font-medium
                   transition-transform duration-150 ease-out
                   hover:bg-white/10
                   active:scale-95 active:shadow-inner"
                onClick={() => onEdit(employee)}
                title="Edit officer"
              >
                <FaEdit className="text-sm" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Right Side — now in normal flex flow, not absolutely positioned */}
          <div className="flex items-center gap-2">
            <button
              className="rounded-full bg-white text-green-700 px-4 py-2 text-sm font-semibold
                 transition-transform duration-150 ease-out
                 hover:bg-green-50
                 active:scale-95 active:shadow-inner"
              onClick={() => handleDownloadFront(frontRef, finalEmployeeData)}
            >
              Front
            </button>

            <button
              className="rounded-full bg-white text-green-700 px-4 py-2 text-sm font-semibold
                 transition-transform duration-150 ease-out
                 hover:bg-green-50
                 active:scale-95 active:shadow-inner"
              onClick={() => handleDownloadBack(backRef, finalEmployeeData)}
            >
              Back
            </button>

            <button
              className="rounded-full bg-green-700 text-white px-4 py-2 text-sm font-semibold
                 transition-transform duration-150 ease-out
                 hover:bg-green-800
                 active:scale-95 active:shadow-inner"
              onClick={() =>
                handleDownloadBoth(frontRef, backRef, finalEmployeeData)
              }
            >
              Download Both
            </button>
          </div>

          {/* Close Button — stays absolutely positioned since it's meant to sit in the corner, not in the row */}
          <button
            className="flex items-center justify-center rounded-lg border border-white/70 text-white
               transition-transform duration-150 ease-out
               hover:bg-white/10
               active:scale-90 active:shadow-inner"
            style={{
              width: "38px",
              height: "38px",
              padding: 0,
              position: "absolute",
              left: "12px",
              top: "12px",
            }}
            onClick={onClose}
          >
            <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>×</span>
          </button>
        </div>

        <div
          className="container-fluid py-4 px-4"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f5fbf5 100%)",
            borderBottomLeftRadius: "22px",
            borderBottomRightRadius: "22px",
          }}
        >
          {resolvedImages.loading ? (
            <div className="text-center py-5">Loading images...</div>
          ) : (
            <div
              className="id-container"
              style={{ minHeight: "620px", paddingTop: "8px" }}
            >
              <div className="id-zoom-shell">
                <div className="id-preview" ref={frontRef}>
                  <FrontID employee={finalEmployeeData} />
                </div>
              </div>

              <div className="id-zoom-shell">
                <div className="id-preview">
                  <BackID employee={finalEmployeeData} svgRef={backRef} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pop_up_view;
