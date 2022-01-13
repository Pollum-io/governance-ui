/**
 * Converts the handler to a promise.
 * @param handler
 * @returns
 */
export default function promisify<T>(handler: T): Promise<T> {
  return new Promise((resolve) => {
    resolve(handler)
  })
}
