const app = document.querySelector("#app");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const cartPanel = document.querySelector("[data-cart-panel]");
const overlay = document.querySelector("[data-overlay]");
const cartCount = document.querySelector("[data-cart-count]");
const cartItems = document.querySelector("[data-cart-items]");
const toast = document.querySelector("[data-toast]");

const state = {
  products: [],
  site: null,
  cart: [],
  filters: {
    q: "",
    roast: "",
    region: ""
  }
};

const routes = {
  "/": renderHome,
  "/shop": renderShop,
  "/story": renderStory,
  "/subscribe": renderSubscribe,
  "/wholesale": renderWholesale,
  "/visit": renderVisit
};

function formatPrice(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function navigate(path) {
  history.pushState({}, "", path);
  render();
}

function setActiveNav() {
  document.querySelectorAll("[data-link]").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", href === location.pathname);
  });
}

async function loadInitialData() {
  const [products, site, cart] = await Promise.all([
    api("/api/products"),
    api("/api/site"),
    api("/api/cart")
  ]);
  state.products = products;
  state.site = site;
  state.cart = cart;
  renderCart();
}

function productCard(product) {
  return `
    <article class="product-card">
      <a class="product-card__image" href="/product/${product.slug}" data-link aria-label="Lihat ${product.name}">
        <img src="${product.image}" alt="${product.name}">
      </a>
      <div class="product-card__body">
        <div>
          <h3><a href="/product/${product.slug}" data-link>${product.name}</a></h3>
          <p>${product.process} - ${product.roast} Roast</p>
        </div>
        <div class="chips">${product.notes.map(note => `<span class="chip">${note}</span>`).join("")}</div>
        <div class="price">${formatPrice(product.price)}</div>
        <button class="button button--primary" type="button" data-add-cart="${product.id}">Add to Cart</button>
      </div>
    </article>
  `;
}

