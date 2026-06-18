(function () {
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");

  const state = {
    drawerOpen: false,
    accountOpen: false,
    loggedIn: localStorage.getItem("ownertech-static-session") === "yes",
  };

  const money = new Intl.NumberFormat("id-ID");

  // ----- Material Symbols Rounded icon helper (mirrors Flutter Icons.*_rounded)
  function icon(name, cls = "") {
    return `<span class="mi ${cls}">${name}</span>`;
  }

  // ---------------------------------------------------------------- ROUTES
  const routes = {
    splash: "Ownertech.id",
    welcome: "Project View",
    "auth/login": "Masuk",
    "auth/forgot-password": "Reset Password",
    "profile/complete": "Lengkapi Profil Owner",
    dashboard: "Beranda",
    cashier: "Mode Kasir",
    "cashier/history": "Riwayat Transaksi",
    products: "Daftar Barang",
    "inventory/alerts": "Stok Menipis & Habis",
    barcodes: "Barcode",
    suppliers: "Supplier",
    expenses: "Pengeluaran",
    returns: "Retur Barang",
    employees: "Karyawan",
    attendances: "Absensi",
    "attendances/report": "Riwayat & Rekap Absensi",
    payrolls: "Penggajian",
    branches: "Cabang",
    reports: "Laporan Keuangan",
    members: "Mitra",
    "members/payments": "Pembayaran Mitra",
    settings: "Pengaturan Toko",
    "settings/payments": "Payment Gateway & EDC",
    "settings/loyalty": "Program Mitra",
    "settings/print": "Ukuran Cetak",
    profile: "Profil Saya",
    notifications: "Pesan & Notifikasi",
    accounts: "Akun Karyawan",
    roles: "Role & Akses",
    "mitra/login": "Masuk sebagai Mitra",
    "mitra/home": "Portal Mitra",
    forbidden: "505 - Hayoo ngapain di sini?",
  };

  // Tombol aksi utama tiap layar — di desktop tampil di TopBar (FilledButton.icon).
  const routeActions = {
    products: ["Tambah Barang", "add_box"],
    suppliers: ["Tambah Supplier", "add"],
    expenses: ["Catat Pengeluaran", "add"],
    returns: ["Catat Retur", "add"],
    employees: ["Tambah Karyawan", "person_add"],
    branches: ["Tambah Cabang", "add"],
    members: ["Tambah Mitra", "person_add"],
    barcodes: ["Buat Barcode", "add"],
    accounts: ["Buat Akun", "person_add"],
    roles: ["Buat Role", "add"],
    attendances: ["Catat Absensi", "fingerprint"],
    payrolls: ["Hitung Gaji", "calculate"],
    reports: ["Export PDF", "picture_as_pdf"],
    "attendances/report": ["Unduh Rekap", "download"],
    "cashier/history": ["Export", "download"],
    settings: ["Simpan", "save"],
    "settings/payments": ["Simpan", "save"],
    "settings/loyalty": ["Simpan", "save"],
    "settings/print": ["Simpan", "save"],
    profile: ["Edit Profil", "edit"],
    "profile/complete": ["Simpan Profil", "save"],
  };

  // Menu utama — disusun persis seperti widgets/app_shell.dart (_allMenus).
  const menuGroups = [
    { label: "Beranda", icon: "dashboard", path: "dashboard" },
    {
      label: "Kasir",
      icon: "point_of_sale",
      children: [
        { label: "Transaksi Kasir", icon: "point_of_sale", path: "cashier" },
        { label: "Barang", icon: "inventory_2", path: "products" },
        { label: "Pengeluaran", icon: "receipt_long", path: "expenses" },
        { label: "Retur", icon: "assignment_return", path: "returns" },
      ],
    },
    { label: "Mitra", icon: "card_membership", path: "members" },
    { label: "Pembayaran Mitra", icon: "fact_check", path: "members/payments" },
    {
      label: "Inventori",
      icon: "inventory",
      children: [
        { label: "Barcode", icon: "qr_code_2", path: "barcodes" },
        { label: "Supplier", icon: "local_shipping", path: "suppliers" },
      ],
    },
    {
      label: "Laporan",
      icon: "insights",
      children: [{ label: "Laporan Keuangan", icon: "assessment", path: "reports" }],
    },
    {
      label: "SDM",
      icon: "groups",
      children: [
        { label: "Karyawan", icon: "badge", path: "employees" },
        { label: "Absensi", icon: "fingerprint", path: "attendances" },
        { label: "Penggajian", icon: "account_balance_wallet", path: "payrolls" },
      ],
    },
    { label: "Cabang", icon: "account_tree", path: "branches" },
  ];

  const accountMenus = [
    { label: "Profil Saya", icon: "person", path: "profile" },
    { label: "Akun Karyawan", icon: "manage_accounts", path: "accounts" },
    { label: "Role & Akses", icon: "shield", path: "roles" },
    { label: "Pengaturan Toko", icon: "tune", path: "settings" },
  ];

  // ---------------------------------------------------------------- HELPERS
  function currentRoute() {
    const raw = window.location.hash.replace(/^#\/?/, "");
    return raw || "splash";
  }

  function go(path) {
    window.location.hash = `#/${path}`;
  }

  function badge(label) {
    const key = String(label).toLowerCase();
    let tone = "";
    let ic = "";
    if (/(berhasil|aktif|normal|lunas|disetujui|selesai|terverifikasi|aman)/.test(key)) {
      tone = "success";
      ic = "check_circle";
    } else if (/(pending|review|menipis|proses|menunggu)/.test(key)) {
      tone = "warning";
      ic = "error";
    } else if (/(habis|tolak|ditolak|nonaktif|hutang|gagal|rusak)/.test(key)) {
      tone = "danger";
      ic = "cancel";
    } else if (/(qris|baru|info|tukar)/.test(key)) {
      tone = "info";
      ic = "info";
    }
    if (!tone) return `<span class="badge">${label}</span>`;
    return `<span class="badge tone-${tone}">${icon(ic, "s12")}${label}</span>`;
  }

  function showToast(message, ic = "check_circle") {
    toastEl.innerHTML = `${icon(ic)}<span>${message}</span>`;
    toastEl.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  }

  function todayLabel() {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  // Kartu tile daftar (meniru GlassCard + ListTile di Flutter).
  function tile(o) {
    const { icon: ic, tone = "primary", title, badge: b, lines = [], price, sub } = o;
    const trailing =
      o.trailing !== undefined
        ? o.trailing
        : `<button class="icon-button" data-action="showRowMenu()" title="Aksi">${icon("more_vert")}</button>`;
    const stats =
      price || sub
        ? `<div class="tile-stats">${price ? `<span class="tile-price">${price}</span>` : ""}${
            sub ? `<span class="tile-sub">${sub}</span>` : ""
          }</div>`
        : "";
    return `<article class="tile">
      <span class="tile-icon tone-${tone}">${icon(ic, "s26")}</span>
      <div class="tile-body">
        <div class="tile-row"><strong>${title}</strong>${b ? badge(b) : ""}</div>
        ${lines.map((l) => `<div class="tile-meta">${l}</div>`).join("")}
        ${stats}
      </div>
      ${trailing}
    </article>`;
  }

  function searchBar(placeholder, right = "") {
    return `<div class="toolbar">
      <label class="search">${icon("search")}<input placeholder="${placeholder}"></label>
      ${right ? `<div class="toolbar-right">${right}</div>` : ""}
    </div>`;
  }

  function listScreen(placeholder, items, right = "") {
    return `<div class="stack">${searchBar(placeholder, right)}<div class="list">${items
      .map(tile)
      .join("")}</div></div>`;
  }

  function sectionHeader(title, subtitle, ic, trailing = "") {
    return `<div class="section-header">
      <div class="section-title">
        <span class="section-title-icon">${icon(ic, "s20")}</span>
        <div><h2>${title}</h2><p>${subtitle}</p></div>
      </div>
      ${trailing}
    </div>`;
  }

  function formFields(labels, firstValue = "") {
    return `<div class="form-grid">${labels
      .map(
        (label, i) =>
          `<div class="field ${label.toLowerCase().includes("alamat") ? "full" : ""}">
            <label>${label}</label>
            <input class="input" value="${i === 0 ? firstValue : ""}" placeholder="${label}">
          </div>`
      )
      .join("")}</div>`;
  }

  // ---------------------------------------------------------------- RENDER
  function render() {
    const route = currentRoute();
    const publicRoutes = [
      "splash",
      "welcome",
      "auth/login",
      "auth/forgot-password",
      "mitra/login",
      "mitra/home",
    ];
    if (!state.loggedIn && !publicRoutes.includes(route)) {
      go("auth/login");
      return;
    }
    document.title = `${routes[route] || "Ownertech.id"} - Ownertech.id`;

    if (route === "splash") return renderSplash();
    if (route === "welcome") return renderWelcome();
    if (route === "auth/login") return renderLogin();
    if (route === "auth/forgot-password") return renderForgot();
    if (route === "mitra/login") return renderMitraLogin();
    if (route === "mitra/home") return renderMitraHome();

    app.innerHTML = shell(route, renderPage(route));
    bindActions();
  }

  function shell(route, content) {
    const action = routeActions[route];
    const initials = "MR";
    return `
      <div class="mobile-topbar">
        <button class="hamburger" data-action="toggleDrawer()" aria-label="Menu">${icon("menu")}</button>
        <a class="mobile-brand" href="#/dashboard">
          <span class="brand-mark">${icon("storefront")}</span>
          <span><strong>Ownertech.id</strong><span>Ownertech Store</span></span>
        </a>
        <button class="icon-button" data-nav="notifications">${icon("notifications")}<span class="dot-badge">3</span></button>
      </div>
      <div class="layout">
        ${state.drawerOpen ? '<button class="drawer-backdrop" data-action="toggleDrawer()" aria-label="Tutup menu"></button>' : ""}
        <aside class="sidebar ${state.drawerOpen ? "open" : ""}">
          <div class="sidebar-brand">
            <span class="brand-mark">${icon("storefront")}</span>
            <div><strong>Ownertech.id</strong><span>Ownertech Store</span></div>
          </div>
          <nav class="nav-scroll">${renderNav(route)}</nav>
          <div class="account-card ${state.accountOpen ? "open" : ""}">
            <button class="account-head" data-action="toggleAccount()">
              <span class="avatar">${initials}</span>
              <span class="meta"><strong>Muhammad Rafiq Amin</strong><span>Owner</span></span>
              ${icon("expand_more", "chevron")}
            </button>
            <div class="account-body">
              <div class="account-links">${accountMenus.map((m) => compactLink(m, route)).join("")}</div>
              <button class="logout-button" data-action="logoutDemo()">${icon("logout", "s16")}Keluar</button>
            </div>
          </div>
        </aside>
        <main class="content-shell">
          <header class="topbar">
            <h1>${routes[route] || "Ownertech.id"}</h1>
            <div class="topbar-actions">
              ${action ? `<button class="topbar-action" data-action="showFormModal('${action[0]}')">${icon(action[1])}${action[0]}</button>` : ""}
              <span class="branch-pill">${icon("account_tree")}Cabang Utama${icon("expand_more")}</span>
              <button class="icon-button" data-nav="notifications" title="Pesan & Notifikasi">${icon("notifications")}<span class="dot-badge">3</span></button>
              <button class="icon-button" data-action="showSyncDemo()" title="Status sinkronisasi data">${icon("cloud_done")}</button>
              <span class="status-pill"><span class="status-dot"></span>Server Normal</span>
            </div>
          </header>
          <section class="page">${content}</section>
          <footer class="footer">
            <span>Copyright © 2026 all rights reserved. Ownertech.id by <a href="#/welcome">Muhammad Rafiq Amin</a></span>
            <span class="version">Versi 1.0.0</span>
          </footer>
        </main>
      </div>`;
  }

  function renderNav(route) {
    return menuGroups
      .map((item) => {
        if (!item.children) return navLink(item, route, "nav-link");
        const activeInside = item.children.some((c) => c.path === route);
        return `<div class="nav-group ${activeInside ? "open active-inside" : ""}">
          <button class="nav-group-toggle" data-action="toggleGroup(this)">
            ${icon(item.icon)}<span>${item.label}</span>${icon("chevron_right", "chevron")}
          </button>
          <div class="nav-children">${item.children.map((c) => navLink(c, route, "nav-link")).join("")}</div>
        </div>`;
      })
      .join("");
  }

  function navLink(item, route, cls) {
    const active = route === item.path;
    return `<a class="${cls} ${active ? "active" : ""}" href="#/${item.path}">
      ${icon(item.icon)}<span>${item.label}</span>${active ? icon("chevron_right", "trailing") : ""}
    </a>`;
  }

  function compactLink(item, route) {
    const active = route === item.path;
    return `<a class="compact-link ${active ? "active" : ""}" href="#/${item.path}">${icon(item.icon)}<span>${item.label}</span></a>`;
  }

  // ---------------------------------------------------------------- PAGES
  function renderPage(route) {
    switch (route) {
      case "dashboard":
        return dashboardPage();
      case "cashier":
        return cashierPage();
      case "cashier/history":
        return historyPage();
      case "products":
        return productsPage();
      case "inventory/alerts":
        return stockAlertPage();
      case "barcodes":
        return barcodePage();
      case "suppliers":
        return suppliersPage();
      case "expenses":
        return expensesPage();
      case "returns":
        return returnsPage();
      case "employees":
        return employeesPage();
      case "attendances":
        return attendancePage();
      case "attendances/report":
        return reportAttendancePage();
      case "payrolls":
        return payrollPage();
      case "branches":
        return branchesPage();
      case "reports":
        return financeReportPage();
      case "members":
        return membersPage();
      case "members/payments":
        return paymentsPage();
      case "settings":
        return settingsPage();
      case "settings/payments":
        return paymentSettingsPage();
      case "settings/loyalty":
        return loyaltySettingsPage();
      case "settings/print":
        return printSettingsPage();
      case "profile":
        return profilePage();
      case "notifications":
        return notificationsPage();
      case "accounts":
        return accountsPage();
      case "roles":
        return rolesPage();
      case "profile/complete":
        return completeProfilePage();
      case "forbidden":
        return forbiddenPage();
      default:
        return dashboardPage();
    }
  }

  // -------- Dashboard
  const stats = [
    ["Pendapatan", "Rp 8.450.000", "attach_money", "success", "Hari ini"],
    ["Pengeluaran", "Rp 1.250.000", "payments", "warning", "Hari ini"],
    ["Transaksi", "128", "receipt_long", "info", "Hari ini"],
    ["Stok Menipis", "14 barang", "warning", "warning", ""],
    ["Stok Habis", "3 barang", "remove_shopping_cart", "danger", ""],
  ];

  function dashboardPage() {
    return `
      <div class="stack">
        <section class="hero-banner">
          <div>
            <h2>${greeting()}, Muhammad Rafiq Amin</h2>
            <p>Berikut ringkasan toko Anda hari ini, ${todayLabel()}.</p>
          </div>
          <span class="hero-banner-icon">${icon("insights", "s28")}</span>
        </section>
        <div class="grid stats-grid">${stats
          .map(
            ([label, value, ic, tone, hint]) => `
          <article class="stat-card tone-${tone}">
            <div class="stat-card-head"><span class="icon-tile">${icon(ic)}</span>${hint ? `<span class="hint">${hint}</span>` : ""}</div>
            <div class="label">${label}</div>
            <div class="value">${value}</div>
          </article>`
          )
          .join("")}</div>
        ${sectionHeader(
          "Grafik Keuangan",
          "Pendapatan vs pengeluaran hari ini.",
          "show_chart",
          `<div class="segmented"><button class="active">Hari</button><button>Minggu</button><button>Bulan</button><button>Tahun</button></div>`
        )}
        <section class="card finance-card">
          <div class="inline-metrics">
            <div class="inline-metric"><small>Pendapatan</small><strong style="color:var(--success)">Rp 8.450.000</strong></div>
            <div class="inline-metric"><small>Pengeluaran</small><strong style="color:var(--warning)">Rp 1.250.000</strong></div>
            <div class="inline-metric"><small>Laba</small><strong style="color:var(--primary)">Rp 7.200.000</strong></div>
          </div>
          <p class="muted" style="font-size:11.5px">Modal (HPP): Rp 3.120.000 &nbsp;•&nbsp; Laba kotor: Rp 5.330.000</p>
          <div class="chart">${[45, 62, 38, 76, 55, 88, 69, 92, 73, 84, 65, 95]
            .map((h) => `<span style="height:${h}%"></span>`)
            .join("")}</div>
        </section>
        ${sectionHeader("Akses Cepat", "Modul yang sering dipakai.", "bolt")}
        <div class="quick-grid">
          ${[
            ["Kasir", "cashier", "point_of_sale", "primary"],
            ["Barang", "products", "inventory_2", "info"],
            ["Barcode", "barcodes", "qr_code_2", "warning"],
            ["Absensi", "attendances", "fingerprint", "success"],
          ]
            .map(
              (q) =>
                `<button class="quick-action" data-nav="${q[1]}"><span class="icon-circle tone-${q[3]}">${icon(q[2])}</span><strong>${q[0]}</strong>${icon("chevron_right", "arrow")}</button>`
            )
            .join("")}
        </div>
      </div>`;
  }

  // -------- Cashier (POS)
  function cashierPage() {
    const search = [
      ["Kopi Robusta 250gr", "BRG-001", 42, "Rp 35.000"],
      ["Gula Aren 500gr", "BRG-002", 11, "Rp 21.000"],
      ["Susu UHT 1L", "BRG-004", 67, "Rp 19.500"],
    ];
    const cart = [
      ["Kopi Robusta 250gr", 2, 35000],
      ["Gula Aren 500gr", 1, 21000],
      ["Susu UHT 1L", 3, 19500],
    ];
    const subtotal = cart.reduce((s, i) => s + i[1] * i[2], 0);
    return `<div class="cashier-grid">
      <section class="cashier-cart-panel">
        <div class="search-card">
          <div class="toolbar" style="margin-bottom:0">
            <label class="search">${icon("qr_code_scanner")}<input placeholder="Scan barcode atau cari nama barang" value="kopi"></label>
            <span class="badge tone-success">${icon("check_circle", "s12")}Scanner USB aktif</span>
          </div>
          <div class="search-results">
            ${search
              .map(
                (p) =>
                  `<button class="search-result" data-action="showToast('${p[0]} ditambahkan ke keranjang')"><div><strong>${p[0]}</strong><br><small class="muted">${p[1]} · Stok ${p[2]}</small></div><span class="badge">${p[3]}</span></button>`
              )
              .join("")}
          </div>
        </div>
        <div class="cart-list">
          ${cart
            .map(
              (item) => `<article class="cart-item">
            <span class="tile-icon tone-primary" style="width:46px;height:46px;border-radius:12px">${icon("inventory_2", "s20")}</span>
            <div class="cart-item-main"><strong>${item[0]}</strong><small>${item[1]} × Rp ${money.format(item[2])}</small></div>
            <div class="qty-control"><button>${icon("remove")}</button><span>${item[1]}</span><button>${icon("add")}</button></div>
            <strong>Rp ${money.format(item[1] * item[2])}</strong>
          </article>`
            )
            .join("")}
        </div>
      </section>
      <aside class="cashier-checkout-panel">
        <h3 style="margin:0">Keranjang</h3>
        <div class="cart-total"><div class="toolbar" style="margin-bottom:0"><span>Subtotal</span><strong style="font-size:18px;margin:0;color:var(--text)">Rp ${money.format(subtotal)}</strong></div></div>
        <div class="field"><label>ID Mitra (opsional)</label><div style="display:flex;gap:8px"><input class="input" style="flex:1" value="0421"><button class="button-outline" data-action="showToast('Mitra ditemukan: Sari Mart')">Cek</button></div></div>
        <div class="card" style="background:var(--primary-soft);box-shadow:none;border-color:transparent;padding:14px"><strong>Sari Mart</strong><div class="muted" style="font-size:12px;margin:2px 0 8px">ID 0421 · 1.240 poin</div>${badge("Hutang Rp 420.000")}</div>
        <strong>Metode Pembayaran</strong>
        <div class="segmented"><button class="active">Cash</button><button>QRIS</button><button>Transfer</button><button>EDC</button></div>
        <div style="margin-top:auto;display:grid;gap:8px">
          <button class="button" data-action="showReceiptModal()">${icon("payments")}Proses Pembayaran</button>
          <button class="button-outline" data-action="showToast('Keranjang dibersihkan')">${icon("delete_sweep")}Bersihkan Keranjang</button>
        </div>
      </aside>
    </div>`;
  }

  function historyPage() {
    const trx = [
      ["TRX-2606001", "Kasir Utama · 18 Jun 2026 14:32", "Rp 350.000", "Cash", "Berhasil"],
      ["TRX-2606002", "Kasir Utama · 18 Jun 2026 13:10", "Rp 720.000", "QRIS", "Pending"],
      ["TRX-2606003", "Admin · 18 Jun 2026 11:48", "Rp 112.000", "Transfer", "Berhasil"],
      ["TRX-2606004", "Rafiq · 17 Jun 2026 19:05", "Rp 86.000", "EDC BCA", "Berhasil"],
    ];
    return listScreen(
      "Cari ID transaksi...",
      trx.map((t) => ({
        icon: "receipt_long",
        tone: "info",
        title: t[0],
        badge: t[4],
        lines: [t[1]],
        price: t[2],
        sub: t[3],
      })),
      `<div class="segmented"><button class="active">Hari ini</button><button>Minggu</button><button>Bulan</button></div>`
    );
  }

  // -------- Inventory
  function productsPage() {
    const products = [
      ["Kopi Robusta 250gr", "BRG-001", "899-001-2606001", "Rp 35.000", 42, "Aman"],
      ["Gula Aren 500gr", "BRG-002", "899-002-2606002", "Rp 21.000", 11, "Menipis"],
      ["Teh Premium Melati", "BRG-003", "899-003-2606003", "Rp 18.000", 0, "Habis"],
      ["Susu UHT Full Cream 1L", "BRG-004", "899-004-2606004", "Rp 19.500", 67, "Aman"],
      ["Minyak Goreng 1L", "BRG-005", "899-005-2606005", "Rp 17.000", 5, "Menipis"],
    ];
    return listScreen(
      "Cari nama, kode, atau barcode...",
      products.map((p) => ({
        icon: "inventory_2",
        tone: "primary",
        title: p[0],
        badge: p[5],
        lines: [`${p[1]} &nbsp;${icon("qr_code_2", "s12")}${p[2]}`],
        price: p[3],
        sub: `Stok ${p[4]}`,
      }))
    );
  }

  function stockAlertPage() {
    return `<div class="stack">
      <div class="grid two-col">
        <section class="card"><h3>Stok Menipis</h3><div class="list" style="margin-top:12px">
          ${[
            ["Gula Aren 500gr", "BRG-002", 11, 12],
            ["Minyak Goreng 1L", "BRG-005", 5, 10],
          ]
            .map((p) =>
              tile({
                icon: "warning",
                tone: "warning",
                title: p[0],
                badge: "Menipis",
                lines: [`${p[1]} · minimum ${p[3]}`],
                sub: `Sisa ${p[2]}`,
                trailing: "",
              })
            )
            .join("")}
        </div></section>
        <section class="card"><h3>Stok Habis</h3><div class="list" style="margin-top:12px">
          ${[["Teh Premium Melati", "BRG-003"]]
            .map((p) =>
              tile({
                icon: "remove_shopping_cart",
                tone: "danger",
                title: p[0],
                badge: "Habis",
                lines: [`${p[1]} · stok 0`],
                trailing: "",
              })
            )
            .join("")}
        </div></section>
      </div>
    </div>`;
  }

  function barcodePage() {
    const items = [
      ["Kopi Robusta 250gr", "899-001-2606001"],
      ["Gula Aren 500gr", "899-002-2606002"],
      ["Susu UHT 1L", "899-004-2606004"],
    ];
    return `<div class="stack">
      <div class="grid two-col">
        <div class="list">
          ${items
            .map((b) =>
              tile({
                icon: "qr_code_2",
                tone: "primary",
                title: b[0],
                lines: [b[1]],
                trailing: `<button class="button-soft" data-action="showToast('Label PDF dibuat')">${icon("print", "s18")}Cetak</button>`,
              })
            )
            .join("")}
        </div>
        <aside class="card"><h3>Preview Label</h3><div class="print-preview"><strong>Ownertech.id</strong><p>Kopi Robusta 250gr</p><div class="barcode"></div><p>899-001-2606001</p></div></aside>
      </div>
    </div>`;
  }

  function suppliersPage() {
    const data = [
      ["PT Sumber Kopi Nusantara", "0812-2222-1100", "Bandung", "Aktif"],
      ["CV Berkah Pangan Sejahtera", "0821-9000-7788", "Bekasi", "Aktif"],
      ["Toko Plastik Jaya Abadi", "0878-2345-9800", "Jakarta", "Review"],
    ];
    return listScreen(
      "Cari supplier...",
      data.map((s) => ({
        icon: "local_shipping",
        tone: "gold",
        title: s[0],
        badge: s[3],
        lines: [`${icon("call", "s12")}${s[1]} &nbsp; ${icon("place", "s12")}${s[2]}`],
      }))
    );
  }

  function expensesPage() {
    const data = [
      ["Operasional", "18 Jun 2026 · Beli plastik & thermal paper", "Rp 450.000"],
      ["Transport", "18 Jun 2026 · Kirim barang ke cabang", "Rp 180.000"],
      ["Maintenance", "17 Jun 2026 · Servis printer barcode", "Rp 620.000"],
    ];
    return listScreen(
      "Cari pengeluaran...",
      data.map((e) => ({
        icon: "receipt_long",
        tone: "warning",
        title: e[0],
        lines: [e[1]],
        sub: e[2],
      }))
    );
  }

  function returnsPage() {
    const data = [
      ["Susu UHT 1L", "Qty 2 · Rusak", "Kemasan bocor saat kirim", "Rusak"],
      ["Teh Premium Melati", "Qty 1 · Tukar barang", "Salah varian", "Tukar"],
    ];
    return listScreen(
      "Cari retur...",
      data.map((r) => ({
        icon: "assignment_return",
        tone: "danger",
        title: r[0],
        badge: r[3],
        lines: [r[1], r[2]],
        trailing: "",
      }))
    );
  }

  // -------- SDM
  function employeesPage() {
    const data = [
      ["Alya Putri", "Kasir", "Rp 3.200.000", "Aktif"],
      ["Dimas Pratama", "Admin Gudang", "Rp 3.600.000", "Aktif"],
      ["Nur Hasanah", "Supervisor", "Rp 4.700.000", "Aktif"],
    ];
    return listScreen(
      "Cari karyawan...",
      data.map((e) => ({
        icon: "badge",
        tone: "info",
        title: e[0],
        badge: e[3],
        lines: [e[1]],
        sub: `Gaji pokok ${e[2]}`,
      }))
    );
  }

  function attendancePage() {
    const summary = [
      ["Masuk Hari Ini", "18", "login", "success"],
      ["Terlambat", "2", "schedule", "warning"],
      ["Belum Absen", "4", "person_off", "danger"],
    ];
    const rows = [
      ["Alya Putri", "Masuk 08:02 · Keluar 17:04", "Aktif"],
      ["Dimas Pratama", "Masuk 08:31 · belum keluar", "Pending"],
      ["Nur Hasanah", "Masuk 07:55 · Keluar 17:20", "Aktif"],
    ];
    return `<div class="stack">
      <div class="grid three-col">${summary
        .map(
          (s) => `<article class="stat-card tone-${s[3]}"><div class="stat-card-head"><span class="icon-tile">${icon(s[2])}</span></div><div class="label">${s[0]}</div><div class="value">${s[1]}</div></article>`
        )
        .join("")}</div>
      <div class="list">${rows
        .map((r) =>
          tile({ icon: "fingerprint", tone: r[2] === "Aktif" ? "success" : "warning", title: r[0], badge: r[2], lines: [r[1]], trailing: "" })
        )
        .join("")}</div>
    </div>`;
  }

  function reportAttendancePage() {
    const data = [
      ["Alya Putri", "Hadir 24 hari · Terlambat 1 · Lembur 6 jam", "Juni 2026"],
      ["Dimas Pratama", "Hadir 22 hari · Terlambat 3 · Lembur 2 jam", "Juni 2026"],
      ["Nur Hasanah", "Hadir 25 hari · Terlambat 0 · Lembur 8 jam", "Juni 2026"],
    ];
    return listScreen(
      "Cari karyawan...",
      data.map((r) => ({ icon: "fact_check", tone: "primary", title: r[0], lines: [r[1]], sub: r[2], trailing: "" }))
    );
  }

  function payrollPage() {
    const data = [
      ["Alya Putri", "Juni 2026", "Rp 3.450.000", "Lunas"],
      ["Dimas Pratama", "Juni 2026", "Rp 3.720.000", "Pending"],
      ["Nur Hasanah", "Juni 2026", "Rp 4.950.000", "Lunas"],
    ];
    return listScreen(
      "Cari penggajian...",
      data.map((p) => ({
        icon: "account_balance_wallet",
        tone: "success",
        title: p[0],
        badge: p[3],
        lines: [`Periode ${p[1]}`],
        price: p[2],
      }))
    );
  }

  function branchesPage() {
    const data = [
      ["Cabang Utama", "Jl. Merdeka No. 12, Jakarta Selatan", "Aktif"],
      ["Cabang Bekasi", "Ruko Galaxy Blok C, Bekasi Barat", "Aktif"],
    ];
    return listScreen(
      "Cari cabang...",
      data.map((b) => ({ icon: "store", tone: "primary", title: b[0], badge: b[2], lines: [`${icon("place", "s12")}${b[1]}`] }))
    );
  }

  function financeReportPage() {
    const cards = [
      ["Pendapatan", "Rp 84.500.000", "attach_money", "success"],
      ["Pengeluaran", "Rp 18.250.000", "payments", "warning"],
      ["Laba Bersih", "Rp 66.250.000", "savings", "primary"],
      ["Transaksi", "1.284", "receipt_long", "info"],
    ];
    return `<div class="stack">
      <div class="grid four-col">${cards
        .map(
          (s) => `<article class="stat-card tone-${s[3]}"><div class="stat-card-head"><span class="icon-tile">${icon(s[2])}</span></div><div class="label">${s[0]}</div><div class="value">${s[1]}</div></article>`
        )
        .join("")}</div>
      ${sectionHeader("Tren Keuangan", "Pendapatan vs pengeluaran 8 periode terakhir.", "show_chart")}
      <section class="card"><div class="chart">${[63, 74, 58, 83, 71, 92, 77, 88]
        .map((h) => `<span style="height:${h}%"></span>`)
        .join("")}</div></section>
    </div>`;
  }

  // -------- Mitra
  function membersPage() {
    const data = [
      ["Sari Mart", "0421", "1.240", "Rp 420.000", "Aktif"],
      ["Budi Grosir", "0422", "880", "Rp 0", "Aktif"],
      ["Nina Shop", "0423", "340", "Rp 155.000", "Review"],
    ];
    return listScreen(
      "Cari mitra atau ID...",
      data.map((m) => ({
        icon: "card_membership",
        tone: "gold",
        title: m[0],
        badge: m[4],
        lines: [`ID ${m[1]} · ${m[2]} poin`],
        sub: `Hutang ${m[3]}`,
      }))
    );
  }

  function paymentsPage() {
    return `<div class="stack">
      ${sectionHeader("Tinjau Pembayaran Mandiri", "Bukti pembayaran hutang & transaksi dari portal Mitra.", "fact_check")}
      <div class="kanban">${["Menunggu", "Disetujui", "Ditolak"]
        .map(
          (col, i) => `<section class="kanban-column"><h3>${col}</h3>${[1, 2]
            .map(
              (n) =>
                `<div class="mini-card"><strong>PAY-${i + 1}${n}06</strong><div class="muted" style="font-size:12px;margin:2px 0 8px">Sari Mart · Rp ${money.format((i + n) * 85000)}</div>${badge(i === 0 ? "Pending" : i === 1 ? "Disetujui" : "Ditolak")}</div>`
            )
            .join("")}</section>`
        )
        .join("")}</div>
    </div>`;
  }

  // -------- Settings
  function settingsPage() {
    return `<div class="stack">
      <div class="grid two-col">
        <section class="form-panel"><h3>Informasi Toko</h3>${formFields(["Nama Toko", "Email", "Nomor Telepon", "Alamat"], "Ownertech Store")}</section>
        <aside class="card"><h3>Pengaturan Lanjutan</h3><div class="list" style="margin-top:12px">
          ${settingsLink("Payment Gateway & EDC", "Provider, QRIS, transfer, terminal EDC", "credit_card", "settings/payments")}
          ${settingsLink("Program Mitra", "Poin loyalitas & hutang / bon", "card_membership", "settings/loyalty")}
          ${settingsLink("Ukuran Cetak", "Struk & label barcode", "print", "settings/print")}
        </div></aside>
      </div>
    </div>`;
  }

  function settingsLink(label, sub, ic, path) {
    return `<button class="tile" data-nav="${path}" style="width:100%;text-align:left">
      <span class="tile-icon tone-primary" style="width:46px;height:46px;border-radius:12px">${icon(ic, "s20")}</span>
      <div class="tile-body"><div class="tile-row"><strong>${label}</strong></div><div class="muted" style="font-size:12px;margin-top:2px">${sub}</div></div>
      ${icon("chevron_right", "arrow")}
    </button>`;
  }

  function paymentSettingsPage() {
    return `<div class="stack">
      <div class="grid two-col">
        <section class="form-panel"><h3>Payment Gateway</h3>${formFields(["Provider", "Mode", "Bank VA", "Nama Rekening"], "Xendit")}</section>
        <section class="card"><h3>Mesin EDC</h3><div class="list" style="margin-top:12px">${[
          ["BCA Counter 1", "TCP / LAN ECR"],
          ["Mandiri Portable", "Bluetooth ECR"],
        ]
          .map((x) => tile({ icon: "point_of_sale", tone: "info", title: x[0], badge: "Aktif", lines: [x[1]], trailing: "" }))
          .join("")}</div></section>
      </div>
    </div>`;
  }

  function loyaltySettingsPage() {
    return `<div class="stack"><section class="form-panel"><h3>Program Mitra</h3>${formFields(
      ["Aktifkan Poin Loyalitas", "Rasio Poin (Rp / poin)", "Aktifkan Hutang / Bon", "Limit Hutang"],
      "Aktif"
    )}</section></div>`;
  }

  function printSettingsPage() {
    return `<div class="stack">
      <div class="grid two-col">
        <section class="form-panel"><h3>Ukuran Cetak</h3>${formFields(["Kertas Struk", "Lebar Barcode (mm)", "Tinggi Barcode (mm)", "Kolom per Baris"], "58mm")}</section>
        <section class="card"><h3>Preview Struk</h3><div class="print-preview"><strong>OWNERTECH STORE</strong><p>TRX-2606001</p><hr><p>2× Kopi Robusta 250gr</p><p>1× Gula Aren 500gr</p><hr><p><strong>Total Rp 91.000</strong></p><p>Terima kasih 🙏</p></div></section>
      </div>
    </div>`;
  }

  // -------- Akun
  function profilePage() {
    return `<div class="stack">
      <div class="grid two-col">
        <section class="card">
          <div class="account-head" style="cursor:default"><span class="avatar" style="width:48px;height:48px">MR</span><span class="meta"><strong>Muhammad Rafiq Amin</strong><span>owner@ownertech.id</span></span></div>
          <div class="list" style="margin-top:16px">${[
            ["Email Google pemulihan", "verified"],
            ["Nomor telepon terverifikasi", "verified"],
            ["Authenticator 2FA", "verified"],
            ["Kanal OTP", "verified"],
          ]
            .map(
              (x) =>
                `<div class="tile" style="padding:12px 14px"><span class="tile-icon tone-success" style="width:42px;height:42px;border-radius:12px">${icon(
                  "verified_user",
                  "s20"
                )}</span><div class="tile-body"><div class="tile-row"><strong>${x[0]}</strong>${badge("Aktif")}</div></div></div>`
            )
            .join("")}</div>
        </section>
        <section class="form-panel"><h3>Data Pribadi</h3>${formFields(["NIK", "Tanggal Lahir", "Jenis Kelamin", "Alamat"], "3210xxxxxxxxxxxx")}</section>
      </div>
    </div>`;
  }

  function notificationsPage() {
    const items = [
      ["Stok Gula Aren menipis", "Sisa 11 item, minimum 12.", "inventory_2", "warning", "Baru"],
      ["Pembayaran Mitra menunggu review", "Sari Mart mengirim bukti pembayaran.", "fact_check", "info", "Baru"],
      ["Sinkronisasi selesai", "4 transaksi offline terkirim ke server.", "cloud_done", "success", ""],
    ];
    return `<div class="stack"><div class="list">${items
      .map((n) =>
        tile({ icon: n[2], tone: n[3], title: n[0], badge: n[4] || null, lines: [n[1]], trailing: "" })
      )
      .join("")}</div></div>`;
  }

  function accountsPage() {
    const data = [
      ["Alya Putri", "alya@ownertech.id", "Kasir", "Aktif"],
      ["Dimas Pratama", "dimas@ownertech.id", "Gudang", "Aktif"],
      ["Nur Hasanah", "nur@ownertech.id", "Supervisor", "Aktif"],
    ];
    return listScreen(
      "Cari akun karyawan...",
      data.map((a) => ({
        icon: "manage_accounts",
        tone: "info",
        title: a[0],
        badge: a[3],
        lines: [`${icon("alternate_email", "s12")}${a[1]}`],
        sub: `Role ${a[2]}`,
      }))
    );
  }

  function rolesPage() {
    const data = [
      ["Owner", "Akses penuh semua cabang", "Semua hak akses", "Aktif"],
      ["Kasir", "Transaksi & mitra", "8 hak akses", "Aktif"],
      ["Gudang", "Produk, barcode, supplier", "7 hak akses", "Aktif"],
    ];
    return listScreen(
      "Cari role...",
      data.map((r) => ({ icon: "shield", tone: "primary", title: r[0], badge: r[3], lines: [r[1]], sub: r[2] }))
    );
  }

  function completeProfilePage() {
    return `<div class="stack"><section class="form-panel"><h3>Lengkapi Profil Owner</h3><p class="muted" style="margin:0 0 14px">Owner baru wajib melengkapi data usaha, kontak, data pribadi, dan preferensi OTP.</p>${formFields(
      ["Nama Toko", "Nama Owner", "Nomor Telepon", "Alamat Toko", "Kanal OTP", "Jenis Kelamin"],
      "Ownertech Store"
    )}</section></div>`;
  }

  function forbiddenPage() {
    return `<div class="empty"><span class="empty-icon" style="background:rgba(220,38,38,.1);color:var(--danger)">${icon("block", "s38")}</span><h3>505 - Hayoo ngapain di sini?</h3><p class="muted">Anda tidak punya izin mengakses halaman ini.</p><button class="button" data-nav="dashboard">${icon("home")}Kembali ke Beranda</button></div>`;
  }

  // ---------------------------------------------------------------- PUBLIC PAGES
  function renderSplash() {
    app.innerHTML = `
      <main class="splash-layout">
        <section class="splash-card">
          <div class="brand-mark splash-logo">${icon("storefront")}</div>
          <p class="eyebrow">Static preview portfolio</p>
          <h1>Ownertech.id</h1>
          <p>Salinan tampilan dari aplikasi Point of Sale: owner, kasir, inventori, SDM, laporan, pengaturan, dan portal Mitra.</p>
          <div class="splash-actions">
            <button class="button" data-action="loginDemo()">${icon("login")}Masuk sebagai Owner</button>
            <button class="button-outline" data-nav="welcome">Lihat Landing</button>
            <button class="button-soft" data-nav="mitra/login">${icon("card_membership")}Portal Mitra</button>
          </div>
        </section>
      </main>`;
    bindActions();
  }

  function renderWelcome() {
    const features = [
      ["Kasir offline + sync", "point_of_sale", "primary"],
      ["Multi cabang", "account_tree", "info"],
      ["Inventori & barcode", "qr_code_2", "warning"],
      ["Absensi wajah", "fingerprint", "success"],
      ["Penggajian", "account_balance_wallet", "gold"],
      ["Mitra: poin & hutang", "card_membership", "danger"],
    ];
    app.innerHTML = `
      <main class="welcome-layout">
        <section class="welcome-card">
          <div class="section-header">
            <div><p class="eyebrow">Ownertech.id</p><h1 style="font-size:clamp(28px,4vw,42px)">Operasional toko dalam satu dashboard</h1><p>Versi statis untuk GitHub Pages — navigasi & flow mengikuti struktur aplikasi asli.</p></div>
            <span class="brand-mark" style="width:56px;height:56px;border-radius:18px">${icon("storefront", "s28")}</span>
          </div>
          <div class="grid three-col">
            ${features
              .map(
                (f) => `<div class="card"><span class="icon-circle tone-${f[2]}">${icon(f[1])}</span><h3>${f[0]}</h3><p class="muted">Preview modul siap diklik dari sidebar aplikasi.</p></div>`
              )
              .join("")}
          </div>
          <div class="welcome-actions">
            <button class="button" data-action="loginDemo()">${icon("login")}Buka Dashboard</button>
            <button class="button-outline" data-nav="auth/login">Ke Halaman Login</button>
          </div>
        </section>
      </main>`;
    bindActions();
  }

  function renderLogin() {
    app.innerHTML = `
      <main class="auth-layout">
        <section class="auth-shell">
          <aside class="auth-panel">
            <span class="orb orb-1"></span>
            <span class="orb orb-2"></span>
            <div>
              <span class="hero-eyebrow">${icon("waving_hand", "s14")}SELAMAT DATANG</span>
              <h2>Selamat datang di<br>Ownertech.id</h2>
              <p>Ownertech.id adalah sistem Point of Sale untuk mengelola toko Anda secara menyeluruh — kasir, stok barang, supplier, karyawan, absensi biometrik, penggajian, hingga laporan keuangan — dalam satu aplikasi yang cepat, aman, dan mudah digunakan di Android maupun Windows.</p>
              <div class="feature-pills">
                <span>${icon("point_of_sale", "s14")}Kasir & Stok</span>
                <span>${icon("fingerprint", "s14")}Absensi biometrik</span>
                <span>${icon("insights", "s14")}Laporan keuangan</span>
              </div>
            </div>
          </aside>
          <div class="auth-card">
            <div class="auth-brand-row">
              <span class="brand-mark">${icon("storefront")}</span>
              <div><h1>Ownertech.id</h1><p>Point of Sale Premium</p></div>
            </div>
            <h1>Selamat datang kembali</h1>
            <p>Pilih cara masuk sesuai akun Anda.</p>
            <div class="auth-tabs"><button class="active" type="button">${icon("workspace_premium")}Owner</button><button type="button" data-action="showToast('Demo: login Karyawan butuh akun dari Owner','info')">${icon("badge")}Karyawan</button></div>
            <form class="auth-form" data-form="login">
              <label class="input-icon">${icon("alternate_email", "prefix")}<input class="input" value="owner@ownertech.id"></label>
              <label class="input-icon">${icon("lock", "prefix")}<input class="input" type="password" value="password"><button class="suffix" type="button" data-action="noop()">${icon("visibility")}</button></label>
              <button class="button" type="submit">${icon("login")}Masuk sebagai Owner</button>
            </form>
            <div class="auth-center"><a href="#/auth/forgot-password">Lupa kata sandi?</a></div>
            <div class="auth-center"><button class="button-outline" data-nav="mitra/login" style="width:100%">${icon("card_membership")}Masuk sebagai Mitra</button></div>
            <div class="auth-divider">Belum punya akun?</div>
            <div class="auth-center"><button class="button-soft" data-action="showRegisterModal()" style="width:100%">${icon("person_add")}Daftar Owner Baru</button></div>
          </div>
        </section>
      </main>`;
    bindActions();
  }

  function renderForgot() {
    app.innerHTML = `
      <main class="auth-layout">
        <section class="auth-shell">
          <aside class="auth-panel">
            <span class="orb orb-1"></span>
            <span class="orb orb-2"></span>
            <div>
              <span class="hero-eyebrow">${icon("lock_reset", "s14")}PEMULIHAN</span>
              <h2>Alur pemulihan<br>dibuat ringkas.</h2>
              <p>Email, kode OTP, password baru, lalu masuk kembali ke dashboard.</p>
            </div>
          </aside>
          <div class="auth-card">
            <div class="auth-brand-row"><span class="brand-mark">${icon("storefront")}</span><div><h1>Reset Password</h1><p>Kode OTP dikirim ke email</p></div></div>
            <h1>Lupa kata sandi?</h1>
            <p>Masukkan email akun Anda untuk menerima kode OTP.</p>
            <form class="auth-form" data-form="forgot">
              <label class="input-icon">${icon("alternate_email", "prefix")}<input class="input" value="owner@ownertech.id"></label>
              <button class="button" type="submit">${icon("send")}Kirim Kode OTP</button>
            </form>
            <div class="auth-center"><a href="#/auth/login">Kembali ke login</a></div>
          </div>
        </section>
      </main>`;
    bindActions();
  }

  function renderMitraLogin() {
    app.innerHTML = `<main class="auth-layout"><section class="auth-shell">
      <aside class="auth-panel">
        <span class="orb orb-1"></span><span class="orb orb-2"></span>
        <div><span class="hero-eyebrow">${icon("card_membership", "s14")}PORTAL MITRA</span><h2>Portal read-only<br>untuk pelanggan.</h2><p>Mitra dapat melihat hutang, poin, dan riwayat transaksi, lalu mengunggah bukti pembayaran.</p></div>
      </aside>
      <div class="auth-card">
        <div class="auth-brand-row"><span class="brand-mark">${icon("storefront")}</span><div><h1>Portal Mitra</h1><p>Cek poin & hutang Anda</p></div></div>
        <h1>Masuk sebagai Mitra</h1>
        <p>Gunakan ID Mitra dan nomor telepon terdaftar.</p>
        <form class="auth-form" data-form="mitra">
          <label class="input-icon">${icon("badge", "prefix")}<input class="input" value="0421"></label>
          <label class="input-icon">${icon("smartphone", "prefix")}<input class="input" value="0812-0000-0421"></label>
          <button class="button" type="submit">${icon("login")}Masuk Portal Mitra</button>
        </form>
        <div class="auth-center"><a href="#/auth/login">Masuk sebagai Owner</a></div>
      </div>
    </section></main>`;
    bindActions();
  }

  function renderMitraHome() {
    app.innerHTML = `<main class="portal-layout"><section class="portal-shell">
      <div class="portal-top">
        <a class="mobile-brand" href="#/mitra/home" style="display:flex"><span class="brand-mark">${icon("card_membership")}</span><span><strong>Portal Mitra</strong><span>Sari Mart</span></span></a>
        <button class="button-outline" data-nav="mitra/login">${icon("logout")}Keluar</button>
      </div>
      <div class="portal-hero"><span class="badge">ID 0421</span><h1>Halo, Sari Mart 👋</h1><p>Saldo poin, sisa hutang, dan riwayat belanja Anda tersedia di sini.</p></div>
      <div class="grid three-col">
        <article class="stat-card tone-gold"><div class="stat-card-head"><span class="icon-tile">${icon("stars")}</span></div><div class="label">Poin</div><div class="value">1.240</div></article>
        <article class="stat-card tone-danger"><div class="stat-card-head"><span class="icon-tile">${icon("account_balance_wallet")}</span></div><div class="label">Sisa Hutang</div><div class="value">Rp 420.000</div></article>
        <article class="stat-card tone-info"><div class="stat-card-head"><span class="icon-tile">${icon("receipt_long")}</span></div><div class="label">Transaksi</div><div class="value">38</div></article>
      </div>
      <section class="card"><div class="toolbar"><h3 style="margin:0">Riwayat Belanja</h3><button class="button" data-action="showFormModal('Bayar / Cicil Hutang')">${icon("payments")}Bayar / Cicil</button></div>
        <div class="list">${[
          ["TRX-2606001", "18 Jun 2026", "Rp 350.000", "Pending"],
          ["TRX-2604102", "15 Jun 2026", "Rp 110.000", "Lunas"],
        ]
          .map((t) => tile({ icon: "receipt_long", tone: "info", title: t[0], badge: t[3], lines: [t[1]], price: t[2], trailing: "" }))
          .join("")}</div>
      </section>
    </section></main>`;
    bindActions();
  }

  // ---------------------------------------------------------------- ACTIONS
  function bindActions() {
    app.querySelectorAll("[data-nav]").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        go(el.dataset.nav);
      })
    );
    app.querySelectorAll("[data-action]").forEach((el) =>
      el.addEventListener("click", (event) => {
        event.preventDefault();
        callAction(el.dataset.action, el);
      })
    );
    app.querySelectorAll("form").forEach((form) =>
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const type = form.dataset.form;
        if (type === "login") loginDemo();
        if (type === "forgot") showToast("Kode OTP dikirim ke email Anda.");
        if (type === "mitra") go("mitra/home");
      })
    );
  }

  function callAction(action, el) {
    if (!action || action === "noop()") return;
    if (action === "toggleDrawer()") return toggleDrawer();
    if (action === "toggleAccount()") return toggleAccount();
    if (action === "logoutDemo()") return logoutDemo();
    if (action === "loginDemo()") return loginDemo();
    if (action === "showReceiptModal()") return showReceiptModal();
    if (action === "showRegisterModal()") return showRegisterModal();
    if (action === "completeRegisterDemo()") return completeRegisterDemo();
    if (action === "showSyncDemo()")
      return showDemoModal(
        "Status Sinkronisasi Data",
        "Semua data sudah tersinkron. Pada aplikasi asli, indikator ini memantau antrean transaksi & absensi offline (Drift/SQLite) yang dikirim ke API Laravel saat kembali online."
      );
    if (action === "showRowMenu()")
      return showDemoModal("Aksi Baris", "Edit / Hapus. Tombol ini dibuat statis untuk kebutuhan demo GitHub Pages.");
    if (action.startsWith("showToast(")) {
      const args = [...action.matchAll(/'([^']*)'/g)].map((m) => m[1]);
      return showToast(args[0] || "Aksi demo", args[1] || "check_circle");
    }
    if (action.startsWith("showFormModal(")) return showFormModal(action.match(/'([^']+)'/)?.[1] || "Form");
    if (action.startsWith("showDemoModal(")) {
      const args = [...action.matchAll(/'([^']*)'/g)].map((m) => m[1]);
      return showDemoModal(args[0] || "Demo", args[1] || "Aksi ini hanya preview statis.");
    }
    if (action === "toggleGroup(this)") return el.closest(".nav-group").classList.toggle("open");
  }

  window.loginDemo = function () {
    state.loggedIn = true;
    localStorage.setItem("ownertech-static-session", "yes");
    go("dashboard");
  };

  window.logoutDemo = function () {
    state.loggedIn = false;
    state.accountOpen = false;
    localStorage.removeItem("ownertech-static-session");
    go("auth/login");
  };

  function toggleDrawer() {
    state.drawerOpen = !state.drawerOpen;
    render();
  }

  function toggleAccount() {
    state.accountOpen = !state.accountOpen;
    render();
  }

  window.showFormModal = function (title) {
    openModal(
      title,
      `<div class="form-grid">${["Nama", "Kode / ID", "Nominal", "Tanggal", "Catatan"]
        .map(
          (label, i) =>
            `<div class="field ${i === 4 ? "full" : ""}"><label>${label}</label><input class="input" placeholder="${label}"></div>`
        )
        .join("")}</div>
      <div class="toolbar" style="margin-top:18px;justify-content:flex-end"><button class="button-outline" data-close>Batal</button><button class="button" data-save>${icon(
        "save"
      )}Simpan</button></div>`
    );
  };

  window.showRegisterModal = function () {
    openModal(
      "Daftar Owner Baru",
      `<p class="muted">Akun pertama otomatis menjadi Owner. Email login dibuat dari username: <strong>username@ownertech.id</strong>.</p>
      <div class="form-grid" style="margin-top:16px">
        ${[
          ["Nama usaha", "Usaha Maju Jaya"],
          ["Nama lengkap", "Budi Santoso"],
          ["Username", "budimaju"],
          ["Email Google pemulihan", "budimaju@gmail.com"],
          ["Nomor HP", "081234567890"],
          ["Kata sandi", "••••••••"],
        ]
          .map(([label, value]) => `<div class="field"><label>${label}</label><input class="input" value="${value}"></div>`)
          .join("")}
      </div>
      <div class="toolbar" style="margin-top:18px;justify-content:flex-end"><button class="button-outline" data-close>Kembali</button><button class="button" data-action="completeRegisterDemo()">${icon(
        "rocket_launch"
      )}Daftar Owner</button></div>`
    );
  };

  window.completeRegisterDemo = function () {
    document.querySelector(".modal-backdrop")?.remove();
    state.loggedIn = true;
    localStorage.setItem("ownertech-static-session", "yes");
    go("profile/complete");
  };

  window.showDemoModal = function (title, message) {
    openModal(title, `<p class="muted">${message}</p><div class="toolbar" style="margin-top:18px;justify-content:flex-end"><button class="button" data-close>Mengerti</button></div>`);
  };

  window.showReceiptModal = function () {
    openModal(
      "Struk Transaksi",
      `<div class="print-preview"><strong>OWNERTECH STORE</strong><p>TRX-2606001 · ${todayLabel()}</p><hr><p>2× Kopi Robusta 250gr</p><p>1× Gula Aren 500gr</p><p>3× Susu UHT 1L</p><hr><p><strong>Total Rp 149.500</strong></p><p>Tunai · Kasir: M. Rafiq Amin</p><p>Terima kasih 🙏</p></div>
      <div class="toolbar" style="margin-top:18px;justify-content:flex-end"><button class="button-outline" data-close>Tutup</button><button class="button" data-save>${icon(
        "print"
      )}Cetak PDF</button></div>`
    );
  };

  function openModal(title, body) {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML = `<div class="modal"><div class="modal-head"><h2>${title}</h2><button class="icon-button" data-close>${icon("close")}</button></div>${body}</div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (event) => {
      const closer = event.target.closest("[data-close]");
      const actionEl = event.target.closest("[data-action]");
      const saver = event.target.closest("[data-save]");
      if (event.target === wrap || closer) return wrap.remove();
      if (actionEl) return callAction(actionEl.getAttribute("data-action"), actionEl);
      if (saver) {
        wrap.remove();
        showToast("Perubahan tersimpan.");
      }
    });
  }

  window.addEventListener("hashchange", () => {
    state.drawerOpen = false;
    render();
  });

  render();
})();
