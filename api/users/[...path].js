// IMPORTANT:
// Disable Vercel's automatic body parser.
// Needed so multipart/form-data (PUT with image upload) passes through untouched.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 USERS VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("=================================");

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);

    // /api/users/2  -> "2"
    // /api/users    -> ""
    const targetPath = url.pathname.replace(/^\/api\/users\/?/i, "");

    const backendUrl =
      `https://id-management-api.runasp.net/api/users${targetPath ? `/${targetPath}` : ""}${url.search}`;

    console.log("Backend:", backendUrl);

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Keep original Content-Type INCLUDING the multipart boundary.
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }
    if (req.headers["content-length"]) {
      headers["Content-Length"] = req.headers["content-length"];
    }

    const options = {
      method: req.method,
      headers,
      duplex: "half",
    };

    // Forward the raw request stream — do NOT JSON.stringify(req.body).
    // This is what lets FormData (with files) pass through intact for PUT.
    if (!["GET", "HEAD"].includes(req.method)) {
      options.body = req;
    }

    console.log("Sending request to:", backendUrl);

    const response = await fetch(backendUrl, options);

    console.log("Backend status:", response.status);

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    // Image / file passthrough (e.g. if a GET ever returns a file directly)
    if (
      contentType &&
      (
        contentType.startsWith("image/") ||
        contentType.startsWith("application/octet-stream") ||
        contentType.includes("pdf") ||
        contentType.includes("zip")
      )
    ) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return res.status(response.status).send(buffer);
    }

    const data = await response.text();

    console.log("Backend response:", data.substring(0, 1000));

    res.status(response.status).send(data);
  } catch (error) {
    console.error("=================================");
    console.error("USERS PROXY ERROR:", error);
    console.error("=================================");

    res.status(502).json({
      error: "Users proxy failed",
      details: error.message,
    });
  }
}