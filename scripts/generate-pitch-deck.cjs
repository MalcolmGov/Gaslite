const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const W = 792;
const H = 612;

const C = {
  bg1: '#0f172a',
  bg2: '#1e293b',
  white: '#ffffff',
  offWhite: '#f1f5f9',
  gray: '#94a3b8',
  lightGray: '#cbd5e1',
  blue: '#3b82f6',
  cyan: '#22d3ee',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  darkCard: '#1e293b',
  cardBorder: '#334155',
};

function newDoc() {
  return new PDFDocument({
    size: [W, H],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: true,
    info: {
      Title: 'Gaslite - Investor Pitch Deck',
      Author: 'Gaslite',
      Subject: 'Seed Round Investment Opportunity',
    },
  });
}

function bg(doc, color) {
  doc.rect(0, 0, W, H).fill(color);
}

function slideNum(doc, num) {
  doc.fontSize(8).fillColor(C.gray).text(`${String(num).padStart(2, '0')} / 10`, W - 70, H - 25, { width: 50, align: 'right' });
}

function accentBar(doc, x, y, w) {
  doc.rect(x, y, w * 0.6, 3).fill(C.blue);
  doc.rect(x + w * 0.6, y, w * 0.4, 3).fill(C.cyan);
}

function card(doc, x, y, w, h) {
  doc.roundedRect(x, y, w, h, 8).lineWidth(1).fillAndStroke(C.bg2, C.cardBorder);
}

function lightCard(doc, x, y, w, h) {
  doc.roundedRect(x, y, w, h, 8).lineWidth(1).fillAndStroke('#253347', '#3b5068');
}

function sectionBadge(doc, label, x, y, color) {
  const tw = doc.fontSize(7).widthOfString(label) + 18;
  doc.roundedRect(x, y, tw, 18, 9).lineWidth(0.8).fillAndStroke(C.bg1, color);
  doc.fontSize(7).fillColor(color).text(label, x + 9, y + 4.5);
  return tw;
}

function bullet(doc, x, y, r, color) {
  doc.circle(x + r, y + r, r).fill(color);
}

function numberedCircle(doc, x, y, num) {
  doc.circle(x, y, 13).fill(C.blue);
  doc.fontSize(11).fillColor(C.white).text(String(num), x - 5, y - 6, { width: 10, align: 'center' });
}

function addPage(doc) {
  doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
}

function slide1(doc) {
  bg(doc, C.bg1);

  doc.circle(W + 50, -80, 350).fill('#1e3a5f');
  doc.circle(-80, H + 80, 300).fill('#162032');

  const logoPath = path.join(__dirname, '..', 'client', 'public', 'logo-dark.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, W / 2 - 90, 70, { width: 180 });
  }

  doc.fontSize(36).fillColor(C.white).text("South Africa's", 0, 175, { width: W, align: 'center' });
  doc.fontSize(40).fillColor(C.cyan).text('Verified LPG Delivery Network', 0, 218, { width: W, align: 'center' });

  doc.fontSize(13).fillColor(C.gray).text(
    'A compliance-first digital platform connecting licensed LPG operators\nwith customers for safe, on-demand gas cylinder delivery.',
    W / 2 - 280, 285, { width: 560, align: 'center', lineGap: 5 }
  );

  const tags = ['ON-DEMAND DELIVERY', 'LICENSED OPERATORS ONLY', 'CARD-ONLY PAYMENTS'];
  const tagColors = [C.blue, C.green, C.amber];
  let tx = W / 2 - 240;
  tags.forEach((t, i) => {
    const tw = sectionBadge(doc, t, tx, 360, tagColors[i]);
    tx += tw + 14;
  });

  doc.fontSize(10).fillColor(C.gray).text('Seed Round Investment Opportunity  |  2026', 0, H - 60, { width: W, align: 'center' });
  slideNum(doc, 1);
}

