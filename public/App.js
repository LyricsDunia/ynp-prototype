import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';

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

  return (
    <div className="min-h-screen bg-white font-serif">
      <header className="bg-ynpblue text-white p-4 text-center">
        <h1 className="text-2xl font-bold">YNP: Your Next Phone</h1>
      </header>
      <section className="py-12 px-4">
        <h2 className="text-3xl font-bold text-ynpblue text-center mb-8">Phone Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phones.map(phone => (
            <div key={phone.name} className="bg-ynpgreen/10 p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-ynpblue">{phone.name}</h3>
              <p>Amazon: {phone.amazonPrice || 'N/A'}</p>
              <p>Flipkart: {phone.flipkartPrice || 'N/A'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;