import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import type { PixelBuffer } from '../src/core/pixbuf.ts';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

export function encodePng(b: PixelBuffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(b.w, 0);
  ihdr.writeUInt32BE(b.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((b.w * 4 + 1) * b.h);
  for (let y = 0; y < b.h; y++) {
    raw[y * (b.w * 4 + 1)] = 0;
    Buffer.from(b.data.buffer, y * b.w * 4, b.w * 4).copy(raw, y * (b.w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

export function writePng(path: string, b: PixelBuffer): void {
  writeFileSync(path, encodePng(b));
}
