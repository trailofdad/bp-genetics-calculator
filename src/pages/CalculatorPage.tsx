import { useMemo, useState, useRef, useEffect } from 'react'
import {
  FolderOpenIcon,
  DiagramProjectIcon,
  XmarkIcon,
  FloppyDiskIcon,
  ArrowRotateLeftIcon,
  FaSnakeIcon,
  MarsIcon,
  VenusIcon,
} from '../components/icons/index'
import { useLocation, useNavigate } from 'react-router-dom'
import type { OffspringOutcome, ParentGenotype } from 'bp-genetics'
import { calculateOffspring } from 'bp-genetics'
import { ParentSelector } from '../components/ParentSelector'
import { ResultsDisplay } from '../components/ResultsDisplay'
import { GenotypePreview } from '../components/GenotypePreview'
import { useAppContext } from '../context/AppContext'
import type { SavedAnimal, AnimalSex } from '../hooks/useSavedAnimals'
import type { SavedPairing } from '../hooks/useSavedPairings'
import { genotypeKey } from '../projects/utils/compactLabel'
import { buildProjectFromPairing } from '../projects/utils/projectBuilders'

type LocationState = {
  loadAnimal?: SavedAnimal
  slot?: 'parent1' | 'parent2'
  loadPairing?: Pick<
    SavedPairing,
    'id' | 'parent1' | 'parent2' | 'parent1AnimalId' | 'parent2AnimalId'
  >
} | null

function initFromState(state: LocationState) {
  const parent1: ParentGenotype =
    state?.loadPairing?.parent1 ??
    (state?.loadAnimal && state?.slot === 'parent1'
      ? state.loadAnimal.genotype
      : {})
  const parent2: ParentGenotype =
    state?.loadPairing?.parent2 ??
    (state?.loadAnimal && state?.slot === 'parent2'
      ? state.loadAnimal.genotype
      : {})
  const parent1AnimalId =
    state?.loadPairing?.parent1AnimalId ??
    (state?.slot === 'parent1' ? state?.loadAnimal?.id : undefined)
  const parent2AnimalId =
    state?.loadPairing?.parent2AnimalId ??
    (state?.slot === 'parent2' ? state?.loadAnimal?.id : undefined)
  const currentPairingId = state?.loadPairing?.id

  return {
    parent1,
    parent2,
    parent1AnimalId,
    parent2AnimalId,
    currentPairingId,
  }
}

