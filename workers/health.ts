import http from 'http';

export function startHealthServer(port = 3001) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200);
      res.end('OK');
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`🩺 Health check server running on port ${port}`);
  });

  return server;
}