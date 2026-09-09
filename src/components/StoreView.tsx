import React from 'react';
import { ShoppingBag } from 'lucide-react';
export function StoreView() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Puja Store</h2>
      <p className="text-gray-600 max-w-md">Our authentic collection of Puja Samagri is currently being updated. Please check back soon.</p>
    </div>
  );
}
