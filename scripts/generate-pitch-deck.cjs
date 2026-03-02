const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const W = 792;
const H = 612;

const COLORS = {
  dark: '#0a0e1a',
  dark2: '#111827',
  dark3: '#1e293b',
  white: '#ffffff',
  gray: '#94a3b8',
  lightGray: '#cbd5e1',
  blue: '#3b82f6',
  cyan: '#22d3ee',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

function createDoc() {
  const doc = new PDFDocument({
    size: [W, H],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: true,
    info: {
      Title: 'Gaslite — Investor Pitch Deck',
      Author: 'Gaslite',
      Subject: 'Seed Round Investment Opportunity',
    },
  });
  return doc;
}

function bg(doc, color) {
  doc.rect(0, 0, W, H).fill(color);
}

function slideNum(doc, num, total) {
  doc.fontSize(9).fillColor(COLORS.gray).text(`${String(num).padStart(2,'0')} / ${String(total).padStart(2,'0')}`, W - 80, H - 30, { width: 60, align: 'right' });
}

function badge(doc, text, x, y, color) {
  const w = doc.fontSize(8).widthOfString(text) + 20;
  doc.roundedRect(x, y, w, 22, 11).fill(color + '22');
  doc.roundedRect(x, y, w, 22, 11).lineWidth(0.5).stroke(color + '55');
  doc.fontSize(8).fillColor(color).text(text, x + 10, y + 6, { width: w - 20 });
  return w;
}

function gradientLine(doc, x, y, w) {
  doc.rect(x, y, w, 3).fill(COLORS.blue);
  doc.rect(x + w * 0.5, y, w * 0.5, 3).fill(COLORS.cyan);
}

function cardRect(doc, x, y, w, h, opts = {}) {
  const fill = opts.fill || '#ffffff08';
  const stroke = opts.stroke || '#ffffff15';
  doc.roundedRect(x, y, w, h, 10).fill(fill);
  doc.roundedRect(x, y, w, h, 10).lineWidth(0.5).stroke(stroke);
}

function iconCircle(doc, x, y, size, bgColor, emoji) {
  doc.roundedRect(x, y, size, size, 6).fill(bgColor + '25');
  doc.fontSize(size * 0.5).fillColor(COLORS.white).text(emoji, x, y + size * 0.2, { width: size, align: 'center' });
}

const TOTAL = 10;

function slide1_cover(doc) {
  bg(doc, COLORS.dark);

  doc.save();
  doc.circle(W - 100, -50, 300).fill(COLORS.blue + '0A');
  doc.circle(-50, H + 50, 250).fill(COLORS.cyan + '08');
  doc.restore();

  const logoPath = path.join(__dirname, '..', 'client', 'public', 'logo-dark.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, W / 2 - 80, 80, { width: 160 });
  }

  doc.fontSize(38).fillColor(COLORS.white).text("South Africa's", 0, 180, { width: W, align: 'center' });
  doc.fontSize(42).fillColor(COLORS.cyan).text('Verified LPG Delivery Network', 0, 225, { width: W, align: 'center' });

  doc.fontSize(14).fillColor(COLORS.gray).text(
    'A compliance-first digital platform connecting licensed LPG operators\nwith customers for safe, on-demand gas cylinder delivery.',
    W / 2 - 280, 290, { width: 560, align: 'center', lineGap: 4 }
  );

  let bx = W / 2 - 220;
  const by = 360;
  bx += badge(doc, '⚡ ON-DEMAND DELIVERY', bx, by, COLORS.blue) + 12;
  bx += badge(doc, '✓ LICENSED OPERATORS', bx, by, COLORS.green) + 12;
  badge(doc, '💳 CARD-ONLY PAYMENTS', bx, by, COLORS.amber);

  doc.fontSize(11).fillColor(COLORS.gray).text('Seed Round Investment Opportunity — 2026', 0, H - 80, { width: W, align: 'center' });

  slideNum(doc, 1, TOTAL);
}

function slide2_problem(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark2);

  badge(doc, '⚠ THE PROBLEM', 60, 40, COLORS.amber);
  doc.fontSize(30).fillColor(COLORS.white).text('LPG Distribution in South Africa is ', 60, 72, { continued: true });
  doc.fillColor(COLORS.cyan).text('Broken', { continued: false });
  gradientLine(doc, 60, 115, 50);

  doc.fontSize(11).fillColor(COLORS.gray).text(
    'Millions of South African households depend on LPG gas, yet the delivery experience remains fragmented, unsafe, and inconvenient.',
    60, 128, { width: 500 }
  );

  const cards = [
    { icon: '😣', title: 'Inconvenient Access', desc: 'Customers must drive to depots or petrol stations with heavy cylinders. No reliable home delivery exists.' },
    { icon: '⚠', title: 'Safety Concerns', desc: 'Unregulated informal sellers transport LPG without dangerous goods permits, creating community risks.' },
    { icon: '💰', title: 'Cash-Only, No Accountability', desc: 'Most transactions are cash-based with no receipts, no tracking, and inconsistent pricing.' },
    { icon: '🚚', title: 'Operators Lack Reach', desc: 'Licensed LPG operators have no digital channel. They lose business to unregulated competitors.' },
  ];

  const cw = 320, ch = 100, gap = 20;
  cards.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = 60 + col * (cw + gap), cy = 170 + row * (ch + gap);
    cardRect(doc, cx, cy, cw, ch);
    doc.fontSize(14).fillColor(COLORS.white).text(c.icon + '  ' + c.title, cx + 16, cy + 14, { width: cw - 32 });
    doc.fontSize(9.5).fillColor(COLORS.gray).text(c.desc, cx + 16, cy + 38, { width: cw - 32, lineGap: 2 });
  });

  slideNum(doc, 2, TOTAL);
}

