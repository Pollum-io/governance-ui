import EventEmitter from 'events'
import { promisify, unixTimestamp } from '../lib'
import { PromiseListener, EventDispatcherTypes } from '../model'

/**
 * Represents the `EventEmitter` class
 *
 * Example
 *
 * ```ts
 *
 
 */
class PromiseEvent extends EventEmitter {
  /**
   * The last time an emitter was called
   */
  private _lastEmitterCall?: number

  /**
   * @param inactivityTime time to remove all the listeners if not called, Default is 30s.
   * This mean that if any event is called after its listener is created, after `inactivityTime` it will be removed.
   */
  constructor(inactivityTime?: number) {
    super()
    this._checkStandbyListeners(inactivityTime)
  }

  /**
   * Checks if any listener is called in this period of time. Default is 60s
   * @param inactivityTime time to remove listeners if not called in this period
   */
  private _checkStandbyListeners(inactivityTime = 60000) {
    const interval = setInterval(() => {
      if (
        this._lastEmitterCall &&
        unixTimestamp() - this._lastEmitterCall > inactivityTime
      ) {
        this.removeAllListeners()
        clearInterval(interval)
      }
    }, inactivityTime)
  }

  /**
   * Creates a Promise Event and return its listeners.
   *
   * Example
   *
   * ```ts
   * function coolFunction() {
   *   return PromiseEvent.create((emitter) => {
   *        someAsyncFn().then(res => emitter.emit('my-event', 'Your event was fired!'));
   *        emitter.emit('my-other-event', 'Your other event was fired!');
   *    })
   * }
   *
   * coolFunction()
   * .on('my-event', console.log)
   * // will print 'Your event was fired!'
   * .on('my-other-event', console.log)
   * // will print 'Your other event was fired!'
   * ```
   *
   * @param fn the callback function to be executed. The function will create an `emitter` to emit events
   */
  static create(fn: (emitter: PromiseEvent) => void) {
    const ee = new PromiseEvent()
    promisify(fn).then((res) => res(ee))
    return ee as PromiseListener
  }

  /**
   * @param event event name
   * @param args arguments to be caught by the listener
   */
  emit(event: string, ...args: any) {
    this._lastEmitterCall = unixTimestamp()
    return super.emit(event, ...args)
  }
}

export default PromiseEvent
