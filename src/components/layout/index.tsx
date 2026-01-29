import { Outlet } from 'react-router-dom'
import { Navbar } from './navbar'

export function Layout() {
  return (
    <>
      <Navbar />
      <main className="main">
        <Outlet />
      </main>
    </>
  )
}
