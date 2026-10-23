import { About } from './components/About'
import { Close } from './components/Close'
import { Hero } from './components/Hero'
import { Rail } from './components/Rail'
import { Work } from './components/Work'
import { OWNER } from './content'
import { reducedMotion } from './env'
import { useEngines } from './useEngines'
import { useFace } from './useFace'

export function App() {
  const { face, origin, toggle } = useFace()
  const { sceneFailed } = useEngines(face, origin)
  return (
    <>
      <a className="skip" href="#work">Skip to work</a>
      <div className="tex" aria-hidden="true" />
      <canvas id="field" aria-hidden="true" />
      <div className="wipe" id="wipe" aria-hidden="true" />
      <div className="cursor" id="cursor" aria-hidden="true" />
      <p className="sr" id="live" aria-live="polite" />
      <Rail />
      <main id="top">
        <Hero face={face} hint={!reducedMotion() && !sceneFailed} onToggle={toggle} />
        <Work face={face} />
        <About />
        <Close />
      </main>
      <footer><span>{OWNER}</span><a href="#top">Back to top</a></footer>
    </>
  )
}
