
import { Outlet } from 'react-router-dom'
import Header from '../Component/Header'
import React, { useEffect } from "react";
import { useAccount } from "wagmi";
import SignIn from '../Page/SignIn'


const UserRootLayout = () => {
     const { isConnected } = useAccount();

       useEffect(() => {
         if (isConnected) {
           localStorage.setItem("walletConnected", "true");
         } else {
           localStorage.setItem("walletConnected", "false");
           localStorage.removeItem("walletAddress");
         }
       }, [isConnected]);

  return (
    <div className='min-h-screen bg-[#FFFBF0]'
    >
     
      <div>
        <Header />
      </div>
        <div>
          <Outlet />
        </div>

        {!isConnected && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <SignIn />
                </div>
              )}
    </div>
  )
}

export default UserRootLayout