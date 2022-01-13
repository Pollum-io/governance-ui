import { PublicKey } from '@solana/web3.js'

export type EventDispatcherTypes =
  | 'sent'
  | 'transaction-hash'
  | 'error'
  | 'confirmation'
  | 'signature'
  | 'timeout'
  | 'finish-sending'
  | 'finally'

/**
 * Implements an interface of promise events. The promise events interface
 * only filter the EventEmitter methods and doesn't do anything besides defining
 * types and return states.
 */
interface PromiseListener {
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
    handler: (txnId: string, index: number, length?: number) => void
  ): PromiseListener
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
  ): PromiseListener
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
  ): PromiseListener
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
  ): PromiseListener
  /**
   * Listens to an event type of `timeout`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(
    type: 'timeout',
    handler: (index: number, error?: Error) => void
  ): PromiseListener
  /**
   * Listens to the an event type of `signature`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  on(type: 'signature', handler: () => void): PromiseListener
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
  ): PromiseListener
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
  ): PromiseListener
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
  ): PromiseListener
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
  ): PromiseListener
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
  ): PromiseListener
  /**
   * Listens to the first emmited event type of `timeout`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(
    type: 'timeout',
    handler: (index: number, error?: Error) => void
  ): PromiseListener
  /**
   * Listens to the first emmited event type of `signature`. When this action is
   * finished, this event will be triggered as many times as it
   * is needed.
   *
   * @param type the event type
   * @param handler callback function to execute when triggered
   */
  once(type: 'signature', handler: () => void): PromiseListener
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
  ): PromiseListener
}

export default PromiseListener
