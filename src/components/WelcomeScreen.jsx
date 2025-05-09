export default function WelcomeScreen({ user, onComplete }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Welcome, {user?.name || 'Guest'}!
      </h1>
      <p className="mb-4">
        You are currently viewing the <strong>{user?.role || 'guest'}</strong> dashboard.
      </p>
      <button
        onClick={onComplete}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Complete Onboarding
      </button>
    </div>
  );
}
