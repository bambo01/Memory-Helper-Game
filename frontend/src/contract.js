import badgeAbiJson from "../../frontend/src/abi/MemoryBadgeABI.json";
import packAbiJson from "../../frontend/src/abi/MemoryPack.json";

export const CONTRACT_ADDRESS = "0x7E8FEE80edA9094481e61aA72cdCcb8D97acD787";
export const BADGE_ADDRESS = "0xC8565d1A30c427a6CD1C93477dDE059aB88531Cc";

export const CONTRACT_ABI = packAbiJson.abi || packAbiJson;
export const BADGE_ABI = badgeAbiJson.abi || badgeAbiJson;

export const explorerTx = (hash) =>
  `https://sepolia.basescan.org/tx/${hash}`;
