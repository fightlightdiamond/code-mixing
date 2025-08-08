"use client";

import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Test Page
        </h1>
        <p className="text-gray-600 mb-6">
          If you can see this page, the basic setup is working!
        </p>

        <div className="space-y-3 mb-6">
          <div className="p-3 bg-blue-100 text-blue-800 rounded">
            ✅ Next.js is working
          </div>
          <div className="p-3 bg-green-100 text-green-800 rounded">
            ✅ Tailwind CSS is working
          </div>
          <div className="p-3 bg-purple-100 text-purple-800 rounded">
            ✅ TypeScript is working
          </div>
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded">
            ✅ Components are working
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Test Login System:</h3>

          <Link
            href="/login"
            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            🔐 Go to Login
          </Link>

          <Link
            href="/register"
            className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            📝 Go to Register
          </Link>

          <Link
            href="/"
            className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            🏠 Back to Home
          </Link>
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded text-sm text-gray-600">
          <strong>Demo Accounts:</strong><br />
          Admin: admin@edtech.com / admin123<br />
          Student: student1@edtech.com / student123
        </div>
      </div>
    </div>
  );
}
