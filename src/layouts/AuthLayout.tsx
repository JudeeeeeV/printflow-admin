import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export const AuthLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
                <h1 className="text-4xl font-black tracking-tight text-gray-900">
                    PrintFlow <span className="text-red-600">Admin</span>
                </h1>
                <p className="mt-2 text-sm text-gray-600 font-medium">
                    Secure Dashboard Access
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-lg sm:px-10 relative z-10"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
