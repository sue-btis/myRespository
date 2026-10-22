import { EMAIL, GITHUB } from '../content'
import { PendingLink } from './PendingLink'

export function Close() {
  return (
    <section className="close" id="contact" aria-labelledby="close-title">
      <h2 className="close__line display" id="close-title">Have something that needs building?</h2>
      <a className="close__mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <div className="close__links">
        <PendingLink label="CV">CV</PendingLink>
        <PendingLink label="LinkedIn">LinkedIn</PendingLink>
        <a href={GITHUB}>GitHub</a>
      </div>
    </section>
  )
}
