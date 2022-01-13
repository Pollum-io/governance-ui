import { FeeCalculator } from '@solana/web3.js'

interface Block {
  blockhash: string
  feeCalculator: FeeCalculator
}

export default Block
