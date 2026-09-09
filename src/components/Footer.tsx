import React from 'react';

export function Footer(props: any) {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h3 className="text-xl font-bold mb-4 text-blue-400">Bhakti Store</h3>
        <p className="text-sm text-gray-400 mb-4">Your daily source for the best deals and products.</p>
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Bhakti Store. All rights reserved.</p>
      </div>
    </footer>
  );
}
