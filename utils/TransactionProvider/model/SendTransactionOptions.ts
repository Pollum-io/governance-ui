import { Commitment } from '@solana/web3.js'
import { SequenceType } from '.'
import Block from './Block'

/**
 * Implements an interface to the SendTransaction options
 */
interface SendTransactionOptions {
  /**
   * The sequence type defined if the transactions should be executed
   * in parallel or in sequence.
   *
   * If `SequenceType.Parallel` is set, then all the transactions will
   * be dispatched at the same time.
   *
   * If `SequenceType.Sequential` is set, then the transactions will
   * be dispatched one by one in a strict order.
   */
  sequenceType: SequenceType
  /**
   * The level of commitment desired when querying state
   *
   * ```ts
   * (alias) type Commitment = "processed" | "confirmed" | "finalized" |
   * "recent" | "single" | "singleGossip" | "root" | "max"
   * ```
   */
  commitment: Commitment
  /**
   * The chain block in the time of the transaction
   */
  block?: Block
}

export default SendTransactionOptions
