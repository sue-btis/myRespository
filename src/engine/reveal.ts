/** Adds `.in` to [data-reveal] and [data-split] elements the first time they scroll into view. */
export function initReveals(onReady: () => void): () => void {
  let cancelled = false
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue
      en.target.classList.add('in')
      io.unobserve(en.target)
    }
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' })

  // Headline words depend on the final font metrics, so wait for fonts (capped) before observing.
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 700))]).then(() => {
    if (cancelled) return
    onReady()
    document.querySelectorAll('[data-reveal], [data-split]').forEach((el) => io.observe(el))
  })

  return () => {
    cancelled = true
    io.disconnect()
  }
}
