import { formatDate } from "../../styles/formDate";
import { API_BASE_URL } from "../../api/axios";
const getImageUrl = (path) => {
  if (!path) return undefined;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:image")
  ) {
    return path;
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
};
const splitPosition = (text) => {
  if (!text) return [""];
  return text
    .split(",")
    .map((part) => part.replace(/-/g, "").trim())
    .filter((part) => part.length > 0);
};
const VB_W = 540;
const VB_H = 856;
const measureTextWidth = (text, font = "18px Arial") => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  return ctx.measureText(text).width;
};
const splitAddress = (text, maxWidth) => {
  if (!text) return [""];
  const width = measureTextWidth(text);
  if (width <= maxWidth) return [text];

  const words = text.trim().split(" ");
  const lastThree = words.slice(-3).join(" ");
  const firstPart = words.slice(0, -3).join(" ");
  return [firstPart, lastThree];
};
const formatContactNumber = (raw) => {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");

  if (digits.startsWith("63")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  const last10 = digits.slice(-10).padStart(10, "0");
  const part1 = last10.slice(0, 3);
  const part2 = last10.slice(3, 6);
  const part3 = last10.slice(6, 10);

  return `+63 ${part1} ${part2} ${part3}`;
};

const POS = {
  address: { x: VB_W / 2, y: VB_H * 0.25 },

  contact: {
    number: { x: 280, y: VB_H * 0.3 },
    dob: { x: 285, y: VB_H * 0.3 + 20 },
    blood: { x: 310, y: VB_H * 0.3 + 41 },
  },

  emergency: {
    name: { x: VB_W / 2, y: VB_H * 0.448 },
    number: { x: VB_W / 2, y: VB_H * 0.448 + 20 },
  },

  validation: {
    signature: {
      w: VB_W * 0.5,
      h: VB_H * 0.11,
      x: (VB_W - VB_W * 0.5) / 2,
      y: VB_H * 0.64,
    },
    //can be added if you really want to have a customized signature validation, but for now we just use the signature image
    // validatedBy: { x: VB_W / 2, y: VB_H * 0.665 + 70 },
    // position: { x: VB_W / 2, y: VB_H * 0.665 + 90 },
  },

  dates: {
    issued: { x: 314, y: VB_H * 0.84 + 1 },
    expiry: { x: 322, y: VB_H * 0.84 + 21 },
  },
};
const FONT_SIG = "'Calibri', 'Gill Sans MT', 'Trebuchet MS', sans-serif";

const BackID = ({ employee, svgRef }) => {
  const maxAddressWidth = VB_W * 0.8;
  const addressLines = splitAddress(employee.address, maxAddressWidth);

  const backTemplate = employee.templateBackBackground || undefined;

  // validatedSignature is already normalized server-side (see
  // /api/signatures/normalized) — rendered as-is, no client-side canvas work.
  const normalizedSignature = employee.validatedSignature || null;

  return (
    <svg
      ref={svgRef}
      className="id-preview-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background template fills the whole card, no distortion */}
      {backTemplate && (
        <image
          href={backTemplate}
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      <text
        x={POS.address.x}
        y={POS.address.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {addressLines.map((line, i) => (
          <tspan
            key={i}
            x={POS.address.x}
            dy={i === 0 ? 0 : 22} // push second line down
          >
            {line}
          </tspan>
        ))}
      </text>

      {/* Contact block: number / dob / blood type, left-aligned stack */}
      <text
        x={POS.contact.number.x}
        y={POS.contact.number.y}
        textAnchor="start"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {formatContactNumber(employee.contactNumber)}
      </text>
      <text
        x={POS.contact.dob.x}
        y={POS.contact.dob.y}
        textAnchor="start"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {formatDate(employee.dateOfBirth)}
      </text>
      <text
        x={POS.contact.blood.x}
        y={POS.contact.blood.y}
        textAnchor="start"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {employee.bloodType === "N/A" ? "" : employee.bloodType}
      </text>

      {/* Emergency contact */}
      <text
        x={POS.emergency.name.x}
        y={POS.emergency.name.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {employee.emergencyName}
      </text>
      <text
        x={POS.emergency.number.x}
        y={POS.emergency.number.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {formatContactNumber(employee.emergencyNumber)}
      </text>

      {normalizedSignature && (
        <image
          href={normalizedSignature}
          x={POS.validation.signature.x}
          y={POS.validation.signature.y}
          width={POS.validation.signature.w}
          height={POS.validation.signature.h}
          preserveAspectRatio="none"
        />
      )}
      {/* <text
        x={POS.validation.validatedBy.x}
        y={POS.validation.validatedBy.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fontWeight="bold"
        fill="#000"
      >
        {employee.validatedBy}
      </text>
      <text
        x={POS.validation.position.x}
        y={POS.validation.position.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fontStyle="italic"
        fill="#000"
      >
        {splitPosition(employee.validatedPosition).map((line, i) => (
          <tspan key={i} x={POS.validation.position.x} dy={i === 0 ? 0 : 22}>
            {line}
          </tspan>
        ))}
      </text> */}

      {/* Issued / expiry dates */}
      <text
        x={POS.dates.issued.x}
        y={POS.dates.issued.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {formatDate(employee.issuedDate)}
      </text>
      <text
        x={POS.dates.expiry.x}
        y={POS.dates.expiry.y}
        textAnchor="middle"
        fontFamily={FONT_SIG}
        fontSize="18"
        fill="#000"
      >
        {formatDate(employee.expiryDate)}
      </text>
    </svg>
  );
};

export default BackID;
