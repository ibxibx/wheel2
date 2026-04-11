import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = Number(process.env.PORT || 4173);

const mimeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/** Load firebase config from gitignored file — never committed. */
async function loadFirebaseConfig() {
  try {
    const raw = await readFile(join(__dirname, "firebase-config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    console.warn("⚠  firebase-config.json not found — copy firebase-config.example.json and fill in your values.");
    return null;
  }
}

const firebaseConfig = await loadFirebaseConfig();

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) { res.writeHead(400); res.end("Bad Request"); return; }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    // API endpoint: serve firebase config at runtime (never in source)
    if (parsedUrl.pathname === "/api/firebase-config") {
      if (!firebaseConfig) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Firebase not configured" }));
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(firebaseConfig));
      return;
    }

    const requestPath = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;
    const filePath = join(__dirname, requestPath);

    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }

    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const mime = mimeByExt[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Wheel app running on http://localhost:${PORT}`);
  if (!firebaseConfig) {
    console.log("Firebase is NOT configured — create firebase-config.json from the example file.");
  } else {
    console.log("Firebase config loaded.");
  }
});
