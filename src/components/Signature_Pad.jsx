import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import {
  checkExtensionInstalled,
  startSignature,
} from "../Components/TopazService";

export default function SignatureCanvas({ onSave }) {
  const canvasRef = useRef(null);
  const sigPad = useRef(null);

  const [preview, setPreview] = useState(null);

  // Keep Topaz ready for future use
  const [isTopazLoading, setIsTopazLoading] = useState(false);

  const normalizeSignatureData = (dataUrl) => {
    return new Promise((resolve) => {
      if (!dataUrl) {
        resolve(null);
        return;
      }

      const img = new Image();

      img.onload = () => {
        const targetWidth = 800;
        const targetHeight = 200;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, targetWidth, targetHeight);

        ctx.drawImage(
          img,
          0,
          0,
          targetWidth,
          targetHeight
        );

        const imageData = ctx.getImageData(
          0,
          0,
          targetWidth,
          targetHeight
        );

        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          if (r >= 245 && g >= 245 && b >= 245) {
            pixels[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => resolve(dataUrl);

      img.src = dataUrl;
    });
  };

  const finalizeSignature = async (dataUrl) => {
    if (!dataUrl) return;

    const normalized = await normalizeSignatureData(dataUrl);

    if (!normalized) return;

    setPreview(normalized);

    onSave?.(normalized);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ratio = Math.max(
      window.devicePixelRatio || 1,
      1
    );

    canvas.width = 800 * ratio;
    canvas.height = 200 * ratio;

    canvas.style.width = "800px";
    canvas.style.height = "200px";

    const ctx = canvas.getContext("2d");

    ctx.scale(ratio, ratio);

    sigPad.current = new SignaturePad(canvas, {
      penColor: "black",
      minWidth: 1,
      maxWidth: 2,
      backgroundColor: "rgba(255,255,255,0)",
    });

    return () => {
      sigPad.current?.off();
    };
  }, []);

  const clear = () => {
    sigPad.current?.clear();
    setPreview(null);
  };

  const save = async () => {
    if (sigPad.current?.isEmpty()) {
      alert("Please draw your signature first.");
      return;
    }

    const dataUrl = sigPad.current.toDataURL("image/png");

    await finalizeSignature(dataUrl);
  };

  /*
   * TOPAZ IS KEPT ON STANDBY
   *
   * We are not showing the Topaz button yet.
   * When Topaz is needed, this function can be used again.
   */
  const captureTopaz = () => {
    if (!checkExtensionInstalled()) {
      alert(
        "Topaz SigPlus Lite extension is not installed or not enabled."
      );
      return;
    }

    setIsTopazLoading(true);

    startSignature(async (result) => {
      setIsTopazLoading(false);

      if (!result || !result.isSigned) {
        alert(
          result?.errorMsg ||
            "Signature capture was cancelled."
        );
        return;
      }

      const imageData =
        result.imageData ||
        result.image ||
        result.signature;

      if (!imageData) {
        alert("Topaz returned no signature image.");
        return;
      }

      const dataUrl = imageData.startsWith("data:image")
        ? imageData
        : `data:image/png;base64,${imageData}`;

      await finalizeSignature(dataUrl);
    });
  };

  return (
    <div className="w-full">

      {/* Signature Drawing Area */}
      <canvas
        ref={canvasRef}
        className="border rounded bg-transparent w-full max-w-200"
        style={{
          height: "200px",
          touchAction: "none",
        }}
      />

      {/* Buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-3">

        <div className="flex gap-2">

          <button
            type="button"
            onClick={clear}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={save}
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
          >
            Save
          </button>

        </div>

        {

        <button
          type="button"
          onClick={captureTopaz}
          disabled={isTopazLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {isTopazLoading ? "Capturing..." : "Use Topaz"}
        </button>
        }

      </div>

      {/* Signature Preview */}
      {preview && (
        <div className="mt-4">

          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            Signature Preview
          </p>

          <img
            src={preview}
            alt="Signature Preview"
            className="border rounded bg-gray-50 w-48 h-24 object-contain"
          />

        </div>
      )}

    </div>
  );
}