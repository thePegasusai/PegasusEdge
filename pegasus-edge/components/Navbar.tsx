import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PEGASUS_APP_TITLE, SparklesIcon, HomeIcon, AdjustmentsHorizontalIcon, CreditCardIcon } from '../constants';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/tools', label: 'AI Tools', icon: AdjustmentsHorizontalIcon },
    { path: '/subscriptions', label: 'Get The Edge', icon: CreditCardIcon },
  ];

  return (
    <nav className="bg-slate-900/80 backdrop-blur-lg shadow-2xl sticky top-0 z-50 border-b border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <SparklesIcon className="w-10 h-10 text-purple-500 group-hover:text-amber-400 transition-colors duration-300 transform group-hover:rotate-12" />
            <span className="font-display text-3xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors duration-300">
              {PEGASUS_APP_TITLE}
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/tools' && location.pathname.startsWith('/tools'));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out group
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md scale-105' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  <item.icon className={`w-5 h-5 mr-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="md:hidden">
            {/* Mobile menu button can be added here */}
            <button className="text-slate-300 hover:text-white focus:outline-none">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;