import { About } from './components/About'
import { Close } from './components/Close'
import { Hero } from './components/Hero'
import { Rail } from './components/Rail'
import { Work } from './components/Work'
import { useFace } from './useFace'

export function App() {
  const { face, toggle } = useFace()
  return (
    <>
      <Rail />
      <main>
        <Hero face={face} onToggle={toggle} />
        <Work />
        <About />
        <Close />
      </main>
    </>
  )
}
