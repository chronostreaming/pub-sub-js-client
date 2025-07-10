export function sendJson(res, status, body) {
  const data = Buffer.from(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Connection', 'close');
  res.setHeader('Content-Length', data.length);
  res.end(data);
}
