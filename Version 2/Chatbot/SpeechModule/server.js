const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE = `http://localhost:${PORT}`;

const server = http.createServer((req, res) => {

  // ── CORS headers (allow browser requests) ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { pathname } = new URL(req.url, BASE);

  // ── Proxy route: POST /chat ──
  if (req.method === 'POST' && pathname === '/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { apiKey, userMessage, history } = JSON.parse(body);

        const messages = [
          {
            role: 'system',
            content: 'You are ARIA, a helpful and concise voice AI assistant. Keep responses short and conversational since they will be spoken aloud. Aim for 1-3 sentences unless more detail is needed.'
          },
          ...(history || []),
          { role: 'user', content: userMessage }
        ];

        const payload = JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 300
        });

        const options = {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const groqReq = https.request(options, groqRes => {
          let data = '';
          groqRes.on('data', chunk => data += chunk);
          groqRes.on('end', () => {
            res.writeHead(groqRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });

        groqReq.on('error', err => {
          console.error('Groq request error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: err.message } }));
        });

        groqReq.write(payload);
        groqReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Invalid request body' } }));
      }
    });
    return;
  }

  // ── Serve static files ──
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });

});

server.listen(PORT, () => {
  console.log('');
  console.log('  ✅  ARIA Server running!');
  console.log(`  🌐  Open: http://localhost:${PORT}`);
  console.log('  🔑  Enter your Groq key in the UI');
  console.log('');
});