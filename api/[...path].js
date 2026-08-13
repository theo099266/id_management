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

    // Forward body for POST, PUT, PATCH, etc.
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
    console.log(
      "Backend response:",
      data.substring(0, 500)
    );

    res.status(response.status).send(data);

  } catch (error) {
    console.error("PROXY ERROR:", error);

    res.status(502).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}