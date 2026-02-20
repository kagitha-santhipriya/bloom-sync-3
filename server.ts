import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("bloomsync.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS farmer_inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT,
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    sowing_date TEXT,
    crop_category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS climate_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    avg_temp REAL,
    peak_bloom_day INTEGER,
    pollinator_peak_day INTEGER
  );
`);

// Seed some simulated historical data if empty
const rowCount = db.prepare("SELECT COUNT(*) as count FROM climate_data").get() as { count: number };
if (rowCount.count === 0) {
  const insert = db.prepare("INSERT INTO climate_data (year, avg_temp, peak_bloom_day, pollinator_peak_day) VALUES (?, ?, ?, ?)");
  for (let i = 0; i < 20; i++) {
    const year = 2006 + i;
    // Simulate slight warming trend
    const avgTemp = 24 + (i * 0.1) + (Math.random() * 0.5);
    // Bloom day shifts earlier with higher temp (e.g., day 100 - temp factor)
    const peakBloomDay = Math.round(100 - (avgTemp - 24) * 5 + (Math.random() * 2));
    // Pollinator peak is more stable but slightly affected
    const pollinatorPeakDay = Math.round(95 + (Math.random() * 5));
    insert.run(year, avgTemp, peakBloomDay, pollinatorPeakDay);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/climate-history", (req, res) => {
    const data = db.prepare("SELECT * FROM climate_data ORDER BY year ASC").all();
    res.json(data);
  });

  app.post("/api/farmer-input", (req, res) => {
    const { crop_name, location_name, latitude, longitude, sowing_date, crop_category } = req.body;
    const info = db.prepare(`
      INSERT INTO farmer_inputs (crop_name, location_name, latitude, longitude, sowing_date, crop_category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(crop_name, location_name, latitude, longitude, sowing_date, crop_category);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/farmer-inputs", (req, res) => {
    const data = db.prepare("SELECT * FROM farmer_inputs ORDER BY created_at DESC").all();
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
