import { ABOUT_INTRO, TIMELINE } from '../content'
import { Words } from './text'

export function About() {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div data-calm>
        <h2 className="display" id="about-title" data-split aria-label="How I got here"><Words text="How I got here" /></h2>
        <div className="about__intro" data-reveal>
          {ABOUT_INTRO.map((p) => <p key={p}>{p}</p>)}
        </div>
      </div>
      <ol className="tl" id="tl" data-calm>
        {TIMELINE.map((t) => (
          <li key={`${t.when}-${t.what}`} data-reveal><time>{t.when}</time><b>{t.what}</b><span>{t.where}</span></li>
        ))}
      </ol>
    </section>
  )
}
