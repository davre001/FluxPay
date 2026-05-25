// Main frontend application component

import React from 'react';
import Header from './components/Header';
import PaymentForm from './components/PaymentForm';

export default function App() {
  return (
    <div>
      <Header />
      <PaymentForm />
    </div>
  );
}
