// src/Page/SignIn.jsx
import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function SignIn() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [posting, setPosting] = useState(false);

  // On wallet connect: upsert user in DB
  useEffect(() => {
    if (!isConnected || !address || posting) return;

    (async () => {
      try {
        setPosting(true);
        console.log("My add and chainID: ", { address });

        await fetch("/api/users/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // keep if you use cookies for auth
          body: JSON.stringify({
            address,
            chainId,
            verified: false,
          }),
        });

        // ✅ Store in localStorage so you can check later if needed
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", address);
      } catch (e) {
        console.error("Upsert failed:", e);
      }
    })();
  }, [isConnected, address, chainId, posting]);

  return (
   <div className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg p-8 sm:p-10">
  <h1 className="text-4xl font-semibold text-gray-800 mb-6 text-center">
    Sign in
  </h1>

  <div className="flex flex-col items-center space-y-4">
    <p className="text-sm text-gray-600 text-center">
      Connect your wallet to continue
    </p>
    <ConnectButton />
  </div>
</div>

  );
}
