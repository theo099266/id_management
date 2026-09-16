import { useEffect, useRef, useState } from "react";
import FrontID from "./FrontID";
import BackID from "./BackID";

const BACKEND_URL = "https://id-management-api.runasp.net";
const CARD_WIDTH = Math.round((5.4 / 2.54) * 300);
const CARD_HEIGHT = Math.round((8.56 / 2.54) * 300);

const toDataUrl = async (url) => {
  if (!url) return null;

  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    mode: "cors",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Unable to load card image (${response.status}).`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const resizeProfilePhoto = async (src, width = 600, height = 900) => {
  if (!src) return null;

  const blob = await (await fetch(src)).blob();
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: "from-image",
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;

  context.drawImage(
    bitmap,
    (width - drawWidth) / 2,
    0,
    drawWidth,
    drawHeight,
  );
  bitmap.close();
  return canvas.toDataURL("image/png");
};

const getImageUrl = (path) => {
  if (!path) return "";
  if (/^(https?:|data:image|blob:)/.test(path)) return path;

  const clean = path.replace(/^\/+/, "");
  if (clean.startsWith("uploads/templates/")) {
    return `${BACKEND_URL}/api/files/templates/${clean.slice("uploads/templates/".length)}`;
  }
  return `${BACKEND_URL}/api/files/${clean}`;
};

const getNormalizedUrl = (path, endpoint) =>
  path
    ? `${BACKEND_URL}/api/${endpoint}/normalized?path=${encodeURIComponent(path)}`
    : "";

const mapEmployee = (employee) => ({
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
  validatedSignature: getNormalizedUrl(
    employee.validatedBySignature,
    "signatures",
  ),
  issuedDate: employee.issueDate || "",
  expiryDate: employee.expiration_date || "",
  photo: getNormalizedUrl(employee.imagePath, "photos"),
  signature: getNormalizedUrl(employee.signaturepath, "signatures"),
  templateFrontBackground: getImageUrl(employee.templateFrontBackground),
  templateFrontFooter: getImageUrl(employee.templateFrontFooter),
  templateBackBackground: getImageUrl(employee.templateBackBackground),
});

const svgToJpeg = async (svg, filename) => {
  const clone = svg.cloneNode(true);
  clone.setAttribute("width", "540");
  clone.setAttribute("height", "856");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgBlob = new Blob(
    [new XMLSerializer().serializeToString(clone)],
    { type: "image/svg+xml;charset=utf-8" },
  );
  const imageUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    canvas.getContext("2d").drawImage(image, 0, 0, CARD_WIDTH, CARD_HEIGHT);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve({ blob, filename }) : reject(new Error("Could not create ID image."))),
        "image/jpeg",
        0.95,
      );
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export default function BatchCardRenderer({ employee, onRendered, onError }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [cardEmployee, setCardEmployee] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const data = mapEmployee(employee);

    (async () => {
      try {
        const rawPhoto = await toDataUrl(data.photo);
        const [photo, signature, validatedSignature, frontBackground, footer, backBackground] =
          await Promise.all([
            rawPhoto ? resizeProfilePhoto(rawPhoto) : null,
            toDataUrl(data.signature),
            toDataUrl(data.validatedSignature),
            toDataUrl(data.templateFrontBackground),
            toDataUrl(data.templateFrontFooter),
            toDataUrl(data.templateBackBackground),
          ]);

        if (!cancelled) {
          setCardEmployee({
            ...data,
            photo,
            signature,
            validatedSignature,
            templateFrontBackground: frontBackground,
            templateFrontFooter: footer,
            templateBackBackground: backBackground,
          });
        }
      } catch (error) {
        if (!cancelled) onError(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employee, onError]);

  useEffect(() => {
    if (!cardEmployee || !frontRef.current || !backRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        const safeName = (cardEmployee.name || "employee").replace(/[\\/:*?"<>|]+/g, "_");
        const [front, back] = await Promise.all([
          svgToJpeg(frontRef.current, `${safeName}_front.jpg`),
          svgToJpeg(backRef.current, `${safeName}_back.jpg`),
        ]);
        if (!cancelled) onRendered({ front, back });
      } catch (error) {
        if (!cancelled) onError(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cardEmployee, onError, onRendered]);

  if (!cardEmployee) return null;

  return (
    <div style={{ position: "fixed", left: "-10000px", top: 0, width: 540, height: 856 }}>
      <FrontID employee={cardEmployee} svgRef={frontRef} />
      <BackID employee={cardEmployee} svgRef={backRef} />
    </div>
  );
}