function renderHome() {
  const featured = state.products.slice(0, 3);
  app.innerHTML = `
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Small-batch roastery Bandung</p>
        <h1>Artisanal Beans, Rooted in West Java.</h1>
        <p>Website Kopi Kalapa ini sudah terhubung frontend dan backend: katalog produk, cart, checkout, form wholesale, dan subscription berjalan lewat API lokal.</p>
        <div class="button-row">
          <a class="button button--primary" href="/shop" data-link>Shop Our Roast</a>
          <a class="button button--ghost" href="/story" data-link>Read Our Story</a>
        </div>
      </div>
      <div class="hero__media">
        <video src="/media/buatkan_video_sesuai_dengan_ga.mp4" autoplay muted loop playsinline poster="/media/top_down_view_of_a_v60_coffee_dripper_on_a_glass_server_clean_minimalist.png"></video>
        <div class="hero__stat">
          <p class="eyebrow">Since 2018</p>
          <strong>Direct trade beans, roasted weekly in Bandung.</strong>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured Roasts</p>
          <h2>Freshly roasted favorites</h2>
        </div>
        <a class="button button--ghost" href="/shop" data-link>View All</a>
      </div>
      <div class="grid">${featured.map(productCard).join("")}</div>
    </section>

    <section class="band">
      <div class="section split">
        <div class="media-tile">
          <img src="/media/detail_shot_of_a_french_press_with_dark_coffee_warm_morning_light_minimalist.png" alt="French press coffee">
        </div>
        <div>
          <p class="eyebrow">Rooted in tradition</p>
          <h2 class="page-title">Roasted with patience, served with purpose.</h2>
          <p class="lead">Kami mengambil inspirasi dari HTML awal: cerita petani, roastery Bandung, subscription, wholesale, dan visit page. Versi ini menyatukannya dalam satu aplikasi modern.</p>
          <div class="button-row" style="margin-top: 24px;">
            <a class="button button--secondary" href="/subscribe" data-link>Start Subscription</a>
            <a class="button button--ghost" href="/wholesale" data-link>Wholesale Inquiry</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

async function fetchFilteredProducts() {
  const params = new URLSearchParams();
  Object.entries(state.filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  state.products = await api(`/api/products?${params.toString()}`);
}

function renderShop() {
  app.innerHTML = `
    <section class="section">
      <div class="page-header">
        <p class="eyebrow">Shop</p>
        <h1>Freshly Roasted in Bandung</h1>
        <p>Filter berdasarkan roast, region, atau cari tasting note favoritmu.</p>
      </div>
      <div class="shop-layout" style="margin-top: 36px;">
        <aside class="filters">
          <label>
            Search
            <input type="search" value="${state.filters.q}" placeholder="Ciwidey, honey, citrus" data-filter="q">
          </label>
          <label>
            Roast Level
            <select data-filter="roast">
              <option value="">All Roast</option>
              <option value="Light" ${state.filters.roast === "Light" ? "selected" : ""}>Light</option>
              <option value="Medium" ${state.filters.roast === "Medium" ? "selected" : ""}>Medium</option>
              <option value="Dark" ${state.filters.roast === "Dark" ? "selected" : ""}>Dark</option>
            </select>
          </label>
          <label>
            Region
            <select data-filter="region">
              <option value="">All Region</option>
              <option value="Ciwidey" ${state.filters.region === "Ciwidey" ? "selected" : ""}>Ciwidey</option>
              <option value="Garut" ${state.filters.region === "Garut" ? "selected" : ""}>Garut</option>
              <option value="Pangalengan" ${state.filters.region === "Pangalengan" ? "selected" : ""}>Pangalengan</option>
              <option value="Gunung Puntang" ${state.filters.region === "Gunung Puntang" ? "selected" : ""}>Gunung Puntang</option>
            </select>
          </label>
          <button class="button button--ghost" type="button" data-reset-filters>Reset Filter</button>
        </aside>
        <div>
          <div class="shop-toolbar">
            <strong>${state.products.length} products</strong>
            <span class="meta">API: <code>/api/products</code></span>
          </div>
          ${state.products.length ? `<div class="grid">${state.products.map(productCard).join("")}</div>` : `<div class="empty-state">Tidak ada produk yang cocok.</div>`}
        </div>
      </div>
    </section>
  `;
}

async function renderProduct(slug) {
  const product = await api(`/api/products/${slug}`);
  app.innerHTML = `
    <section class="section product-detail">
      <div class="product-detail__image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="buy-box">
        <div>
          <p class="eyebrow">${product.region}</p>
          <h1>${product.name}</h1>
          <p class="price">${formatPrice(product.price)}</p>
        </div>
        <div class="chips">${product.notes.map(note => `<span class="chip">${note}</span>`).join("")}</div>
        <p class="lead">${product.description}</p>
        <div class="info-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="info-card"><p class="eyebrow">Process</p><strong>${product.process}</strong></div>
          <div class="info-card"><p class="eyebrow">Altitude</p><strong>${product.altitude}</strong></div>
        </div>
        <form class="product-options" data-product-form="${product.id}">
          <div class="quantity-row">
            <label>Grind
              <select name="grind">
                <option>Whole Bean</option>
                <option>Fine</option>
                <option>Medium</option>
                <option>Coarse</option>
              </select>
            </label>
            <label>Weight
              <select name="weight">
                <option ${product.weight === "250g" ? "selected" : ""}>250g</option>
                <option ${product.weight === "500g" ? "selected" : ""}>500g</option>
                <option>1kg</option>
              </select>
            </label>
          </div>
          <div class="quantity-row">
            <label>Qty
              <input name="quantity" type="number" min="1" max="20" value="1">
            </label>
            <label>Subscribe
              <select name="subscription">
                <option value="false">One time</option>
                <option value="true">Subscribe and save 10%</option>
              </select>
            </label>
          </div>
          <button class="button button--primary" type="submit">Add to Cart</button>
        </form>
        <div class="info-card">
          <p class="eyebrow">Brew Guide</p>
          <p>${product.brew}</p>
        </div>
      </div>
    </section>
  `;
}

function renderStory() {
  app.innerHTML = `
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Our Story</p>
        <h1>A Heritage of Craft in Bandung</h1>
        <p>Born in Bandung, Kopi Kalapa dimulai dari keyakinan sederhana: kopi yang baik harus terasa dekat dengan tanah, petani, dan orang yang menyeduhnya.</p>
      </div>
      <div class="hero__media">
        <img src="/media/top_down_view_of_a_v60_coffee_dripper_on_a_glass_server_clean_minimalist.png" alt="V60 brewing coffee">
      </div>
    </section>
    <section class="section">
      <div class="story-steps">
        ${["Green Sourcing", "Small Batch Roast", "Quality Control", "Sustainable Packing"].map((title, index) => `
          <article class="info-card">
            <p class="eyebrow">Step ${index + 1}</p>
            <h3>${title}</h3>
            <p class="meta">Setiap langkah dibuat untuk menjaga karakter terroir West Java tetap terasa jelas di cangkir.</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSubscribe() {
  const plans = state.site.plans;
  app.innerHTML = `
    <section class="section">
      <div class="page-header">
        <p class="eyebrow">Subscribe and Save</p>
        <h1>Your Daily Ritual, Delivered.</h1>
        <p>Program langganan terhubung ke endpoint <code>/api/subscriptions</code>.</p>
      </div>
      <div class="grid" style="margin-top: 36px;">
        ${plans.map((plan, index) => `
          <article class="plan-card ${index === 1 ? "is-featured" : ""}">
            <p class="eyebrow">${index === 1 ? "Most Popular" : "Plan"}</p>
            <h3>${plan.name}</h3>
            <p class="meta">${plan.description}</p>
            <p><strong>${plan.bags}</strong></p>
            <p class="price">${formatPrice(plan.price)}</p>
            <form class="inline-form" data-subscribe-form="${plan.id}">
              <label>Nama<input name="name" type="text" placeholder="Nama" required></label>
              <label>Email<input name="email" type="email" placeholder="email@contoh.com" required></label>
              <button class="button ${index === 1 ? "button--ghost" : "button--primary"}" type="submit">Select</button>
            </form>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderWholesale() {
  app.innerHTML = `
    <section class="section">
      <div class="split">
        <div>
          <p class="eyebrow">Wholesale Partnerships</p>
          <h1 class="page-title">Fuel Your Business with Artisanal Bandung Coffee</h1>
          <p class="lead">Kami siapkan beans, training, dan konsultasi program kopi untuk cafe, restaurant, kantor, dan retail.</p>
        </div>
        <div class="media-tile">
          <img src="/media/aeropress_brewing_process_hands_pressing_down_minimalist_clean_photography_warm.png" alt="Coffee brewing">
        </div>
      </div>
    </section>
    <section class="section section--tight">
      <form class="form-shell" data-inquiry-form>
        <div class="section-heading">
          <div>
            <p class="eyebrow">Inquiry Form</p>
            <h2>Start a Conversation</h2>
          </div>
        </div>
        <div class="form-grid">
          <div class="field"><label>Nama<input name="name" type="text" placeholder="Jane Doe" required></label></div>
          <div class="field"><label>Email<input name="email" type="email" placeholder="jane@cafe.com" required></label></div>
          <div class="field"><label>Business Name<input name="businessName" type="text" placeholder="Nama bisnis" required></label></div>
          <div class="field"><label>Business Type<select name="businessType"><option>Independent Cafe</option><option>Restaurant / Hospitality</option><option>Corporate Office</option><option>Retail Store</option><option>Other</option></select></label></div>
          <div class="field"><label>Monthly Volume<select name="volume"><option>Under 10 kg</option><option>10 - 25 kg</option><option>26 - 50 kg</option><option>Over 50 kg</option></select></label></div>
          <div class="field field--full"><label>Message<textarea name="message" rows="5" placeholder="Ceritakan kebutuhan bisnis Anda"></textarea></label></div>
        </div>
        <div style="margin-top: 18px;"><button class="button button--primary" type="submit">Submit Inquiry</button></div>
      </form>
    </section>
  `;
}

function renderVisit() {
  const locationData = state.site.location;
  app.innerHTML = `
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Visit Us</p>
        <h1>Welcome Home</h1>
        <p>Experience the craft in person at our flagship roastery.</p>
        <div class="info-card">
          <p class="eyebrow">Address</p>
          <p><strong>${locationData.address}</strong></p>
          <p>${locationData.hours}</p>
          <p>${locationData.phone}</p>
          <p>${locationData.cupping}</p>
        </div>
      </div>
      <div class="hero__media">
        <img src="/media/detail_shot_of_a_french_press_with_dark_coffee_warm_morning_light_minimalist.png" alt="Coffee roastery table">
      </div>
    </section>
  `;
}

async function render() {
  setActiveNav();
  nav.classList.remove("is-open");
  const productMatch = location.pathname.match(/^\/product\/([^/]+)$/);
  try {
    if (productMatch) {
      await renderProduct(productMatch[1]);
    } else {
      const route = routes[location.pathname] || renderHome;
      route();
    }
    app.focus({ preventScroll: true });
  } catch (error) {
    app.innerHTML = `<section class="section"><div class="empty-state">${error.message}</div></section>`;
  }
}

function openCart() {
  cartPanel.classList.add("is-open");
  overlay.classList.add("is-open");
  cartPanel.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartPanel.classList.remove("is-open");
  overlay.classList.remove("is-open");
  cartPanel.setAttribute("aria-hidden", "true");
}

function renderCart() {
  const totalCount = state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  cartCount.textContent = totalCount;
  if (!state.cart.length) {
    cartItems.innerHTML = `<div class="empty-state">Cart masih kosong.</div>`;
    return;
  }
  const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  cartItems.innerHTML = `
    ${state.cart.map(item => `
      <article class="cart-item">
        <strong>${item.product.name}</strong>
        <span class="meta">${item.quantity} x ${item.weight} - ${item.grind}${item.subscription ? " - Subscription" : ""}</span>
        <span>${formatPrice(item.product.price * item.quantity)}</span>
      </article>
    `).join("")}
    <article class="cart-item"><strong>Total</strong><span class="price">${formatPrice(total)}</span></article>
  `;
}

async function addToCart(productId, detail = {}) {
  const item = await api("/api/cart", {
    method: "POST",
    body: JSON.stringify({ productId, ...detail })
  });
  state.cart.push(item);
  renderCart();
  showToast(`${item.product.name} masuk ke cart.`);
}

document.addEventListener("click", async event => {
  const link = event.target.closest("[data-link]");
  if (link && link.origin === location.origin) {
    event.preventDefault();
    navigate(link.pathname);
    return;
  }

  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) {
    await addToCart(addButton.dataset.addCart);
    return;
  }

  if (event.target.closest("[data-cart-open]")) openCart();
  if (event.target.closest("[data-cart-close]") || event.target === overlay) closeCart();

  if (event.target.closest("[data-cart-clear]")) {
    await api("/api/cart", { method: "DELETE" });
    state.cart = [];
    renderCart();
    showToast("Cart dikosongkan.");
  }

  if (event.target.closest("[data-reset-filters]")) {
    state.filters = { q: "", roast: "", region: "" };
    await fetchFilteredProducts();
    renderShop();
  }
});

document.addEventListener("input", async event => {
  const filter = event.target.closest("[data-filter]");
  if (!filter) return;
  state.filters[filter.dataset.filter] = filter.value;
  await fetchFilteredProducts();
  renderShop();
});

document.addEventListener("submit", async event => {
  const productForm = event.target.closest("[data-product-form]");
  if (productForm) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(productForm).entries());
    await addToCart(productForm.dataset.productForm, {
      quantity: Number(data.quantity || 1),
      grind: data.grind,
      weight: data.weight,
      subscription: data.subscription === "true"
    });
    openCart();
    return;
  }

  const checkoutForm = event.target.closest("[data-checkout-form]");
  if (checkoutForm) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(checkoutForm).entries());
    const order = await api("/api/orders", { method: "POST", body: JSON.stringify(data) });
    state.cart = [];
    renderCart();
    checkoutForm.reset();
    closeCart();
    showToast(`Order ${order.id.slice(0, 8)} berhasil dibuat.`);
    return;
  }

  const inquiryForm = event.target.closest("[data-inquiry-form]");
  if (inquiryForm) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(inquiryForm).entries());
    await api("/api/inquiries", { method: "POST", body: JSON.stringify(data) });
    inquiryForm.reset();
    showToast("Inquiry terkirim. Data tersimpan di backend.");
    return;
  }

  const subscribeForm = event.target.closest("[data-subscribe-form]");
  if (subscribeForm) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(subscribeForm).entries());
    await api("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({ ...data, planId: subscribeForm.dataset.subscribeForm })
    });
    subscribeForm.reset();
    showToast("Subscription berhasil dibuat.");
  }
});

navToggle.addEventListener("click", () => {
  nav.classList.toggle("is-open");
});

window.addEventListener("popstate", render);

loadInitialData()
  .then(render)
  .catch(error => {
    app.innerHTML = `<section class="section"><div class="empty-state">${error.message}</div></section>`;
  });
