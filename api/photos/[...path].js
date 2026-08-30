export default async function handler(req, res) {

  console.log("PHOTOS VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    const targetPath = url.pathname.replace(
      /^\/api\/photos\/?/,
      ""
    );

    // Prevent accidental double slash
    const backendUrl =
      `https://id-management-api.runasp.net/api/photos/${targetPath}${url.search}`;

    console.log("Target Path:", targetPath);
    console.log("Backend:", backendUrl);

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
    });

    console.log("Backend status:", response.status);

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
    console.error("PHOTOS PROXY ERROR");
    console.error(error);

    return res.status(502).json({
      error: "Photos proxy failed",
      details: error.message,
    });
  }
}