function slide3_solution(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark);

  badge(doc, '💡 THE SOLUTION', 60, 40, COLORS.green);
  doc.fontSize(28).fillColor(COLORS.white).text('Gaslite: The ', 60, 70, { continued: true });
  doc.fillColor(COLORS.cyan).text('Uber for Gas', { continued: true });
  doc.fillColor(COLORS.white).text(' — Built on Compliance');
  gradientLine(doc, 60, 108, 50);

  doc.fontSize(11).fillColor(COLORS.gray).text(
    'A PWA connecting customers with licensed, verified LPG operators for safe, trackable, card-only gas cylinder delivery.',
    60, 120, { width: 550 }
  );

  const features = [
    { icon: '📱', title: 'Order in Seconds', desc: 'Browse 9kg, 19kg, 48kg cylinders. Pay by card, track delivery live.', bg: COLORS.blue },
    { icon: '✅', title: 'Verified Operators', desc: 'Dangerous goods licences and vehicle compliance verified.', bg: COLORS.green },
    { icon: '📍', title: 'Live GPS Tracking', desc: 'Uber-style real-time map tracking from pickup to delivery.', bg: COLORS.cyan },
    { icon: '💳', title: 'Card-Only Payments', desc: 'Visa, MC, Amex, Apple Pay, Google Pay via Yoco. Fully traceable.', bg: COLORS.amber },
    { icon: '🔔', title: 'Instant Notifications', desc: 'Push notifications, in-app chat, and email confirmations.', bg: COLORS.blue },
    { icon: '🔒', title: 'POPIA Compliant', desc: 'South African data protection built in from the ground up.', bg: COLORS.green },
  ];

  const cw = 220, ch = 95, gap = 15;
  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = 60 + col * (cw + gap), cy = 155 + row * (ch + gap);
    cardRect(doc, cx, cy, cw, ch);
    doc.fontSize(13).fillColor(COLORS.white).text(f.icon + '  ' + f.title, cx + 14, cy + 12, { width: cw - 28 });
    doc.fontSize(9).fillColor(COLORS.gray).text(f.desc, cx + 14, cy + 34, { width: cw - 28, lineGap: 2 });
  });

  slideNum(doc, 3, TOTAL);
}

