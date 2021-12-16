import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js'
import { GOVERNANCE_SCHEMA } from './serialisation'
import { serialize } from 'borsh'
import { DepositGoverningTokensArgs } from './instructions'
import { getTokenOwnerAddress, GOVERNANCE_PROGRAM_SEED } from './accounts'
import { TOKEN_PROGRAM_ID } from '@utils/tokens'

export const withDepositGoverningTokens = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  realm: PublicKey,
  governingTokenSource: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
  transferAuthority: PublicKey,
  payer: PublicKey
) => {
  const args = new DepositGoverningTokensArgs()
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args))

  const tokenOwnerRecordPk = await getTokenOwnerAddress(
    programId,
    realm,
    governingTokenMint,
    governingTokenOwner
  )

  const [governingTokenHoldingPk] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    programId
  )

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governingTokenHoldingPk,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenSource,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenOwner,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: transferAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: tokenOwnerRecordPk,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
  ]

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    })
  )

  return tokenOwnerRecordPk
}
