export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 ADMINISTRATIVE VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("=================================");

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    // /api/Administrative
    // /api/Administrative/123
    // /api/Administrative/byUser/5
    // /api/Administrative/123/image
    // /api/Administrative/123/reprocess

    const targetPath = url.pathname.replace(
      /^\/api\/Administrative\/?/,
      ""
    );

    const backendUrl = targetPath
      ? `https://id-management-api.runasp.net/api/Administrative/${targetPath}${url.search}`
      : `https://id-management-api.runasp.net/api/Administrative${url.search}`;

    console.log("Backend:", backendUrl);

    const headers = {};

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

    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.body !== undefined && req.body !== null) {
        options.body =
          typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body);
      }
    }

    console.log("Sending request to:", backendUrl);

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

    const data = await response.text();

    console.log(
      "Backend response:",
      data.substring(0, 1000)
    );

    res
      .status(response.status)
      .send(data);

  } catch (error) {
    console.error(
      "ADMINISTRATIVE PROXY ERROR:",
      error
    );

    res.status(502).json({
      error: "Administrative proxy failed",
      details: error.message,
    });
  }
}