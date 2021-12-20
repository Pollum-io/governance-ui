import React, { useState } from 'react'
import RealmWizardController from './controller/RealmWizardController'
import BN from 'bn.js'
// import CreateRealmForm from './components/CreateRealmForm'
import Loading from '@components/Loading'
import WizardModeSelect from './components/Steps/WizardModeSelect'
import { notify } from '@utils/notifications'
import {
  StepOne,
  StepTwo,
  StepThree,
  StepFour,
  RealmCreated,
} from './components/Steps'
import { useMemo } from 'react'
import Button from '@components/Button'
import {
  RealmArtifacts,
  RealmWizardMode,
  RealmWizardStep,
  StepDirection,
} from './interfaces/Realm'
import { formValidation, isFormValid } from '@utils/formValidation'
import { CreateFormSchema } from './validators/create-realm-validator'
import { tryGetMint } from '@utils/tokens'
import { PublicKey } from '@solana/web3.js'
import { getMintDecimalAmount } from '@tools/sdk/units'
import useWalletStore from 'stores/useWalletStore'
import { registerRealm } from 'actions/registerRealm'
import { generateGovernanceArtifacts } from '@utils/governance/generate-governance-artifacts'
import { DEFAULT_GOVERNANCE_PROGRAM_ID } from '@components/instructions/tools'
import { ProgramVersion } from '@models/registry/constants'

import { createMultisigRealm } from 'actions/createMultisigRealm'

enum LoaderMessage {
  CREATING_ARTIFACTS = 'Creating the Realm Artifacts..',
  MINTING_COUNCIL_TOKENS = 'Minting the council tokens..',
  MINTING_COMMUNITY_TOKENS = 'Minting the community tokens..',
  DEPLOYING_REALM = 'Deploying the Realm..',
  COMPLETING_REALM = 'Finishing the Realm buildings..',
  FINISHED = 'Realm successfully created.',
  ERROR = 'We found an error while creating your Realm :/',
}

const RealmWizard: React.FC = () => {
  // const wallet = useWalletStore((s) => s.current)
  const { connection, current: wallet } = useWalletStore((s) => s)
  /**
   * @var {RealmWizardController} ctl
   * The wizard controller instance
   */
  const [ctl, setController] = useState<RealmWizardController>()

  const [form, setForm] = useState<RealmArtifacts>({
    yesThreshold: 60,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<RealmWizardStep>(
    RealmWizardStep.SELECT_MODE
  )
  const [realmAddress, setRealmAddress] = useState('')
  const [loaderMessage, setLoaderMessage] = useState<LoaderMessage>()

  /**
   * Handles and set the form data
   * @param data the form data
   */
  const handleSetForm = (data: RealmArtifacts) => {
    setForm({
      ...form,
      ...data,
    })
  }

  /**
   * Generate program artifacts
   */
  const generateProgramArtifacts = async () => {
    if (!ctl) return
    if (!wallet?.publicKey || !connection.current) {
      notify({ type: 'error', message: 'Wallet not connected!' })
      return
    }
    if (!form.name)
      return notify({
        type: 'error',
        message: 'You must set a name for the realm!',
      })

    if (!form.teamWallets?.length)
      return notify({
        type: 'error',
        message: 'Team member wallets are required.',
      })

    setLoaderMessage(LoaderMessage.CREATING_ARTIFACTS)
    setIsLoading(true)

    let programId = DEFAULT_GOVERNANCE_PROGRAM_ID

    // temp. set to other instance to prevent spamming the default one
    // TODO: make it possible to set the default one via environment variable
    programId = '4T4jPyMxM4fMn71pJQpU3iuQZrf5FnE2MmP71T7PGosm'

    const results = await createMultisigRealm(
      connection.current,
      new PublicKey(programId),
      ProgramVersion.V1,
      form.name,
      60,
      form.teamWallets.map((w) => new PublicKey(w)),
      wallet
    )

    if (results) {
      return results
    }

    notify({
      type: 'error',
      message: 'Something bad happened during this request.',
    })
  }

  /**
   * Handles and set the selected mode
   * @param option the selected mode
   */
  const handleModeSelection = (option: RealmWizardMode) => {
    try {
      const ctl = new RealmWizardController(option)
      const nextStep = ctl.getNextStep(currentStep, StepDirection.NEXT)
      setController(ctl)
      setCurrentStep(nextStep)
    } catch (error) {
      notify({
        type: 'error',
        message: error.message,
      })
    }
  }

  const handleStepSelection = (direction: StepDirection) => {
    if (ctl) {
      try {
        const nextStep = ctl.getNextStep(currentStep, direction)
        setCurrentStep(nextStep)
      } catch (error) {
        notify({
          type: 'error',
          message: error.message,
        })
      }
    }
  }

  const handleCreateRealm = async () => {
    setIsLoading(true)
    try {
      const realm = await generateProgramArtifacts()
      setIsLoading(false)
      if (realm) {
        window.location.pathname = `/dao/${realm.realmPk.toBase58()}`
      }
    } catch (error) {
      const err = error as Error
      notify({
        type: 'error',
        message: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Binds the current step to the matching component
   */
  const BoundStepComponent = useMemo(() => {
    switch (currentStep) {
      case RealmWizardStep.SELECT_MODE:
        return <WizardModeSelect onSelect={handleModeSelection} />
      case RealmWizardStep.BASIC_CONFIG:
        return <StepOne form={form} setForm={handleSetForm} />
      case RealmWizardStep.TOKENS_CONFIG:
        return <StepTwo form={form} setForm={handleSetForm} />
      case RealmWizardStep.STEP_3:
        return <StepThree form={form} setForm={handleSetForm} />
      case RealmWizardStep.STEP_4:
        return <StepFour form={form} setForm={handleSetForm} />
      case RealmWizardStep.REALM_CREATED:
        return <RealmCreated realmAddress={realmAddress} />
      default:
        return <h4>Sorry, but this step ran away</h4>
    }
  }, [currentStep, form])

  return (
    <div className="relative">
      {isLoading ? (
        <div className="text-center">
          <Loading />
          <span>{loaderMessage}</span>
        </div>
      ) : (
        BoundStepComponent
      )}
      {ctl && !(ctl.isFirstStep() || isLoading) && (
        <>
          <Button
            onClick={() => handleStepSelection(StepDirection.PREV)}
            className="mr-3"
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (ctl.isLastStep()) handleCreateRealm()
              else handleStepSelection(StepDirection.NEXT)
            }}
            disabled={!form.teamWallets?.length || !form.name}
          >
            {ctl.isLastStep() ? 'Create' : 'Next'}
          </Button>
        </>
      )}
    </div>
  )
}

export default RealmWizard
