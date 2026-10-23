import { CLOSE_LINE, EMAIL, GITHUB, LINKEDIN } from '../content'
import { Icon } from './Icon'
import { PendingLink } from './PendingLink'
import { Roll, Words } from './text'

export function Close() {
  return (
    <section className="close" id="contact" aria-labelledby="close-title" data-calm>
      <h2 className="display" id="close-title" data-split aria-label={CLOSE_LINE}><Words text={CLOSE_LINE} /></h2>
      <a className="close__mail" href={`mailto:${EMAIL}`} data-mag="0.12" data-reveal>{EMAIL}</a>
      <div className="cta-row" data-reveal>
        <a className="btn spot" href={`mailto:${EMAIL}`} data-mag="0.3"><Icon name="mail" /><Roll text="Write to me" /></a>
        <a className="btn btn--ghost spot" href={GITHUB} data-mag="0.3"><Icon name="github" /><Roll text="GitHub" /></a>
        <PendingLink label="CV"><span aria-hidden="true">CV</span></PendingLink>
        <a className="btn btn--ghost spot" href={LINKEDIN} data-mag="0.3"><Icon name="linkedin" /><Roll text="LinkedIn" /></a>
      </div>
    </section>
  )
}
