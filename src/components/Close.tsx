import { CLOSE_LINE, EMAIL, GITHUB, LINKEDIN } from '../content'
import { Icon } from './Icon'
import { MailLink } from './MailLink'
import { Chars, Words } from './text'

export function Close() {
  return (
    <section className="close" id="contact" aria-labelledby="close-title" data-calm>
      <h2 className="display" id="close-title" data-split aria-label={CLOSE_LINE}><Words text={CLOSE_LINE} /></h2>
      <MailLink className="close__mail" data-mag="0.12" data-reveal>{EMAIL}</MailLink>
      <div className="cta-row" data-reveal>
        <MailLink className="btn spot" data-mag="0.3"><Icon name="mail" /><span className="lbl"><Chars text="Write to me" /></span></MailLink>
        <a className="btn btn--ghost spot" href={GITHUB} data-mag="0.3"><Icon name="github" /><span className="lbl"><Chars text="GitHub" /></span></a>
        <a className="btn btn--ghost spot" href={LINKEDIN} data-mag="0.3"><Icon name="linkedin" /><span className="lbl"><Chars text="LinkedIn" /></span></a>
      </div>
    </section>
  )
}
