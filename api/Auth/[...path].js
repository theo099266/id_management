// IMPORTANT:
// Disable Vercel's automatic body parser.
// Needed so multipart/form-data (register with image upload)
// passes through untouched.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  
  console.log(" AUTH VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);

    // /api/Auth/login -> login   (case-insensitive, matches Auth/auth/AUTH)
    const targetPath = url.pathname.replace(/^\/api\/Auth\/?/i, "");

    const backendUrl =
      `https://id-management-api.runasp.net/api/Auth/${targetPath}${url.search}`;

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
    // This is what lets FormData (with files) pass through intact.
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

    const data = await response.text();

    console.log("Backend response:", data.substring(0, 1000));

    res.status(response.status).send(data);
  } catch (error) {
    console.error("AUTH PROXY ERROR:", error);

    res.status(502).json({
      error: "Auth proxy failed",
      details: error.message,
    });
  }
}