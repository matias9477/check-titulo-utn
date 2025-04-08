require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { Resend } = require('resend');

const USERNAME = process.env.UTN_USERNAME;
const PASSWORD = process.env.UTN_PASSWORD;
const URL = 'https://tramites-academicos.utn.edu.ar/';
const STATE_FILE = 'estado.json';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

async function sendEmail(subject, message) {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html: `<pre style="font-family: sans-serif;">${message}</pre>`,
    });

    console.log('📨 Email sent:', response?.id || '(no id)');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

function loadPreviousEntries() {
  if (!fs.existsSync(STATE_FILE)) return [];
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function saveEntries(entries) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(entries, null, 2));
}

function compareEntries(current, previous) {
  const changes = [];
  current.forEach(row => {
    const match = previous.find(
      old => old.date === row.date && old.place === row.place
    );
    if (!match) {
      changes.push({ type: 'new', row });
    } else if (match.status !== row.status) {
      changes.push({ type: 'updated', row, oldStatus: match.status });
    }
  });
  return changes;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(URL, { waitUntil: 'networkidle2' });

    await page.type('input[name="documento"]', USERNAME);
    await page.type('input[name="password"]', PASSWORD);

    await Promise.all([
      page.click('#submitSignIn'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Esperar a que aparezca el botón "Ver detalle"
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button'))
        .some(btn => btn.innerText.includes('Ver detalle'));
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const verDetalle = buttons.find(btn => btn.innerText.includes('Ver detalle'));
      if (verDetalle) verDetalle.click();
    });

    // Esperar a que cargue la tabla con encabezados correctos
    await page.waitForFunction(() => {
        const normalize = text => text.trim().toLowerCase();
        const tables = Array.from(document.querySelectorAll('table'));
      
        return tables.some(table => {
          const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
            normalize(th.innerText)
          );
          const isTargetTable = JSON.stringify(headers) === JSON.stringify(["fecha", "lugar", "estado"]);
          const rows = table.querySelectorAll('tbody tr');
          return isTargetTable && rows.length > 0;
        });
      }, { timeout: 15000 });

    // Extraer solo la tabla que tiene encabezado Fecha | Lugar | Estado
    const currentEntries = await page.evaluate(() => {
      const normalize = text => text.trim().toLowerCase();
      const tables = Array.from(document.querySelectorAll('table'));

      const correctTable = tables.find(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
          normalize(th.innerText)
        );
        return JSON.stringify(headers) === JSON.stringify(["fecha", "lugar", "estado"]);
      });

      if (!correctTable) return [];

      const rows = correctTable.querySelectorAll('tbody tr');
      return Array.from(rows).map(row => {
        const cols = row.querySelectorAll('td');
        return {
          date: cols[0]?.innerText.trim(),
          place: cols[1]?.innerText.trim(),
          status: cols[2]?.innerText.trim(),
        };
      });
    });

    console.log('📋 Filas extraídas:', currentEntries);

    const previousEntries = loadPreviousEntries();
    const changes = compareEntries(currentEntries, previousEntries);

    if (changes.length > 0) {
      const messages = changes.map(change => {
        if (change.type === 'new') {
          return `🆕 Nueva entrada:\n📅 ${change.row.date}\n📍 ${change.row.place}\n📌 Estado: ${change.row.status}`;
        } else {
          return `🔄 Cambio de estado:\n📅 ${change.row.date}\n📍 ${change.row.place}\n📌 Antes: ${change.oldStatus}\n📌 Ahora: ${change.row.status}`;
        }
      });

      await sendEmail('📢 Actualización en el estado de tu título', messages.join('\n\n'));
      console.log('🔔 Se detectaron cambios y se envió un email.');
    } else {
      console.log('Sin cambios detectados.');
    }

    saveEntries(currentEntries);
    await browser.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await browser.close();
  }
})();