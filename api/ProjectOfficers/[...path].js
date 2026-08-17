export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_URL = "https://id-management-api.runasp.net";

export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 PROJECT OFFICERS VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("=================================");

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    // Remove /api/ProjectOfficers/ from the URL
    const targetPath = url.pathname.replace(
      /^\/api\/ProjectOfficers\/?/i,
      ""
    );

    // Build backend URL
    const backendUrl = targetPath
      ? `${BACKEND_URL}/api/ProjectOfficers/${targetPath}${url.search}`
      : `${BACKEND_URL}/api/ProjectOfficers${url.search}`;

    console.log("Target Path:", targetPath);
    console.log("Backend:", backendUrl);

    // -----------------------------------------
    // HEADERS
    // -----------------------------------------

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization =
        req.headers.authorization;
    }

    if (req.headers["content-type"]) {
      headers["Content-Type"] =
        req.headers["content-type"];
    }

    if (req.headers["content-length"]) {
      headers["Content-Length"] =
        req.headers["content-length"];
    }

    // -----------------------------------------
    // REQUEST OPTIONS
    // -----------------------------------------

    const options = {
      method: req.method,
      headers,
      duplex: "half",
    };

    // -----------------------------------------
    // FORWARD BODY
    // -----------------------------------------

    if (!["GET", "HEAD"].includes(req.method)) {
      options.body = req;
    }

    console.log(
      "Sending request to backend..."
    );

    // -----------------------------------------
    // CALL BACKEND
    // -----------------------------------------

    const response = await fetch(
      backendUrl,
      options
    );

    console.log(
      "Backend status:",
      response.status
    );

    // -----------------------------------------
    // RESPONSE HEADERS
    // -----------------------------------------

    const contentType =
      response.headers.get("content-type");

    if (contentType) {
      res.setHeader(
        "Content-Type",
        contentType
      );
    }

    // Forward useful headers
    const contentDisposition =
      response.headers.get(
        "content-disposition"
      );

    if (contentDisposition) {
      res.setHeader(
        "Content-Disposition",
        contentDisposition
      );
    }

    // -----------------------------------------
    // RETURN BACKEND RESPONSE
    // -----------------------------------------

    const data =
      await response.arrayBuffer();

    return res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "🔥 PROJECT OFFICERS PROXY ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return res.status(502).json({
      error:
        "Project Officers proxy failed",
      details: error.message,
    });
  }
}