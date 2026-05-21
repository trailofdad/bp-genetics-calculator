import { useState } from 'react';
import { ParentSelector } from './components/ParentSelector';
import { ResultsDisplay } from './components/ResultsDisplay';
import type { ParentGenotype, OffspringOutcome } from 'bp-genetics';
import { calculateOffspring } from 'bp-genetics';

export default function App() {
  const [parent1, setParent1] = useState<ParentGenotype>({});
  const [parent2, setParent2] = useState<ParentGenotype>({});
  const [outcomes, setOutcomes] = useState<OffspringOutcome[] | null>(null);

  function handleCalculate() {
    setOutcomes(calculateOffspring(parent1, parent2));
  }

  function handleReset() {
    setParent1({});
    setParent2({});
    setOutcomes(null);
  }

  const hasGenes =
    Object.values(parent1).some(c => c > 0) || Object.values(parent2).some(c => c > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur border-b border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐍</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Ball Python</h1>
              <p className="text-xs text-indigo-300">Genetics Calculator</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Select genes for each parent, then calculate offspring probabilities
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Parents grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Parent 1 ♂', genotype: parent1, onChange: setParent1 },
            { label: 'Parent 2 ♀', genotype: parent2, onChange: setParent2 },
          ].map(({ label, genotype, onChange }) => (
            <div
              key={label}
              className="bg-white rounded-2xl shadow-xl p-5 border border-slate-100"
            >
              <ParentSelector
                parentLabel={label}
                genotype={genotype}
                onChange={onChange}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleCalculate}
            disabled={!hasGenes}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-colors text-sm"
          >
            Calculate Offspring
          </button>
          {(hasGenes || outcomes !== null) && (
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors text-sm border border-white/20"
            >
              Reset
            </button>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-slate-100 min-h-40">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Offspring Outcomes</h2>
          <ResultsDisplay outcomes={outcomes ?? []} />
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-500 pb-4">
          Results are based on independent gene assortment. Cross-gene interactions (e.g. BEL
          complex compound hets) are not modeled. For breeding decisions, consult a specialist.
        </p>
      </main>
    </div>
  );
}
