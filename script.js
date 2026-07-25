/**
 * SELFCARE DIAGNOSTICS - PRODUCTION CLIENT SCRIPT
 * Full Stack Implementation for Direct Google Apps Script Integration & Admin Dashboard
 */

// Google Apps Script Web App Endpoint
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyc_ddY5_uUlHZE8M3QOX44VO5NVdTZjYcPIwI0aSjsZyIneM58He05-pO5Cl8xiiHpA/exec";

// Static Catalog Data
const staticTestsData = [
  {
    id: "TST-001",
    category: "Diabetes",
    name: "Complete Blood Count (CBC)",
    description: "Evaluates overall health and detects 24+ parameters including hemoglobin.",
    sampleType: "Whole Blood",
    preparation: "No special preparation required.",
    mrp: 600,
    offerPrice: 399,
    nabl: true,
    keywords: ["cbc", "blood", "haemoglobin", "platelets", "infection"]
  },
  {
    id: "TST-002",
    category: "Diabetes",
    name: "HbA1c Diabetes Test",
    description: "Measures average blood sugar levels over the past 3 months.",
    sampleType: "Whole Blood",
    preparation: "Fasting not strictly required.",
    mrp: 700,
    offerPrice: 450,
    nabl: true,
    keywords: ["hba1c", "diabetes", "sugar", "glucose"]
  },
  {
    id: "TST-003",
    category: "Thyroid",
    name: "Thyroid Profile Total (T3, T4, TSH)",
    description: "Checks overall thyroid gland function.",
    sampleType: "Serum",
    preparation: "Overnight fasting recommended.",
    mrp: 900,
    offerPrice: 499,
    nabl: true,
    keywords: ["thyroid", "t3", "t4", "tsh"]
  },
  {
    id: "TST-004",
    category: "Heart",
    name: "Lipid Profile Comprehensive",
    description: "Measures cholesterol levels to assess heart health.",
    sampleType: "Serum",
    preparation: "10-12 hours overnight fasting mandatory.",
    mrp: 1200,
    offerPrice: 699,
    nabl: true,
    keywords: ["lipid", "cholesterol", "heart", "hdl", "ldl"]
  },
  {
    id: "TST-005",
    category: "Vitamins",
    name: "Vitamin D 25-Hydroxy",
    description: "Determines bone density and immune health vitamin status.",
    sampleType: "Serum",
    preparation: "No preparation needed.",
    mrp: 1800,
    offerPrice: 999,
    nabl: true,
    keywords: ["vitamin d", "bone", "calciferol"]
  },
  {
    id: "TST-006",
    category: "Vitamins",
    name: "Vitamin B12 (Cyanocobalamin)",
    description: "Checks nerve health and vitamin deficiency.",
    sampleType: "Serum",
    preparation: "Fasting preferred.",
    mrp: 1500,
    offerPrice: 799,
    nabl: true,
    keywords: ["vitamin b12", "b12", "nerves"]
  }
];

const staticPackagesData = [
  {
    id: "PKG-001",
    name: "Basic Health Checkup",
    mrp: 2500,
    offerPrice: 999,
    testsIncluded: ["Complete Blood Count (CBC)", "Fasting Blood Sugar", "Kidney Function Test", "Urine Analysis"]
  },
  {
    id: "PKG-002",
    name: "Selfcare Prime Full Body Checkup",
    mrp: 4900,
    offerPrice: 1799,
    testsIncluded: ["CBC (24 Parameters)", "HbA1c", "Thyroid Profile", "Liver Function Test", "Lipid Profile"]
  }
];

const staticCategoriesData = [
  { id: "cat-1", name: "Diabetes", icon: "🩸" },
  { id: "cat-2", name: "Thyroid", icon: "🦋" },
  { id: "cat-3", name: "Heart", icon: "🫀" },
  { id: "cat-4", name: "Vitamins", icon: "💊" }
];

