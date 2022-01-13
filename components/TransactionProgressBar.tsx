import { PromiseListener } from '@utils/TransactionProvider/model'
import React, { FunctionComponent, useEffect, useState } from 'react'

interface ProgressBarProps {
  //array of messages that should be displayed
  progressMessage?: any
  insideProgressBarClassName?: string
  outsideProgressBarClassName?: string
  textProgressBar?: string
  listener?: PromiseListener
  onFinish?: () => void
  onError?: (error: Error) => void
  //index of the message that should be displayed
}

const TransactionProgressBar: FunctionComponent<ProgressBarProps> = ({
  textProgressBar = '',
  outsideProgressBarClassName = '',
  insideProgressBarClassName = '',
  progressMessage = [],
  listener,
  onFinish,
  onError,
}) => {
  const [step, setStep] = useState<number>(-1)
  useEffect(() => {
    if (listener)
      listener
        .on('sent', (txId, index) => {
          setStep(index)

          console.log(index)
          console.debug(index)
        })
        .on('finish-sending', () => {
          setStep(progressMessage.length - 1)
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
        className={textProgressBar}
        style={{ textAlign: 'center', marginBottom: '1rem' }}
      >
        {listener && step >= 0 ? progressMessage[step] : 'Starting'}
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
            width: ((step + 1) / progressMessage.length) * 100 + '%',
            transition: 'ease-in-out 100ms',
          }}
        ></span>
      </div>
    </div>
  )
}

export default TransactionProgressBar