function slide4_how(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark2);

  badge(doc, '⚙ HOW IT WORKS', 60, 40, COLORS.blue);
  doc.fontSize(28).fillColor(COLORS.white).text('Simple for Customers, ', 60, 70, { continued: true });
  doc.fillColor(COLORS.cyan).text('Powerful for Operators');
  gradientLine(doc, 60, 105, 50);

  const steps = ['Customer\nOrders Gas', 'Pays by\nCard (Yoco)', 'Nearest Operator\nMatched (10km)', 'Real-Time\nGPS Tracking', 'Delivered\n✅'];
  const sw = 110, sy = 130;
  steps.forEach((s, i) => {
    const sx = 75 + i * 140;
    doc.circle(sx + sw / 2, sy + 20, 14).fill(COLORS.blue);
    doc.fontSize(11).fillColor(COLORS.white).text(String(i + 1), sx + sw / 2 - 5, sy + 14, { width: 10, align: 'center' });
    doc.fontSize(9).fillColor(COLORS.lightGray).text(s, sx, sy + 42, { width: sw, align: 'center', lineGap: 2 });
    if (i < steps.length - 1) {
      doc.fontSize(14).fillColor(COLORS.gray).text('→', sx + sw + 5, sy + 16, { width: 20 });
    }
  });

  const roles = [
    { title: '👤 Customers', desc: 'Browse products, place orders, track deliveries live, chat with operators, receive push notifications and email receipts.' },
    { title: '🚚 Operators', desc: 'Go online to receive orders, one-tap navigation, earnings dashboard, weekly settlements, admin support chat.' },
    { title: '🛠 Admin', desc: 'Approve operators, manage orders, view analytics, process settlements, monitor compliance.' },
  ];

  const cw = 215, ch = 110;
  roles.forEach((r, i) => {
    const cx = 60 + i * (cw + 16), cy = 250;
    cardRect(doc, cx, cy, cw, ch);
    doc.fontSize(12).fillColor(COLORS.cyan).text(r.title, cx + 14, cy + 14, { width: cw - 28 });
    doc.fontSize(9).fillColor(COLORS.gray).text(r.desc, cx + 14, cy + 36, { width: cw - 28, lineGap: 2 });
  });

  slideNum(doc, 4, TOTAL);
}

function slide5_market(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark);

  badge(doc, '🌍 MARKET OPPORTUNITY', 60, 40, COLORS.blue);
  doc.fontSize(28).fillColor(COLORS.white).text('A ', 60, 70, { continued: true });
  doc.fillColor(COLORS.cyan).text('R30+ Billion', { continued: true });
  doc.fillColor(COLORS.white).text(' Addressable Market');
  gradientLine(doc, 60, 105, 50);

  doc.fontSize(11).fillColor(COLORS.gray).text(
    "South Africa's LPG market is large, growing, and ripe for digital disruption. Load shedding and rising electricity costs accelerate LPG adoption.",
    60, 118, { width: 550 }
  );

  const stats = [
    { num: 'R30B+', label: 'SA LPG Market\n(Annual)' },
    { num: '8.5%', label: 'Annual Growth\nRate' },
    { num: '6M+', label: 'Households\nUsing LPG' },
    { num: '<1%', label: 'Currently Served\nDigitally' },
  ];

  const sw = 150;
  stats.forEach((s, i) => {
    const sx = 60 + i * (sw + 15), sy = 155;
    cardRect(doc, sx, sy, sw, 80);
    doc.fontSize(26).fillColor(COLORS.cyan).text(s.num, sx, sy + 12, { width: sw, align: 'center' });
    doc.fontSize(9).fillColor(COLORS.gray).text(s.label, sx, sy + 48, { width: sw, align: 'center', lineGap: 2 });
  });

  cardRect(doc, 60, 255, 672, 120, { fill: '#1e3a5f20', stroke: COLORS.blue + '30' });
  doc.fontSize(13).fillColor(COLORS.white).text('🌱 Key Growth Drivers', 80, 270);

  const drivers = [
    { title: 'Load Shedding', desc: 'Chronic electricity instability pushes households to adopt LPG as a reliable alternative.' },
    { title: 'Rising Electricity Costs', desc: 'Eskom tariff increases of 12–18% annually make LPG increasingly cost-competitive.' },
    { title: 'Smartphone Penetration', desc: 'Over 90% of SA adults have smartphones, enabling app-based ordering at scale.' },
  ];

  drivers.forEach((d, i) => {
    const dx = 80 + i * 220;
    doc.fontSize(10).fillColor(COLORS.cyan).text(d.title, dx, 295, { width: 200 });
    doc.fontSize(8.5).fillColor(COLORS.gray).text(d.desc, dx, 310, { width: 200, lineGap: 2 });
  });

  slideNum(doc, 5, TOTAL);
}

