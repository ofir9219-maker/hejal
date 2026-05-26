const http = require('http');

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('hejal funcionando ✅\n');
}).listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
