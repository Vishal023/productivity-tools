import { Link } from 'react-router-dom'
import { Timer, Calendar, ArrowRight } from 'lucide-react'

const tools = [
  {
    id: 'story-points',
    name: 'Story Points Calculator',
    description: 'Convert time spent on tasks into story points. Perfect for sprint planning and retrospectives.',
    icon: Timer,
    path: '/story-points'
  },
  {
    id: 'sprint-planner',
    name: 'Sprint Planner',
    description: 'Plan sprints with team capacity tracking, Jira ticket management, and real-time utilization metrics.',
    icon: Calendar,
    path: '/sprint-planner'
  }
]

export function HomePage() {
  return (
    <>
      <div className="hero-section">
        <h1 className="hero-title">Productivity Tools</h1>
        <p className="hero-description">
          A collection of simple, focused tools to help developers work more efficiently.
        </p>
      </div>

      <div className="tools-grid">
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <Link key={tool.id} to={tool.path} className="tool-card">
              <div className="tool-icon">
                <Icon />
              </div>
              <h2 className="tool-name">{tool.name}</h2>
              <p className="tool-description">{tool.description}</p>
              <div className="tool-link">
                Open tool
                <ArrowRight />
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
