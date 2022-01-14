import { PromiseListener } from '@utils/TransactionProvider/model'
import React, { FunctionComponent, useEffect, useState } from 'react'

interface ProgressBarProps {
  /**
   * array of messages that should be displayed, according to the amount
   * of transactions that will happen.
   */
  messages?: any
  insideProgressBarClassName?: string
  outsideProgressBarClassName?: string
  textClassName?: string
  /**
   * The promise listener that the send transaction method should return.
   */
  listener?: PromiseListener
  /**
   * When the progress is finished, this callback will be triggered
   */
  onFinish?: () => void
  /**
   * If an error happen, this callback will be triggered
   */
  onError?: (error: Error) => void
}

const TransactionProgressBar: FunctionComponent<ProgressBarProps> = ({
  textClassName = '',
  outsideProgressBarClassName = '',
  insideProgressBarClassName = '',
  messages = [],
  listener,
  onFinish,
  onError,
}) => {
  const [step, setStep] = useState<number>(-1)

  useEffect(() => {
    if (listener)
      listener
        .on('sent', (txId, index) => {
          if (index) setStep(index)

          console.log(index)
          console.debug(index)
        })
        .on('finish-sending', () => {
          setStep(messages.length - 1)
          if (onFinish) {
            onFinish()
          }
        })
        .on('error', (error) => {
          console.log(error)
          if (onError) {
            onError(error)
          }
        })
  }, [listener])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h3
        className={textClassName}
        style={{ textAlign: 'center', marginBottom: '1rem' }}
      >
        {listener && step >= 0 ? messages[step] : 'Starting...'}
      </h3>
      <div
        className={outsideProgressBarClassName}
        style={{
          height: '26px',
          position: 'relative',

          background: '#555',
          borderRadius: '25px',

          minWidth: '100px',
          width: '300px',
          overflow: 'hidden',
        }}
      >
        <span
          className={insideProgressBarClassName}
          style={{
            height: '100%',
            position: 'absolute',
            left: 0,
            background: '#4BB543',
            width: ((step + 1) / messages.length) * 100 + '%',
            transition: 'ease-in-out 100ms',
          }}
        ></span>
      </div>
    </div>
  )
}

export default TransactionProgressBar