function slide6_model(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark2);

  badge(doc, '💰 BUSINESS MODEL', 60, 35, COLORS.green);
  doc.fontSize(28).fillColor(COLORS.white).text('Multiple ', 60, 62, { continued: true });
  doc.fillColor(COLORS.cyan).text('Revenue Streams');
  gradientLine(doc, 60, 98, 50);

  const lx = 60, rx = 420;

  doc.fontSize(12).fillColor(COLORS.white).text('📊 Revenue Breakdown', lx, 118);

  const revenues = [
    ['Service Fee', 'R29 per order'],
    ['Processing Fee', '2.6% + 15% VAT on card'],
    ['Subscription', 'R39/month per operator'],
    ['Margin', 'Revenue after operator commission'],
  ];

  let ry = 140;
  revenues.forEach(([stream, detail], i) => {
    const highlight = i === 3;
    if (highlight) doc.rect(lx, ry - 2, 340, 20).fill('#3b82f615');
    doc.fontSize(9).fillColor(highlight ? COLORS.cyan : COLORS.lightGray).text(stream, lx + 10, ry + 2, { width: 120 });
    doc.fontSize(9).fillColor(COLORS.gray).text(detail, lx + 130, ry + 2, { width: 200 });
    ry += 22;
  });

  doc.fontSize(12).fillColor(COLORS.white).text('💰 Operator Commission', lx, ry + 10);
  ry += 30;

  const commissions = [['9kg', 'R262', 'R80'], ['19kg', 'R552', 'R200'], ['48kg', 'R1,345', 'R500']];
  doc.fontSize(8).fillColor(COLORS.gray).text('CYLINDER', lx + 10, ry, { width: 80 });
  doc.text('PRICE', lx + 100, ry, { width: 80 });
  doc.text('COMMISSION', lx + 190, ry, { width: 100 });
  ry += 16;
  commissions.forEach(([cyl, price, comm]) => {
    doc.fontSize(10).fillColor(COLORS.lightGray).text(cyl, lx + 10, ry, { width: 80 });
    doc.fillColor(COLORS.white).text(price, lx + 100, ry, { width: 80 });
    doc.fillColor(COLORS.green).text(comm, lx + 190, ry, { width: 100 });
    ry += 20;
  });

  cardRect(doc, rx, 118, 320, 190, { stroke: COLORS.green + '40' });
  doc.fontSize(12).fillColor(COLORS.white).text('💵 Unit Economics (19kg Order)', rx + 16, 130);

  const econ = [
    ['Customer Pays', 'R552', COLORS.white],
    ['Operator Commission', '-R200', COLORS.red],
    ['Gas Supply Cost', '-R280', COLORS.red],
    ['Service Fee Retained', '+R29', COLORS.green],
    ['Card Processing', '-R16.50', COLORS.red],
  ];

  let ey = 155;
  econ.forEach(([label, val, color]) => {
    doc.rect(rx + 16, ey + 14, 288, 0.5).fill('#ffffff10');
    doc.fontSize(9).fillColor(COLORS.gray).text(label, rx + 16, ey, { width: 180 });
    doc.fontSize(10).fillColor(color).text(val, rx + 200, ey, { width: 120, align: 'right' });
    ey += 20;
  });
  doc.rect(rx + 16, ey, 288, 1).fill(COLORS.blue + '40');
  ey += 8;
  doc.fontSize(10).fillColor(COLORS.white).text('Gross Margin', rx + 16, ey, { width: 180 });
  doc.fontSize(12).fillColor(COLORS.green).text('R84.50', rx + 200, ey - 1, { width: 120, align: 'right' });

  cardRect(doc, rx, 325, 320, 120);
  doc.fontSize(12).fillColor(COLORS.white).text('🚀 Scale Projection', rx + 16, 337);
  doc.fontSize(9).fillColor(COLORS.gray).text('At 100 orders/day average:', rx + 16, 355);

  const scale = [['Daily Revenue', '~R8,450'], ['Monthly Revenue', '~R253,500'], ['Annual Revenue', '~R3.04M']];
  let sy = 375;
  scale.forEach(([label, val], i) => {
    doc.fontSize(9).fillColor(COLORS.gray).text(label, rx + 16, sy);
    doc.fontSize(10).fillColor(i === 2 ? COLORS.green : COLORS.white).text(val, rx + 200, sy, { width: 120, align: 'right' });
    sy += 20;
  });

  slideNum(doc, 6, TOTAL);
}

