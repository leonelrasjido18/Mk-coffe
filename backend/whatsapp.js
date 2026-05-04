const { Client, LocalAuth } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

let client = null;
let isReady = false;
let currentQR = null; // base64 data URL del QR actual

function initWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', async (qr) => {
    console.log('\n📱 Nuevo QR generado. Escanealo desde la web o la terminal.\n');
    qrTerminal.generate(qr, { small: true });

    // Generar QR como imagen base64 para el frontend
    try {
      currentQR = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
    } catch (err) {
      console.error('Error generando QR image:', err);
    }
  });

  client.on('ready', () => {
    isReady = true;
    currentQR = null; // Ya no se necesita el QR
    console.log('\n✅ WhatsApp conectado y listo para enviar mensajes!\n');
  });

  client.on('authenticated', () => {
    currentQR = null;
    console.log('🔐 WhatsApp autenticado correctamente.');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación de WhatsApp:', msg);
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.log('📴 WhatsApp desconectado:', reason);
    isReady = false;
    // Re-inicializar para generar nuevo QR
    setTimeout(() => {
      client.initialize();
    }, 3000);
  });

  client.initialize();
}

async function sendMessage(phoneNumber, message) {
  if (!isReady || !client) {
    throw new Error('WhatsApp no está conectado. Escaneá el QR primero.');
  }

  let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (formattedNumber.length === 10) {
    formattedNumber = '549' + formattedNumber; // Auto-add 549 if they just typed the 10 digits
  } else if (formattedNumber.startsWith('54') && !formattedNumber.startsWith('549') && formattedNumber.length === 12) {
    formattedNumber = '549' + formattedNumber.substring(2); // Convert 54... to 549...
  }

  try {
    // Pedirle a WhatsApp que valide el número y nos dé el ID oficial
    const numberDetails = await client.getNumberId(formattedNumber);
    
    if (!numberDetails) {
      throw new Error(`El número ${formattedNumber} no está registrado en WhatsApp o el formato es incorrecto.`);
    }

    const chatId = numberDetails._serialized;
    await client.sendMessage(chatId, message);
    console.log(`✅ Mensaje enviado a +${formattedNumber}`);
    return true;
  } catch (err) {
    console.error(`❌ Error enviando a +${formattedNumber}:`, err.message);
    throw err;
  }
}

function getStatus() {
  return isReady;
}

function getQR() {
  return currentQR;
}

async function logoutWhatsApp() {
  if (!client) throw new Error('No hay cliente activo');
  try {
    await client.logout();
    isReady = false;
    currentQR = null;
    console.log('\n🚪 WhatsApp desvinculado correctamente.');
    // Re-inicializar para mostrar nuevo QR
    setTimeout(() => client.initialize(), 2000);
  } catch (err) {
    console.error('Error al desconectar:', err.message);
    throw err;
  }
}

module.exports = { initWhatsApp, sendMessage, getStatus, getQR, logoutWhatsApp };
