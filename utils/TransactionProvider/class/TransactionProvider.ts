import {
  SignerWalletAdapter,
  WalletNotConnectedError,
} from '@solana/wallet-adapter-base'
import {
  Commitment,
  Connection,
  Keypair,
  RpcResponseAndContext,
  SignatureStatus,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js'
import PromiseEvent from './PromiseEvent'
import SendTransactionOptions from '../model/SendTransactionOptions'
import SignedTransactionProps, {
  SignedTransaction,
} from '../model/SignedTransactionProps'
import SimulateTransactionProps from '../model/SimulateTransactionProps'
import TransactionResponse from '../model/TransactionResponse'
import PromiseListener, { EventDispatcherTypes } from '../model/PromiseListener'
import unixTimestamp from '../lib/unix-timestamp'
import sleep from '../lib/sleep'
import RequestSignatureProps from '../model/RequestSignatureProps'
import Block from '../model/Block'
import { SequenceType } from '../model/SequenceType'

namespace Provider {
  export interface TransactionProviderProps {
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
     * Timeout for waiting a request to be completed, otherwise, give up.
     *
     * _Note that even if the timeout has reached, the transaction may be executed by the network._
     */
    timeout?: number
  }

  export interface TransactionFailedErrorProps {
    signedTxns?: SignedTransaction
    index?: number
  }

  export interface TransactionInstructionsProps {
    instructions: TransactionInstruction[][] | TransactionInstruction[]
    signers: Keypair[][] | Keypair[]
    isSingle?: boolean
  }

  export interface BaseTransactionProps {
    wallet: SignerWalletAdapter
    block: Block
  }

  export interface CreateTransactionProps extends BaseTransactionProps {
    instructions: TransactionInstruction[]
    signers: Keypair[]
  }

  export interface CreateTransactionsProps extends BaseTransactionProps {
    instructions: TransactionInstruction[][]
    signers: Keypair[][]
  }

  export class TransactionFailedError extends Error {
    readonly data?: TransactionFailedErrorProps
    readonly code?: number
    constructor(
      message = 'Transaction failed',
      data?: TransactionFailedErrorProps,
      code?: number
    ) {
      super(message)
      this.data = data
      this.code = code
    }
  }

  /**
   * Provides interface for the wallet signer and static methods to request and sign transactions.
   *
   * @method signAll
   */
  export class Signer {
    static async sign(
      params: CreateTransactionProps
    ): Promise<SignedTransaction> {
      const { instructions, signers, block, wallet } = params
      const signedTxns = await this.signAll({
        instructions: [instructions],
        signers: [signers],
        block,
        wallet,
      })
      return signedTxns[0]
    }
    /**
     * Requsts signature for the transactions
     *
     * @param params.instructions the instructions to be executed
     * @param params.signers the set of signers
     * @param params.wallet the connected wallet instance
     * @param params.block a recent block
     */
    static async signAll(
      params: CreateTransactionsProps
    ): Promise<SignedTransaction[]> {
      if (!params.wallet.publicKey) throw new WalletNotConnectedError()
      const unsignedTxns: Transaction[] = []
      for (let i = 0; i < params.instructions.length; i++) {
        const instructions = params.instructions[i]
        const signers = params.signers[i]

        if (instructions.length) {
          const transaction = new Transaction({
            feePayer: params.wallet.publicKey,
          })

          instructions.forEach((instruction) => transaction.add(instruction))
          transaction.recentBlockhash = params.block.blockhash

          if (signers.length > 0) {
            transaction.partialSign(...signers)
          }

          unsignedTxns.push(transaction)
        }
      }
      try {
        const signed = await params.wallet.signAllTransactions(unsignedTxns)
        return signed
      } catch (error) {
        throw new Error('User denied signature')
      }
    }
  }

  /**
   * Provides transaction sending methods, including listeners and transaction
   * progress tracking
   *
   * @method simulate
   * @method send
   * @method sendSigned
   * @method requestSignature
   */
  export class SendTransaction {
    static readonly DEFAULT_TIMEOUT = 30000
    private emitter?: PromiseEvent
    private isSigned = false
    private connection: Connection
    private wallet: SignerWalletAdapter
    private transactions: TransactionInstructionsProps
    private _timeout = SendTransaction.DEFAULT_TIMEOUT

    constructor(params: TransactionProviderProps) {
      console.debug('here', params)
      this.connection = params.connection
      this.wallet = params.wallet
      this.timeout = params.timeout
      this.transactions = {
        instructions: params.instructionSet,
        signers: params.signersSet,
      }
      this.setIsSingleTxn()
    }

    /**
     * Gets the recent blockhash if block is undefined
     * @param params.block the given block. If not set, it'll fetch it
     * @param params.commitment the level of commitment desired when querying state
     */
    private async getCurrentBlock(params: {
      block?: Block
      commitment: Commitment
    }): Promise<Block> {
      return (
        params.block ??
        (await this.connection.getRecentBlockhash(params.commitment))
      )
    }

    /**
     * Checks if the transaction object is single or multiple and set its property
     */
    private setIsSingleTxn() {
      const { instructions: i, signers: s } = this.transactions
      if (Array.isArray(i)) {
        this.transactions.isSingle = true
        if (Array.isArray(i[0]) && Array.isArray(s[0])) {
          this.transactions.isSingle = false
        } else {
          throw new Error(
            'TransactionProvider: Multiple instructions given but not enough signers set.'
          )
        }
      } else {
        throw new Error('TransactionProvider: Instructions must be an array.')
      }
    }

    /**
     * Simulates a transaction.
     * @param params.transaction the transaction to be simulated
     * @param params.commitment the commitment level
     * @returns the simulation results
     */
    async simulate({
      transaction,
      commitment,
    }: SimulateTransactionProps): Promise<
      RpcResponseAndContext<SimulatedTransactionResponse>
    > {
      const { blockhash } = await this.connection.getRecentBlockhash()
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
          `Failed to simulate transaction: ${result.error.message}`
        )
      }
      return result.result
    }

    /**
     * Requests the signature from the ui
     * @param param0
     * @returns
     */
    private async requestSignature({
      txId,
      commitment = 'recent',
      queryStatus = false,
    }: RequestSignatureProps) {
      let done = false
      let status: SignatureStatus | null = {
        slot: 0,
        confirmations: 0,
        err: null,
      }
      let subId = 0
      await new Promise((resolve, reject) => {
        const fn = async () => {
          setTimeout(() => {
            if (done) {
              return
            }
            done = true
            reject({ timeout: true })
          }, this.timeout)
          try {
            subId = this.connection.onSignature(
              txId,
              (result, context) => {
                done = true
                status = {
                  err: result.err,
                  slot: context.slot,
                  confirmations: 0,
                }
                if (result.err) {
                  this.notify('error', result.err)
                  console.log('Rejected via websocket', result.err)
                  reject(result.err)
                } else {
                  this.notify('signature', txId, status.slot)
                  console.log('Resolved via websocket', result)
                  resolve(result)
                }
              },
              commitment
            )
          } catch (e) {
            done = true
            console.error('WS error in setup', txId, e)
          }
          while (!done && queryStatus) {
            // eslint-disable-next-line no-loop-func
            const fn = async () => {
              try {
                const signatureStatuses = await this.connection.getSignatureStatuses(
                  [txId]
                )
                status = signatureStatuses && signatureStatuses.value[0]
                if (!done) {
                  if (!status) {
                    console.log('REST null result for', txId, status)
                  } else if (status.err) {
                    console.log('REST error for', txId, status)
                    done = true
                    reject(status.err)
                  } else if (!status.confirmations) {
                    console.log('REST no confirmations for', txId, status)
                  } else {
                    console.log('REST confirmation for', txId, status)
                    done = true
                    resolve(status)
                  }
                }
              } catch (e) {
                if (!done) {
                  console.log('REST connection error: txId', txId, e)
                }
              }
            }
            fn()
            await sleep(2000)
          }
        }
        fn()
      })
        .catch((err) => {
          if (err.timeout && status) {
            status.err = { timeout: true }
          }
          this.notify('error', err)
          //@ts-ignore
          if (this.connection._signatureSubscriptions[subId])
            this.connection.removeSignatureListener(subId)
        })
        .then((_) => {
          //@ts-ignore
          if (this.connection._signatureSubscriptions[subId])
            this.connection.removeSignatureListener(subId)
        })
      done = true
      return status
    }

    /**
     * Sends a single transaction
     * @param params
     */
    private async _single(
      params: SendTransactionOptions
    ): Promise<TransactionResponse> {
      if (!params.block) throw new Error("Couldn't get a recent block hash.")
      const transaction = await Signer.sign({
        instructions: this.transactions
          .instructions as TransactionInstruction[],
        block: params.block,
        signers: this.transactions.signers as Keypair[],
        wallet: this.wallet,
      })
      const result = await this.sendSignedAsync({
        transaction,
      })

      return result
    }

    /**
     * Sends a set of transactions
     */
    private async _batch(params: SendTransactionOptions) {
      if (!this.wallet.publicKey) throw new WalletNotConnectedError()
      if (!params.block) throw new Error("Couldn't get a recent block hash")
      try {
        const signedTxns = await Signer.signAll({
          instructions: this.transactions
            .instructions as TransactionInstruction[][],
          signers: this.transactions.signers as Keypair[][],
          block: params.block!,
          wallet: this.wallet,
        })

        const pendingTxns: Promise<TransactionResponse>[] = []

        const breakEarlyObject = { breakEarly: false }
        for (let i = 0; i < signedTxns.length; i++) {
          const signedTxnPromise = this.sendSignedAsync({
            transaction: signedTxns[i],
            index: i,
          })

          signedTxnPromise.catch((_reason) => {
            // @ts-ignore
            const error = new TransactionFailedError('Transaction failed.', {
              signedTxns: signedTxns[i],
              index: i,
            })
            this.notify('error', error)

            if (params.sequenceType == SequenceType.StopOnFailure) {
              breakEarlyObject.breakEarly = true
            }
          })

          if (params.sequenceType != SequenceType.Parallel) {
            await signedTxnPromise
            if (breakEarlyObject.breakEarly) {
              const error = new TransactionFailedError('Transaction Failed', {
                index: i,
              })
              this.notify('error', error)
              return i // REturn the txn we failed on by index
            }
          } else {
            pendingTxns.push(signedTxnPromise)
          }
        }

        if (params.sequenceType != SequenceType.Parallel) {
          await Promise.all(pendingTxns)
        }
        this.notify('finish-sending')
      } catch (error) {
        throw error
      }
    }

    /**
     * Send a transaction in async mode
     * @param param0.transaction the transaction to send
     * @returns
     */
    async sendSignedAsync({
      transaction,
      index,
    }: SignedTransactionProps): Promise<TransactionResponse> {
      const rawTransaction = transaction.serialize()
      const startTime = unixTimestamp()
      let slot = 0

      const txId: TransactionSignature = await this.connection.sendRawTransaction(
        rawTransaction,
        {
          skipPreflight: true,
        }
      )

      console.log('Started awaiting confirmation for', txId)

      let done = false
      ;(async () => {
        while (!done && unixTimestamp() - startTime < this.timeout) {
          this.connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
          })
          await sleep()
        }
      })()
      try {
        const confirmation = await this.requestSignature({
          txId,
          commitment: 'recent',
          queryStatus: true,
        })

        if (confirmation.err) {
          console.error(confirmation.err)
          const error = new Error(
            'Transaction failed: Custom instruction error'
          )
          throw error
        }

        slot = confirmation?.slot ?? 0
      } catch (err) {
        if (err.timeout) {
          this.notify('timeout', slot, err)
          throw new Error('Timed out awaiting confirmation on transaction')
        }
        let simulateResult: SimulatedTransactionResponse | null = null
        try {
          simulateResult = (
            await this.simulate({
              transaction,
              commitment: 'single',
            })
          ).value
        } catch (e) {
          //
        }
        if (simulateResult && simulateResult.err) {
          if (simulateResult.logs) {
            for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
              const line = simulateResult.logs[i]
              if (line.startsWith('Program log: ')) {
                const error = new Error(
                  'Transaction failed: ' + line.slice('Program log: '.length)
                )
                throw error
              }
            }
          }
          const error = new Error(JSON.stringify(simulateResult.err))
          throw error
        }
      } finally {
        done = true
      }

      console.log('Latency', txId, unixTimestamp() - startTime)
      this.notify('sent', txId, index, this.transactions.instructions.length)
      return { txId, slot }
    }

    /**
     * Sends a request and returns its Transaction id. If the goal is to use listeners, try `send`;
     */
    async sendAsync(params: SendTransactionOptions) {
      if (!this.wallet.publicKey) throw new WalletNotConnectedError()
      params.block = await this.getCurrentBlock(params)
      if (this.transactions.isSingle) {
        return this._single(params)
      } else {
        return this._batch(params)
      }
    }

    /**
     * Send a signed transaction. This method returns an event listener,
     * if you need to do it async, see `TransactionProvider.sendSignedAsync`
     */
    sendSigned({ transaction }: SignedTransactionProps) {
      return PromiseEvent.create((emitter) => {
        this.emitter = emitter
        this.sendSignedAsync({
          transaction,
        })
          .catch((err) => {
            this.notify('error', err)
          })
          .finally(() => {
            this.notify('finally')
          })
      })
    }

    /**
     * Sends a transaction or a set of transactions. This method will return an event listener. If the goal is
     * to do it async, try `sendAsync`.
     * @param params
     */
    send(params: SendTransactionOptions): PromiseListener {
      return PromiseEvent.create((emitter) => {
        this.emitter = emitter
        this.sendAsync(params)
          .catch((err) => {
            this.notify('error', err)
          })
          .finally(() => {
            this.notify('finally')
          })
      })
    }

    /**
     * Emits an event if the emitter is set
     * @param event
     * @param args
     */
    private notify(event: EventDispatcherTypes, ...args: any): boolean {
      if (this.emitter) {
        return this.emitter.emit(event, ...args)
      }
      return false
    }

    set timeout(value: number | undefined) {
      if (value) this._timeout = value
    }

    get timeout(): number {
      return this._timeout
    }
  }
}
export default Provider
