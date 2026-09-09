import React from 'react';
import { Calendar } from 'lucide-react';
export function PanchangPage() {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center mb-6">
        <Calendar className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Daily Panchang</h2>
      <p className="text-gray-600 max-w-md">Loading today's auspicious timings and tithi details...</p>
    </div>
  );
}