// App State
const appState = {
  tests: staticTestsData,
  packages: staticPackagesData,
  categories: staticCategoriesData,
  cart: JSON.parse(localStorage.getItem('selfcare_cart') || '[]'),
  bookings: JSON.parse(localStorage.getItem('selfcare_bookings') || '[]'),
  user: JSON.parse(localStorage.getItem('selfcare_user') || '{"name":"Guest Patient","phone":"7010174890"}'),
  activeView: 'home',
  appliedCoupon: null,
  adminFilter: 'ALL',
  adminQuery: ''
};

// UI Engine
const ui = {
  init() {
    this.updateCartBadges();
    this.bindEvents();
    this.renderCatalog();

    // Dismiss splash screen
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      const app = document.getElementById('app-container');
      if (splash) splash.style.opacity = '0';
      setTimeout(() => {
        if (splash) splash.classList.add('hidden');
        if (app) app.classList.remove('hidden');
      }, 500);
    }, 1200);
  },

  updateCartBadges() {
    const totalCount = appState.cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('nav-cart-badge');
    if (badge) {
      if (totalCount > 0) {
        badge.innerText = totalCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  },

  openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('hidden');
    document.querySelectorAll('.modal-content').forEach(m => m.classList.add('hidden'));
    const target = document.getElementById(modalId);
    if (target) target.classList.remove('hidden');
  },

  closeModals() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
  },

  bindEvents() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
      });
    }

    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length > 0) {
          appRouter.navigate('tests');
          this.filterTests(query);
        } else {
          this.renderAllTests(appState.tests);
        }
      });
    }
  },

  renderCatalog() {
    const catContainer = document.getElementById('categories-list');
    if (catContainer) {
      catContainer.innerHTML = appState.categories.map(c => `
        <div class="category-chip" onclick="ui.filterByCategory('${c.name}')">
          <span>${c.icon}</span>
          <span>${c.name}</span>
        </div>
      `).join('');
    }

    const popularContainer = document.getElementById('popular-tests-container');
    if (popularContainer) {
      popularContainer.innerHTML = appState.tests.slice(0, 4).map(t => this.createTestCardHTML(t)).join('');
    }

    this.renderAllTests(appState.tests);

    const pkgContainer = document.getElementById('popular-packages-container');
    const allPkgContainer = document.getElementById('all-packages-container');
    const pkgHTML = appState.packages.map(p => `
      <div class="glass-card mb-12">
        <h4>${p.name}</h4>
        <p class="text-muted" style="font-size: 11px;">${p.testsIncluded.length} Tests Included</p>
        <div class="test-price-row" style="justify-content: space-between; align-items: center;">
          <div>
            <span class="price-offer">₹${p.offerPrice}</span>
            <span class="price-mrp">₹${p.mrp}</span>
          </div>
          <button class="btn-primary" onclick="cart.addItem('${p.id}', 'package')">Book Package</button>
        </div>
      </div>
    `).join('');

    if (pkgContainer) pkgContainer.innerHTML = pkgHTML;
    if (allPkgContainer) allPkgContainer.innerHTML = pkgHTML;
  },

  createTestCardHTML(test) {
    return `
      <div class="glass-card test-item-card">
        <div class="test-info">
          <div class="badge-row">
            ${test.nabl ? '<span class="tag-badge badge-nabl">NABL Certified</span>' : ''}
            <span class="tag-badge badge-offer">OFFER</span>
          </div>
          <h4 class="test-title" onclick="ui.showTestDetail('${test.id}')">${test.name}</h4>
          <p class="test-meta">${test.description}</p>
          <div class="test-price-row">
            <span class="price-offer">₹${test.offerPrice}</span>
            <span class="price-mrp">₹${test.mrp}</span>
          </div>
        </div>
        <button class="btn-add" onclick="cart.addItem('${test.id}', 'test')">Add</button>
      </div>
    `;
  },

  renderAllTests(list) {
    const container = document.getElementById('all-tests-container');
    const label = document.getElementById('test-count-label');
    if (container) container.innerHTML = list.map(t => this.createTestCardHTML(t)).join('');
    if (label) label.innerText = `Showing ${list.length} Tests`;
  },

  filterTests(query) {
    const filtered = appState.tests.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.category.toLowerCase().includes(query) ||
      t.keywords.some(k => k.toLowerCase().includes(query))
    );
    this.renderAllTests(filtered);
  },

  filterByCategory(catName) {
    appRouter.navigate('tests');
    const filtered = appState.tests.filter(t => t.category.toLowerCase() === catName.toLowerCase());
    this.renderAllTests(filtered);
  },

  showTestDetail(testId) {
    const t = appState.tests.find(item => item.id === testId);
    if (!t) return;
    const body = document.getElementById('test-detail-body');
    if (body) {
      body.innerHTML = `
        <h3>${t.name}</h3>
        <p class="text-muted mb-8" style="font-size:12px;">${t.description}</p>
        <div class="bill-summary">
          <div class="bill-row"><span>Sample Type:</span><strong>${t.sampleType}</strong></div>
          <div class="bill-row"><span>Preparation:</span><strong>${t.preparation}</strong></div>
        </div>
        <div class="test-price-row mb-16">
          <span class="price-offer">₹${t.offerPrice}</span>
          <span class="price-mrp">₹${t.mrp}</span>
        </div>
        <button class="btn-primary btn-block" onclick="cart.addItem('${t.id}', 'test'); ui.closeModals();">Add to Cart</button>
      `;
      ui.openModal('test-detail-modal');
    }
  }
};

