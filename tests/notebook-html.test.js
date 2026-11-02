import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { sanitizeHtml } from '../src/lib/notebook-html.js'
globalThis.document=new JSDOM('').window.document

test('removes active content inside wrappers that are unwrapped',()=>{
  for(const input of [
    '<div><span><img src=x onerror="alert(1)"><b onclick="alert(1)">texto</b></span></div>',
    '<div><a><span><iframe srcdoc="bad"></iframe><u onmouseover="bad()">texto</u></span></a></div>',
    '<div><span style="background:red"><svg onload="bad()"></svg>texto</span></div>'
  ]){
    const clean=sanitizeHtml(input)
    assert.doesNotMatch(clean, /onerror|onclick|onmouseover|onload|iframe|svg|img|srcdoc/i)
    assert.match(clean,/texto/)
    assert.equal(sanitizeHtml(clean),clean)
  }
})
test('preserves formatting and discards attributes and executable subtrees',()=>{
  assert.equal(sanitizeHtml('<p class="x"><strong>Fé</strong><br><em>vida</em></p>'),'<p><strong>Fé</strong><br><em>vida</em></p>')
  assert.equal(sanitizeHtml('<div><script>alert(1)</script><style>bad</style><span style="background-color:gold">luz</span></div>'),'<div><mark>luz</mark></div>')
})
