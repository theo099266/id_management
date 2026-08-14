// api/[...path].js
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

    const segments = targetPath.split("/");
    if (segments.length > 0) {
      const firstSegmentLower = segments[0].toLowerCase();
      if (CONTROLLER_CASE_MAP[firstSegmentLower]) {
        segments[0] = CONTROLLER_CASE_MAP[firstSegmentLower];
        targetPath = segments.join("/");
      }
    }

    // uploads/* is handled entirely by api/uploads/[...path].js now — this
    // file should never see those paths, so no isUploadsPath branch needed.
    const backendUrl = `https://id-management-api.runasp.net/api/${targetPath}${queryString}`;

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

    const data = await response.text();
    return res.status(response.status).send(data);
  } catch (error) {
    return res.status(502).json({ error: "Proxy request failed", details: error.message });
  }
}