import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlaygroundView } from '../playground/PlaygroundView';
import { useAppContext } from '../context/AppContext';
import type { PlaygroundProject } from '../playground/types';

export function PlaygroundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pairings, animals, saveProject } = useAppContext();

  const locationProject = (location.state as { project?: PlaygroundProject } | null)?.project;
  const [project, setProject] = useState<PlaygroundProject | null>(locationProject ?? null);

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d1117] text-slate-400 flex-col gap-4">
        <p className="text-sm">No playground project loaded.</p>
        <button
          onClick={() => navigate('/pairings')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors"
        >
          Go to Pairings
        </button>
      </div>
    );
  }

  return (
    <PlaygroundView
      project={project}
      savedPairings={pairings}
      savedAnimals={animals}
      onBack={() => navigate(-1)}
      onSave={p => { saveProject(p); setProject(p); }}
    />
  );
}
