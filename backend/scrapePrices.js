const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

async function scrapePrices() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const phones = [
    {
      name: 'Samsung Galaxy S24 Ultra',
      amazonUrl: 'https://www.amazon.in/Samsung-Galaxy-Smartphone-Titanium-Storage/dp/B0CS5XW6TN/ref=sr_1_3?crid=1DUH7WXCLEG80&dib=eyJ2IjoiMSJ9.hv6NA5ualu9lei5y5vIe2GMNiST-H9gDW5_nYq4vVAR1JsXB8PUVcbd4ZbSW3ZYiUASgcEjQ_USHgj4E3DFWBoLLDmH63nHWS7i7UTJgs9W4LrkBiMrqviCy-cQPRpViNW6CXN-hBMnyzkwocMZPVuPY1oZXtv8T1uLqzBAXDugi64C602X_UfUokT3-8j5pU-FwNHvR6q3W8FnMdPAmp2V-qd8wziqbZ3Cehs1tJHE.8xh28g97in7rNgFenGhizL6StKDraeP3GdFfqyaT-mo&dib_tag=se&keywords=24%2Bultra&qid=1753479069&sprefix=24%2Bultra%2Caps%2C219&sr=8-3&th=1',
      flipkartUrl: 'https://www.flipkart.com/samsung-galaxy-s24-ultra-5g-titanium-gray-256-gb/p/itm12ef5ea0212ed?pid=MOBGX2F3RQKKKTAW&lid=LSTMOBGX2F3RQKKKTAWNKBMGS&marketplace=FLIPKART&q=s24+ultra&store=tyy%2F4io&srno=s_1_1&otracker=search&otracker1=search&fm=organic&iid=c774c0db-d43e-47da-a7e4-90bc5a2b95b4.MOBGX2F3RQKKKTAW.SEARCH&ppt=pp&ppn=pp&ssid=gssspz4l4w0000001753478993977&qH=9645cd762e4dc77e',
    },
    // Add more phones
    {
      name: 'iPhone 16 Pro',
      amazonUrl: 'https://www.amazon.in/iPhone-16-Pro-Max-256/dp/B0DGJJM5HZ/ref=sr_1_44?crid=2FVLNR88WAIRT&dib=eyJ2IjoiMSJ9.X0imLW2SDkCPEex-H8sO_UUhFe7_OP64hBIHTUCoJVEkzmc2uLVs5LV_3us-R1hfnrXZPkDO8mnSgAFua1FYYMC1dIqVUcNwGu0bpS-mAW6ddYMTDtwAVe-QdE6ggEq5ixHQ7236fTKKOHbHb4McgYhb7aTQPTpvJlZIF2lG2xscK_ekaBGPSMYCkI6yyRkc.EmLe6_tUPo2fNuffj6x2Pwdh8hZNCJnMfhXPETHd4Cw&dib_tag=se&keywords=iphone%2B15%2Bpro&qid=1753484753&sprefix=iphone%2B15%2Bpro%2Caps%2C151&sr=8-44&xpid=EkzhF7wJvnAxM&th=1',
      flipkartUrl: 'https://www.flipkart.com/apple-iphone-16-pro-desert-titanium-256-gb/p/itm4f25cec0bd003?pid=MOBH4DQFEZFXPGNJ&lid=LSTMOBH4DQFEZFXPGNJV4UWQH&marketplace=FLIPKART&q=iphone+16+pro&store=tyy%2F4io&srno=s_1_1&otracker=search&otracker1=search&fm=Search&iid=5ca26218-ca89-45a2-8cc9-8bf91fe2a61f.MOBH4DQFEZFXPGNJ.SEARCH&ppt=sp&ppn=sp&ssid=9rv2qdskbk0000001753484787911&qH=6f0b50cc832ce851',
    },
  ];

  for (const phone of phones) {
    let amazonPrice = null;
    let flipkartPrice = null;

    try {
      await page.goto(phone.amazonUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      amazonPrice = await page.evaluate(() => {
        const priceElement = document.querySelector('#priceblock_ourprice, .a-price-whole');
        return priceElement ? priceElement.textContent.trim() : null;
      });
    } catch (error) {
      console.error(`Error scraping Amazon for ${phone.name}:`, error);
    }

    try {
      await page.goto(phone.flipkartUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      flipkartPrice = await page.evaluate(() => {
        const priceElement = document.querySelector('div._30jeq3');
        return priceElement ? priceElement.textContent.trim() : null;
      });
    } catch (error) {
      console.error(`Error scraping Flipkart for ${phone.name}:`, error);
    }

    if (amazonPrice || flipkartPrice) {
      await db.collection('phones').doc(phone.name).set({
        name: phone.name,
        amazonPrice,
        flipkartPrice,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Saved prices for ${phone.name}`);
    }
  }

  await browser.close();
}

scrapePrices().catch(console.error);