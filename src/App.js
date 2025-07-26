import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';
import amazonLogo from './assets/amazon.png';
import flipkartLogo from './assets/flipkart.png';

function App() {
  const [phones, setPhones] = useState([]);

  useEffect(() => {
    const fetchPhones = async () => {
      const querySnapshot = await getDocs(collection(db, 'phones'));
      const phoneData = querySnapshot.docs.map(doc => doc.data());
      setPhones(phoneData);
    };
    fetchPhones().catch(console.error);
  }, []);

  const getPriceStatus = (price, prevPrice) => {
    if (!price || !prevPrice) return 'text-gray-500';
    const curr = parseInt(price.replace(/[^\d]/g, ''));
    const prev = parseInt(prevPrice.replace(/[^\d]/g, ''));
    if (curr < prev) return 'text-green-600 font-semibold';
    if (curr > prev) return 'text-red-600 font-semibold';
    return 'text-yellow-600';
  };

  const displayPrice = (current, previous) => {
    if (current) return current;
    if (previous) return previous;
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-white font-serif">
      <header className="bg-ynpblue text-white p-4 text-center">
        <h1 className="text-2xl font-bold">YNP: Your Next Phone</h1>
      </header>

      <section className="py-12 px-4">
        <h2 className="text-3xl font-bold text-ynpblue text-center mb-8">Phone Prices</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phones.map(phone => (
            <div
              key={phone.name}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-5 hover:shadow-xl transition duration-300"
            >
              <h3 className="text-xl font-bold text-ynpblue mb-4 text-center">{phone.name}</h3>

              <div className="flex items-center justify-between mb-3">
                <img src={amazonLogo} alt="Amazon" className="h-6 w-auto" />
                {phone.amazonUrl ? (
                  <a
                    href={phone.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ml-4 ${getPriceStatus(phone.amazonPrice || phone.prevAmazonPrice, phone.prevAmazonPrice)}`}
                  >
                    {displayPrice(phone.amazonPrice, phone.prevAmazonPrice)}
                  </a>
                ) : (
                  <span className="ml-4 text-gray-500">N/A</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <img src={flipkartLogo} alt="Flipkart" className="h-6 w-auto" />
                {phone.flipkartUrl ? (
                  <a
                    href={phone.flipkartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ml-4 ${getPriceStatus(phone.flipkartPrice || phone.prevFlipkartPrice, phone.prevFlipkartPrice)}`}
                  >
                    {displayPrice(phone.flipkartPrice, phone.prevFlipkartPrice)}
                  </a>
                ) : (
                  <span className="ml-4 text-gray-500">N/A</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
