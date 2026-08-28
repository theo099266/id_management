import { useRef, useLayoutEffect, useState } from "react";

const CARD_W_UNITS = 540; // 5.4cm
const CARD_H_UNITS = 856; // 8.56cm

const NAME_FONT_SIZE = CARD_W_UNITS * 0.08;     // was --name-font-size
const OFFICE_FONT_SIZE = CARD_W_UNITS * 0.026;  // was --office-font-size (fixed earlier)
const ID_FONT_SIZE = CARD_W_UNITS * 0.034;      // was .employee-id font-size

const NAME_BOX_X = CARD_W_UNITS * 0.4676;       // was .info-column left: 46.76%
const NAME_BOX_WIDTH = CARD_W_UNITS - NAME_BOX_X;
const NAME_BOX_TOP = CARD_H_UNITS * 0.33;       // was .info-column top: 33%
const NAME_BOX_CENTER_X = NAME_BOX_X + NAME_BOX_WIDTH / 2;

const PHOTO_WIDTH = CARD_W_UNITS * 0.8;         
const PHOTO_HEIGHT = CARD_H_UNITS * 0.75;      
const PHOTO_X = CARD_W_UNITS * -0.14;           

const PHOTO_BOTTOM_OFFSET = CARD_H_UNITS * 0.037;
const PHOTO_Y = CARD_H_UNITS - PHOTO_HEIGHT - PHOTO_BOTTOM_OFFSET;
        // was .employee-id-wrapper top: 91.5%

const FrontID = ({ employee, svgRef }) => {
  const splitName = (name = "") => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return [words.join(" ")];
    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
  };

  const nameLines = splitName(employee.name || "EMPLOYEE NAME");

  const nameTspanRefs = useRef([]);
  const [nameFontSize, setNameFontSize] = useState(NAME_FONT_SIZE);

  const backgroundTemplate = employee.templateFrontBackground || undefined;
  const footerTemplate = employee.templateFrontFooter || undefined;
  const photoUrl = employee.photo || undefined;
  const signature = employee.signature || null;

  useLayoutEffect(() => {
    let size = NAME_FONT_SIZE;
    const maxWidth = NAME_BOX_WIDTH * 0.94; // small side padding

    for (let i = 0; i < 15; i++) {
      const tspans = nameTspanRefs.current.filter(Boolean);
      if (tspans.length === 0) break;

      tspans.forEach((el) => el.setAttribute("font-size", size));
      const widest = Math.max(...tspans.map((el) => el.getComputedTextLength()));

      if (widest <= maxWidth) break;
      size *= 0.92;
    }

    setNameFontSize(Math.round(size * 100) / 100);
  }, [employee.name, nameLines.join("|")]);

  const officeLines = (employee.office || "").split("\n");

const nameBlockHeight =
  nameFontSize * 1.05 * nameLines.length;

const officeLineHeight =
  OFFICE_FONT_SIZE * 1.2;

const officeStartY =
  NAME_BOX_TOP +
  nameBlockHeight +
  OFFICE_FONT_SIZE * 1.4;

// Distance from the bottom of the office text to the signature
const signatureGap =
  officeLines.length === 1
    ? -3
    : -1;

const signatureY =
  officeStartY +
  OFFICE_FONT_SIZE +
  officeLineHeight * (officeLines.length - 1) +
  signatureGap;
const SIGNATURE_WIDTH = 2850;
const SIGNATURE_HEIGHT = 120;

const ID_Y = 757;
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CARD_W_UNITS} ${CARD_H_UNITS}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="front-card-clip">
          <rect x="0" y="0" width={CARD_W_UNITS} height={CARD_H_UNITS} />
        </clipPath>
        <clipPath id="front-photo-clip">
          <rect x={PHOTO_X} y={PHOTO_Y} width={PHOTO_WIDTH} height={PHOTO_HEIGHT} />
        </clipPath>
      </defs>

      <g clipPath="url(#front-card-clip)">
        {backgroundTemplate && (
          <image
            href={backgroundTemplate}
            x="0"
            y="0"
            width={CARD_W_UNITS}
            height={CARD_H_UNITS}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {photoUrl && (
          <g clipPath="url(#front-photo-clip)">
            {/* preserveAspectRatio="xMidYMin slice" mirrors object-fit: cover
                with object-position: top from the old .employee-photo img */}
            <image
              href={photoUrl}
              x={PHOTO_X}
              y={PHOTO_Y}
              width={PHOTO_WIDTH}
              height={PHOTO_HEIGHT}
              preserveAspectRatio="xMidYMin slice"
            />
          </g>
        )}

        <text
          textAnchor="middle"
          fontFamily="Impact, 'Arial Narrow', sans-serif"
          fill="#000"
        >
          {nameLines.map((line, i) => (
            <tspan
              key={i}
              ref={(el) => (nameTspanRefs.current[i] = el)}
              x={NAME_BOX_CENTER_X}
              y={NAME_BOX_TOP + nameFontSize * 1.05 * (i + 1)}
              fontSize={nameFontSize}
            >
              {line}
            </tspan>
          ))}
        </text>

        <text
          x={NAME_BOX_CENTER_X}
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize={OFFICE_FONT_SIZE}
          fill="#000"
        >
          {officeLines.map((line, i) => (
            <tspan
              key={i}
              x={NAME_BOX_CENTER_X}
              y={officeStartY + OFFICE_FONT_SIZE * 1.2 * i}
            >
              {line}
            </tspan>
          ))}
        </text>

        {signature && (
  <image
    href={signature}
    x={NAME_BOX_CENTER_X - SIGNATURE_WIDTH / 2}
    y={signatureY}
    width={SIGNATURE_WIDTH}
    height={SIGNATURE_HEIGHT}
    preserveAspectRatio="xMidYMid meet"
  />
)}

        <text
  x={NAME_BOX_CENTER_X}
  y={ID_Y}
  textAnchor="middle"
  fontFamily="Arial, sans-serif"
  fontSize={ID_FONT_SIZE}
  fontWeight="bold"
  fill="#000"
>
  {employee.employeeId}
</text>

        {footerTemplate && (
  <image
    href={footerTemplate}
    x="0"
    y="0"
    width={CARD_W_UNITS}
    height={CARD_H_UNITS}
    preserveAspectRatio="xMidYMid meet"
  />
)}
      </g>
    </svg>
  );
};

export default FrontID;