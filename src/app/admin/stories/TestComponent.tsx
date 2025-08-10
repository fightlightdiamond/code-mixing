"use client";

export default function TestComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Component</h1>
      <p className="text-gray-600">If you can see this, the basic component rendering works.</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-lg font-semibold text-blue-900">Debug Info:</h2>
        <ul className="mt-2 text-sm text-blue-800">
          <li>✅ React component rendering</li>
          <li>✅ Tailwind CSS styles</li>
          <li>✅ Basic layout structure</li>
        </ul>
      </div>
    </div>
  );
}
