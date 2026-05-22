import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PlaygroundView } from '../playground/PlaygroundView'
import { useAppContext } from '../context/AppContext'
import type { PlaygroundProject } from '../playground/types'

export function PlaygroundPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { animals, saveAnimal, saveProject } = useAppContext()

  const locationProject = (
    location.state as { project?: PlaygroundProject } | null
  )?.project
  const [project, setProject] = useState<PlaygroundProject | null>(
    locationProject ?? null
  )

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0d1117] text-slate-400">
        <p className="text-sm">No playground project loaded.</p>
        <button
          onClick={() => navigate('/pairings')}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-500"
        >
          Go to Pairings
        </button>
      </div>
    )
  }

  return (
    <PlaygroundView
      project={project}
      savedAnimals={animals}
      saveAnimal={saveAnimal}
      onBack={() => navigate(-1)}
      onSave={(p) => {
        saveProject(p)
        setProject(p)
      }}
    />
  )
}