function slide2(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'THE PROBLEM', 60, 40, C.amber);
  doc.fontSize(28).fillColor(C.white).text('LPG Distribution in South Africa is ', 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('Broken');
  accentBar(doc, 60, 102, 50);

  doc.fontSize(11).fillColor(C.gray).text(
    'Millions of South African households depend on LPG gas, yet the delivery experience remains fragmented, unsafe, and inconvenient.',
    60, 115, { width: 550, lineGap: 2 }
  );

  const problems = [
    { title: 'Inconvenient Access', desc: 'Customers must drive to depots or petrol stations with heavy cylinders. No reliable home delivery option exists in most areas.' },
    { title: 'Safety Concerns', desc: 'Unregulated informal sellers transport LPG without dangerous goods permits, creating serious risks for communities.' },
    { title: 'Cash-Only, No Accountability', desc: 'Most transactions are cash-based with no receipts, no tracking, and inconsistent pricing across different sellers.' },
    { title: 'Licensed Operators Lack Reach', desc: 'Legitimate, licensed LPG operators have no digital channel to reach customers. They lose business to unregulated competitors.' },
  ];

  const cw = 325, ch = 105, gap = 16;
  problems.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = 60 + col * (cw + gap), cy = 155 + row * (ch + gap);
    card(doc, cx, cy, cw, ch);
    bullet(doc, cx + 16, cy + 16, 4, C.amber);
    doc.fontSize(12).fillColor(C.white).text(p.title, cx + 30, cy + 12, { width: cw - 46 });
    doc.fontSize(9).fillColor(C.gray).text(p.desc, cx + 16, cy + 34, { width: cw - 32, lineGap: 3 });
  });

  slideNum(doc, 2);
}

function slide3(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'THE SOLUTION', 60, 40, C.green);
  doc.fontSize(26).fillColor(C.white).text('Gaslite: The ', 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('Uber for Gas', { continued: true });
  doc.fillColor(C.white).text(' - Built on Compliance');
  accentBar(doc, 60, 100, 50);

  doc.fontSize(11).fillColor(C.gray).text(
    'A Progressive Web App connecting customers with licensed, verified LPG operators for safe, trackable, card-only gas cylinder delivery.',
    60, 114, { width: 580, lineGap: 2 }
  );

  const features = [
    { title: 'Order in Seconds', desc: 'Browse 9kg, 19kg, and 48kg cylinders. Select, pay by card, and track your delivery in real time.' },
    { title: 'Verified Operators', desc: 'Every operator verified for dangerous goods licences and vehicle compliance before approval.' },
    { title: 'Live GPS Tracking', desc: 'Uber-style real-time tracking. Customers see operator location on a live map.' },
    { title: 'Card-Only Payments', desc: 'Visa, Mastercard, Amex, Apple Pay, Google Pay via Yoco. Every transaction is traceable.' },
    { title: 'Instant Notifications', desc: 'Push notifications, in-app chat, and email confirmations at every delivery stage.' },
    { title: 'POPIA Compliant', desc: 'Built with South African data protection law at the core. Full consent management.' },
  ];

  const cw = 220, ch = 90, gap = 12;
  const dotColors = [C.blue, C.green, C.cyan, C.amber, C.blue, C.green];
  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = 60 + col * (cw + gap), cy = 148 + row * (ch + gap);
    card(doc, cx, cy, cw, ch);
    bullet(doc, cx + 14, cy + 14, 4, dotColors[i]);
    doc.fontSize(11).fillColor(C.white).text(f.title, cx + 28, cy + 10, { width: cw - 42 });
    doc.fontSize(8.5).fillColor(C.gray).text(f.desc, cx + 14, cy + 30, { width: cw - 28, lineGap: 3 });
  });

  slideNum(doc, 3);
}

