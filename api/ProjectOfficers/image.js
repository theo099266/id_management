export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("🔥 DELETE IMAGE FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Query:", req.query);

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Project Officer ID is required",
      });
    }

    const backendUrl =
      `https://id-management-api.runasp.net/api/ProjectOfficers/${id}/image`;

    console.log("Backend:", backendUrl);

    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
    });

    console.log("Backend status:", response.status);

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const data = await response.arrayBuffer();

    return res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error("🔥 IMAGE PROXY ERROR:", error);

    return res.status(502).json({
      error: "Image proxy failed",
      details: error.message,
    });
  }
}