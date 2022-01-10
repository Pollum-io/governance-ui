/* eslint-disable */

import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import {
  Commitment,
  Connection,
  FeeCalculator,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { on } from 'node:events'

interface Block {
  blockhash: string
  feeCalculator: FeeCalculator
}

export enum SequenceType {
  Sequential,
  Parallel,
  StopOnFailure,
}

type EventDispatcherTypes =
  | 'sent'
  | 'transaction-hash'
  | 'error'
  | 'confirmation'

/**
 * Implements an interface of promise events. Those events creates a chain
 * of events returned by themselves. When a particular action is finished,
 * an `on` event will be called with its particular type and handler.
 *
 * Example
 *
 * ```ts
 *
 * function coolFunction(): PromiseEvent<string> {
 *  return new PromiseEvent((resolve, reject) => {
 *    resolve(true)
 *  })
 * }
 *
 * coolFunction()
 *
 * ```
 *
 */
interface PromiseEvent<T> extends Promise<T> {
  /**
   * Listens to an event type of `sent`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(
    type: 'sent',
    handler: (txnId: string, index: number) => void
  ): PromiseEvent<T>
  /**
   * Listens to an event type of `transaction-hash`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(
    type: 'transaction-hash',
    handler: (txnId: string, index: number) => void
  ): PromiseEvent<T>
  /**
   * Listens to an event type of `error`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(
    type: 'error',
    handler: (error: Error, index: number) => void
  ): PromiseEvent<T>
  /**
   * Listens to an event type of `confirmation`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(
    type: 'confirmation',
    handler: (payload: PublicKey | string) => void
  ): PromiseEvent<T>
  /**
   * Listens to `EventDispatcherTypes`. When a particular action
   * is finished, one of those events will be triggered as many
   * times as it is needed.
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(
    type: EventDispatcherTypes,
    handler: (data: string | Error | PublicKey) => void
  ): PromiseEvent<T>
}

/**
 * Implements an interface to the SendTransaction options
 */
interface SendTransactionOptions {
  /**
   * Currenct connection to a fullnode
   */
  connection: Connection
  /**
   * The current wallet adapter
   */
  wallet: SignerWalletAdapter
  /**
   * The transaction instruction set
   *
   * The set of instructions can either be an array or an array of transaction
   * instruction arrays. _Note that `signersSet` should follow the same pattern._
   *
   * `instructionSet is [] <-> signersSet is []`
   *
   * `instructionSet is [][] <-> signersSet is [][]`
   */
  instructionSet: TransactionInstruction[][] | TransactionInstruction[]
  /**
   * The set of signers can either be an array or an array of signer arrays.
   * _Note that `signersSet` should follow the same pattern._
   *
   * `instructionSet is [][] <-> signersSet is [][]`
   *
   * `instructionSet is [] <-> signersSet is []`
   */
  signersSet: Keypair[][] | Keypair[]
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
interface SignedTransactionProps {
  signedTransaction: Transaction
  connection: Connection
  sendingMessage?: string
  sentMessage?: string
  successMessage?: string
  timeout?: number
}
class TransactionProvider {
  static readonly DEFAULT_TIMEOUT = 30000

  constructor() {}

  private simulate() {}

  private requestSignature() {}
  private send(options: SendTransactionOptions) {}

  sendSigned({
    signedTransaction,
    connection,
    timeout = TransactionProvider.DEFAULT_TIMEOUT,
  }: SignedTransactionProps) {}
}

export default TransactionProvider