function slide4(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'HOW IT WORKS', 60, 40, C.blue);
  doc.fontSize(26).fillColor(C.white).text('Simple for Customers, ', 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('Powerful for Operators');
  accentBar(doc, 60, 100, 50);

  const steps = ['Customer\nOrders Gas', 'Pays by\nCard (Yoco)', 'Nearest Operator\nMatched (10km)', 'Real-Time\nGPS Tracking', 'Order\nDelivered'];
  steps.forEach((s, i) => {
    const sx = 80 + i * 138;
    numberedCircle(doc, sx + 50, 140, i + 1);
    doc.fontSize(9).fillColor(C.lightGray).text(s, sx, 160, { width: 100, align: 'center', lineGap: 2 });
    if (i < 4) {
      doc.save();
      doc.moveTo(sx + 80, 140).lineTo(sx + 118, 140).lineWidth(1).stroke(C.gray);
      doc.moveTo(sx + 115, 136).lineTo(sx + 120, 140).lineTo(sx + 115, 144).fill(C.gray);
      doc.restore();
    }
  });

  const roles = [
    { title: 'Customers', color: C.cyan, desc: 'Browse products, place orders, track deliveries live, chat with operators, receive push notifications and email receipts.' },
    { title: 'Licensed Operators', color: C.green, desc: 'Go online to receive orders, one-tap navigation, earnings dashboard, weekly settlements, in-app support chat with admin.' },
    { title: 'Admin Panel', color: C.amber, desc: 'Approve operators, manage orders, view analytics, process weekly settlements, monitor compliance, run campaigns.' },
  ];

  roles.forEach((r, i) => {
    const rx = 60 + i * 232, ry = 225;
    card(doc, rx, ry, 218, 130);
    doc.rect(rx, ry, 4, 130).fill(r.color);
    doc.fontSize(12).fillColor(r.color).text(r.title, rx + 16, ry + 14, { width: 186 });
    doc.fontSize(9).fillColor(C.gray).text(r.desc, rx + 16, ry + 36, { width: 186, lineGap: 3 });
  });

  slideNum(doc, 4);
}

function slide5(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'MARKET OPPORTUNITY', 60, 40, C.blue);
  doc.fontSize(26).fillColor(C.white).text('A ', 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('R30+ Billion', { continued: true });
  doc.fillColor(C.white).text(' Addressable Market');
  accentBar(doc, 60, 100, 50);

  doc.fontSize(11).fillColor(C.gray).text(
    "South Africa's LPG market is large, growing, and ready for digital disruption. Load shedding and rising electricity costs accelerate adoption.",
    60, 114, { width: 580, lineGap: 2 }
  );

  const stats = [
    { num: 'R30B+', label: 'SA LPG Market (Annual)' },
    { num: '8.5%', label: 'Annual Growth Rate' },
    { num: '6M+', label: 'Households Using LPG' },
    { num: '<1%', label: 'Currently Served Digitally' },
  ];

  stats.forEach((s, i) => {
    const sx = 60 + i * 170, sy = 152;
    card(doc, sx, sy, 155, 75);
    doc.fontSize(24).fillColor(C.cyan).text(s.num, sx, sy + 12, { width: 155, align: 'center' });
    doc.fontSize(8.5).fillColor(C.gray).text(s.label, sx, sy + 48, { width: 155, align: 'center' });
  });

  lightCard(doc, 60, 248, 672, 120);
  doc.fontSize(12).fillColor(C.white).text('Key Growth Drivers', 80, 262);
  accentBar(doc, 80, 280, 30);

  const drivers = [
    { title: 'Load Shedding', desc: 'Chronic electricity instability pushes households to adopt LPG as a reliable alternative energy source.' },
    { title: 'Rising Electricity Costs', desc: 'Eskom tariff increases of 12-18% annually make LPG increasingly cost-competitive for cooking and heating.' },
    { title: 'Smartphone Penetration', desc: 'Over 90% of SA adults have smartphones, enabling app-based ordering and digital payments at scale.' },
  ];

  drivers.forEach((d, i) => {
    const dx = 80 + i * 220;
    doc.fontSize(10).fillColor(C.cyan).text(d.title, dx, 295, { width: 200 });
    doc.fontSize(8).fillColor(C.gray).text(d.desc, dx, 310, { width: 200, lineGap: 2 });
  });

  slideNum(doc, 5);
}

