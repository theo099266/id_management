import "../../styles/idcard.css";
import { useState, useRef, useLayoutEffect } from "react";

const FrontID = ({ employee }) => {
  const splitName = (name = "") => {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length <= 2) {
      return [words.join(" ")];
    }

    const middle = Math.ceil(words.length / 2);

    return [
      words.slice(0, middle).join(" "),
      words.slice(middle).join(" "),
    ];
  };

  const nameLines = splitName(employee.name || "EMPLOYEE NAME");

  const nameBoxRef = useRef(null);
  const [nameFontPx, setNameFontPx] = useState(null);
  const [measured, setMeasured] = useState(false);

  const backgroundTemplate =
    employee.templateFrontBackground || undefined;

  const footerTemplate =
    employee.templateFrontFooter || undefined;

  const photoUrl =
    employee.photo || undefined;

  const signature =
    employee.signature || null;

  useLayoutEffect(() => {
  const el = nameBoxRef.current;

  if (!el) {
    setMeasured(true);
    return;
  }

  let testSize = parseFloat(window.getComputedStyle(el).fontSize);

  for (let i = 0; i < 15; i++) {
    const style = window.getComputedStyle(el);
    const lineHeight =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.05;

    const lines = Math.round(el.clientHeight / lineHeight);

    if (lines <= 2) {
      break;
    }

    testSize *= 0.92;
    el.style.fontSize = `${testSize}px`;
  }

  el.style.fontSize = "";

  setNameFontPx(testSize);
  setMeasured(true);
}, [employee.name, nameLines.join("|")]);

  return (
    <div className="id-card">

      {backgroundTemplate && (
        <img
          src={backgroundTemplate}
          className="template-image"
          alt=" "
        />
      )}

      {photoUrl && (
        <img
          src={photoUrl}
          className="employee-photo"
          alt=" "
        />
      )}

      <div className="info-column">

        <h2
          className="employee-name"
          style={
            nameFontPx
              ? {
                  "--name-font-size": `${nameFontPx}px`,
                  visibility: measured ? "visible" : "hidden",
                }
              : {
                  visibility: measured ? "visible" : "hidden",
                }
          }
        >

          <div
            ref={nameBoxRef}
            className="name-lines"
          >
            {nameLines.map((line, index) => (
              <span key={index}>
                {line}
              </span>
            ))}
          </div>

          <span className="employee-office">
            {employee.office || ""}
          </span>

          {signature && (
            <div className="employee-signature">
              <img
                src={signature}
                className="signature-image"
                alt=" "
              />
            </div>
          )}

        </h2>

        <div className="employee-id-wrapper">
          <div className="employee-id">
            {employee.employeeId}
          </div>
        </div>

      </div>

      {footerTemplate && (
        <img
          src={footerTemplate}
          className="footer-image"
          alt=" "
        />
      )}

    </div>
  );
};

export default FrontID;