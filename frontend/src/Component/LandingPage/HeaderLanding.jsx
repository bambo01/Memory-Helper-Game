import React from "react";

const HeaderLanding = () => {
  return (
    <header className="sticky top-0 z-40 w-full h-20 flex items-center shadow-[0_2px_4px_rgba(30,30,30,0.5)] bg-white">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-16 flex items-center">
        <img
          src="../logo.png"
          alt="Remindr Logo"
          className="w-32 sm:w-40 h-auto"
        />
      </div>
    </header>
  );
};

export default HeaderLanding;
