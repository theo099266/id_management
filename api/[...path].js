export default async function handler(req, res) {
  try {
    const { path } = req.query;

    const targetPath = Array.isArray(path)
      ? path.join("/")
      : path || "";

    const backendUrl =
      `http://id-management-api.runasp.net/api/${targetPath}`;

    console.log("PROXY:", req.method, backendUrl);

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

    const response = await fetch(backendUrl, options);

    const data = await response.text();

    res.status(response.status);

    if (response.headers.get("content-type")) {
      res.setHeader(
        "Content-Type",
        response.headers.get("content-type")
      );
    }

    res.send(data);

  } catch (error) {
    console.error(error);

    res.status(502).json({
      error: "Proxy request failed",
      details: error.message
    });
  }
}