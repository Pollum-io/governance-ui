import { Commitment, Transaction } from '@solana/web3.js'

interface SimulateTransactionProps {
  transaction: Transaction
  commitment: Commitment
}
export default SimulateTransactionProps
