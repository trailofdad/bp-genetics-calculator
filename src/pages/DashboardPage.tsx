import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { GenotypePreview } from '../components/GenotypePreview';
import { formatDate } from '../utils/formatDate';

export function DashboardPage() {
  const { animals, pairings } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard emoji="🐍" label="Animals" value={animals.length} to="/animals" navigate={navigate} />
        <StatCard emoji="⇄" label="Pairings" value={pairings.length} to="/pairings" navigate={navigate} />
        <StatCard emoji="🧬" label="Calculator" value={null} to="/calculator" navigate={navigate} />
      </div>

      {/* Animals overview */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 tracking-tight">Your Animals</h2>
          <button
            onClick={() => navigate('/animals')}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Manage →
          </button>
        </div>

        {animals.length === 0 ? (
          <div className="bg-[#161b27] rounded-2xl border border-white/5 p-8 flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🐍</span>
            <p className="text-sm text-slate-400">No animals saved yet.</p>
            <p className="text-xs text-slate-600">Head to the Animals page to add your first snake.</p>
            <button
              onClick={() => navigate('/animals')}
              className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
            >
              Add Animal
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {animals.map(animal => (
              <div
                key={animal.id}
                className="bg-[#161b27] rounded-2xl border border-white/5 p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-slate-200 leading-tight">{animal.name}</span>
                  <span className="text-[10px] text-slate-600 shrink-0">{formatDate(animal.savedAt)}</span>
                </div>
                <GenotypePreview genotype={animal.genotype} />
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => navigate('/calculator', { state: { loadAnimal: animal, slot: 'parent1' } })}
                    className="flex-1 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors text-center"
                  >
                    Load as Sire
                  </button>
                  <button
                    onClick={() => navigate('/calculator', { state: { loadAnimal: animal, slot: 'parent2' } })}
                    className="flex-1 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors text-center"
                  >
                    Load as Dam
                  </button>
                  <button
                    onClick={() => navigate('/animals')}
                    className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
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
            <h2 className="text-sm font-semibold text-slate-300 tracking-tight">Recent Pairings</h2>
            <button
              onClick={() => navigate('/pairings')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="bg-[#161b27] rounded-2xl border border-white/5 divide-y divide-white/5">
            {pairings.slice(0, 5).map(p => {
              const a1 = animals.find(a => a.id === p.parent1AnimalId);
              const a2 = animals.find(a => a.id === p.parent2AnimalId);
              return (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a1 ? a1.name : 'Sire'} × {a2 ? a2.name : 'Dam'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">{formatDate(p.savedAt)}</span>
                  <button
                    onClick={() => navigate('/calculator', { state: { loadPairing: p } })}
                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors shrink-0"
                  >
                    Load
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  emoji, label, value, to, navigate,
}: {
  emoji: string;
  label: string;
  value: number | null;
  to: string;
  navigate: (path: string) => void;
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="bg-[#161b27] rounded-2xl border border-white/5 p-4 flex flex-col gap-1 text-left hover:border-white/10 transition-colors"
    >
      <span className="text-xl">{emoji}</span>
      <p className="text-lg font-bold text-white mt-1">{value !== null ? value : 'Open'}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </button>
  );
}
