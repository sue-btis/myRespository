import { EMAIL, GITHUB } from '../content'
import { Icon } from './Icon'
import { PendingLink } from './PendingLink'

export function Rail() {
  return (
    <header className="rail">
      <a className="rail__name" href="#top">Josue Escobar</a>
      <ul className="rail__links">
        <li>
          <PendingLink label="CV"><Icon name="cv" className="icon" /><span className="label">CV</span></PendingLink>
        </li>
        <li>
          <PendingLink label="LinkedIn"><Icon name="linkedin" className="icon" /><span className="label">LinkedIn</span></PendingLink>
        </li>
        <li>
          <a href={GITHUB} aria-label="GitHub"><Icon name="github" className="icon" /><span className="label">GitHub</span></a>
        </li>
        <li>
          <a className="cta" href={`mailto:${EMAIL}`}><Icon name="mail" />Write to me</a>
        </li>
      </ul>
    </header>
  )
}
