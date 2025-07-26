import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';
import amazonLogo from './assets/amazon.png';
import flipkartLogo from './assets/flipkart.png';

function App() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhones = async () => {
      const querySnapshot = await getDocs(collection(db, 'phones'));
      const phoneData = querySnapshot.docs.map(doc => doc.data());
      setPhones(phoneData);
      setLoading(false);
    };
    fetchPhones().catch(console.error);
  }, []);

  const getPriceStatus = (price, prevPrice) => {
    if (!price || !prevPrice || price === 'null' || prevPrice === 'null') return 'text-gray-500';
    const curr = parseInt(price.replace(/[^\d]/g, ''));
    const prev = parseInt(prevPrice.replace(/[^\d]/g, ''));
    if (isNaN(curr) || isNaN(prev)) return 'text-gray-500';
    if (curr < prev) return 'text-green-600 font-semibold';
    if (curr > prev) return 'text-red-600 font-semibold';
    return 'text-yellow-600';
  };

  const displayPrice = (current, previous) => {
    if (current && current !== 'null') return current;
    if (previous && previous !== 'null') return `${previous} (old)`;
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-white font-serif">
      <header className="bg-ynpblue text-white p-6 shadow-md text-center">
        <h1 className="text-3xl font-bold">YNP: Your Next Phone</h1>
        <p className="text-lg mt-2 font-light">Find Your Perfect Phone</p>
        <p className="text-md text-blue-100 mt-1">Smart recommendations based on your budget and features</p>

      </header>

      <section className="py-12 px-4">
        <h2 className="text-3xl font-bold text-ynpblue text-center mb-8">Phone Prices</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading phones...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phones.map(phone => (
              <div
                key={phone.name}
                className="bg-white border border-gray-200 rounded-lg shadow-lg p-5 hover:shadow-xl transition duration-300"
              >
                <h3 className="text-xl font-bold text-ynpblue mb-4 text-center">{phone.name}</h3>

                <div className="flex items-center justify-between mb-3">
                  <a
                    href={phone.amazonUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full"
                  >
                    <img src={amazonLogo} alt="Amazon" className="h-6 w-auto" />
                    <span className={`ml-4 ${getPriceStatus(phone.amazonPrice ?? phone.prevAmazonPrice, phone.prevAmazonPrice)}`}>
                      {displayPrice(phone.amazonPrice, phone.prevAmazonPrice)}
                    </span>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href={phone.flipkartUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full"
                  >
                    <img src={flipkartLogo} alt="Flipkart" className="h-6 w-auto" />
                    <span className={`ml-4 ${getPriceStatus(phone.flipkartPrice ?? phone.prevFlipkartPrice, phone.prevFlipkartPrice)}`}>
                      {displayPrice(phone.flipkartPrice, phone.prevFlipkartPrice)}
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
