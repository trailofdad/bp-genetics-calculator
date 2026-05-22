import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { GenotypePreview } from '../components/GenotypePreview'
import { formatDate } from '../utils/formatDate'

export function DashboardPage() {
  const { animals, pairings } = useAppContext()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          emoji="🐍"
          label="Animals"
          value={animals.length}
          to="/animals"
          navigate={navigate}
        />
        <StatCard
          emoji="⇄"
          label="Pairings"
          value={pairings.length}
          to="/pairings"
          navigate={navigate}
        />
        <StatCard
          emoji="🧬"
          label="Calculator"
          value={null}
          to="/calculator"
          navigate={navigate}
        />
      </div>

      {/* Animals overview */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-slate-300">
            Your Animals
          </h2>
          <button
            onClick={() => navigate('/animals')}
            className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Manage →
          </button>
        </div>

        {animals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#161b27] p-8 text-center">
            <span className="text-3xl">🐍</span>
            <p className="text-sm text-slate-400">No animals saved yet.</p>
            <p className="text-xs text-slate-600">
              Head to the Animals page to add your first snake.
            </p>
            <button
              onClick={() => navigate('/animals')}
              className="mt-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Add Animal
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((animal) => (
              <div
                key={animal.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-[#161b27] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm leading-tight font-medium text-slate-200">
                    {animal.name}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {formatDate(animal.savedAt)}
                  </span>
                </div>
                <GenotypePreview genotype={animal.genotype} />
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate('/calculator', {
                        state: { loadAnimal: animal, slot: 'parent1' },
                      })
                    }
                    className="flex-1 rounded-lg border border-white/5 bg-white/4 px-2.5 py-1.5 text-center text-[11px] text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                  >
                    Load as Sire
                  </button>
                  <button
                    onClick={() =>
                      navigate('/calculator', {
                        state: { loadAnimal: animal, slot: 'parent2' },
                      })
                    }
                    className="flex-1 rounded-lg border border-white/5 bg-white/4 px-2.5 py-1.5 text-center text-[11px] text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                  >
                    Load as Dam
                  </button>
                  <button
                    onClick={() => navigate('/animals')}
                    className="rounded-lg border border-white/5 bg-white/4 px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
                    title="Edit"
                  >
                    ✎
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent pairings */}
      {pairings.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-slate-300">
              Recent Pairings
            </h2>
            <button
              onClick={() => navigate('/pairings')}
              className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-[#161b27]">
            {pairings.slice(0, 5).map((p) => {
              const a1 = animals.find((a) => a.id === p.parent1AnimalId)
              const a2 = animals.find((a) => a.id === p.parent2AnimalId)
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {a1 ? a1.name : 'Sire'} × {a2 ? a2.name : 'Dam'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {formatDate(p.savedAt)}
                  </span>
                  <button
                    onClick={() =>
                      navigate('/calculator', { state: { loadPairing: p } })
                    }
                    className="shrink-0 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                  >
                    Load
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  emoji,
  label,
  value,
  to,
  navigate,
}: {
  emoji: string
  label: string
  value: number | null
  to: string
  navigate: (path: string) => void
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-[#161b27] p-4 text-left transition-colors hover:border-white/10"
    >
      <span className="text-xl">{emoji}</span>
      <p className="mt-1 text-lg font-bold text-white">
        {value !== null ? value : 'Open'}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </button>
  )
}