function slide6(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'BUSINESS MODEL', 60, 35, C.green);
  doc.fontSize(26).fillColor(C.white).text('Multiple ', 60, 60, { continued: true });
  doc.fillColor(C.cyan).text('Revenue Streams');
  accentBar(doc, 60, 92, 50);

  const lx = 60, rx = 410;

  doc.fontSize(11).fillColor(C.white).text('Revenue Breakdown', lx, 112);
  accentBar(doc, lx, 128, 25);

  const revenues = [
    ['Service Fee', 'R29 per order (flat fee)'],
    ['Processing Fee', '2.6% + 15% VAT on card payment'],
    ['Subscription', 'R39/month per active operator'],
    ['Margin', 'Revenue retained after operator commission'],
  ];

  let ry = 140;
  revenues.forEach(([s, d], i) => {
    if (i === 3) {
      doc.roundedRect(lx, ry - 2, 330, 18, 3).fill('#253347');
    }
    doc.fontSize(9).fillColor(i === 3 ? C.cyan : C.offWhite).text(s, lx + 8, ry + 1, { width: 110 });
    doc.fontSize(9).fillColor(C.gray).text(d, lx + 120, ry + 1, { width: 210 });
    ry += 22;
  });

  doc.fontSize(11).fillColor(C.white).text('Operator Commission per Delivery', lx, ry + 8);
  accentBar(doc, lx, ry + 24, 25);
  ry += 34;

  doc.fontSize(7).fillColor(C.gray)
    .text('CYLINDER', lx + 8, ry)
    .text('CUSTOMER PRICE', lx + 90, ry)
    .text('OPERATOR EARNS', lx + 210, ry);
  ry += 14;

  const comm = [['9kg', 'R262', 'R80'], ['19kg', 'R552', 'R200'], ['48kg', 'R1,345', 'R500']];
  comm.forEach(([cyl, price, earn]) => {
    doc.fontSize(10).fillColor(C.offWhite).text(cyl, lx + 8, ry);
    doc.fillColor(C.white).text(price, lx + 90, ry);
    doc.fillColor(C.green).text(earn, lx + 210, ry);
    ry += 20;
  });

  card(doc, rx, 108, 330, 195);
  doc.rect(rx, 108, 4, 195).fill(C.green);
  doc.fontSize(11).fillColor(C.white).text('Unit Economics (19kg Order)', rx + 16, 120);
  accentBar(doc, rx + 16, 136, 25);

  const econ = [
    ['Customer Pays', 'R552', C.white],
    ['Operator Commission', '-R200', C.red],
    ['Gas Supply Cost', '-R280', C.red],
    ['Service Fee Retained', '+R29', C.green],
    ['Card Processing (Yoco)', '-R16.50', C.red],
  ];

  let ey = 148;
  econ.forEach(([label, val, color]) => {
    doc.moveTo(rx + 16, ey + 14).lineTo(rx + 314, ey + 14).lineWidth(0.5).stroke('#334155');
    doc.fontSize(9).fillColor(C.gray).text(label, rx + 16, ey, { width: 180 });
    doc.fontSize(10).fillColor(color).text(val, rx + 200, ey, { width: 114, align: 'right' });
    ey += 18;
  });
  doc.moveTo(rx + 16, ey + 2).lineTo(rx + 314, ey + 2).lineWidth(1).stroke(C.blue);
  ey += 10;
  doc.fontSize(10).fillColor(C.white).text('Gross Margin per Order', rx + 16, ey);
  doc.fontSize(13).fillColor(C.green).text('R84.50', rx + 200, ey - 2, { width: 114, align: 'right' });

  card(doc, rx, 320, 330, 110);
  doc.rect(rx, 320, 4, 110).fill(C.blue);
  doc.fontSize(11).fillColor(C.white).text('Scale Projection', rx + 16, 332);
  doc.fontSize(9).fillColor(C.gray).text('At 100 orders/day average:', rx + 16, 348);

  const scale = [['Daily Revenue', '~R8,450'], ['Monthly Revenue', '~R253,500'], ['Annual Revenue', '~R3.04M']];
  let sy = 368;
  scale.forEach(([label, val], i) => {
    doc.fontSize(9).fillColor(C.gray).text(label, rx + 16, sy);
    doc.fontSize(10).fillColor(i === 2 ? C.green : C.white).text(val, rx + 200, sy, { width: 114, align: 'right' });
    sy += 20;
  });

  slideNum(doc, 6);
}

