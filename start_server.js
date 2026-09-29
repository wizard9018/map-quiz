// start_server.js - 本地轻量 Web 服务器，用于本地测试 map-quiz & focus 专注力小游戏
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = 8080;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function tryListen(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(__dirname, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      tryListen(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}/index.html`;
    console.log(`===================================================`);
    console.log(`>>> 本地测试服务已就绪: ${url} <<<`);
    console.log(`>>> 独立全屏测试: http://127.0.0.1:${port}/focus.html <<<`);
    console.log(`===================================================`);
    
    // 调用系统默认浏览器自动打开
    exec(`start ${url}`);
  });
}

tryListen(PORT);
