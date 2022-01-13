/**
 * Sleeps for the time set in delay
 * @param delay
 */
export default function sleep(delay = 500) {
  return new Promise<true>((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, delay)
  })
}
