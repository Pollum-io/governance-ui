import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js'

import * as serum from '@project-serum/common'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'

export const withCreateSplTokenAccount = async (
  connection: Connection,
  wallet: SignerWalletAdapter | undefined,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  mint: PublicKey
): Promise<{ tokenAccountAddress: PublicKey }> => {
  const tokenAccount = new Keypair()
  const provider = new serum.Provider(
    connection,
    wallet as serum.Wallet,
    serum.Provider.defaultOptions()
  )
  instructions.push(
    ...(await serum.createTokenAccountInstrs(
      provider,
      tokenAccount.publicKey,
      mint,
      wallet!.publicKey!
    ))
  )
  signers.push(tokenAccount)
  return { tokenAccountAddress: tokenAccount.publicKey }
}