function slide7_moat(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark);

  badge(doc, '🛡 COMPETITIVE ADVANTAGE', 60, 40, COLORS.blue);
  doc.fontSize(28).fillColor(COLORS.white).text('Our ', 60, 70, { continued: true });
  doc.fillColor(COLORS.cyan).text('Unfair Advantages');
  gradientLine(doc, 60, 105, 50);

  const moats = [
    { title: 'Compliance-First Positioning', desc: 'Only licensed operators with dangerous goods permits. Trust moat competitors cannot replicate.' },
    { title: 'Regulatory Barrier to Entry', desc: 'LPG transport heavily regulated. Compliance built into our onboarding by design.' },
    { title: 'Full-Stack PWA', desc: 'No app store dependency. Works on any device with push, offline support, installability.' },
    { title: 'Network Effects', desc: 'More operators = faster delivery = more customers. Self-reinforcing flywheel.' },
    { title: 'Card-Only Payments', desc: 'Every transaction traceable. Enables trust, settlements, and future financial products.' },
    { title: 'Proximity-Based Matching', desc: 'Haversine algorithm matches nearest operator within 10km. Efficient logistics.' },
    { title: 'Data Advantage', desc: 'Real-time demand data enables dynamic pricing, forecasting, and supply chain optimisation.' },
    { title: 'First-Mover in Verified LPG', desc: 'No other SA platform combines compliance, tracking, and digital payments for LPG.' },
  ];

  const cw = 320, ch = 58, gap = 10;
  moats.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = 60 + col * (cw + gap + 20), cy = 125 + row * (ch + gap);
    cardRect(doc, cx, cy, cw, ch);
    doc.fontSize(10).fillColor(COLORS.white).text('● ' + m.title, cx + 14, cy + 10, { width: cw - 28 });
    doc.fontSize(8.5).fillColor(COLORS.gray).text(m.desc, cx + 14, cy + 28, { width: cw - 28, lineGap: 1 });
  });

  slideNum(doc, 7, TOTAL);
}

