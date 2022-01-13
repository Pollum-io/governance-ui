import { Transaction } from '@solana/web3.js'

export type SignedTransaction = Transaction

interface SignedTransactionProps {
  transaction: SignedTransaction
  sendingMessage?: string
  sentMessage?: string
  successMessage?: string
  index?: number
}

export default SignedTransactionProps
