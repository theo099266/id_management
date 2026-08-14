export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 SIGNATURES VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("=================================");

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    const targetPath = url.pathname.replace(
      /^\/api\/signatures\/?/,
      ""
    );

    const backendUrl =
      `https://id-management-api.runasp.net/api/signatures/${targetPath}${url.search}`;

    console.log("Target Path:", targetPath);
    console.log("Backend:", backendUrl);

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const response = await fetch(
      backendUrl,
      {
        method: req.method,
        headers,
      }
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

    const data = await response.arrayBuffer();

    return res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "🔥 SIGNATURES PROXY ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return res.status(502).json({
      error: "Signatures proxy failed",
      details: error.message,
    });
  }
}