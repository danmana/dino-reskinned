// Receives frames and audio from record.html and writes them to disk.
//   node scripts/record-server.ts [outDir]     (default .rec, port 5318)
// Then: ffmpeg -framerate 60 -i .rec/frames/%05d.png -i .rec/audio.wav ... out.mp4
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve(process.argv[2] ?? '.rec');
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/frames`, { recursive: true });
let frames = 0;
let status = 'waiting';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors).end();
    return;
  }
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify({ frames, status }));
    return;
  }
  const chunks: Buffer[] = [];
  req.on('data', (c: Buffer) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const m = req.url?.match(/^\/frame\/(\d+)$/);
    if (m) {
      writeFileSync(`${out}/frames/${m[1].padStart(5, '0')}.png`, body);
      frames++;
    } else if (req.url === '/audio') writeFileSync(`${out}/audio.wav`, body);
    else if (req.url === '/done') {
      writeFileSync(`${out}/meta.json`, body);
      status = 'done';
      console.log(`done: ${frames} frames`);
    } else if (req.url === '/log') console.log(body.toString());
    res.writeHead(200, cors).end('ok');
  });
}).listen(5318, '127.0.0.1', () => console.log(`record server on :5318 writing to ${out}`));
