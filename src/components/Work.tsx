import { PROJECTS, type Project } from '../content'
import { Icon } from './Icon'

function ProjectPanel({ project }: { project: Project }) {
  return (
    <article className="project" data-area={project.area}>
      <div>
        <h3 className="project__title display">{project.title}</h3>
        <p className="project__desc">{project.desc}</p>
        <dl className="spec">
          {project.spec.map(([term, detail]) => (
            <div key={term} className="spec__row">
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
        <div className="links">
          {project.links.map((l) => (
            <a key={l.href} className="link" href={l.href}>{l.label} <Icon name="arrow" /></a>
          ))}
          {project.pending && <span className="pending">{project.pending}</span>}
        </div>
      </div>

      {project.shots && (
        <div className="shots">
          {project.shots.map((s) => (
            <figure key={s.src}>
              <img src={s.src} alt={s.alt} loading="lazy" width={780} height={1688} />
            </figure>
          ))}
        </div>
      )}

      {project.parts && (
        <ul className="tree" aria-label={`What ships in ${project.title}`}>
          {project.parts.map((p) => (
            <li key={p.name}><strong>{p.name}</strong><code>{p.version}</code><span>{p.desc}</span></li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function Work() {
  return (
    <section className="section" id="work" aria-labelledby="work-title">
      <div className="section__head">
        <h2 className="section__title display" id="work-title">Work</h2>
        <p className="section__note">Each project carries its proof: code you can read and screens from the real thing.</p>
      </div>
      <div className="work">
        {PROJECTS.map((p) => <ProjectPanel key={p.id} project={p} />)}
      </div>
    </section>
  )
}
