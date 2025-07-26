const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

puppeteer.use(StealthPlugin());

async function scrapePrices() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36'
  );

  const phones = [
    {
      name: 'Samsung Galaxy S24 Ultra',
      amazonUrl:
        'https://www.amazon.in/Samsung-Galaxy-Smartphone-Titanium-Storage/dp/B0CS5XW6TN/ref=sr_1_3?crid=1DUH7WXCLEG80&dib=eyJ2IjoiMSJ9.hv6NA5ualu9lei5y5vIe2GMNiST-H9gDW5_nYq4vVAR1JsXB8PUVcbd4ZbSW3ZYiUASgcEjQ_USHgj4E3DFWBoLLDmH63nHWS7i7UTJgs9W4LrkBiMrqviCy-cQPRpViNW6CXN-hBMnyzkwocMZPVuPY1oZXtv8T1uLqzBAXDugi64C602X_UfUokT3-8j5pU-FwNHvR6q3W8FnMdPAmp2V-qd8wziqbZ3Cehs1tJHE.8xh28g97in7rNgFenGhizL6StKDraeP3GdFfqyaT-mo&dib_tag=se&keywords=24%2Bultra&qid=1753479069&sprefix=24%2Bultra%2Caps%2C219&sr=8-3&th=1',
      flipkartUrl:
        'https://www.flipkart.com/samsung-galaxy-s24-ultra-5g-titanium-gray-256-gb/p/itm12ef5ea0212ed?pid=MOBGX2F3RQKKKTAW&lid=LSTMOBGX2F3RQKKKTAWNKBMGS&marketplace=FLIPKART&q=s24+ultra&store=tyy%2F4io&srno=s_1_1&otracker=search&otracker1=search&fm=organic&iid=c774c0db-d43e-47da-a7e4-90bc5a2b95b4.MOBGX2F3RQKKKTAW.SEARCH&ppt=pp&ppn=pp&ssid=gssspz4l4w0000001753478993977&qH=9645cd762e4dc77e',
    },
    {
      name: 'iPhone 16 Pro',
      amazonUrl:
        'https://www.amazon.in/iPhone-16-Pro-Max-256/dp/B0DGJJM5HZ/ref=sr_1_44?crid=2FVLNR88WAIRT&dib=eyJ2IjoiMSJ9.X0imLW2SDkCPEex-H8sO_UUhFe7_OP64hBIHTUCoJVEkzmc2uLVs5LV_3us-R1hfnrXZPkDO8mnSgAFua1FYYMC1dIqVUcNwGu0bpS-mAW6ddYMTDtwAVe-QdE6ggEq5ixHQ7236fTKKOHbHb4McgYhb7aTQPTpvJlZIF2lG2xscK_ekaBGPSMYCkI6yyRkc.EmLe6_tUPo2fNuffj6x2Pwdh8hZNCJnMfhXPETHd4Cw&dib_tag=se&keywords=iphone%2B15%2Bpro&qid=1753484753&sprefix=iphone%2B15%2Bpro%2Caps%2C151&sr=8-44&xpid=EkzhF7wJvnAxM&th=1',
      flipkartUrl:
        'https://www.flipkart.com/apple-iphone-16-pro-desert-titanium-256-gb/p/itm4f25cec0bd003?pid=MOBH4DQFEZFXPGNJ&lid=LSTMOBH4DQFEZFXPGNJV4UWQH&marketplace=FLIPKART&q=iphone+16+pro&store=tyy%2F4io&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=5ca26218-ca89-45a2-8cc9-8bf91fe2a61f.MOBH4DQFEZFXPGNJ.SEARCH&ppt=sp&ppn=sp&ssid=9rv2qdskbk0000001753484787911&qH=6f0b50cc832ce851',
    },
  ];

  for (const phone of phones) {
    let amazonPrice = null;
    let flipkartPrice = null;

    // AMAZON
    try {
      await page.goto(phone.amazonUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.a-price .a-offscreen', { timeout: 15000 });
      amazonPrice = await page.$eval('.a-price .a-offscreen', el => el.textContent.trim());
      console.log(`${phone.name} Amazon price: ${amazonPrice}`);
    } catch (err) {
      console.error(`Amazon scrape failed for ${phone.name}: ${err.message}`);
      await takeScreenshot(page, `${phone.name.replace(/\s+/g, '_')}_amazon_error.png`);
    }

    // FLIPKART
    try {
      await page.goto(phone.flipkartUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('._30jeq3', { timeout: 15000 });
      flipkartPrice = await page.$eval('._30jeq3', el => el.textContent.trim());
      console.log(`${phone.name} Flipkart price: ${flipkartPrice}`);
    } catch (err) {
      console.error(`Flipkart scrape failed for ${phone.name}: ${err.message}`);
      await takeScreenshot(page, `${phone.name.replace(/\s+/g, '_')}_flipkart_error.png`);
    }

    console.log(`Finished ${phone.name}`);

    // FIRESTORE
    const docRef = db.collection('phones').doc(phone.name);
    const docSnap = await docRef.get();
    const oldData = docSnap.exists ? docSnap.data() : null;

    if (
      amazonPrice !== oldData?.amazonPrice ||
      flipkartPrice !== oldData?.flipkartPrice
    ) {
      await docRef.set({
        name: phone.name,
        amazonPrice,
        flipkartPrice,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Updated prices for ${phone.name}`);
    } else {
      console.log(`No price change for ${phone.name}`);
    }
  }

  await browser.close();
}

async function takeScreenshot(page, filename) {
  const dir = path.resolve(__dirname, 'screenshots');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await page.screenshot({ path: filePath });
}

scrapePrices().catch(err => {
  console.error('Fatal error in scraping:', err);
});