// Router System
const appRouter = {
  navigate(viewName) {
    appState.activeView = viewName;
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active-view'));
    
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active-view');

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === viewName);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'cart') cart.renderCartView();
    if (viewName === 'bookings') booking.renderBookingsView();
    if (viewName === 'admin' && !document.getElementById('admin-dashboard-wrapper').classList.contains('hidden')) {
      admin.renderDashboard();
    }
  }
};

// Cart Engine
const cart = {
  addItem(id, type) {
    let item = type === 'test' ? appState.tests.find(t => t.id === id) : appState.packages.find(p => p.id === id);
    if (!item) return;

    const existing = appState.cart.find(c => c.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      appState.cart.push({ id: item.id, name: item.name, price: item.offerPrice, qty: 1, type });
    }

    this.saveCart();
    alert(`Added "${item.name}" to cart.`);
  },

  removeItem(id) {
    appState.cart = appState.cart.filter(item => item.id !== id);
    this.saveCart();
    this.renderCartView();
  },

  updateQty(id, delta) {
    const item = appState.cart.find(c => c.id === id);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) return this.removeItem(id);
      this.saveCart();
      this.renderCartView();
    }
  },

  clearCart() {
    appState.cart = [];
    this.saveCart();
    this.renderCartView();
  },

  saveCart() {
    localStorage.setItem('selfcare_cart', JSON.stringify(appState.cart));
    ui.updateCartBadges();
  },

  applyCoupon() {
    const input = document.getElementById('coupon-code-input');
    const msg = document.getElementById('coupon-msg');
    if (!input || !msg) return;

    const code = input.value.trim().toUpperCase();
    if (code === 'SELFCARE20') {
      appState.appliedCoupon = 0.20;
      msg.className = "coupon-msg text-green";
      msg.innerText = "20% Discount Applied!";
    } else {
      appState.appliedCoupon = null;
      msg.className = "coupon-msg text-muted";
      msg.innerText = "Invalid Coupon Code.";
    }
    this.renderCartView();
  },

  renderCartView() {
    const emptyState = document.getElementById('cart-empty-state');
    const wrapper = document.getElementById('cart-content-wrapper');
    const container = document.getElementById('cart-items-container');

    if (!emptyState || !wrapper || !container) return;

    if (appState.cart.length === 0) {
      emptyState.classList.remove('hidden');
      wrapper.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    wrapper.classList.remove('hidden');

    container.innerHTML = appState.cart.map(item => `
      <div class="glass-card cart-item-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h5 style="font-size:12px;">${item.name}</h5>
          <span style="font-size:12px; color:var(--primary); font-weight:700;">₹${item.price * item.qty}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-secondary" style="padding: 2px 8px;" onclick="cart.updateQty('${item.id}', -1)">-</button>
          <span style="font-size:12px;">${item.qty}</span>
          <button class="btn-secondary" style="padding: 2px 8px;" onclick="cart.updateQty('${item.id}', 1)">+</button>
          <button class="btn-text-danger" style="margin-left:6px;" onclick="cart.removeItem('${item.id}')">✕</button>
        </div>
      </div>
    `).join('');

    const subtotal = appState.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discount = appState.appliedCoupon ? subtotal * appState.appliedCoupon : 0;
    const tax = (subtotal - discount) * 0.05;
    const total = (subtotal - discount) + tax;

    document.getElementById('bill-subtotal').innerText = `₹${subtotal.toFixed(0)}`;
    document.getElementById('bill-discount').innerText = `-₹${discount.toFixed(0)}`;
    document.getElementById('bill-tax').innerText = `₹${tax.toFixed(0)}`;
    document.getElementById('bill-total').innerText = `₹${total.toFixed(0)}`;
  }
};

