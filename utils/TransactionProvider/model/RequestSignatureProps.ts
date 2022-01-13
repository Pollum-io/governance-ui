import { Commitment, TransactionSignature } from '@solana/web3.js'

interface RequestSignatureProps {
  txId: TransactionSignature
  commitment: Commitment
  queryStatus: boolean
}

export default RequestSignatureProps
