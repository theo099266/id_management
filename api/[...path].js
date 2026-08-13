export default async function handler(req, res) {
  try {
    const { path } = req.query;

    const targetPath = Array.isArray(path)
      ? path.join("/")
      : path || "";

    const backendUrl =
      `http://id-management-api.runasp.net/api/${targetPath}`;

    console.log("=================================");
    console.log("PROXY REQUEST");
    console.log("Method:", req.method);
    console.log("Backend:", backendUrl);
    console.log("=================================");

    const headers = {};

    // Forward authorization
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Forward content type
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const options = {
      method: req.method,
      headers,
    };

    // Handle request body
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

    res.status(response.status).send(data);

  } catch (error) {
    console.error("PROXY ERROR:", error);

    res.status(502).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}