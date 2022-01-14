import { PublicKey } from '@solana/web3.js'
import { EventDispatcherTypes } from './PromiseListener'

/**
 * Implements an interface of promise events. The promise events interface
 * only filter the EventEmitter methods and doesn't do anything besides defining
 * types and return states.
 */
type PromiseEmitterArgs =
  | [event: 'sent', txId: string, index?: number, length?: number]
  | [event: 'signature' | 'finish-sending' | 'finally']
  | [event: 'transaction-hash', txId: string, index?: number]
  | [event: 'confirmation', payload: PublicKey | string]
  | [event: 'error', error: Error, index?: number]
  | [event: 'timeout', index: number | undefined, error: Error]
  | [event: EventDispatcherTypes, data: string | Error | PublicKey]

export default PromiseEmitterArgs
