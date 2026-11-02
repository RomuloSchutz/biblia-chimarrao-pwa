// Rebuild allowed HTML instead of promoting unvisited descendants into the page.
export function sanitizeHtml(value) {
  const template = document.createElement('template')
  template.innerHTML = String(value || '')
  const allowed = new Set(['B','STRONG','I','EM','U','MARK','UL','OL','LI','BR','P','DIV'])
  const drop = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','TEMPLATE'])
  function clean(source, target) {
    for (const child of source.childNodes) {
      if (child.nodeType === 3) {
        target.append(document.createTextNode(child.textContent))
        continue
      }
      if (child.nodeType !== 1 || drop.has(child.tagName)) continue
      let tag = child.tagName
      if (tag === 'SPAN' && /background(?:-color)?\s*:/i.test(child.getAttribute('style') || '')) tag = 'MARK'
      if (allowed.has(tag)) {
        const safe = document.createElement(tag.toLowerCase())
        clean(child, safe)
        target.append(safe)
      } else {
        clean(child, target)
      }
    }
  }
  const result = document.createElement('div')
  clean(template.content, result)
  return result.innerHTML
}
