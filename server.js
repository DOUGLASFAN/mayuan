// Minimal zero-dependency static server for local review
const http = require('http');
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md':   'text/markdown; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

// Text-based MIME types that benefit from gzip
const COMPRESSIBLE = new Set([
    'text/html; charset=utf-8',
    'text/css; charset=utf-8',
    'application/javascript; charset=utf-8',
    'application/json; charset=utf-8',
    'text/markdown; charset=utf-8',
    'image/svg+xml',
]);

const GZIP_THRESHOLD = 1024; // only compress responses > 1KB

const server = http.createServer((req, res) => {
    // Decode URL and prevent directory traversal
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT, safe);

    // Ensure we stay inside ROOT
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }

        const acceptGzip = (req.headers['accept-encoding'] || '').includes('gzip');
        const shouldCompress = acceptGzip && COMPRESSIBLE.has(mime) && data.length > GZIP_THRESHOLD;

        if (shouldCompress) {
            res.writeHead(200, {
                'Content-Type': mime,
                'Content-Encoding': 'gzip',
                'Vary': 'Accept-Encoding',
            });
            zlib.gzip(data, (gzErr, compressed) => {
                if (gzErr) {
                    // Fallback: send uncompressed if gzip fails
                    res.writeHead(200, { 'Content-Type': mime });
                    res.end(data);
                } else {
                    res.end(compressed);
                }
            });
        } else {
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('  ╭────────────────────────────────────────╮');
    console.log('  │   马克思主义原理 · 刷题复习系统       │');
    console.log('  ├────────────────────────────────────────┤');
    console.log('  │  选择题刷题  http://localhost:' + PORT + '/exam.html');
    console.log('  │  简答题复习  http://localhost:' + PORT + '/review.html');
    console.log('  │  首页导航    http://localhost:' + PORT + '/');
    console.log('  ├────────────────────────────────────────┤');
    console.log('  │  Gzip 已启用 · 按 Ctrl+C 停止服务器    │');
    console.log('  ╰────────────────────────────────────────╯');
    console.log('');
});