function slide8_traction(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark2);

  badge(doc, '🚀 TRACTION & MILESTONES', 60, 40, COLORS.green);
  doc.fontSize(28).fillColor(COLORS.white).text("What We've ", 60, 70, { continued: true });
  doc.fillColor(COLORS.cyan).text('Built So Far');
  gradientLine(doc, 60, 105, 50);

  const milestones = [
    { icon: '✅', label: 'Full MVP\nLive & Deployed' },
    { icon: '👥', label: '3 User Roles\nCustomer / Operator / Admin' },
    { icon: '💳', label: 'Yoco Payments\nIntegrated' },
    { icon: '📍', label: 'Live GPS\nTracking Active' },
  ];

  milestones.forEach((m, i) => {
    const mx = 60 + i * 170, my = 125;
    cardRect(doc, mx, my, 155, 70);
    doc.fontSize(20).fillColor(COLORS.cyan).text(m.icon, mx, my + 8, { width: 155, align: 'center' });
    doc.fontSize(9).fillColor(COLORS.lightGray).text(m.label, mx, my + 36, { width: 155, align: 'center', lineGap: 2 });
  });

  doc.fontSize(12).fillColor(COLORS.white).text('✅ Product Features Completed', 60, 220);

  const features = [
    { title: '👤 Customer App', items: 'Product browsing, card checkout, real-time delivery tracking, push notifications, in-app chat, order history, email receipts' },
    { title: '🚚 Operator Dashboard', items: 'Go online/offline, accept orders, GPS navigation, earnings dashboard, weekly settlement history, admin support chat' },
    { title: '🛠 Admin Panel', items: 'Operator approval workflow, order management, settlement processing, analytics, referral program, launch campaign tools' },
  ];

  features.forEach((f, i) => {
    const fx = 60 + i * 230, fy = 245;
    cardRect(doc, fx, fy, 215, 130);
    doc.fontSize(11).fillColor(COLORS.cyan).text(f.title, fx + 14, fy + 14, { width: 187 });
    doc.fontSize(8.5).fillColor(COLORS.gray).text(f.items, fx + 14, fy + 35, { width: 187, lineGap: 3 });
  });

  slideNum(doc, 8, TOTAL);
}

function slide9_roadmap(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark);

  badge(doc, '📅 ROADMAP', 60, 40, COLORS.blue);
  doc.fontSize(28).fillColor(COLORS.white).text('The Path to ', 60, 70, { continued: true });
  doc.fillColor(COLORS.cyan).text('Market Leadership');
  gradientLine(doc, 60, 105, 50);

  const timeline = [
    { q: 'Q1 2026', title: 'Launch', desc: 'Johannesburg & Pretoria. 50 founding operators. Launch referral program.' },
    { q: 'Q2 2026', title: 'Scale Gauteng', desc: 'Expand operator network. Performance tiers & loyalty program. 500+ daily orders.' },
    { q: 'Q3 2026', title: 'CT & Durban', desc: 'Western Cape & KZN expansion. LPG supplier partnerships.' },
    { q: 'Q4 2026', title: 'National & B2B', desc: 'National coverage. B2B subscriptions for hospitality. Bulk ordering.' },
    { q: '2027', title: 'Expand', desc: 'Operator financing. Adjacent energy products. SADC regional expansion.' },
  ];

  const tlx = 60;
  doc.rect(tlx + 4, 130, 2, 260).fill(COLORS.blue + '60');

  timeline.forEach((t, i) => {
    const ty = 130 + i * 54;
    doc.circle(tlx + 5, ty + 8, 5).fill(COLORS.cyan);
    doc.fontSize(9).fillColor(COLORS.cyan).text(t.q, tlx + 20, ty, { width: 80 });
    doc.fontSize(10).fillColor(COLORS.white).text(t.title, tlx + 100, ty, { width: 120 });
    doc.fontSize(8.5).fillColor(COLORS.gray).text(t.desc, tlx + 100, ty + 14, { width: 280, lineGap: 1 });
  });

  const rx = 440;
  cardRect(doc, rx, 125, 300, 160);
  doc.fontSize(12).fillColor(COLORS.white).text('🎯 Year 1 Targets', rx + 16, 137);

  const targets = [
    ['Licensed Operators', '200+'],
    ['Registered Customers', '25,000+'],
    ['Daily Orders', '500+'],
    ['Cities Active', '5+'],
    ['Annual GMV', 'R100M+'],
  ];

  let ty = 160;
  targets.forEach(([label, val], i) => {
    doc.fontSize(9).fillColor(COLORS.gray).text(label, rx + 16, ty);
    doc.fontSize(10).fillColor(i === 4 ? COLORS.green : COLORS.cyan).text(val, rx + 190, ty, { width: 100, align: 'right' });
    ty += 22;
  });

  cardRect(doc, rx, 300, 300, 120);
  doc.fontSize(12).fillColor(COLORS.white).text('💡 Future Revenue Streams', rx + 16, 312);

  const future = [
    'Operator Financing — Working capital loans',
    'B2B Subscriptions — Recurring delivery contracts',
    'Advertising — Promoted supplier listings',
    'Certification — Operator training services',
  ];

  let fy = 335;
  future.forEach(f => {
    doc.fontSize(8.5).fillColor(COLORS.gray).text('▸  ' + f, rx + 16, fy, { width: 268 });
    fy += 18;
  });

  slideNum(doc, 9, TOTAL);
}

