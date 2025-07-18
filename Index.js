require('./utils/global');
/**
 * WhatsApp Bot Multi Device - Powered by Baileys
 * Created by Deni Orlando - https://orlando-digital.my.id
 * Instagram: https://instagram.com/deni.orlando
 * WhatsApp: https://wa.me/6283106346274
 */

require('dotenv').config();

const { makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const config = require('./config');
const settings = require('./settings');

// Utilitas
const modules = require('./utils/module');
const tools = require('./utils/function');
const { cleanupExpiredPremium } = require('./utils/limit');
const color = require('./utils/color');
const convert = require('./utils/convert');
const connectDB = require('./utils/database');

// Handler
const messageHandler = require('./handler/messageHandler');
const statusHandler = require('./handler/statusHandler');

// Path dan QR
const path = require('path');
const QRCode = require('qrcode');

// Start Bot
async function startBot() {
  await connectDB(); // Koneksi MongoDB

  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: Browsers.macOS('Bot WhatsApp Deni Orlando'),
    auth: state
  });

  // QR Code
  sock.ev.on('connection.update', async (update) => {
    const { qr } = update;
    if (qr) {
      const qrPath = path.join(__dirname, 'assets', 'qr-code.png');
      QRCode.toFile(qrPath, qr, {
        color: { dark: '#000', light: '#FFF' }
      }, (err) => {
        if (err) color.error('Gagal membuat QR: ' + err);
        else color.success('QR Code disimpan: assets/qr-code.png');
      });
    }
  });

  setInterval(() => cleanupExpiredPremium(sock), 60 * 60 * 1000); // cek expired tiap jam

// Event Handler
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async (m) => messageHandler(sock, m));
  sock.ev.on('status.update', async (status) => statusHandler(sock, status));
  sock.ev.on('presence.update', async (presence) => {
    if (presence?.isOnline) {
      color.info(`📶 ${presence.id} sedang online...`);
    }
  });

  // Log pengaturan aktif
if (settings.autoReadStatus) color.info('Auto Read Status aktif');
if (settings.autoReactStatus) color.info('Auto React Status aktif');
if (settings.showTypingVoiceNote) color.info('Simulasi Typing Voice aktif');
if (settings.enableWebsiteButton) color.info('Tombol Website aktif');
if (settings.enablePremiumMenu) color.info('Menu Premium aktif');
if (settings.enableSewaBot) color.info('Sewa Bot aktif');

// Info Uptime
  setInterval(() => {
    const uptime = tools.formatUptime(process.uptime());
    color.info('Bot Uptime: ' + uptime);
  }, settings.pingIntervalSeconds * 1000); // Setiap 60 detik

  color.success('🤖 Bot WhatsApp Deni Orlando aktif! (v1.0.9)');
}

startBot();
              