// Booking Engine (Customer Flow)
const booking = {
  async processCheckout(e) {
    e.preventDefault();
    if (appState.cart.length === 0) return alert('Your cart is empty!');

    const btn = document.getElementById('confirm-booking-btn');
    const originalBtnText = btn ? btn.innerText : 'Confirm Booking';

    try {
      // Step 1: Form Validation
      const patientName = document.getElementById('patient-name').value.trim();
      const age = document.getElementById('patient-age').value.trim();
      const gender = document.getElementById('patient-gender').value;
      const mobile = document.getElementById('patient-mobile').value.trim();
      const email = document.getElementById('patient-email').value.trim();
      const address = document.getElementById('patient-address').value.trim();
      const pincode = document.getElementById('patient-pincode').value.trim();
      const collectionType = document.getElementById('collection-type').value;
      const preferredDate = document.getElementById('preferred-date').value;
      const preferredTime = document.getElementById('preferred-time').value;
      
      const paymentRadios = document.getElementsByName('payment');
      let paymentMethod = 'Cash on Collection';
      for (const r of paymentRadios) {
        if (r.checked) {
          paymentMethod = r.value;
          break;
        }
      }

      if (!patientName || !age || !mobile || !address || !pincode || !preferredDate || !preferredTime) {
        alert('Please fill in all required fields.');
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Saving Booking...';
      }

      const subtotal = appState.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
      const discount = appState.appliedCoupon ? subtotal * appState.appliedCoupon : 0;
      const gst = (subtotal - discount) * 0.05;
      const totalAmount = (subtotal - discount) + gst;

      const testsArr = appState.cart.filter(i => i.type === 'test').map(i => `${i.name} (x${i.qty})`);
      const packagesArr = appState.cart.filter(i => i.type === 'package').map(i => `${i.name} (x${i.qty})`);

      const tests = testsArr.join(', ');
      const packages = packagesArr.join(', ');

      const now = new Date();
      const bookingDate = now.toISOString().split('T')[0];
      const bookingTime = now.toTimeString().split(' ')[0];
      const bookingId = 'SEL-' + Math.floor(100000 + Math.random() * 900000);

      const payload = {
        bookingId,
        bookingDate,
        bookingTime,
        patientName,
        age,
        gender,
        mobile,
        email,
        address,
        pincode,
        collectionType,
        preferredDate,
        preferredTime,
        paymentMethod,
        tests,
        packages,
        subtotal,
        discount,
        gst,
        totalAmount,
        bookingStatus: "Pending"
      };

      // Step 2: Save to Google Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      console.log("HTTP Status:", response.status);
      const text = await response.text();
      console.log("Raw Response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response format from server.");
      }

      if (result && result.success) {
        const finalBookingId = result.bookingId || bookingId;

        // Step 5: Store in Local Storage
        const localRecord = {
          ...payload,
          bookingId: finalBookingId,
          id: finalBookingId,
          total: totalAmount,
          date: preferredDate,
          time: preferredTime,
          status: 'Pending'
        };

        appState.bookings.unshift(localRecord);
        localStorage.setItem('selfcare_bookings', JSON.stringify(appState.bookings));

        // Step 4: Clear Cart
        cart.clearCart();

        // Step 3: Show Success Modal
        const modalBody = document.getElementById('booking-success-modal');
        if (modalBody) {
          modalBody.innerHTML = `
            <div class="success-checkmark">✓</div>
            <h3>✅ Booking Submitted Successfully</h3>
            <p class="booking-id-text">Booking ID: <strong>${finalBookingId}</strong></p>
            <div class="bill-summary text-center" style="margin: 12px 0; text-align: left;">
              <div class="bill-row"><span>Status:</span><span class="tag-badge badge-offer">Pending</span></div>
              <div class="bill-row"><span>Estimated Pick-up:</span><strong>${preferredDate} (${preferredTime})</strong></div>
              <div class="bill-row"><span>Patient Name:</span><strong>${patientName}</strong></div>
              <div class="bill-row"><span>Collection Mode:</span><strong>${collectionType}</strong></div>
            </div>
            <p class="text-muted mb-16" style="font-size: 11px;">Our team will reach out to confirm your collection slot.</p>
            <button class="btn-primary btn-block" onclick="ui.closeModals(); appRouter.navigate('bookings');">View My Orders</button>
          `;
        }

        ui.openModal('booking-success-modal');
        // Step 6: Customer side NEVER opens WhatsApp or redirects.
      } else {
        alert("❌ Booking Failed\nPlease try again.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Booking Failed\nPlease try again.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = originalBtnText;
      }
    }
  },

  renderBookingsView() {
    const container = document.getElementById('bookings-history-list');
    if (!container) return;

    if (appState.bookings.length === 0) {
      container.innerHTML = `<div class="text-center text-muted"><p>No previous bookings recorded.</p></div>`;
      return;
    }

    container.innerHTML = appState.bookings.map(b => `
      <div class="glass-card mb-12">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>ID: ${b.bookingId || b.id}</strong>
          <span class="tag-badge badge-nabl">${b.bookingStatus || b.status || 'Pending'}</span>
        </div>
        <p style="font-size:12px; margin-top:4px;">Patient: ${b.patientName}</p>
        <p style="font-size:12px; color:var(--text-muted);">Slot: ${b.preferredDate || b.date} (${b.preferredTime || b.time})</p>
        <p style="font-size:12px; color:var(--primary); font-weight:700; margin-top:2px;">Total: ₹${Number(b.totalAmount || b.total || 0).toFixed(0)}</p>
      </div>
    `).join('');
  },

  filterBookings() {
    const input = document.getElementById('booking-search-input');
    const container = document.getElementById('bookings-history-list');
    if (!input || !container) return;

    const q = input.value.toLowerCase();
    const filtered = appState.bookings.filter(b => 
      (b.bookingId || b.id || '').toLowerCase().includes(q) || 
      (b.patientName || '').toLowerCase().includes(q)
    );

    container.innerHTML = filtered.map(b => `
      <div class="glass-card mb-12">
        <div style="display:flex; justify-content:space-between;">
          <strong>ID: ${b.bookingId || b.id}</strong>
          <span class="tag-badge badge-nabl">${b.bookingStatus || b.status || 'Pending'}</span>
        </div>
        <p style="font-size:12px;">Patient: ${b.patientName}</p>
      </div>
    `).join('');
  }
};

