import React, { useState } from 'react';
import { LayoutDashboard, Users, Receipt, CreditCard, Wallet, Menu, X } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Students', icon: <Users size={20} /> },
    { name: 'Fee Collection', icon: <Receipt size={20} /> },
    { name: 'Expenses', icon: <CreditCard size={20} /> },
    { name: 'Petty Cash', icon: <Wallet size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (Hamburger Menu) */}
      <div className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-indigo-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex justify-between items-center border-b border-indigo-800">
          {isMenuOpen && <h1 className="font-bold text-xl">EduPay Pro</h1>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-indigo-700 rounded">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        <nav className="flex-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center p-4 hover:bg-indigo-800 transition-colors ${activeTab === item.name ? 'bg-indigo-700 border-r-4 border-yellow-400' : ''}`}
            >
              {item.icon}
              {isMenuOpen && <span className="ml-4">{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">Admin Online</span>
          </div>
        </header>

        <main className="p-6">
          {/* Dashboard Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <p className="text-gray-500 text-sm">Total Collection</p>
              <h3 className="text-2xl font-bold">Rs. 125,000</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
              <p className="text-gray-500 text-sm">Total Expenses</p>
              <h3 className="text-2xl font-bold">Rs. 45,000</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <p className="text-gray-500 text-sm">Net Profit</p>
              <h3 className="text-2xl font-bold">Rs. 80,000</h3>
            </div>
          </div>

          {/* Dynamic Content Placeholder */}
          <div className="bg-white p-6 rounded-xl shadow-sm min-h-[400px]">
            <p className="text-gray-400 text-center mt-20">
              {activeTab} content will be loaded from Firebase here...
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;