function slide7(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'COMPETITIVE ADVANTAGE', 60, 40, C.blue);
  doc.fontSize(26).fillColor(C.white).text('Our ', 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('Unfair Advantages');
  accentBar(doc, 60, 100, 50);

  const moats = [
    { title: 'Compliance-First Positioning', desc: 'Only licensed operators with dangerous goods permits. A trust moat that competitors cannot replicate.' },
    { title: 'Regulatory Barrier to Entry', desc: 'LPG transport is heavily regulated. Compliance is built into our operator onboarding by design.' },
    { title: 'Full-Stack PWA', desc: 'No app store dependency. Works on any device with push notifications, offline support, and installability.' },
    { title: 'Network Effects', desc: 'More operators = faster delivery = more customers = more orders. A self-reinforcing flywheel.' },
    { title: 'Card-Only Payments', desc: 'Every transaction is digital and traceable. Enables trust, automated settlements, and future lending.' },
    { title: 'Proximity-Based Matching', desc: 'Haversine algorithm matches the nearest available operator within 10km. Efficient, fast logistics.' },
    { title: 'Data Advantage', desc: 'Real-time demand data enables dynamic pricing, demand forecasting, and supply chain optimisation.' },
    { title: 'First-Mover in Verified LPG', desc: 'No other SA platform combines compliance verification, live tracking, and digital payments for LPG.' },
  ];

  const cw = 325, ch = 56, gap = 10;
  const dotColors = [C.green, C.blue, C.cyan, C.amber, C.green, C.blue, C.cyan, C.amber];
  moats.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = 60 + col * (cw + 16), cy = 118 + row * (ch + gap);
    card(doc, cx, cy, cw, ch);
    bullet(doc, cx + 14, cy + 10, 4, dotColors[i]);
    doc.fontSize(10).fillColor(C.white).text(m.title, cx + 28, cy + 8, { width: cw - 42 });
    doc.fontSize(8).fillColor(C.gray).text(m.desc, cx + 14, cy + 26, { width: cw - 28, lineGap: 2 });
  });

  slideNum(doc, 7);
}

