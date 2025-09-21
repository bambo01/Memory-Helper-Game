import { useState } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../base-dapp/src/contract'

export default function VoteBox() {
  const [option, setOption] = useState(0)

  const { data: totalVotes, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'totalVotes',
  })

  const { data: hash, isPending, writeContract, error } = useWriteContract()
  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash })

  const castVote = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'vote',
      args: [Number(option)],
    })
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div>Total Votes: {totalVotes?.toString?.() ?? '—'}</div>

      <div style={{ marginTop: 8 }}>
        <input
          type="number"
          min="0"
          value={option}
          onChange={(e) => setOption(e.target.value)}
          style={{ width: 80, marginRight: 8 }}
        />
        <button disabled={isPending} onClick={castVote}>
          {isPending ? 'Confirm in wallet…' : 'Cast Vote'}
        </button>
      </div>

      {hash && (
        <div style={{ marginTop: 8 }}>
          <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noreferrer">
            View on BaseScan
          </a>
        </div>
      )}
      {confirming && <div>Waiting for confirmations…</div>}
      {confirmed && <button onClick={() => refetch()}>Refresh</button>}
      {error && <div style={{ color: 'crimson' }}>{error.message}</div>}
    </div>
  )
}
