const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Email setup — replace with your email & app password or SMTP details
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'lyricsdunia9@gmail.com',
    pass: 'Buddy@123', // Use app password if 2FA enabled
  },
});

function parsePrice(priceStr) {
  if (!priceStr) return null;
  // Remove everything except digits and dot
  const number = priceStr.replace(/[^\d.]/g, '');
  return parseFloat(number);
}

async function sendPriceDropEmail(phoneName, oldPrice, newPrice) {
  const mailOptions = {
    from: 'lyricsdunia9@gmail.com',
    to: 'americanostrich001@example.com',
    subject: `Price drop alert: ${phoneName}`,
    text: `Price dropped from ₹${oldPrice} to ₹${newPrice}. Check it out!`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Sent price drop email for ${phoneName}`);
}

async function scrapePrices() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');

  const phones = [
    {
      name: 'Samsung Galaxy S24 Ultra',
      amazonUrl: 'https://www.amazon.in/Samsung-Galaxy-Smartphone-Titanium-Storage/dp/B0CS5XW6TN/ref=sr_1_3?crid=1DUH7WXCLEG80&dib=eyJ2IjoiMSJ9.hv6NA5ualu9lei5y5vIe2GMNiST-H9gDW5_nYq4vVAR1JsXB8PUVcbd4ZbSW3ZYiUASgcEjQ_USHgj4E3DFWBoLLDmH63nHWS7i7UTJgs9W4LrkBiMrqviCy-cQPRpViNW6CXN-hBMnyzkwocMZPVuPY1oZXtv8T1uLqzBAXDugi64C602X_UfUokT3-8j5pU-FwNHvR6q3W8FnMdPAmp2V-qd8wziqbZ3Cehs1tJHE.8xh28g97in7rNgFenGhizL6StKDraeP3GdFfqyaT-mo&dib_tag=se&keywords=24%2Bultra&qid=1753479069&sprefix=24%2Bultra%2Caps%2C219&sr=8-3&th=1',
      flipkartUrl: 'https://www.flipkart.com/samsung-galaxy-s24-ultra-5g-titanium-gray-256-gb/p/itm12ef5ea0212ed?pid=MOBGX2F3RQKKKTAW&lid=LSTMOBGX2F3RQKKKTAWNKBMGS&marketplace=FLIPKART&q=s24+ultra&store=tyy%2F4io&srno=s_1_1&otracker=search&otracker1=search&fm=organic&iid=c774c0db-d43e-47da-a7e4-90bc5a2b95b4.MOBGX2F3RQKKKTAW.SEARCH&ppt=pp&ppn=pp&ssid=gssspz4l4w0000001753478993977&qH=9645cd762e4dc77e',
    },
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
        const el = document.querySelector('#priceblock_dealprice, #priceblock_ourprice, .a-price .a-offscreen');
        return el ? el.textContent.trim() : null;
      });
    } catch (err) {
      console.error(`Amazon scrape failed for ${phone.name}: ${err.message}`);
    }

    try {
      await page.goto(phone.flipkartUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      flipkartPrice = await page.evaluate(() => {
        const el = document.querySelector('._30jeq3');
        return el ? el.textContent.trim() : null;
      });
    } catch (err) {
      console.error(`Flipkart scrape failed for ${phone.name}: ${err.message}`);
    }

    const docRef = db.collection('phones').doc(phone.name);
    const docSnap = await docRef.get();
    const oldData = docSnap.exists ? docSnap.data() : null;

    // Parse prices as numbers for comparison
    const oldAmazonPriceNum = parsePrice(oldData?.amazonPrice);
    const oldFlipkartPriceNum = parsePrice(oldData?.flipkartPrice);
    const newAmazonPriceNum = parsePrice(amazonPrice);
    const newFlipkartPriceNum = parsePrice(flipkartPrice);

    // Save new price record in subcollection
    await docRef.collection('prices').add({
      amazonPrice,
      flipkartPrice,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update latest prices in main doc
    await docRef.set({
      name: phone.name,
      amazonPrice,
      flipkartPrice,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Check and send email if price dropped on Amazon
    if (
      newAmazonPriceNum !== null &&
      oldAmazonPriceNum !== null &&
      newAmazonPriceNum < oldAmazonPriceNum
    ) {
      await sendPriceDropEmail(phone.name, oldAmazonPriceNum, newAmazonPriceNum);
    }

    // Check and send email if price dropped on Flipkart
    if (
      newFlipkartPriceNum !== null &&
      oldFlipkartPriceNum !== null &&
      newFlipkartPriceNum < oldFlipkartPriceNum
    ) {
      await sendPriceDropEmail(phone.name, oldFlipkartPriceNum, newFlipkartPriceNum);
    }

    console.log(`Processed prices for ${phone.name}`);
  }

  await browser.close();
}

scrapePrices().catch(console.error);