export function CalculatorPage() {
  const {
    animals,
    saveAnimal,
    savePairing,
    savedOffspring,
    saveOffspring,
    removeSavedOffspring,
    projectGoals,
    saveProjectGoal,
    removeProjectGoalByKey,
    pairings,
    saveProject,
  } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = location.state as LocationState
  const init = initFromState(locationState)

  const [parent1, setParent1] = useState<ParentGenotype>(init.parent1)
  const [parent2, setParent2] = useState<ParentGenotype>(init.parent2)
  const [parent1AnimalId, setParent1AnimalId] = useState<string | undefined>(
    init.parent1AnimalId
  )
  const [parent2AnimalId, setParent2AnimalId] = useState<string | undefined>(
    init.parent2AnimalId
  )
  const [currentPairingId, setCurrentPairingId] = useState<string | undefined>(
    init.currentPairingId
  )

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const saveInputRef = useRef<HTMLInputElement>(null)

  const [saveAnimalModal, setSaveAnimalModal] = useState<{
    genotype: ParentGenotype
    name: string
    sex?: AnimalSex
  } | null>(null)
  const saveAnimalInputRef = useRef<HTMLInputElement>(null)

  const [loadAnimalPicker, setLoadAnimalPicker] = useState<
    'parent1' | 'parent2' | null
  >(null)
  const [loadPairingPickerOpen, setLoadPairingPickerOpen] = useState(false)

  useEffect(() => {
    if (locationState) {
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (saveModalOpen) {
      setTimeout(() => saveInputRef.current?.focus(), 50)
    }
  }, [saveModalOpen])

  useEffect(() => {
    if (saveAnimalModal !== null) {
      setTimeout(() => saveAnimalInputRef.current?.focus(), 50)
    }
  }, [saveAnimalModal])

  const outcomes = useMemo(
    () => calculateOffspring(parent1, parent2),
    [parent1, parent2]
  )
  const hasGenes =
    Object.values(parent1).some((c) => c > 0) ||
    Object.values(parent2).some((c) => c > 0)

  const savedOutcomeKeys = useMemo(() => {
    if (!currentPairingId) return new Set<string>()
    return new Set(
      savedOffspring
        .filter((entry) => entry.pairingId === currentPairingId)
        .map((entry) => entry.genotypeKey)
    )
  }, [currentPairingId, savedOffspring])

  const goalOutcomeKeys = useMemo(
    () => new Set(projectGoals.map((g) => g.genotypeKey)),
    [projectGoals]
  )

  function handleReset() {
    setParent1({})
    setParent2({})
    setParent1AnimalId(undefined)
    setParent2AnimalId(undefined)
    setCurrentPairingId(undefined)
  }

  function handleSaveConfirm() {
    const pairingId = savePairing(
      saveName,
      parent1,
      parent2,
      parent1AnimalId,
      parent2AnimalId
    )
    setSaveName('')
    setSaveModalOpen(false)
    setCurrentPairingId(pairingId)
  }

  function handleSaveAnimalConfirm() {
    if (!saveAnimalModal) return
    saveAnimal(saveAnimalModal.name, saveAnimalModal.genotype, saveAnimalModal.sex)
    setSaveAnimalModal(null)
  }

  function handleLoadAnimal(animal: SavedAnimal, slot: 'parent1' | 'parent2') {
    if (slot === 'parent1') {
      setParent1(animal.genotype)
      setParent1AnimalId(animal.id)
    } else {
      setParent2(animal.genotype)
      setParent2AnimalId(animal.id)
    }
    setCurrentPairingId(undefined)
    setLoadAnimalPicker(null)
  }

  function handleSaveOffspring(outcome: OffspringOutcome) {
    if (!currentPairingId) return

    const outcomeKey = genotypeKey(outcome.genotype)
    const existing = savedOffspring.find(
      (entry) =>
        entry.pairingId === currentPairingId && entry.genotypeKey === outcomeKey
    )

    if (existing) {
      removeSavedOffspring(existing.id)
      return
    }

    saveOffspring(currentPairingId, outcome)
  }

  function handleToggleGoal(outcome: OffspringOutcome) {
    const key = genotypeKey(outcome.genotype)
    const existing = projectGoals.find((g) => g.genotypeKey === key)
    if (existing) {
      removeProjectGoalByKey(key)
    } else {
      const pairing = pairings.find((p) => p.id === currentPairingId)
      saveProjectGoal(outcome, currentPairingId, pairing?.name)
    }
  }

  function handleLoadPairing(pairing: (typeof pairings)[number]) {
    setParent1(pairing.parent1)
    setParent2(pairing.parent2)
    setParent1AnimalId(pairing.parent1AnimalId)
    setParent2AnimalId(pairing.parent2AnimalId)
    setCurrentPairingId(pairing.id)
    setLoadPairingPickerOpen(false)
  }

  function handleOpenInProjects() {
    const pairing = pairings.find((p) => p.id === currentPairingId)
    if (!pairing) return
    const project = buildProjectFromPairing(pairing, animals)
    saveProject(project)
    navigate('/projects', { state: { project } })
  }

  const parentConfigs = [
    {
      label: 'Sire',
      sex: <MarsIcon className="h-3.5 w-3.5 text-sky-400" />,
      inferredSex: 'male' as AnimalSex,
      genotype: parent1,
      onChange: (g: ParentGenotype) => {
        setParent1(g)
        setParent1AnimalId(undefined)
        setCurrentPairingId(undefined)
      },
      animalId: parent1AnimalId,
      slot: 'parent1' as const,
    },
    {
      label: 'Dam',
      sex: <VenusIcon className="h-3.5 w-3.5 text-rose-400" />,
      inferredSex: 'female' as AnimalSex,
      genotype: parent2,
      onChange: (g: ParentGenotype) => {
        setParent2(g)
        setParent2AnimalId(undefined)
        setCurrentPairingId(undefined)
      },
      animalId: parent2AnimalId,
      slot: 'parent2' as const,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {pairings.length > 0 && (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Calculator</h1>
          <button
            onClick={() => setLoadPairingPickerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <span>Load Pairing</span>
            <FolderOpenIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {parentConfigs.map(
          ({ label, sex, inferredSex, genotype, onChange, animalId, slot }) => {
            const linkedAnimal = animals.find((a) => a.id === animalId)
            const hasGenesForParent = Object.values(genotype).some((c) => c > 0)
            return (
              <div
                key={label}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
              >
                {linkedAnimal && (
                  <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                      <FaSnakeIcon className="h-4 w-4" />
                      <span>{linkedAnimal.name}</span>
                      {linkedAnimal.sex === 'male' && (
                        <MarsIcon className="h-3.5 w-3.5 text-sky-400/80" />
                      )}
                      {linkedAnimal.sex === 'female' && (
                        <VenusIcon className="h-3.5 w-3.5 text-rose-400/80" />
                      )}
                    </span>
                    <button
                      onClick={() => {
                        onChange({})
                      }}
                      className="ml-auto text-indigo-400/60 transition-colors hover:text-indigo-300"
                      title="Unlink animal"
                      aria-label="Unlink animal"
                    >
                      <XmarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <ParentSelector
                  parentLabel={label}
                  parentSex={sex}
                  genotype={genotype}
                  onChange={onChange}
                  headerAction={
                    animals.length > 0 ? (
                      <button
                        onClick={() => setLoadAnimalPicker(slot)}
                        className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground/80"
                      >
                        <span>Load Animal</span>
                        <FolderOpenIcon className="h-3.5 w-3.5" />
                      </button>
                    ) : undefined
                  }
                />

                <div className="flex items-center justify-end gap-2">
                  {hasGenesForParent && (
                    <button
                      onClick={() =>
                        setSaveAnimalModal({ genotype, name: '', sex: inferredSex })
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground/80"
                    >
                      <span>Save Animal</span>
                      <FaSnakeIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          }
        )}
      </div>

      {hasGenes && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setSaveName('')
              setSaveModalOpen(true)
            }}
            disabled={!!currentPairingId}
            title={currentPairingId ? 'Pairing already saved' : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium tracking-tight text-foreground transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            Save Pairing
            <FloppyDiskIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleOpenInProjects}
            disabled={!currentPairingId}
            title={!currentPairingId ? 'Save pairing first' : 'Open in Projects'}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-500/10"
          >
            <span>Open in Projects</span>
            <DiagramProjectIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Reset
            <ArrowRotateLeftIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="min-h-40 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground/80">
          Offspring Outcomes
        </h2>
        <ResultsDisplay
          outcomes={outcomes}
          onSaveOffspring={currentPairingId ? handleSaveOffspring : undefined}
          savedOutcomeKeys={currentPairingId ? savedOutcomeKeys : undefined}
          onToggleGoal={handleToggleGoal}
          goalOutcomeKeys={goalOutcomeKeys}
        />
      </div>

      <p className="pb-4 text-center text-xs text-muted-foreground/40">
        Results assume independent gene assortment. Cross-gene interactions (BEL
        complex, neurological notes) are surfaced inline. For breeding
        decisions, consult a specialist.
      </p>

      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-foreground">Save Pairing</h3>
            <input
              ref={saveInputRef}
              type="text"
              placeholder="Pairing name…"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveConfirm()
                if (e.key === 'Escape') setSaveModalOpen(false)
              }}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
                <XmarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleSaveConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-indigo-500"
              >
                Save
                <FloppyDiskIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {saveAnimalModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Save Animal</h3>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Give this animal a name to find it easily later.
              </p>
            </div>
            <input
              ref={saveAnimalInputRef}
              type="text"
              placeholder="Animal name…"
              value={saveAnimalModal.name}
              onChange={(e) =>
                setSaveAnimalModal((m) => m && { ...m, name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAnimalConfirm()
                if (e.key === 'Escape') setSaveAnimalModal(null)
              }}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSaveAnimalModal(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
                <XmarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleSaveAnimalConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-indigo-500"
              >
                Save
                <FloppyDiskIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {loadAnimalPicker !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Load Animal as {loadAnimalPicker === 'parent1' ? 'Sire' : 'Dam'}
              </h3>
              <button
                onClick={() => setLoadAnimalPicker(null)}
                className="text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <XmarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {animals.filter(
                (a) =>
                  !a.sex ||
                  (loadAnimalPicker === 'parent1'
                    ? a.sex === 'male'
                    : a.sex === 'female')
              ).length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground/60">
                  No{' '}
                  {loadAnimalPicker === 'parent1' ? 'male' : 'female'} animals
                  saved.
                </p>
              ) : (
                animals
                  .filter(
                    (a) =>
                      !a.sex ||
                      (loadAnimalPicker === 'parent1'
                        ? a.sex === 'male'
                        : a.sex === 'female')
                  )
                  .map((animal) => (
                    <button
                      key={animal.id}
                      onClick={() => handleLoadAnimal(animal, loadAnimalPicker)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:border-indigo-500/25 hover:bg-muted"
                    >
                      <FaSnakeIcon className="h-5 w-5 shrink-0 text-muted-foreground" variant="thin" />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                          {animal.name}
                          {animal.sex === 'male' && (
                            <MarsIcon className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                          )}
                          {animal.sex === 'female' && (
                            <VenusIcon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                          )}
                        </span>
                        <GenotypePreview genotype={animal.genotype} />
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {loadPairingPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-popover p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Load Pairing</h3>
              <button
                onClick={() => setLoadPairingPickerOpen(false)}
                className="text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <XmarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {pairings.map((pairing) => {
                const p1Name = animals.find((a) => a.id === pairing.parent1AnimalId)?.name ?? 'Parent 1'
                const p2Name = animals.find((a) => a.id === pairing.parent2AnimalId)?.name ?? 'Parent 2'
                return (
                  <button
                    key={pairing.id}
                    onClick={() => handleLoadPairing(pairing)}
                    className="flex flex-col gap-0.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:border-indigo-500/25 hover:bg-muted"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {pairing.name}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {p1Name} × {p2Name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
