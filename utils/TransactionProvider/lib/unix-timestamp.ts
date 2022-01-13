/**
 * Returns the current timestamp as unix timestamp
 * @see [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339)
 *
 * @param date the date. If nothing is set, then it'll set as the current date.
 */
export default function unixTimestamp(date?: Date): number {
  const _date = date ?? new Date()
  return _date.getTime() / 1000
}
