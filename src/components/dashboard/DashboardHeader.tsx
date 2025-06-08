import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardHeader() {
  const { user } = useAuth();
  
  return (
    <div className="mb-8 pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
      <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
        Welcome to your Dashboard
      </h2>
      <div className="mt-3 flex sm:mt-0 sm:ml-4">
        <Link
          href="/analyze"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Analyze New Account
        </Link>
      </div>
    </div>
  );
}