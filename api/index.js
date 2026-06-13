// Vercel serverless entry point
// This file wraps the Express server for Vercel's serverless runtime

import express from "express";
import OpenAI from "openai";
import { createServer } from "http";

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https:;"
  );
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hostname: req.hostname,
    environment: process.env.NODE_ENV || "production",
  });
});

// Contact form
app.post("/api/contact", async (req, res) => {
  try {
    const { firstName, lastName, email, company, service, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("=== CONTACT FORM SUBMISSION ===");
    console.log(`From: ${firstName} ${lastName} <${email}>`);
    console.log(`Company: ${company || "Not provided"}`);
    console.log(`Service: ${service || "Not specified"}`);
    console.log(`Message: ${message}`);
    console.log(`Time: ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: "Thank you for your message! We'll respond within 24 hours.",
      emailSent: false,
      method: "Logged",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.json({
      success: true,
      message: "Thank you for your message! We'll respond within 24 hours.",
    });
  }
});

// Zara AI chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages: chatMessages } = req.body;

    if (!chatMessages || !Array.isArray(chatMessages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are Zara, Move Digital's AI assistant — a premium, knowledgeable, and friendly guide for the Move Digital platform. You speak with confidence and warmth.

## About Move Digital
Move Digital is an African fintech company building production-grade platforms that power payments, fraud detection, identity verification, messaging, and digital wallets across Africa. Founded and led by Malcolm Govender.

**Contact:**
- Founder: Malcolm Govender
- Phone/WhatsApp: +27 83 465 4639
- Email: malcolm@movedigital.africa
- Location: South Africa

## Our 6 Platforms

1. **Swifter** — Cross-Border Payment Infrastructure
   - AI-powered smart routing across 10+ payment rails
   - Real-time FX aggregation, FATF Travel Rule compliance

2. **PayGuard** — Fraud Detection
   - Real-time risk scoring in <100ms, 70%+ fraud prediction accuracy

3. **eKYC Africa** — AI Identity Verification
   - 99.7% KYC accuracy, AI document + face recognition

4. **OTPWave** — WhatsApp-First OTP Delivery
   - 99.9% delivery rate

5. **SmartSendr** — Intelligent Messaging Infrastructure

6. **SwifterWallet** — Digital Wallet integrated with Swifter rails

## Response Guidelines
- Be concise — 2-4 sentences per response
- Always offer to connect users with Malcolm for detailed discussions
- For pricing, suggest booking a consultation`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages.slice(-10).map((m) => ({
          role: m.role,
          content: String(m.content),
        })),
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "I'm having trouble responding right now. Please contact Malcolm directly at +27 83 465 4639.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error?.message || error);
    res.json({
      reply:
        "I'm having a connectivity issue right now. You can reach Malcolm directly at **+27 83 465 4639** (WhatsApp) or **malcolm@movedigital.africa** for immediate assistance.",
    });
  }
});

// robots.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: https://movedigital.africa/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

Crawl-delay: 1`);
});

// sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://movedigital.africa/</loc>
    <lastmod>2025-04-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

export default app;