function slide8(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'TRACTION & MILESTONES', 60, 40, C.green);
  doc.fontSize(26).fillColor(C.white).text("What We've ", 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('Built So Far');
  accentBar(doc, 60, 100, 50);

  const milestones = [
    { label: 'Full MVP\nLive & Deployed', color: C.green },
    { label: '3 User Roles\nCustomer / Operator / Admin', color: C.blue },
    { label: 'Yoco Payments\nIntegrated', color: C.cyan },
    { label: 'Live GPS\nTracking Active', color: C.amber },
  ];

  milestones.forEach((m, i) => {
    const mx = 60 + i * 170, my = 120;
    card(doc, mx, my, 155, 65);
    doc.rect(mx, my, 155, 3).fill(m.color);
    doc.fontSize(9).fillColor(C.offWhite).text(m.label, mx + 12, my + 18, { width: 131, align: 'center', lineGap: 3 });
  });

  doc.fontSize(11).fillColor(C.white).text('Product Features Completed', 60, 210);
  accentBar(doc, 60, 226, 30);

  const features = [
    { title: 'Customer App', color: C.cyan, items: 'Product browsing, card checkout, real-time delivery tracking, push notifications, in-app chat, order history, email receipts' },
    { title: 'Operator Dashboard', color: C.green, items: 'Go online/offline, accept orders, GPS navigation, earnings dashboard, weekly settlement history, admin support chat' },
    { title: 'Admin Panel', color: C.amber, items: 'Operator approval workflow, order management, settlement processing, analytics, referral program, launch campaign tools' },
  ];

  features.forEach((f, i) => {
    const fx = 60 + i * 232, fy = 240;
    card(doc, fx, fy, 218, 130);
    doc.rect(fx, fy, 4, 130).fill(f.color);
    doc.fontSize(11).fillColor(f.color).text(f.title, fx + 16, fy + 14, { width: 186 });
    doc.fontSize(8.5).fillColor(C.gray).text(f.items, fx + 16, fy + 34, { width: 186, lineGap: 3 });
  });

  slideNum(doc, 8);
}

function slide9(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  sectionBadge(doc, 'ROADMAP', 60, 40, C.blue);
  doc.fontSize(26).fillColor(C.white).text('The Path to ', 60, 68, { continued: true });
  doc.fillColor(C.cyan).text('Market Leadership');
  accentBar(doc, 60, 100, 50);

  const timeline = [
    { q: 'Q1 2026', title: 'Launch', desc: 'Johannesburg & Pretoria. Onboard first 50 founding operators. Activate referral program.' },
    { q: 'Q2 2026', title: 'Scale Gauteng', desc: 'Expand operator network across Gauteng. Performance tiers and loyalty program. 500+ daily orders.' },
    { q: 'Q3 2026', title: 'CT & Durban', desc: 'Expand to Western Cape and KwaZulu-Natal. LPG supplier partnerships for preferential pricing.' },
    { q: 'Q4 2026', title: 'National & B2B', desc: 'National metro coverage. B2B subscriptions for restaurants and hospitality. Bulk ordering.' },
    { q: '2027', title: 'Platform Expansion', desc: 'Operator financing. Adjacent energy products (solar, batteries). SADC regional expansion.' },
  ];

  const tlx = 65;
  doc.moveTo(tlx + 4, 125).lineTo(tlx + 4, 390).lineWidth(2).stroke(C.blue);

  timeline.forEach((t, i) => {
    const ty = 125 + i * 54;
    doc.circle(tlx + 4, ty + 6, 5).fill(C.cyan);
    doc.fontSize(9).fillColor(C.cyan).text(t.q, tlx + 18, ty - 2, { width: 70 });
    doc.fontSize(10).fillColor(C.white).text(t.title, tlx + 90, ty - 2, { width: 130 });
    doc.fontSize(8.5).fillColor(C.gray).text(t.desc, tlx + 90, ty + 14, { width: 280, lineGap: 1 });
  });

  const rx2 = 440;
  card(doc, rx2, 118, 300, 155);
  doc.rect(rx2, 118, 4, 155).fill(C.cyan);
  doc.fontSize(11).fillColor(C.white).text('Year 1 Targets', rx2 + 16, 130);
  accentBar(doc, rx2 + 16, 146, 25);

  const targets = [['Licensed Operators', '200+'], ['Registered Customers', '25,000+'], ['Daily Orders', '500+'], ['Cities Active', '5+'], ['Annual GMV', 'R100M+']];
  let ty2 = 158;
  targets.forEach(([label, val], i) => {
    doc.fontSize(9).fillColor(C.gray).text(label, rx2 + 16, ty2);
    doc.fontSize(10).fillColor(i === 4 ? C.green : C.cyan).text(val, rx2 + 190, ty2, { width: 94, align: 'right' });
    ty2 += 20;
  });

  card(doc, rx2, 290, 300, 115);
  doc.rect(rx2, 290, 4, 115).fill(C.amber);
  doc.fontSize(11).fillColor(C.white).text('Future Revenue Streams', rx2 + 16, 302);
  accentBar(doc, rx2 + 16, 318, 25);

  const future = [
    'Operator Financing - Working capital loans from transaction data',
    'B2B Subscriptions - Recurring delivery for restaurants & hospitality',
    'Advertising - Promoted listings for LPG suppliers and brands',
    'Certification - Operator training and licensing services',
  ];

  let fy = 330;
  future.forEach(f => {
    bullet(doc, rx2 + 18, fy + 2, 2.5, C.amber);
    doc.fontSize(8).fillColor(C.gray).text(f, rx2 + 28, fy, { width: 256, lineGap: 1 });
    fy += 18;
  });

  slideNum(doc, 9);
}

