import { useRouteError, Link } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-8">

      <h1 className="text-5xl font-bold mb-4">
        Oops!
      </h1>

      <p className="text-neutral-400 mb-8">
        Something went wrong.
      </p>

      <pre className="text-red-400 text-sm mb-8">
        {error?.statusText || error?.message}
      </pre>

      <Link
        to="/dashboard"
        className="bg-blue-600 px-6 py-3 rounded-lg"
      >
        Go to Dashboard
      </Link>

    </div>
  );
}