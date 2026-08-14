export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 UPLOADS VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("=================================");

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    const targetPath = url.pathname.replace(
      /^\/api\/uploads\/?/,
      ""
    );

    const backendUrl =
      `https://id-management-api.runasp.net/uploads/${targetPath}${url.search}`;

    console.log("Backend:", backendUrl);

    const headers = {};

    // Forward important headers
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const options = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.body !== undefined && req.body !== null) {
        options.body =
          typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body);
      }
    }

    const response = await fetch(
      backendUrl,
      options
    );

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

    // Handle files/binary responses
    if (
      contentType &&
      (
        contentType.startsWith("image/") ||
        contentType.startsWith("application/octet-stream") ||
        contentType.includes("pdf")
      )
    ) {
      const buffer = Buffer.from(
        await response.arrayBuffer()
      );

      return res
        .status(response.status)
        .send(buffer);
    }

    // Handle normal JSON/text responses
    const data = await response.text();

    console.log(
      "Backend response:",
      data.substring(0, 1000)
    );

    return res
      .status(response.status)
      .send(data);

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "UPLOAD PROXY ERROR:",
      error
    );

    console.error(
      "================================="
    );

    return res.status(502).json({
      error: "Upload proxy failed",
      details: error.message,
    });
  }
}