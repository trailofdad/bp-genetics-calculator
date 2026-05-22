import { useState, useCallback } from 'react'
import type { PlaygroundProject } from './types'

const STORAGE_KEY = 'playground-projects'

function load(): PlaygroundProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PlaygroundProject[]) : []
  } catch {
    return []
  }
}

function persist(projects: PlaygroundProject[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // ignore quota errors
  }
}

export function usePlaygroundProjects() {
  const [projects, setProjects] = useState<PlaygroundProject[]>(load)

  const saveProject = useCallback((project: PlaygroundProject) => {
    setProjects((prev) => {
      const next = [project, ...prev.filter((p) => p.id !== project.id)]
      persist(next)
      return next
    })
  }, [])

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { projects, saveProject, removeProject }
}
