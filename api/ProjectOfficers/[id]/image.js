const BACKEND_URL = "https://id-management-api.runasp.net";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { id } = req.query;

  console.log("=================================");
  console.log("🔥 PROJECT OFFICERS SIGNATURE ROUTE HIT");
  console.log("Method:", req.method);
  console.log("ID:", id);
  console.log("=================================");

  const backendUrl = `${BACKEND_URL}/api/ProjectOfficers/${id}/signature`;

  const headers = {};
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];

  const options = { method: req.method, headers };
  if (!["GET", "HEAD"].includes(req.method)) {
    options.body = req;
    options.duplex = "half";
  }

  try {
    const response = await fetch(backendUrl, options);
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    const data = await response.text();
    return res.status(response.status).send(data);
  } catch (error) {
    console.error("SIGNATURE ROUTE PROXY ERROR:", error);
    return res.status(502).json({ error: "Proxy failed", details: error.message });
  }
}