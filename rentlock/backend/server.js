// Converted to CommonJS to match root package.json ("type": "commonjs")
// If you prefer ESM, change package.json to { "type": "module" } and revert to import syntax.
const express = require("express");
const multer = require("multer");
// Node 18+ has a global fetch; if on an older Node, install node-fetch@2 and require it.
// const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
const EPOCHS = 1;

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype || "application/octet-stream";

    const walrusRes = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=${EPOCHS}`, {
      method: "PUT",
      body: fileBuffer,
      headers: { "Content-Type": mimeType },
    });

    if (!walrusRes.ok) {
      const text = await walrusRes.text();
      throw new Error(`Walrus error: ${walrusRes.status} ${text}`);
    }

    let info;
    try {
      info = await walrusRes.json();
    } catch (e) {
      throw new Error("Failed to parse Walrus JSON response");
    }

    res.json({
      ok: true,
      blobId: info.blobId || info.newlyCreated?.blobObject?.blobId,
      mimeType,
      raw: info,
    });
  } catch (err) {
    console.error("/upload error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

app.get("/image/:blobId", async (req, res) => {
  try {
    const blobId = req.params.blobId;
    const mime = req.query.mime || "application/octet-stream";

    if (!blobId) {
      return res.status(400).send("Missing blobId");
    }

    const walrusRes = await fetch(`${AGGREGATOR_URL}/v1/blobs/${blobId}`);
    if (!walrusRes.ok) {
      const text = await walrusRes.text();
      throw new Error(`Walrus aggregator error: ${walrusRes.status} ${text}`);
    }

    const arrayBuf = await walrusRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("/image error:", err);
    res.status(500).send("File not found");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend Walrus running at http://localhost:${PORT}`);
  console.log("POST /upload -> return blobId + mimeType");
  console.log("GET  /image/:blobId?mime=xxx -> return file with correct format");
});

// Diagnostics to understand unexpected exits / crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
