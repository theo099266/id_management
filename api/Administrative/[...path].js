export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  
  console.log(" ADMINISTRATIVE VERCEL FUNCTION HIT");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  

  try {
    const url = new URL(
      req.url,
      `https://${req.headers.host}`
    );

    const targetPath = url.pathname.replace(
      /^\/api\/Administrative\/?/,
      ""
    );

    const backendUrl = targetPath
      ? `https://id-management-api.runasp.net/api/Administrative/${targetPath}${url.search}`
      : `https://id-management-api.runasp.net/api/Administrative${url.search}`;

    console.log("Backend:", backendUrl);

    const headers = {};

    // Forward authorization
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Forward content type INCLUDING multipart boundary
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const options = {
      method: req.method,
      headers,
    };

    // Forward the raw request body
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      if (chunks.length > 0) {
        options.body = Buffer.concat(chunks);
      }
    }

    console.log("Sending request to:", backendUrl);

    const response = await fetch(
      backendUrl,
      options
    );

    console.log(
      "Backend status:",
      response.status
    );

    const responseContentType =
      response.headers.get("content-type");

    if (responseContentType) {
      res.setHeader(
        "Content-Type",
        responseContentType
      );
    }

    const data = await response.arrayBuffer();

    console.log(
      "Backend response bytes:",
      data.byteLength
    );

    res
      .status(response.status)
      .send(Buffer.from(data));

  } catch (error) {
    console.error(
      "ADMINISTRATIVE PROXY ERROR:",
      error
    );

    res.status(502).json({
      error: "Administrative proxy failed",
      details: error.message,
    });
  }
}