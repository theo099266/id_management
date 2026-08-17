export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_URL =
  "https://id-management-api.runasp.net";

export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 PROJECT OFFICERS VERCEL PROXY");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Query:", req.query);
  console.log("=================================");

  try {
    // -----------------------------------------
    // GET CATCH-ALL PATH
    // -----------------------------------------

    const { path } = req.query;

    const targetPath = Array.isArray(path)
      ? path.join("/")
      : path || "";

    console.log("Target Path:", targetPath);

    // -----------------------------------------
    // BACKEND URL
    // -----------------------------------------

    const backendUrl =
      targetPath
        ? `${BACKEND_URL}/api/ProjectOfficers/${targetPath}`
        : `${BACKEND_URL}/api/ProjectOfficers`;

    console.log("Backend:", backendUrl);

    // -----------------------------------------
    // HEADERS
    // -----------------------------------------

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization =
        req.headers.authorization;
    }

    if (req.headers["content-type"]) {
      headers["Content-Type"] =
        req.headers["content-type"];
    }

    if (req.headers["content-length"]) {
      headers["Content-Length"] =
        req.headers["content-length"];
    }

    // -----------------------------------------
    // OPTIONS
    // -----------------------------------------

    const options = {
      method: req.method,
      headers,
    };

    // -----------------------------------------
    // BODY
    // -----------------------------------------

    if (!["GET", "HEAD"].includes(req.method)) {
      options.body = req;
      options.duplex = "half";
    }

    console.log("Sending request to backend...");

    // -----------------------------------------
    // REQUEST
    // -----------------------------------------

    const response = await fetch(
      backendUrl,
      options
    );

    console.log(
      "Backend status:",
      response.status
    );

    // -----------------------------------------
    // RESPONSE HEADERS
    // -----------------------------------------

    const contentType =
      response.headers.get(
        "content-type"
      );

    if (contentType) {
      res.setHeader(
        "Content-Type",
        contentType
      );
    }

    const contentDisposition =
      response.headers.get(
        "content-disposition"
      );

    if (contentDisposition) {
      res.setHeader(
        "Content-Disposition",
        contentDisposition
      );
    }

    // -----------------------------------------
    // RESPONSE BODY
    // -----------------------------------------

    const data =
      await response.arrayBuffer();

    return res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "🔥 PROJECT OFFICERS PROXY ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return res.status(502).json({
      error:
        "Project Officers proxy failed",
      details: error.message,
    });
  }
}