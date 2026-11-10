// Ustvari PWA ikone iz SVG (zaženi: node scripts/make-icons.mjs). Rezultat je v public/icons/.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const svg = (size, pad) => {
  const s = size;
  const inner = s - pad * 2;
  const x0 = pad + inner * 0.14;
  const x1 = pad + inner * 0.86;
  const top = pad + inner * 0.3;
  const gap = inner * 0.09;
  const lines = [0, 1, 2, 3, 4]
    .map((i) => `<line x1="${x0}" x2="${x1}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="#f3f5f1" stroke-opacity=".5" stroke-width="${inner * 0.012}"/>`)
    .join("");
  const nx = pad + inner * 0.56;
  const ny = top + gap * 3;
  const rx = gap * 0.62;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#1d5b63"/>
  ${lines}
  <ellipse cx="${nx}" cy="${ny}" rx="${rx * 1.15}" ry="${rx * 0.85}" transform="rotate(-20 ${nx} ${ny})" fill="#f3f5f1"/>
  <rect x="${nx + rx * 0.95}" y="${ny - gap * 3.4}" width="${inner * 0.016}" height="${gap * 3.4}" fill="#f3f5f1"/>
</svg>`;
};

const jobs = [
  ["icon-192.png", 192, 0], ["icon-512.png", 512, 0],
  ["icon-maskable-512.png", 512, 512 * 0.1], ["apple-touch-icon.png", 180, 0],
];
for (const [name, size, pad] of jobs) {
  await sharp(Buffer.from(svg(size, pad))).png().toFile(`public/icons/${name}`);
}
await writeFile("public/icons/icon.svg", svg(512, 0));
console.log("ikone ustvarjene");
