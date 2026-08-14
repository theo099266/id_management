const CONTROLLER_CASE_MAP = {
  administrative: "Administrative",
  auth: "Auth",
  health: "Health",
  projectofficers: "ProjectOfficers",
  signatories: "Signatories",
  signatures: "signatures",
  template: "Template",
  users: "users",
};

export default async function handler(req, res) {
  try {
    console.log("=================================");
    console.log("VERCEL PROXY HIT");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("=================================");

    const url = new URL(req.url, `https://${req.headers.host}`);

    // Remove /api/ from the beginning
    let targetPath = url.pathname.replace(/^\/api\/?/, "");

    const queryString = url.search;

    // Fix controller casing
    const segments = targetPath.split("/");

    if (segments.length > 0) {
      const firstSegmentLower = segments[0].toLowerCase();

      if (CONTROLLER_CASE_MAP[firstSegmentLower]) {
        segments[0] = CONTROLLER_CASE_MAP[firstSegmentLower];
        targetPath = segments.join("/");
      }
    }

    // Handle uploads separately
    const isUploadsPath = targetPath
      .toLowerCase()
      .startsWith("uploads/");

    const backendUrl = isUploadsPath
      ? `https://id-management-api.runasp.net/${targetPath}${queryString}`
      : `https://id-management-api.runasp.net/api/${targetPath}${queryString}`;

    console.log("PROXY REQUEST");
    console.log("Method:", req.method);
    console.log("Original URL:", req.url);
    console.log("Target Path:", targetPath);
    console.log("Backend:", backendUrl);

    // Forward headers
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

    // Forward request body
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.body !== undefined && req.body !== null) {
        options.body =
          typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body);
      }
    }

    console.log("Sending request to backend...");

    const response = await fetch(backendUrl, options);

    console.log("Backend status:", response.status);

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const data = await response.text();

    console.log(
      "Backend response:",
      data.substring(0, 1000)
    );

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