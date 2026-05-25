import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Scale } from 'lucide-react';

export const AdminLayout = () => {
    const location = useLocation();
    const token = localStorage.getItem('admin_access_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('admin_access_token');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-black text-white flex flex-col shadow-2xl z-20">
                <div className="p-6 border-b border-gray-800 shrink-0">
                    <h1 className="text-2xl font-black tracking-tight">PrintFlow <span className="text-red-500">Admin</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link
                        to="/"
                        className={`flex items-center px-4 py-3 rounded-md font-bold text-sm transition-colors ${
                            location.pathname === '/' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Verification Requests
                    </Link>
                    <Link
                        to="/manage"
                        className={`flex items-center px-4 py-3 rounded-md font-bold text-sm transition-colors ${
                            location.pathname === '/manage' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Admin Management
                    </Link>
                    <Link
                        to="/disputes"
                        className={`flex items-center px-4 py-3 rounded-md font-bold text-sm transition-colors ${
                            location.pathname === '/disputes' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <Scale className="w-5 h-5 mr-3" />
                        Payment Disputes
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-bold text-gray-400 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};
