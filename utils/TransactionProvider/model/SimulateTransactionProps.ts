import { Commitment, Connection, Transaction } from '@solana/web3.js'

interface SimulateTransactionProps {
  transaction: Transaction
  commitment: Commitment
}
export default SimulateTransactionProps
