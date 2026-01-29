import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { HomePage } from '@/pages/home'
import { StoryPointsPage } from '@/pages/story-points'
import { SprintPlannerPage } from '@/pages/sprint-planner'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="story-points" element={<StoryPointsPage />} />
          <Route path="sprint-planner" element={<SprintPlannerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
