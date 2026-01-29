import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { HomePage } from '@/pages/home'
import { StoryPointsPage } from '@/pages/story-points'
import { SprintPlannerPage } from '@/pages/sprint-planner'
import { useSprintPlannerStore, useIsHydrated } from '@/store/sprint-planner'

function AppContent() {
  const hydrate = useSprintPlannerStore(state => state.hydrate)
  const isHydrated = useIsHydrated()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="story-points" element={<StoryPointsPage />} />
        <Route path="sprint-planner" element={<SprintPlannerPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
