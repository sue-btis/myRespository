import { EMAIL, GITHUB, LINKEDIN } from '../content'
import { Chars } from './text'
import { Icon } from './Icon'
import { PendingLink } from './PendingLink'

export function Rail() {
  return (
    <header className="top" id="bar">
      <a className="name" href="#top" data-mag="0.2"><b aria-hidden="true" />Josue Escobar</a>
      <ul className="nav">
        <li>
          <PendingLink label="CV" className="nl pend"><Icon name="cv" /><span className="t" aria-hidden="true">CV</span></PendingLink>
        </li>
        <li>
          <a className="nl" href={LINKEDIN} aria-label="LinkedIn" data-mag="0.25"><Icon name="linkedin" /><span className="t" aria-hidden="true">LinkedIn</span></a>
        </li>
        <li>
          <a className="nl" href={GITHUB} aria-label="GitHub" data-mag="0.25"><Icon name="github" /><span className="t" aria-hidden="true">GitHub</span></a>
        </li>
        <li>
          <a className="cta" href={`mailto:${EMAIL}`} aria-label="Write to me" data-mag="0.3" data-rip data-wave>
            <Icon name="mail" /><span className="lbl"><Chars text="Write to me" /></span>
          </a>
        </li>
      </ul>
    </header>
  )
}
