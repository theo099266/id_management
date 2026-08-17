const BACKEND_URL = "https://id-management-api.runasp.net";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("=================================");
  console.log("🔥 IMAGE ROUTE HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Query:", req.query);
  console.log("=================================");

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: "Missing Project Officer ID",
    });
  }

  const backendUrl =
    `${BACKEND_URL}/api/ProjectOfficers/${id}/image`;

  console.log("🔥 Backend URL:");
  console.log(backendUrl);

  try {
    const headers = {};

    // Forward authorization
    if (req.headers.authorization) {
      headers.Authorization =
        req.headers.authorization;
    }

    // Forward content type
    if (req.headers["content-type"]) {
      headers["Content-Type"] =
        req.headers["content-type"];
    }

    // Forward content length
    if (req.headers["content-length"]) {
      headers["Content-Length"] =
        req.headers["content-length"];
    }

    const options = {
      method: req.method,
      headers,
      duplex: "half",
    };

    // Only forward body when there is one
    if (!["GET", "HEAD"].includes(req.method)) {
      options.body = req;
    }

    console.log("🔥 Sending to backend...");

    const response = await fetch(
      backendUrl,
      options
    );

    console.log(
      "🔥 Backend status:",
      response.status
    );

    const contentType =
      response.headers.get("content-type");

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

    const data =
      await response.arrayBuffer();

    console.log(
      "🔥 Sending backend response to browser"
    );

    return res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error("=================================");
    console.error("🔥 IMAGE PROXY ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(502).json({
      error: "Image proxy failed",
      details: error.message,
    });
  }
}