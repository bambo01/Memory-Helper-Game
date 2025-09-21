import React, { useMemo, useState, useEffect } from "react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { IoCopyOutline, IoCheckmarkDone } from "react-icons/io5";
import { useNavigate } from "react-router-dom";


const chainName = (id) => {
  if (id === 8453) return "Base";
  if (id === 84532) return "Base Sepolia";
  return id ? `Chain ${id}` : "";
};
const shortAddr = (addr = "") => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

export default function Header() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect(); 
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const displayAddr = useMemo(() => shortAddr(address), [address]);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", address);
    } else {
      localStorage.setItem("walletConnected", "false");
      localStorage.removeItem("walletAddress");
    }
  }, [isConnected, address]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white py-3 shadow-[0_2px_4px_rgba(30,30,30,0.5)]">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4">
      
        <div className="flex items-center">
          <img src="../logo.png" alt="" className="w-45" />
        </div>

        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {isConnected && (
            <>
             
              <span className="hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-xs">
                <span className="mr-1.5 inline-block size-2 rounded-full bg-blue-600" />
                {chainName(chainId)}
              </span>

              
              <button
                onClick={copy}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-white active:scale-[0.99]"
                title={address}
              >
                <span className="font-medium">{displayAddr}</span>
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <IoCheckmarkDone /> Copied
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 opacity-70">
                    <IoCopyOutline /> Copy
                  </span>
                )}
              </button>

             
              <button
      onClick={() => {
        disconnect();
        localStorage.setItem("walletConnected", "false");
        localStorage.removeItem("walletAddress");
        navigate("/"); 
      }}
      className="text-xs border rounded-full px-3 py-1.5 hover:bg-red-50 text-red-600"
        >
          Disconnect
      </button>
            </>
          )}

          
        </div>
      </div>
    </header>
  );
}