function slide10(doc) {
  addPage(doc);
  bg(doc, C.bg1);

  doc.circle(W + 80, -60, 300).fill('#162032');
  doc.circle(-60, H + 80, 280).fill('#1a2a3e');

  sectionBadge(doc, 'THE ASK', W / 2 - 28, 35, C.amber);

  doc.fontSize(24).fillColor(C.white).text('Join Us in Building', 0, 62, { width: W, align: 'center' });
  doc.fontSize(26).fillColor(C.cyan).text("South Africa's LPG Future", 0, 92, { width: W, align: 'center' });

  lightCard(doc, 150, 135, W - 300, 250);

  doc.fontSize(10).fillColor(C.gray).text('Seed Round', 0, 150, { width: W, align: 'center' });
  doc.fontSize(42).fillColor(C.cyan).text('R5M - R10M', 0, 168, { width: W, align: 'center' });
  doc.fontSize(10).fillColor(C.lightGray).text(
    'To launch commercially across Gauteng and scale to 500+ daily orders within 12 months.',
    W / 2 - 220, 220, { width: 440, align: 'center', lineGap: 2 }
  );

  const funds = [
    ['35%', 'Operator Acquisition & Onboarding'],
    ['25%', 'Customer Acquisition & Marketing'],
    ['25%', 'Technology & Product Development'],
    ['15%', 'Operations & Working Capital'],
  ];

  const fw = 220, fgap = 12;
  funds.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const fx = 190 + col * (fw + fgap), fy = 255 + row * 38;
    doc.roundedRect(fx, fy, fw, 30, 4).fill(C.bg2);
    doc.fontSize(14).fillColor(C.cyan).text(f[0], fx + 10, fy + 7, { width: 42 });
    doc.fontSize(8.5).fillColor(C.lightGray).text(f[1], fx + 52, fy + 9, { width: 158 });
  });

  const logoPath = path.join(__dirname, '..', 'client', 'public', 'logo-dark.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, W / 2 - 60, 410, { width: 120 });
  }

  doc.fontSize(10).fillColor(C.lightGray).text("South Africa's Verified LPG Delivery Network", 0, 460, { width: W, align: 'center' });
  doc.fontSize(8).fillColor(C.gray).text('Fast. Safe. Reliable.', 0, 476, { width: W, align: 'center' });

  doc.fontSize(9).fillColor(C.gray).text(
    'gaslite.replit.app   |   invest@gaslite.co.za   |   0800 GASLITE',
    0, 510, { width: W, align: 'center' }
  );

  slideNum(doc, 10);
}

async function main() {
  const doc = newDoc();
  const outputPath = path.join(__dirname, '..', 'client', 'public', 'Gaslite-Pitch-Deck.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  slide1(doc);
  slide2(doc);
  slide3(doc);
  slide4(doc);
  slide5(doc);
  slide6(doc);
  slide7(doc);
  slide8(doc);
  slide9(doc);
  slide10(doc);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log('PDF generated:', outputPath);
  const stats = fs.statSync(outputPath);
  console.log('Size:', (stats.size / 1024).toFixed(1), 'KB');
}

main().catch(console.error);
