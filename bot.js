import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const LOG_FILE = path.join(process.cwd(), 'bot.log');

let latestQrCodeDataUrl = null;
let botStatus = 'starting'; // 'starting' | 'waiting_qr' | 'connected' | 'disconnected'
let connectedNumber = null;
let connectedSince = null;
const memoryLogs = [];

function log(msg) {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const line = `[${time}] ${msg}`;
  console.log(line);
  memoryLogs.push(line);
  if (memoryLogs.length > 40) memoryLogs.shift();
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
  } catch (e) {}
}

// Load Knowledge Base
let knowledgeBase = "{}";
try {
  knowledgeBase = fs.readFileSync(path.join(process.cwd(), 'knowledge.json'), 'utf-8');
  log("📚 Company Knowledge Base loaded successfully.");
} catch (e) {
  log("⚠️ Could not load knowledge.json: " + e.message);
}

const SYSTEM_INSTRUCTION = `
Aap ek professional, warm aur respectful customer support representative hain.
Aapka kaam customer ke WhatsApp message ka seedha, asaan aur natural jawab dena hai.

CRITICAL RULES:
1. ROBOTIC MAT BANO: AI jaisi kitabi zaban (jaise 'As an AI language model...', 'I am an artificial intelligence') bilkul use mat karo.
2. ZUBAN MATCH KARO: Agar customer Roman Urdu mein likhe toh jawab Roman Urdu mein do. Agar English mein likhe toh fluent English mein do.
3. CONCISE & CRISP: WhatsApp par max 1 se 3 sentences mein jawab do.
4. STRICT TRUTH: Sirf di gayi COMPANY KNOWLEDGE BASE se jawab do.
5. ESCALATION: Agar customer aisi cheez pooche jo knowledge base mein na ho, toh politely bolo:
   "Main ne aapka sawal note kar liya hai, hamari team jald hi aap se rabta karegi."

=== COMPANY KNOWLEDGE BASE ===
${knowledgeBase}
`;

async function getGeminiReply(userMessage) {
  if (!GEMINI_API_KEY) {
    return "Salam! Hamari team jald aap se rabta karegi.";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 250 }
      })
    });

    clearTimeout(timeout);

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) return reply.trim();
    return "Salam! Shukriya aapke message ka. Hamari team jald aapki rehnumai karegi.";
  } catch (err) {
    log(`❌ Gemini API error: ${err.message}`);
    return "Salam! Hamari team jald aapke sawal ka jawab degi.";
  }
}

function extractMessageText(msg) {
  if (!msg?.message) return '';
  let raw = msg.message;

  // Unwrap common WhatsApp containers
  while (raw?.ephemeralMessage || raw?.viewOnceMessage || raw?.viewOnceMessageV2 || raw?.documentWithCaptionMessage) {
    raw = raw.ephemeralMessage?.message || 
          raw.viewOnceMessage?.message || 
          raw.viewOnceMessageV2?.message || 
          raw.documentWithCaptionMessage?.message || 
          raw;
  }

  if (raw?.editedMessage?.message?.protocolMessage?.editedMessage) {
    raw = raw.editedMessage.message.protocolMessage.editedMessage;
  }

  if (raw?.protocolMessage || raw?.reactionMessage || raw?.senderKeyDistributionMessage) {
    return '';
  }

  return (
    raw?.conversation ||
    raw?.extendedTextMessage?.text ||
    raw?.imageMessage?.caption ||
    raw?.videoMessage?.caption ||
    raw?.documentMessage?.caption ||
    ''
  ).trim();
}

let reconnectAttempts = 0;
const MAX_RECONNECT = 8;

