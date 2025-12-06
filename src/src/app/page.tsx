export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Zalo Booking Bot
        </h1>
        <p className="text-gray-600 mb-8">
          MVP V1 - VC-ZBB-1225
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