// Admin Console Module
const admin = {
  login(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-passcode').value;
    if (pass === 'admin123') {
      document.getElementById('admin-login-wrapper').classList.add('hidden');
      document.getElementById('admin-dashboard-wrapper').classList.remove('hidden');
      this.renderDashboard();
    } else {
      alert('Invalid Passcode! (Default: admin123)');
    }
  },

  logout() {
    document.getElementById('admin-login-wrapper').classList.remove('hidden');
    document.getElementById('admin-dashboard-wrapper').classList.add('hidden');
  },

  setFilter(status) {
    appState.adminFilter = status;
    this.renderBookingsList();
  },

  setSearchQuery(q) {
    appState.adminQuery = q.toLowerCase();
    this.renderBookingsList();
  },

  updateStatus(bookingId, newStatus) {
    const bookingItem = appState.bookings.find(b => (b.bookingId || b.id) === bookingId);
    if (bookingItem) {
      bookingItem.bookingStatus = newStatus;
      bookingItem.status = newStatus;
      localStorage.setItem('selfcare_bookings', JSON.stringify(appState.bookings));
      this.renderDashboard();
      alert(`Booking ${bookingId} updated to: ${newStatus}`);
    }
  },

  shareWhatsApp(bookingId) {
    const b = appState.bookings.find(item => (item.bookingId || item.id) === bookingId);
    if (!b) return alert("Booking details not found!");

    const formattedTests = b.tests || "None";
    const formattedPackages = b.packages || "None";
    const totalVal = Number(b.totalAmount || b.total || 0).toFixed(0);

    const waMessage = 
`SELFCARE DIAGNOSTICS

Booking ID: ${b.bookingId || b.id}
Patient Name: ${b.patientName || 'N/A'}
Mobile: ${b.mobile || 'N/A'}
Address: ${b.address || 'N/A'}
Collection Type: ${b.collectionType || 'Home Collection'}
Preferred Date: ${b.preferredDate || b.date || 'N/A'}
Preferred Time: ${b.preferredTime || b.time || 'N/A'}
Tests: ${formattedTests}
Packages: ${formattedPackages}
Total Amount: ₹${totalVal}`;

    const encodedMsg = encodeURIComponent(waMessage);
    const targetMobile = b.mobile ? b.mobile.replace(/\D/g, '') : '7010174890';
    const waUrl = `https://wa.me/${targetMobile.length === 10 ? '91' + targetMobile : targetMobile}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  },

  viewDetails(bookingId) {
    const b = appState.bookings.find(item => (item.bookingId || item.id) === bookingId);
    if (!b) return;

    const body = document.getElementById('test-detail-body');
    if (body) {
      body.innerHTML = `
        <h3>Booking Details</h3>
        <p class="text-muted mb-8" style="font-size: 12px;">ID: <strong>${b.bookingId || b.id}</strong></p>
        <div class="bill-summary">
          <div class="bill-row"><span>Patient:</span><strong>${b.patientName} (${b.age || 'N/A'} / ${b.gender || 'N/A'})</strong></div>
          <div class="bill-row"><span>Mobile:</span><strong>${b.mobile}</strong></div>
          <div class="bill-row"><span>Email:</span><strong>${b.email || 'N/A'}</strong></div>
          <div class="bill-row"><span>Address:</span><strong>${b.address} (${b.pincode || ''})</strong></div>
          <div class="bill-row"><span>Collection Mode:</span><strong>${b.collectionType || 'Home Collection'}</strong></div>
          <div class="bill-row"><span>Slot:</span><strong>${b.preferredDate || b.date} | ${b.preferredTime || b.time}</strong></div>
          <div class="bill-row"><span>Payment:</span><strong>${b.paymentMethod || 'Cash'}</strong></div>
          <div class="bill-row"><span>Tests:</span><strong>${b.tests || 'None'}</strong></div>
          <div class="bill-row"><span>Packages:</span><strong>${b.packages || 'None'}</strong></div>
          <div class="bill-row total-row"><span>Total:</span><strong>₹${Number(b.totalAmount || b.total || 0).toFixed(0)}</strong></div>
        </div>
        <button class="btn-primary btn-block" onclick="ui.closeModals()">Close</button>
      `;
      ui.openModal('test-detail-modal');
    }
  },

  renderDashboard() {
    this.renderStats();
    this.renderBookingsList();
  },

  renderStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = appState.bookings.filter(b => (b.bookingDate || '').startsWith(todayStr) || true); // Summary view across active items

    const pending = appState.bookings.filter(b => (b.bookingStatus || b.status || 'Pending') === 'Pending').length;
    const confirmed = appState.bookings.filter(b => (b.bookingStatus || b.status) === 'Confirmed').length;
    const collected = appState.bookings.filter(b => (b.bookingStatus || b.status) === 'Sample Collected').length;
    const completed = appState.bookings.filter(b => (b.bookingStatus || b.status) === 'Completed').length;
    const cancelled = appState.bookings.filter(b => (b.bookingStatus || b.status) === 'Cancelled').length;

    const rev = appState.bookings
      .filter(b => (b.bookingStatus || b.status) !== 'Cancelled')
      .reduce((sum, b) => sum + Number(b.totalAmount || b.total || 0), 0);

    const statsContainer = document.getElementById('stat-bookings-count')?.parentElement?.parentElement;
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card glass-card text-center" style="grid-column: span 2;">
          <span class="stat-num">₹${rev.toFixed(0)}</span>
          <span class="stat-label">Total Revenue</span>
        </div>
        <div class="stat-card glass-card text-center"><span class="stat-num">${appState.bookings.length}</span><span class="stat-label">Total</span></div>
        <div class="stat-card glass-card text-center"><span class="stat-num" style="color: orange;">${pending}</span><span class="stat-label">Pending</span></div>
        <div class="stat-card glass-card text-center"><span class="stat-num" style="color: blue;">${confirmed}</span><span class="stat-label">Confirmed</span></div>
        <div class="stat-card glass-card text-center"><span class="stat-num" style="color: purple;">${collected}</span><span class="stat-label">Collected</span></div>
        <div class="stat-card glass-card text-center"><span class="stat-num" style="color: green;">${completed}</span><span class="stat-label">Completed</span></div>
        <div class="stat-card glass-card text-center"><span class="stat-num" style="color: red;">${cancelled}</span><span class="stat-label">Cancelled</span></div>
      `;
    }
  },

  renderBookingsList() {
    const subview = document.getElementById('admin-subview-container') || document.getElementById('admin-dashboard-wrapper');
    if (!subview) return;

    let existingControls = document.getElementById('admin-controls-wrapper');
    if (!existingControls) {
      const controlsHolder = document.createElement('div');
      controlsHolder.id = 'admin-controls-wrapper';
      controlsHolder.innerHTML = `
        <div class="search-container mb-12">
          <span class="search-icon">🔎</span>
          <input type="text" id="admin-search-input" placeholder="Search by ID, Name, or Mobile..." oninput="admin.setSearchQuery(this.value)" />
        </div>
        <div class="categories-scroll mb-16" id="admin-filter-pills">
          <div class="category-chip active" onclick="admin.setFilter('ALL')">All</div>
          <div class="category-chip" onclick="admin.setFilter('Pending')">Pending</div>
          <div class="category-chip" onclick="admin.setFilter('Confirmed')">Confirmed</div>
          <div class="category-chip" onclick="admin.setFilter('Sample Collected')">Collected</div>
          <div class="category-chip" onclick="admin.setFilter('Report Ready')">Report Ready</div>
          <div class="category-chip" onclick="admin.setFilter('Completed')">Completed</div>
          <div class="category-chip" onclick="admin.setFilter('Cancelled')">Cancelled</div>
        </div>
        <div id="admin-cards-feed"></div>
      `;
      subview.appendChild(controlsHolder);
    }

    // Filter Logic
    let filtered = appState.bookings.filter(b => {
      const currentStatus = b.bookingStatus || b.status || 'Pending';
      const matchesFilter = (appState.adminFilter === 'ALL') || (currentStatus === appState.adminFilter);
      
      const bId = (b.bookingId || b.id || '').toLowerCase();
      const pName = (b.patientName || '').toLowerCase();
      const pMob = (b.mobile || '').toLowerCase();
      
      const matchesQuery = !appState.adminQuery || 
        bId.includes(appState.adminQuery) || 
        pName.includes(appState.adminQuery) || 
        pMob.includes(appState.adminQuery);

      return matchesFilter && matchesQuery;
    });

    const feed = document.getElementById('admin-cards-feed');
    if (!feed) return;

    if (filtered.length === 0) {
      feed.innerHTML = `<div class="text-center text-muted"><p>No matching bookings found.</p></div>`;
      return;
    }

    feed.innerHTML = filtered.map(b => {
      const bId = b.bookingId || b.id;
      const status = b.bookingStatus || b.status || 'Pending';
      const amount = Number(b.totalAmount || b.total || 0).toFixed(0);

      return `
        <div class="glass-card mb-16">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <strong>${bId}</strong>
            <span class="tag-badge badge-offer">${status}</span>
          </div>
          <p style="font-size:12px;"><strong>Patient:</strong> ${b.patientName || 'N/A'} | <strong>Mobile:</strong> ${b.mobile || 'N/A'}</p>
          <p style="font-size:11px; color:var(--text-muted);"><strong>Address:</strong> ${b.address || 'N/A'}</p>
          <p style="font-size:11px; color:var(--text-muted);"><strong>Slot:</strong> ${b.preferredDate || b.date || 'N/A'} (${b.preferredTime || b.time || 'N/A'})</p>
          <p style="font-size:11px; color:var(--text-muted);"><strong>Tests:</strong> ${b.tests || 'None'}</p>
          <p style="font-size:11px; color:var(--text-muted);"><strong>Packages:</strong> ${b.packages || 'None'}</p>
          <p style="font-size:13px; color:var(--primary); font-weight:700; margin: 4px 0 10px;">Amount: ₹${amount}</p>

          <!-- Admin Action Toolset -->
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px;">
            <button class="btn-secondary" style="font-size:11px;" onclick="admin.viewDetails('${bId}')">👁️ View Details</button>
            <button class="btn-whatsapp" style="font-size:11px; padding:6px;" onclick="admin.shareWhatsApp('${bId}')">💬 Share WhatsApp</button>
            <button class="btn-secondary" style="font-size:10px; background:#e0f2fe; color:#0369a1;" onclick="admin.updateStatus('${bId}', 'Confirmed')">✓ Confirm</button>
            <button class="btn-secondary" style="font-size:10px; background:#f3e8fd; color:#6b21a8;" onclick="admin.updateStatus('${bId}', 'Sample Collected')">🧪 Collected</button>
            <button class="btn-secondary" style="font-size:10px; background:#fef3c7; color:#92400e;" onclick="admin.updateStatus('${bId}', 'Report Ready')">📄 Report Ready</button>
            <button class="btn-secondary" style="font-size:10px; background:#dcfce7; color:#166534;" onclick="admin.updateStatus('${bId}', 'Completed')">✅ Completed</button>
            <button class="btn-secondary" style="font-size:10px; background:#fee2e2; color:#991b1b; grid-column: span 2;" onclick="admin.updateStatus('${bId}', 'Cancelled')">✕ Cancel Booking</button>
          </div>
        </div>
      `;
    }).join('');
  },

  exportExcel() {
    if (appState.bookings.length === 0) return alert("No bookings available to export!");

    let csv = "Booking ID,Booking Date,Patient Name,Mobile,Address,Preferred Date,Preferred Time,Tests,Packages,Total Amount,Booking Status\n";
    appState.bookings.forEach(b => {
      const bId = b.bookingId || b.id || '';
      const bDate = b.bookingDate || '';
      const pName = (b.patientName || '').replace(/,/g, ' ');
      const pMob = b.mobile || '';
      const pAddr = (b.address || '').replace(/,/g, ' ');
      const prefDate = b.preferredDate || b.date || '';
      const prefTime = b.preferredTime || b.time || '';
      const tests = (b.tests || 'None').replace(/,/g, ';');
      const packages = (b.packages || 'None').replace(/,/g, ';');
      const amount = Number(b.totalAmount || b.total || 0).toFixed(0);
      const status = b.bookingStatus || b.status || 'Pending';

      csv += `"${bId}","${bDate}","${pName}","${pMob}","${pAddr}","${prefDate}","${prefTime}","${tests}","${packages}","${amount}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Selfcare_Bookings_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  ui.init();
});
