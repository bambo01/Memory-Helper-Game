import React from "react";

const HeaderLanding = () => {
  return (
    <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between shadow-[0_2px_4px_rgba(30,30,30,0.5)] bg-white px-4 sm:px-6 lg:px-78">
      {/* Logo */}
      <div className="flex items-center">
        <img
          src="../logo.png"
          alt="Remindr Logo"
          className="w-32 sm:w-40 h-auto"
        />
      </div>

      {/* Navigation / Links */}
      <nav>
        <ul className="flex items-center gap-6 text-gray-700 font-medium">
          <li>
            <a href="#about" className="hover:text-gray-900 transition-colors">
              About Us
            </a>
          </li>
          <li>
            <a href="#features" className="hover:text-gray-900 transition-colors">
              Features
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-gray-900 transition-colors">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default HeaderLanding;
