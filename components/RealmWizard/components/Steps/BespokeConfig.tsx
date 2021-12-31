/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react'
import { RealmWizardStepComponentProps } from '@components/RealmWizard/interfaces/Realm'
import Input from '@components/inputs/Input'
import {
  formatMintNaturalAmountAsDecimal,
  getMintDecimalAmount,
} from '@tools/sdk/units'
import { BN } from '@project-serum/anchor'
import { tryGetMint } from '@utils/tokens'
import { PublicKey } from '@solana/web3.js'
import useWalletStore from 'stores/useWalletStore'
import _ from 'lodash'
import Switch from '@components/Switch'
import { StyledLabel } from '@components/inputs/styles'
import Tooltip from '@components/Tooltip'

const BespokeConfig: React.FC<RealmWizardStepComponentProps> = ({
  setForm,
  form,
  formErrors,
  setFormErrors,
  beforeClickNext,
}) => {
  const { connection } = useWalletStore((s) => s)

  const handleCommunityMint = async (mintId: string) => {
    try {
      const mintPublicKey = new PublicKey(mintId)
      const mint = await tryGetMint(connection.current, mintPublicKey)
      if (mint) {
        const supply = mint.account.supply
        if (supply.gt(new BN(0))) {
          setForm({
            minCommunityTokensToCreateGovernance: BN.max(
              new BN(1),
              // divide by 100 for a percentage
              new BN(
                getMintDecimalAmount(mint.account, supply)
                  .dividedBy(100)
                  .toString()
              )
            ),
            communityMintMaxVoteWeightSource: 1,
            communityMint: mint,
            transferAuthority: true,
          })
        } else {
          setForm({
            communityMint: mint,
            transferAuthority: true,
          })
        }
      }
    } catch (e) {
      console.log('failed to set community mint', e)
    }
  }

  useEffect(() => {
    _.debounce(async () => {
      if (form?.communityMintId) {
        await handleCommunityMint(form.communityMintId)
      }
    }, 250)()
    if (!form?.communityMintId?.length) {
      setForm({ communityMint: undefined })
    }
  }, [form?.communityMintId])

  return (
    <>
      <div className="border-b border-fgd-4 pb-4 pt-2">
        <div className="flex items-center justify-between">
          <h1>Create a new realm</h1>
        </div>
      </div>
      <div className="pt-2">
        <div className="pb-4 pr-10 mr-2">
          <Input
            label="Name"
            placeholder="Name of your realm"
            value={form.name}
            type="text"
            error={formErrors['name']}
            onChange={(evt) =>
              setForm({
                name: evt.target.value,
              })
            }
          />
        </div>
        <div className="pb-4 pr-10 mr-2">
          <Input
            label="Community Token Mint"
            placeholder="(Optional) Community token mint of this realm"
            value={form?.communityMintId}
            type="text"
            error={formErrors['communityMintId'] || formErrors['communityMint']}
            onChange={(evt) => setForm({ communityMintId: evt.target.value })}
          />
          {form?.communityMint && (
            <div className="pt-2">
              <div className="pb-0.5 text-fgd-3 text-xs">Mint supply</div>
              <div className="text-xs">
                {formatMintNaturalAmountAsDecimal(
                  form.communityMint.account,
                  form.communityMint.account.supply
                )}
              </div>
            </div>
          )}
        </div>
        {form?.communityMint && (
          <>
            <div className="pb-4 pr-10 mr-2">
              <div className="flex justify-left items-center">
                <Tooltip content="If checked, will transfer mint authority to the realm">
                  <Switch
                    className="mt-2 mb-2"
                    checked={form.transferAuthority ?? false}
                    onChange={() => {
                      setForm({ transferAuthority: !form.transferAuthority })
                    }}
                  />
                </Tooltip>
                <StyledLabel className="mt-1.5 ml-3">
                  Transfer authority
                </StyledLabel>
              </div>
            </div>
            <div className="pb-4 pr-10 mr-2">
              <Input
                label="Min community tokens to create governance (defaults 1% of community mint)"
                placeholder="Min community tokens to create governance"
                step="0.01"
                value={form.minCommunityTokensToCreateGovernance}
                type="number"
                error={formErrors['minCommunityTokensToCreateGovernance']}
                onChange={(evt) =>
                  setForm({
                    minCommunityTokensToCreateGovernance: new BN(
                      evt.target.value
                    ),
                  })
                }
              />
            </div>
            <div className="pb-4 pr-10 mr-2">
              <Input
                label="Community mint supply factor (max vote weight)"
                placeholder="Community mint supply factor (max vote weight)"
                value={form.communityMintMaxVoteWeightSource}
                type="number"
                error={formErrors['communityMintMaxVoteWeightSource']}
                onChange={(evt) =>
                  setForm({
                    communityMintMaxVoteWeightSource: evt.target.value,
                  })
                }
              />
            </div>
          </>
        )}
        <div className="pb-4 pr-10 mr-2">
          <Input
            label="Governance Program Id"
            placeholder="Id of the governance program this realm will be associated with"
            value={form?.governanceProgramId}
            type="text"
            error={formErrors['governanceProgramId']}
            onChange={(evt) =>
              setForm({
                governanceProgramId: evt.target.value,
              })
            }
          />
        </div>
        <div className="pb-4 pr-10 mr-2">
          <Input
            label="Governance program version"
            placeholder={1}
            step="1"
            min={1}
            value={form?.programVersion}
            type="number"
            error={formErrors['programVersion']}
            onChange={(evt) =>
              setForm({
                programVersion: evt.target.value,
              })
            }
          />
        </div>
      </div>
    </>
  )
}

export default BespokeConfig