function slide10_ask(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  bg(doc, COLORS.dark2);

  doc.save();
  doc.circle(W / 2, H / 2, 300).fill(COLORS.blue + '06');
  doc.circle(W - 100, -50, 200).fill(COLORS.cyan + '08');
  doc.restore();

  badge(doc, '💰 THE ASK', W / 2 - 40, 35, COLORS.amber);

  doc.fontSize(26).fillColor(COLORS.white).text('Join Us in Building', 0, 65, { width: W, align: 'center' });
  doc.fontSize(28).fillColor(COLORS.cyan).text("South Africa's LPG Future", 0, 95, { width: W, align: 'center' });

  cardRect(doc, 140, 140, W - 280, 260, { fill: '#1e3a5f15', stroke: COLORS.blue + '30' });

  doc.fontSize(11).fillColor(COLORS.gray).text('Seed Round', 0, 155, { width: W, align: 'center' });
  doc.fontSize(44).fillColor(COLORS.cyan).text('R5M – R10M', 0, 172, { width: W, align: 'center' });
  doc.fontSize(10).fillColor(COLORS.lightGray).text(
    'To launch commercially across Gauteng and scale to 500+ daily orders within 12 months.',
    W / 2 - 220, 225, { width: 440, align: 'center' }
  );

  const funds = [
    ['35%', 'Operator Acquisition & Onboarding'],
    ['25%', 'Customer Acquisition & Marketing'],
    ['25%', 'Technology & Product Development'],
    ['15%', 'Operations & Working Capital'],
  ];

  const fw = 230, fh = 36, fgap = 10;
  funds.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const fx = 180 + col * (fw + fgap), fy = 260 + row * (fh + fgap);
    doc.roundedRect(fx, fy, fw, fh, 6).fill('#ffffff08');
    doc.fontSize(16).fillColor(COLORS.cyan).text(f[0], fx + 12, fy + 8, { width: 50 });
    doc.fontSize(9).fillColor(COLORS.lightGray).text(f[1], fx + 60, fy + 11, { width: 160 });
  });

  const logoPath = path.join(__dirname, '..', 'client', 'public', 'logo-dark.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, W / 2 - 60, 420, { width: 120 });
  }

  doc.fontSize(10).fillColor(COLORS.lightGray).text("South Africa's Verified LPG Delivery Network", 0, 465, { width: W, align: 'center' });
  doc.fontSize(8).fillColor(COLORS.gray).text('Fast. Safe. Reliable.', 0, 480, { width: W, align: 'center' });

  doc.fontSize(9).fillColor(COLORS.gray).text('🌐 gaslite.replit.app     📧 invest@gaslite.co.za     📞 0800 GASLITE', 0, 520, { width: W, align: 'center' });

  slideNum(doc, 10, TOTAL);
}

async function main() {
  const doc = createDoc();

  const outputPath = path.join(__dirname, '..', 'client', 'public', 'Gaslite-Pitch-Deck.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  slide1_cover(doc);
  slide2_problem(doc);
  slide3_solution(doc);
  slide4_how(doc);
  slide5_market(doc);
  slide6_model(doc);
  slide7_moat(doc);
  slide8_traction(doc);
  slide9_roadmap(doc);
  slide10_ask(doc);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log('PDF generated at:', outputPath);
  const stats = fs.statSync(outputPath);
  console.log('File size:', (stats.size / 1024).toFixed(1), 'KB');
}

main().catch(console.error);
