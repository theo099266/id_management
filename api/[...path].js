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
    const url = new URL(req.url, `https://${req.headers.host}`);
    let targetPath = url.pathname.replace(/^\/api\/?/, "");
    const queryString = url.search;

    const isUploadsPath = targetPath.toLowerCase().startsWith("uploads/");

    if (!isUploadsPath) {
      const segments = targetPath.split("/");
      const firstSegmentLower = segments[0].toLowerCase();
      if (CONTROLLER_CASE_MAP[firstSegmentLower]) {
        segments[0] = CONTROLLER_CASE_MAP[firstSegmentLower];
        targetPath = segments.join("/");
      }
    }

    const backendUrl = isUploadsPath
      ? `https://id-management-api.runasp.net/${targetPath}${queryString}`
      : `https://id-management-api.runasp.net/api/${targetPath}${queryString}`;

    console.log("PROXY REQUEST:", req.method, req.url, "->", backendUrl);

    const headers = {};
    if (req.headers.authorization) headers.Authorization = req.headers.authorization;
    if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];

    const options = { method: req.method, headers };
    if (!["GET", "HEAD"].includes(req.method) && req.body != null) {
      options.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(backendUrl, options);
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // Binary passthrough for images/PDFs/etc — needed for uploads
    if (
      contentType &&
      (contentType.startsWith("image/") ||
        contentType.startsWith("application/octet-stream") ||
        contentType.includes("pdf"))
    ) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return res.status(response.status).send(buffer);
    }

    const data = await response.text();
    return res.status(response.status).send(data);
  } catch (error) {
    console.error("PROXY ERROR:", error);
    return res.status(502).json({ error: "Proxy request failed", details: error.message });
  }
}