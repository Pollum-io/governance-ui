import { Keypair, TransactionInstruction } from '@solana/web3.js'

export interface SignedInstructions {
  instructions: TransactionInstruction[][]
  signerSets: Keypair[][]
}
