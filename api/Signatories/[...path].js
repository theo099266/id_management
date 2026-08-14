export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 SIGNATORIES VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("=================================");

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    // Remove /api/Signatories/ from the URL
    const targetPath = url.pathname.replace(
      /^\/api\/Signatories\/?/,
      ""
    );

    // Build backend URL
    const backendUrl = targetPath
      ? `https://id-management-api.runasp.net/api/Signatories/${targetPath}${url.search}`
      : `https://id-management-api.runasp.net/api/Signatories${url.search}`;

    console.log("Target Path:", targetPath);
    console.log("Backend:", backendUrl);

    // -----------------------------------------
    // FORWARD HEADERS
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
    };

    // -----------------------------------------
    // FORWARD RAW REQUEST BODY
    // -----------------------------------------
    //
    // IMPORTANT:
    // Do NOT use JSON.stringify(req.body).
    //
    // This preserves multipart/form-data and
    // allows IFormFile to reach ASP.NET.
    //

    if (!["GET", "HEAD"].includes(req.method)) {
      options.body = req;

      // Required for streaming request bodies
      // with Node.js fetch.
      options.duplex = "half";
    }

    console.log("Sending request to backend...");

    // -----------------------------------------
    // CALL ASP.NET BACKEND
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
    // FORWARD RESPONSE CONTENT TYPE
    // -----------------------------------------

    const contentType =
      response.headers.get("content-type");

    if (contentType) {
      res.setHeader(
        "Content-Type",
        contentType
      );
    }

    // -----------------------------------------
    // RETURN BACKEND RESPONSE
    // -----------------------------------------

    const data = await response.arrayBuffer();

    return res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "🔥 SIGNATORIES PROXY ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return res.status(502).json({
      error: "Signatories proxy failed",
      details: error.message,
    });
  }
}