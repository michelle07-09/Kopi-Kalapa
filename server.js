const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const CATALOG_FILE = path.join(DATA_DIR, "catalog.json");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const mediaFiles = new Set([
  "aeropress_brewing_process_hands_pressing_down_minimalist_clean_photography_warm.png",
  "detail_shot_of_a_french_press_with_dark_coffee_warm_morning_light_minimalist.png",
  "top_down_view_of_a_v60_coffee_dripper_on_a_glass_server_clean_minimalist.png",
  "buatkan_video_sesuai_dengan_ga.mp4"
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sanitizeString(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function serveFile(res, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendError(res, 404, "File not found");
      return;
    }
    sendError(res, 500, "Unable to read file");
  }
}

async function handleApi(req, res, url) {
  const catalog = await readJson(CATALOG_FILE);
  const store = await readJson(STORE_FILE, {
    cart: [],
    inquiries: [],
    subscriptions: [],
    orders: []
  });

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "kopi-kalapa", time: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/products") {
    const params = url.searchParams;
    const roast = params.get("roast");
    const region = params.get("region");
    const query = (params.get("q") || "").toLowerCase();
    const products = catalog.products.filter(product => {
      const matchesRoast = !roast || product.roast.toLowerCase() === roast.toLowerCase();
      const matchesRegion = !region || product.region.toLowerCase().includes(region.toLowerCase());
      const haystack = `${product.name} ${product.region} ${product.process} ${product.notes.join(" ")}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesRoast && matchesRegion && matchesQuery;
    });
    sendJson(res, 200, products);
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/products/")) {
    const slug = decodeURIComponent(url.pathname.replace("/api/products/", ""));
    const product = catalog.products.find(item => item.slug === slug || item.id === slug);
    if (!product) {
      sendError(res, 404, "Product not found");
      return;
    }
    sendJson(res, 200, product);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/site") {
    sendJson(res, 200, {
      location: catalog.location,
      plans: catalog.plans
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/cart") {
    const enriched = store.cart.map(item => {
      const product = catalog.products.find(productItem => productItem.id === item.productId);
      return { ...item, product };
    });
    sendJson(res, 200, enriched);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/cart") {
    const body = await readBody(req);
    const product = catalog.products.find(item => item.id === body.productId);
    if (!product) {
      sendError(res, 400, "Unknown product");
      return;
    }
    const quantity = Math.max(1, Math.min(20, Number(body.quantity || 1)));
    const cartItem = {
      id: randomUUID(),
      productId: product.id,
      quantity,
      grind: sanitizeString(body.grind || "Whole Bean", 60),
      weight: sanitizeString(body.weight || product.weight, 30),
      subscription: Boolean(body.subscription),
      createdAt: new Date().toISOString()
    };
    store.cart.push(cartItem);
    await writeJson(STORE_FILE, store);
    sendJson(res, 201, { ...cartItem, product });
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/cart") {
    store.cart = [];
    await writeJson(STORE_FILE, store);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    if (!store.cart.length) {
      sendError(res, 400, "Cart is empty");
      return;
    }
    const body = await readBody(req);
    const email = sanitizeString(body.email, 120);
    if (!validateEmail(email)) {
      sendError(res, 400, "Valid email is required");
      return;
    }
    const order = {
      id: randomUUID(),
      email,
      name: sanitizeString(body.name, 120),
      items: store.cart,
      createdAt: new Date().toISOString()
    };
    store.orders.push(order);
    store.cart = [];
    await writeJson(STORE_FILE, store);
    sendJson(res, 201, order);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/inquiries") {
    const body = await readBody(req);
    const inquiry = {
      id: randomUUID(),
      name: sanitizeString(body.name, 120),
      email: sanitizeString(body.email, 120),
      businessName: sanitizeString(body.businessName, 160),
      businessType: sanitizeString(body.businessType, 80),
      volume: sanitizeString(body.volume, 80),
      message: sanitizeString(body.message, 1000),
      createdAt: new Date().toISOString()
    };
    if (!inquiry.name || !validateEmail(inquiry.email) || !inquiry.businessName) {
      sendError(res, 400, "Name, valid email, and business name are required");
      return;
    }
    store.inquiries.push(inquiry);
    await writeJson(STORE_FILE, store);
    sendJson(res, 201, inquiry);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/subscriptions") {
    const body = await readBody(req);
    const plan = catalog.plans.find(item => item.id === body.planId);
    const email = sanitizeString(body.email, 120);
    if (!plan || !validateEmail(email)) {
      sendError(res, 400, "Plan and valid email are required");
      return;
    }
    const subscription = {
      id: randomUUID(),
      planId: plan.id,
      email,
      name: sanitizeString(body.name, 120),
      createdAt: new Date().toISOString()
    };
    store.subscriptions.push(subscription);
    await writeJson(STORE_FILE, store);
    sendJson(res, 201, { ...subscription, plan });
    return;
  }

  sendError(res, 404, "API route not found");
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    if (url.pathname.startsWith("/media/")) {
      const fileName = path.basename(decodeURIComponent(url.pathname));
      if (!mediaFiles.has(fileName)) {
        sendError(res, 404, "Media not found");
        return;
      }
      await serveFile(res, path.join(ROOT_DIR, fileName));
      return;
    }

    const safePath = path
      .normalize(decodeURIComponent(url.pathname))
      .replace(/^([/\\])+/, "")
      .replace(/^(\.\.[/\\])+/, "");
    const requestedPath = safePath === "" ? "index.html" : safePath;
    const publicFile = path.join(PUBLIC_DIR, requestedPath);
    const relative = path.relative(PUBLIC_DIR, publicFile);

    if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
      try {
        const stats = await fs.stat(publicFile);
        if (stats.isFile()) {
          await serveFile(res, publicFile);
          return;
        }
      } catch {
        // Fall through to SPA entry.
      }
    }

    await serveFile(res, path.join(PUBLIC_DIR, "index.html"));
  } catch (error) {
    sendError(res, 500, error.message || "Server error");
  }
}

http.createServer(handleRequest).listen(PORT, () => {
  console.log(`Kopi Kalapa running at http://localhost:${PORT}`);
});