async function startWhatsAppBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  log(`Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`);

  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.windows('Desktop'),
    syncFullHistory: false,
    getMessage: async () => undefined
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      botStatus = 'waiting_qr';
      log("\n📲 SCAN THIS FRESH QR CODE NOW WITH YOUR WHATSAPP:");
      qrcodeTerminal.generate(qr, { small: true });

      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 350, margin: 2 });
        latestQrCodeDataUrl = qrDataUrl;
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Scan WhatsApp QR Code</title>
  <meta http-equiv="refresh" content="15">
  <style>
    body { background: #0b141a; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #111b21; padding: 30px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    img { border-radius: 12px; background: white; padding: 12px; }
    h2 { color: #00a884; margin-top: 0; }
    p { color: #8696a0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Scan Fresh WhatsApp QR Code</h2>
    <p>Apne mobile mein WhatsApp open karein ➡️ <b>Linked Devices</b> ➡️ <b>Link a device</b></p>
    <img src="${qrDataUrl}" alt="QR Code" />
    <p style="margin-top: 15px; font-size: 12px; color: #00a884;">Active & Ready to Scan!</p>
  </div>
</body>
</html>`;
        fs.writeFileSync(path.join(process.cwd(), 'scan.html'), html, 'utf-8');
      } catch (e) {
        log("Could not write scan.html: " + e.message);
      }
    }

    if (connection === 'close') {
      botStatus = 'disconnected';
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      log(`⚠️ Connection closed (status: ${statusCode})`);

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        // Session invalidated — clear auth and get fresh QR
        log('🔑 Session logged out. Clearing auth_info for fresh QR scan...');
        try {
          fs.rmSync(path.join(process.cwd(), 'auth_info'), { recursive: true, force: true });
        } catch (e) {}
        reconnectAttempts = 0;
        log('🔄 Restarting for fresh QR code in 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
        startWhatsAppBot();
      } else if (statusCode === 440) {
        // Connection replaced — another instance is running
        log('⚠️ Error 440: Connection replaced by another client. Make sure only ONE instance of bot.js is running!');
        log('💡 Waiting 10 seconds before reconnecting...');
        await new Promise(r => setTimeout(r, 10000));
        reconnectAttempts++;
        if (reconnectAttempts <= MAX_RECONNECT) {
          startWhatsAppBot();
        } else {
          log('❌ Max reconnect attempts reached. Please restart manually with: npm start');
        }
      } else {
        // Other errors — reconnect with backoff
        reconnectAttempts++;
        if (reconnectAttempts <= MAX_RECONNECT) {
          const delay = Math.min(2000 * reconnectAttempts, 15000);
          log(`🔄 Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT})...`);
          await new Promise(r => setTimeout(r, delay));
          startWhatsAppBot();
        } else {
          log('❌ Max reconnect attempts reached. Please restart manually with: npm start');
        }
      }
    } else if (connection === 'open') {
      reconnectAttempts = 0; // Reset on successful connection
      const myId = state.creds?.me?.id || sock.user?.id || '';
      const myNumber = myId.split(/[:@]/)[0];
      botStatus = 'connected';
      latestQrCodeDataUrl = null;
      connectedNumber = myNumber;
      connectedSince = new Date();
      log("\n🎉 =====================================================");
      log(`✅ WHATSAPP CONNECTED SUCCESSFULLY!`);
      log(`📱 Connected Number: +${myNumber}`);
      log(`🤖 AI BOT IS NOW ACTIVE & AUTO-REPLYING!`);
      log("=====================================================\n");

      const htmlConnected = `<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Connected!</title>
  <style>
    body { background: #0b141a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #111b21; padding: 40px; border-radius: 16px; text-align: center; border: 2px solid #00a884; }
    h1 { color: #00a884; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ WhatsApp Connected Successfully!</h1>
    <p>Connected Number: <b>+${myNumber}</b></p>
    <p>Aapka WhatsApp number ab AI Automation se link ho chuka hai.</p>
    <p>Bot ab incoming customer messages aur Self-Chat par auto-reply karega!</p>
  </div>
</body>
</html>`;
      fs.writeFileSync(path.join(process.cwd(), 'scan.html'), htmlConnected, 'utf-8');
    }
  });

  const botSentMessageIds = new Set();

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message) continue;

      const msgId = msg.key?.id;
      const remoteJid = msg.key?.remoteJid || '';

      // Skip messages already sent by this bot instance
      if (msgId && botSentMessageIds.has(msgId)) {
        continue;
      }

      // Ignore broadcasts and channels/newsletters
      if (remoteJid.endsWith('@broadcast') || remoteJid.endsWith('@newsletter')) {
        continue;
      }

      // Read phone and LID credentials
      const myPhone = (state.creds?.me?.id || sock.user?.id || '').split(/[:@]/)[0].replace(/[^0-9]/g, '');
      const myLid = (state.creds?.me?.lid || '').split(/[:@]/)[0].replace(/[^0-9]/g, '');
      const remoteNum = remoteJid.split(/[:@]/)[0].replace(/[^0-9]/g, '');

      // Identify Self-Chat ("Message yourself" / "You")
      const isSelfChat = 
        (myPhone && remoteNum === myPhone) ||
        (myLid && remoteNum === myLid) ||
        (msg.key.fromMe && (remoteJid.includes(myPhone) || (myLid && remoteJid.includes(myLid))));

      const messageText = extractMessageText(msg);
      if (!messageText) continue;

      // Explicit testing triggers (e.g. "!test price" or "!ai kahan hai office")
      const isExplicitTest = messageText.startsWith('!test') || messageText.startsWith('!ai') || messageText.startsWith('#bot');

      // Group chat handling: ignore unless tagged or starts with !ai/!test
      if (remoteJid.endsWith('@g.us')) {
        const isBotMentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.some(
          jid => (myPhone && jid.includes(myPhone)) || (myLid && jid.includes(myLid))
        );
        if (!isBotMentioned && !isExplicitTest) {
          continue;
        }
      }

      // If sent by user themselves, only reply if it's Self-Chat OR an explicit test command
      if (msg.key.fromMe && !isSelfChat && !isExplicitTest) {
        log(`ℹ️ [Outgoing Skipped] Message sent by you to ${remoteNum}. Bot only replies in Self-Chat ("Message yourself") or incoming chats.`);
        continue;
      }

      // Clean query text if it used a command prefix
      let queryText = messageText;
      if (isExplicitTest) {
        queryText = messageText.replace(/^(!test|!ai|#bot)\s*/i, '').trim();
      }
      if (!queryText) queryText = "Salam";

      const senderDisplay = isSelfChat ? `Self-Chat (${myPhone})` : remoteNum;
      log(`\n📩 [Message Received] From ${senderDisplay}: "${queryText}"`);

      // Generate AI response via Gemini
      const reply = await getGeminiReply(queryText);
      log(`🤖 [AI Auto-Reply] To ${senderDisplay}: "${reply}"`);

      // Send reply
      try {
        const sent = await sock.sendMessage(remoteJid, { text: reply }, { quoted: msg });
        if (sent?.key?.id) {
          botSentMessageIds.add(sent.key.id);
          if (botSentMessageIds.size > 500) {
            const firstId = botSentMessageIds.values().next().value;
            botSentMessageIds.delete(firstId);
          }
        }
        log(`✅ [Sent Successfully] Delivered to ${senderDisplay}`);
      } catch (err) {
        log(`❌ [Send Error] Failed to reply to ${senderDisplay}: ${err.message}`);
      }
    }
  });
}

startWhatsAppBot();

function renderWebPage() {
  const isConnected = botStatus === 'connected';
  const isWaitingQr = botStatus === 'waiting_qr' && latestQrCodeDataUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Automation 24/7 Cloud</title>
  ${!isConnected ? '<meta http-equiv="refresh" content="10">' : '<meta http-equiv="refresh" content="30">'}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: #0b141a; color: #e9edef; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #111b21; border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.6); border: 1px solid #222e35; }
    .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .badge-green { background: rgba(0, 168, 132, 0.15); color: #00a884; border: 1px solid #00a884; }
    .badge-amber { background: rgba(255, 170, 0, 0.15); color: #ffaa00; border: 1px solid #ffaa00; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
    h1 { font-size: 22px; color: #fff; margin-bottom: 8px; font-weight: 700; }
    p.desc { font-size: 14px; color: #8696a0; margin-bottom: 24px; line-height: 1.5; }
    .qr-box { background: #ffffff; border-radius: 16px; padding: 16px; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.4); margin-bottom: 20px; }
    .qr-box img { display: block; width: 280px; height: 280px; }
    .steps { text-align: left; background: #1f2c34; padding: 18px 20px; border-radius: 14px; margin-bottom: 20px; font-size: 13px; line-height: 1.8; color: #d1d7db; }
    .steps b { color: #00a884; }
    .logs-box { text-align: left; background: #0c1317; border: 1px solid #222e35; border-radius: 12px; padding: 14px; max-height: 180px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #8696a0; line-height: 1.6; }
    .logs-box .log-line { border-bottom: 1px solid #162026; padding: 2px 0; word-break: break-word; }
    .footer { margin-top: 24px; font-size: 12px; color: #8696a0; }
  </style>
</head>
<body>
  <div class="card">
    ${isConnected ? `
      <div class="badge badge-green"><span class="dot"></span> 24/7 CLOUD ACTIVE</div>
      <h1>WhatsApp Bot is Online!</h1>
      <p class="desc">Aapka WhatsApp number AI Bot ke sath successfully connected hai aur 24/7 replies de raha hai.</p>
      
      <div class="steps">
        <div>📱 <b>Connected Number:</b> +${connectedNumber || 'Active'}</div>
        <div>🤖 <b>AI Model:</b> Google Gemini (${MODEL_NAME})</div>
        <div>🕒 <b>Connected Since:</b> ${connectedSince ? connectedSince.toLocaleTimeString() : 'Active'}</div>
        <div>⚡ <b>Status:</b> Auto-replying to all incoming messages</div>
      </div>
    ` : isWaitingQr ? `
      <div class="badge badge-amber"><span class="dot"></span> SCAN REQUIRED</div>
      <h1>Scan WhatsApp QR Code</h1>
      <p class="desc">Bot ko apne WhatsApp se connect karne ke liye QR code scan karein:</p>
      
      <div class="qr-box">
        <img src="${latestQrCodeDataUrl}" alt="WhatsApp QR Code" />
      </div>

      <div class="steps">
        <div>1. Apne mobile mein <b>WhatsApp</b> open karein.</div>
        <div>2. <b>Settings / 3-Dots</b> par click karein.</div>
        <div>3. <b>Linked Devices</b> ➡️ <b>Link a device</b> par tap karein.</div>
        <div>4. Is QR code ko scan karein.</div>
      </div>
    ` : `
      <div class="badge badge-amber"><span class="dot"></span> INITIALIZING...</div>
      <h1>Connecting to WhatsApp...</h1>
      <p class="desc">Bot start ho raha hai, agar pehli dafa hai toh thodi der mein QR code yahan appear ho jayega. Yeh page har 10 second baad auto-refresh hota hai.</p>
    `}

    <div style="text-align: left; font-size: 11px; color: #8696a0; margin-bottom: 6px; font-weight: 600;">LIVE LOGS (LAST 10 EVENTS):</div>
    <div class="logs-box">
      ${memoryLogs.slice(-10).reverse().map(l => `<div class="log-line">${l.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('') || '<div>Waiting for events...</div>'}
    </div>

    <div class="footer">
      WhatsApp AI Automation Engine • 24/7 Cloud Ready
    </div>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/health' || url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  if (url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: botStatus,
      connected: botStatus === 'connected',
      phone: connectedNumber,
      connectedSince: connectedSince,
      model: MODEL_NAME,
      recentLogs: memoryLogs.slice(-5)
    }));
    return;
  }

  // Web Dashboard UI
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderWebPage());
});

const HOST = process.env.IP || '0.0.0.0';

server.listen(PORT, HOST, () => {
  log(`🌐 Web Dashboard & Health Endpoint listening on ${HOST}:${PORT}`);
});
