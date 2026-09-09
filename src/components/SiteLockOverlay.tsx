import React from 'react';
export function SiteLockOverlay({ isLocked }: any) {
  if (!isLocked) return null;
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <h2 className="text-2xl text-gray-800">Site Maintenance</h2>
    </div>
  );
}
