export default async function handler(req, res) {
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;

  // targetPath already includes "api/..." because axios.js sends it that way
  const backendUrl = `http://id-management-api.runasp.net/${targetPath}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(backendUrl, fetchOptions);

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: 'Proxy request failed', details: error.message });
  }
}