export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    let targetPath = url.pathname.replace(/^\/api\/?/, "");
    const queryString = url.search;

    const isUploadsPath = targetPath.startsWith("uploads/");
    const backendUrl = isUploadsPath
       ? `https://id-management-api.runasp.net/${targetPath}${queryString}`
      : `https://id-management-api.runasp.net/api/${targetPath}${queryString}`;

    console.log("=================================");
    console.log("PROXY REQUEST");
    console.log("Method:", req.method);
    console.log("Original URL:", req.url);
    console.log("Target Path:", targetPath);
    console.log("Backend:", backendUrl);
    console.log("=================================");

    const headers = {};

    // Forward Authorization
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Forward Content-Type
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const options = {
      method: req.method,
      headers,
    };

    // Forward body for POST, PUT, PATCH, DELETE, etc.
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.body !== undefined && req.body !== null) {
        options.body =
          typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body);
      }
    }

    const response = await fetch(backendUrl, options);

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const data = await response.text();

    console.log("Backend status:", response.status);
    console.log("Backend response:", data.substring(0, 1000));

    res.status(response.status).send(data);

  } catch (error) {
    console.error("=================================");
    console.error("PROXY ERROR");
    console.error(error);
    console.error("=================================");

    res.status(502).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}