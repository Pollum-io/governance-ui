import React, { FunctionComponent, useEffect, useState } from 'react'
import { Providers } from '../'
import { SendTransactionOptions, SequenceType } from '../model'

interface ProgressBarProps {
  progressBarOuterClass?: string
  progressBarInnerClass?: string
  textClass?: string
  /**
   * The promise listener that the send transaction method should return.
   */
  transactions?: Providers.TransactionProviderProps
  /**
   * Options to call the send method
   */
  sendTransactionOpts?: SendTransactionOptions
  /**
   * When the progress is finished, this callback will be triggered with 2s delay
   */
  onFinish?: () => void
  /**
   * If an error happen, this callback will be triggered
   */
  onError?: (error: Error, index?: number) => void
  /**
   * It will be executed whether or not the transactions succeed at the end
   * of the execution.
   */
  onFinally?: () => void
  /**
   * It will be executed when a transaction is sent and may be executed more
   * than once
   */
  onSend?: (txId: string, index?: number) => void
}

const SendTransactionWidget: FunctionComponent<ProgressBarProps> = ({
  textClass = '',
  progressBarOuterClass = '',
  progressBarInnerClass = '',
  transactions,
  sendTransactionOpts = {
    commitment: 'singleGossip',
    sequenceType: SequenceType.Sequential,
  },
  onFinish,
  onError,
  onFinally,
  onSend,
}) => {
  const [txnLen, setTxnLen] = useState<number>(0)
  const [currentTxn, setCurrentTxn] = useState<number>(-1)
  const [txnIds, setTxnIds] = useState<string[]>([])

  const [progressMessage, _setProgressMessage] = useState('Starting..')

  const pushTxn = (txnId: string) => {
    const txns = txnIds
    txns.push(txnId)
    setTxnIds(txns)
  }

  const setProgressMessage = (custom?: string) => {
    if (custom) _setProgressMessage(custom)
    else if (!transactions) _setProgressMessage('Starting..')
    else _setProgressMessage(`Sending transaction ${currentTxn} of ${txnLen}`)
  }

  const sendTransactions = () => {
    if (!transactions) return
    console.debug(transactions)
    const txn = new Providers.SendTransaction(transactions)
    setTxnLen(txn.length)
    txn
      .send(sendTransactionOpts)
      .on('sent', (txId, index) => {
        pushTxn(txId)
        if (index) {
          setCurrentTxn(index + 1)
        }
        if (onSend) onSend(txId, index)
      })
      .on('finish-sending', () => {
        if (onFinish) {
          setProgressMessage('All transactions are sent.')
          setTimeout(() => {
            onFinish()
          }, 2000)
        }
      })
      .on('error', (error, index) => {
        if (onError) {
          onError(error, index)
        }
      })
      .on('timeout', (slot, error) => {
        if (onError && error) onError(error)
      })
      .on('finally', () => {
        if (onFinally) onFinally()
      })
  }

  useEffect(() => {
    if (transactions) {
      setTxnIds([])
      sendTransactions()
    }
  }, [transactions])

  useEffect(() => {
    setProgressMessage()
  }, [currentTxn])

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
        className={textClass}
        style={{ textAlign: 'center', marginBottom: '1rem' }}
      >
        {progressMessage}
      </h3>
      <div
        className={progressBarOuterClass}
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
          className={progressBarInnerClass}
          style={{
            height: '100%',
            position: 'absolute',
            left: 0,
            background: '#4BB543',
            width: (currentTxn / txnLen) * 100 + '%',
            transition: 'ease-in-out 100ms',
          }}
        ></span>
      </div>
    </div>
  )
}

export default SendTransactionWidget
