/* eslint-disable */

import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import {
  Commitment,
  Connection,
  FeeCalculator,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import EventEmitter from 'events'

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
  | 'signature'

function promisify(fn: () => void): Promise<any> {
  return new Promise(fn)
}
/**
 * Implements an interface of promise events. The promise events interface
 * only filter the EventEmitter methods and doesn't do anything besides defining
 * types and return states.
 *
 * Example
 *
 * ```ts
 *
 * function coolFunction(): PromiseEvent<string> {
 *  const ee = new EventEmitter();
 *  someAsyncFn().then(res => ee.emit('my-event', 'Your event was fired!'));
 *  return ee as PromiseEvent<string>
 * }
 *
 * coolFunction().on('my-event', console.log);
 *
 * ```
 *
 */
interface PromiseEvent {
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
  ): PromiseEvent
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
  ): PromiseEvent
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
  ): PromiseEvent
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
  ): PromiseEvent
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
  ): PromiseEvent
  /**
   * Listens to the first emmited event type of `sent`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(
    type: 'sent',
    handler: (txnId: string, index: number) => void
  ): PromiseEvent
  /**
   * Listens to the first emmited event type of `transaction-hash`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(
    type: 'transaction-hash',
    handler: (txnId: string, index: number) => void
  ): PromiseEvent
  /**
   * Listens to the first emmited event type of `error`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(
    type: 'error',
    handler: (error: Error, index: number) => void
  ): PromiseEvent
  /**
   * Listens to the first emmited event type of `confirmation`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(
    type: 'confirmation',
    handler: (payload: PublicKey | string) => void
  ): PromiseEvent
  /**
   * Listens to the first emmited `EventDispatcherTypes`. When a particular action
   * is finished, one of those events will be triggered as many
   * times as it is needed.
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(
    type: EventDispatcherTypes,
    handler: (data: string | Error | PublicKey) => void
  ): PromiseEvent
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

interface SimulateTransactionProps {
  connection: Connection
  transaction: Transaction
  commitment: Commitment
}
interface TransactionResponse {
  txId: string
  slot: number
}
interface SignedTransactionProps {
  transaction: Transaction
  connection: Connection
  sendingMessage?: string
  sentMessage?: string
  successMessage?: string
  timeout?: number
}

interface TransactionProviderProps {}

/**
 * Provides transaction sending methods, including listeners and transaction
 * progress tracking
 *
 * @method simulate
 * @method send
 * @method sendSigned
 * @method requestSignature
 * @method
 */
class TransactionProvider {
  static readonly DEFAULT_TIMEOUT = 30000
  private isSigned = false
  constructor({}: TransactionProviderProps) {}

  private getListener(emitter: EventEmitter): PromiseEvent {
    return emitter as PromiseEvent
  }

  /**
   * Simulates a transaction.
   * @param params.connection the current connection to the wallet adapter
   * @param params.transaction the transaction to be simulated
   * @param params.commitment the commitment level
   * @returns the simulation results
   */
  async simulate({
    connection,
    transaction,
    commitment,
  }: SimulateTransactionProps): Promise<
    RpcResponseAndContext<SimulatedTransactionResponse>
  > {
    const { blockhash } = await connection.getRecentBlockhash()
    if (!blockhash) throw new Error('blockhash')
    transaction.recentBlockhash = blockhash

    const signData = transaction.serializeMessage(),
      // @ts-ignore
      wireTransaction = transaction._serialize(signData),
      encodedTransaction = wireTransaction.toString('base64'),
      config: any = { encoding: 'base64', commitment },
      args = [encodedTransaction, config]
    // @ts-ignore
    const result = await connection._rpcRequest('simulateTransaction', args)
    if (result.error) {
      throw new Error(
        'Failted to simulate transaction: ' + result.error.message
      )
    }
    return result.result
  }

  requestSignature() {}
  send(options: SendTransactionOptions) {}

  sendSigned({
    transaction,
    connection,
    timeout = TransactionProvider.DEFAULT_TIMEOUT,
  }: SignedTransactionProps): PromiseEvent {
    const ee = new EventEmitter()
    promisify(async () => {
      let signedTransaction = transaction
      if (!this.isSigned) signedTransaction = this.requestSignature() as any
    })

    return this.getListener(ee)
  }
}

export default TransactionProvider
