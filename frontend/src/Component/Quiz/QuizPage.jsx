// src/Component/Quiz/QuizPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import {
  simulateContract,
  writeContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { config } from "../../wagmi"; // shared wagmi config
import QuizCore from "./QuizCore";
import { BADGE_ADDRESS, BADGE_ABI, explorerTx } from "../../contract";

const IMG_BASE = "";

// If you already have a static badge metadata URI, set it here (e.g. "ipfs://.../metadata.json")
// Leave as null to use the backend route /api/badges/manifest
const BADGE_URI_OVERRIDE = null;

export default function QuizPage() {
  const { tokenId } = useParams();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [pack, setPack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState("");

  const [lastCompletion, setLastCompletion] = useState(null);
  const mintedOnce = useRef(false);

  const [claimState, setClaimState] = useState({
    status: "idle", // idle | claiming | pending | success | error
    txHash: "",
    error: "",
  });

  // Load the quiz pack
  useEffect(() => {
    let live = true;
    setIsLoading(true);
    setErr("");

    fetch(`/api/households/byToken/${encodeURIComponent(tokenId)}`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        if (!live) return;
        const cards = Array.isArray(data?.cards)
          ? data.cards.map((c) => ({
              id: String(c.id),
              name: c.name,
              relation: c.relation || "",
              hint: c.hint || "",
              image: c.image?.startsWith("http")
                ? c.image
                : c.image
                ? `${IMG_BASE}${c.image}`
                : "",
            }))
          : [];
        setPack({
          title: data?.title ?? "Untitled Pack",
          tokenId: data?.tokenId ?? data?.packTokenId ?? tokenId, // normalize
          cards,
          ...data,
        });
      })
      .catch((e) => setErr(e.message || "Failed to load pack"))
      .finally(() => setIsLoading(false));

    return () => {
      live = false;
    };
  }, [tokenId]);

  // Called by QuizCore when the user finishes
  function handleMastered({ masteredCount, total }) {
    setLastCompletion({ masteredCount, total });
    setClaimState({ status: "idle", txHash: "", error: "" });
    mintedOnce.current = false;
  }

  // Build/get the badge metadata URI
  async function makeBadgeUri() {
    if (BADGE_URI_OVERRIDE) return BADGE_URI_OVERRIDE;
    if (!lastCompletion || !pack)
      throw new Error("Missing completion or pack to build badge manifest");

    const { masteredCount, total } = lastCompletion;

    const res = await fetch("/api/manifest/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packTitle: pack.title,
        packTokenId: Number(pack?.tokenId ?? pack?.packTokenId ?? 0),
        score: masteredCount,
        total,
        completedAt: Math.floor(Date.now() / 1000),
      }),
    });

    const body = await res.text();
    if (!res.ok) throw new Error(body || "Manifest endpoint failed");

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error("Manifest endpoint did not return JSON");
    }
    if (!data?.uri) throw new Error("Manifest endpoint missing `uri`");
    return data.uri;
  }

  // Claim/mint the badge
  async function handleClaimClick() {
    if (!lastCompletion || !pack) return;
    if (mintedOnce.current) return;
    mintedOnce.current = true;

    try {
      setClaimState({ status: "claiming", txHash: "", error: "" });

      // 1) Ensure Base Sepolia + connected wallet
      if (chainId !== baseSepolia.id) {
        await switchChainAsync({ chainId: baseSepolia.id });
      }
      if (!address) throw new Error("Please connect wallet");

      // 2) Prepare args (force uint256 -> bigint)
      const rawId = pack?.tokenId ?? pack?.packTokenId ?? tokenId;
      if (rawId == null) throw new Error("Missing pack tokenId");
      const packId = BigInt(String(rawId));

      const uri = await makeBadgeUri();
      if (!uri) throw new Error("Badge URI is empty");

      // 3) Simulate first (validates everything and prepares a safe request)
      const { request } = await simulateContract(config, {
        address: BADGE_ADDRESS,
        abi: BADGE_ABI,
        functionName: "mintBadge",
        account: address,
        args: [address, packId, uri],
        chainId: baseSepolia.id,
      });

      // 4) Send the tx using the prepared request
      const hash = await writeContract(config, request);
      setClaimState({ status: "pending", txHash: hash, error: "" });

      // 5) Wait for confirmation
      await waitForTransactionReceipt(config, { hash, chainId: baseSepolia.id });
      setClaimState({ status: "success", txHash: hash, error: "" });
    } catch (e) {
      console.error("Claim failed:", e);
      setClaimState({
        status: "error",
        txHash: "",
        error: e?.message || String(e),
      });
      mintedOnce.current = false; // allow retry
    }
  }

  if (err) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-red-600">Error: {err}</p>
          <Link
            to="/user/packs"
            className="mt-3 inline-block rounded-xl border px-4 py-2 hover:bg-zinc-50"
          >
            Back to Packs
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !pack) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          Loading pack…
        </div>
      </div>
    );
  }

  const claimDisabled = ["claiming", "pending", "success"].includes(
    claimState.status
  );

  return (
    <QuizCore
      title={`Quiz: ${pack.title}`}
      cardsProp={pack.cards}
      onMastered={handleMastered}
      onClaimBadge={handleClaimClick}
      claimState={claimState}
      claimDisabled={claimDisabled}
      txUrl={explorerTx}
    />
  );
}
