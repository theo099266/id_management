const CONTROLLER_CASE_MAP = {
  administrative: "Administrative",
  auth: "Auth",
  health: "Health",
  projectofficers: "ProjectOfficers",
  signatories: "Signatories",
  signatures: "signatures",
  template: "Template",
  users: "users",
};

const BACKEND_URL = "https://id-management-api.runasp.net";

export default async function handler(req, res) {
  try {
    console.log("=================================");
    console.log("VERCEL PROXY");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("=================================");

    const url = new URL(req.url, `https://${req.headers.host}`);

    // Remove /api/ from the beginning
    let targetPath = url.pathname.replace(/^\/api\/?/, "");

    const queryString = url.search;

    console.log("Target path:", targetPath);

    // ============================================================
    // UPLOADS
    // /api/uploads/profiles/file.jpg
    //
    // becomes:
    // https://id-management-api.runasp.net/uploads/profiles/file.jpg
    // ============================================================

    const isUploadsPath =
      targetPath.toLowerCase() === "uploads" ||
      targetPath.toLowerCase().startsWith("uploads/");

    let backendUrl;

    if (isUploadsPath) {
      // Remove "uploads/" and rebuild it cleanly
      const uploadPath = targetPath
        .replace(/^uploads\/?/i, "")
        .replace(/^\/+/, "")
        .replace(/\/+/g, "/");

      backendUrl =
        `${BACKEND_URL}/uploads/${uploadPath}${queryString}`;

      console.log("UPLOAD REQUEST");
      console.log("Backend:", backendUrl);
    }

    // ============================================================
    // NORMAL API REQUESTS
    // /api/users
    // /api/Template
    // /api/ProjectOfficers
    //
    // becomes:
    // https://id-management-api.runasp.net/api/users
    // ============================================================

    else {
      const segments = targetPath.split("/");

      const firstSegmentLower =
        segments[0].toLowerCase();

      if (CONTROLLER_CASE_MAP[firstSegmentLower]) {
        segments[0] =
          CONTROLLER_CASE_MAP[firstSegmentLower];

        targetPath = segments.join("/");
      }

      backendUrl =
        `${BACKEND_URL}/api/${targetPath}${queryString}`;

      console.log("API REQUEST");
      console.log("Backend:", backendUrl);
    }

    // ============================================================
    // HEADERS
    // ============================================================

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization =
        req.headers.authorization;
    }

    if (req.headers["content-type"]) {
      headers["Content-Type"] =
        req.headers["content-type"];
    }

    // ============================================================
    // REQUEST OPTIONS
    // ============================================================

    const options = {
      method: req.method,
      headers,
    };

    // Forward request body for POST / PUT / PATCH
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.body != null
    ) {
      options.body =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body);
    }

    // ============================================================
    // CALL BACKEND
    // ============================================================

    const response =
      await fetch(backendUrl, options);

    console.log(
      "Backend status:",
      response.status
    );

    const contentType =
      response.headers.get("content-type");

    if (contentType) {
      res.setHeader(
        "Content-Type",
        contentType
      );
    }

    // ============================================================
    // IMAGE / FILE RESPONSE
    // ============================================================

    if (
      contentType &&
      (
        contentType.startsWith("image/") ||
        contentType.startsWith("application/octet-stream") ||
        contentType.includes("pdf") ||
        contentType.includes("zip")
      )
    ) {
      const buffer =
        Buffer.from(
          await response.arrayBuffer()
        );

      return res
        .status(response.status)
        .send(buffer);
    }

    // ============================================================
    // NORMAL JSON / TEXT RESPONSE
    // ============================================================

    const data =
      await response.text();

    console.log(
      "Backend response:",
      data.substring(0, 500)
    );

    return res
      .status(response.status)
      .send(data);

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "VERCEL PROXY ERROR:",
      error
    );

    console.error(
      "================================="
    );

    return res.status(502).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}