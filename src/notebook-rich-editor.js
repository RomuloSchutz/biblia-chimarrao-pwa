const EDITOR_ID='notebook-rich-editor'

const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))

function sanitizeHtml(value){
  const template=document.createElement('template')
  template.innerHTML=String(value||'')
  const allowed=new Set(['B','STRONG','I','EM','U','MARK','UL','OL','LI','BR','P','DIV','SPAN'])
  const walk=node=>{
    ;[...node.childNodes].forEach(child=>{
      if(child.nodeType!==Node.ELEMENT_NODE)return
      if(!allowed.has(child.tagName)){child.replaceWith(...child.childNodes);return}
      if(child.tagName==='SPAN'){
        const highlighted=/background(?:-color)?\s*:/i.test(child.getAttribute('style')||'')
        if(highlighted){const mark=document.createElement('mark');mark.append(...child.childNodes);child.replaceWith(mark);walk(mark);return}
        child.replaceWith(...child.childNodes);return
      }
      ;[...child.attributes].forEach(attr=>child.removeAttribute(attr.name))
      walk(child)
    })
  }
  walk(template.content)
  return template.innerHTML
}

function legacyToHtml(value){
  const text=String(value||'')
  if(/<\/?(?:strong|b|em|i|u|mark|ul|ol|li|p|div|br|span)\b/i.test(text))return sanitizeHtml(text)
  return text.split('\n').map(line=>{
    let html=escapeHtml(line)
    html=html.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/==(.+?)==/g,'<mark>$1</mark>')
      .replace(/__(.+?)__/g,'<u>$1</u>')
      .replace(/\*([^*]+?)\*/g,'<em>$1</em>')
    if(/^[-•]\s+/.test(line))return '<div>• '+html.replace(/^[-•]\s+/,'')+'</div>'
    return '<div>'+html+'</div>'
  }).join('')
}

function setReactTextareaValue(textarea,value){
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set
  if(setter)setter.call(textarea,value);else textarea.value=value
  textarea.dispatchEvent(new Event('input',{bubbles:true}))
}

function installEditor(){
  const textarea=document.getElementById('notebook-body-editor')
  if(!textarea)return
  let editor=document.getElementById(EDITOR_ID)
  if(!editor){
    editor=document.createElement('div')
    editor.id=EDITOR_ID
    editor.className='notebook-rich-editor'
    editor.contentEditable='true'
    editor.setAttribute('role','textbox')
    editor.setAttribute('aria-multiline','true')
    editor.dataset.source=textarea.value
    editor.innerHTML=legacyToHtml(textarea.value)
    textarea.insertAdjacentElement('beforebegin',editor)
    textarea.classList.add('notebook-source-hidden')
    editor.addEventListener('input',()=>{
      const clean=sanitizeHtml(editor.innerHTML)
      editor.dataset.source=clean
      setReactTextareaValue(textarea,clean)
    })
  }else if(document.activeElement!==editor&&editor.dataset.source!==textarea.value){
    editor.dataset.source=textarea.value
    editor.innerHTML=legacyToHtml(textarea.value)
  }

  document.querySelectorAll('.notebook-page p').forEach(p=>{
    const raw=p.textContent||''
    if(p.dataset.richRendered===raw)return
    p.innerHTML=legacyToHtml(raw)
    p.dataset.richRendered=raw
  })
}

const commandFor=button=>({'Negrito':'bold','Itálico':'italic','Sublinhar':'underline','Lista':'insertUnorderedList','Desfazer':'undo','Refazer':'redo'})[button?.getAttribute('title')||'']||null

document.addEventListener('pointerdown',event=>{
  const button=event.target.closest?.('.notebook-toolbar button')
  if(button)event.preventDefault()
},true)

document.addEventListener('click',event=>{
  const button=event.target.closest?.('.notebook-toolbar button')
  if(!button)return
  const editor=document.getElementById(EDITOR_ID),textarea=document.getElementById('notebook-body-editor')
  if(!editor||!textarea)return
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()
  editor.focus({preventScroll:true})
  const title=button.getAttribute('title')||''
  if(title==='Destacar')document.execCommand('hiliteColor',false,'#e3b341')||document.execCommand('backColor',false,'#e3b341')
  else{const command=commandFor(button);if(command)document.execCommand(command,false,null)}
  const clean=sanitizeHtml(editor.innerHTML)
  editor.innerHTML=clean;editor.dataset.source=clean
  setReactTextareaValue(textarea,clean)
},true)

function installStyles(){
  if(document.getElementById('notebook-rich-editor-styles'))return
  const style=document.createElement('style');style.id='notebook-rich-editor-styles'
  style.textContent=`.notebook-source-hidden{display:none!important}.notebook-rich-editor{min-height:22rem;width:100%;box-sizing:border-box;border:1px solid rgba(230,196,135,.55);border-radius:4px;background:#3f3f3f;color:#fff;padding:1rem 1.15rem;font:inherit;line-height:1.65;overflow-wrap:anywhere;outline:none}.notebook-rich-editor:focus{border-color:#d5a24b;box-shadow:0 0 0 2px rgba(213,162,75,.12)}.notebook-rich-editor mark,.notebook-page mark{background:#e3b341;color:#20180b;padding:0 .08em}.notebook-rich-editor ul,.notebook-rich-editor ol,.notebook-page ul,.notebook-page ol{padding-left:1.6rem}.notebook-page p>div{margin:.25rem 0}`
  document.head.appendChild(style)
}

installStyles();installEditor()
window.setInterval(()=>{if(document.getElementById('notebook-body-editor'))installEditor()},350)