from pathlib import Path

path=Path('src/App.jsx')
text=path.read_text(encoding='utf-8')

cristo="      {title:'Cristo: O Marco Entre o Antes e o Depois',productCode:'ebook_cristo_marco',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo',kind:'História · Calendário · Fé',cover:'cristo',image:'/Cristo_O_Marco_Entre_O_Antes_E_O_Depois_CAPA_EBOOK.png',status:'EPUB disponível no aplicativo',group:'publicados',action:'Ler EPUB'},"
pre_jpg="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',kind:'Religioso · Filosófico · Político · Econômico',cover:'sistemas',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO · EM BREVE',group:'projetos',action:'Em breve'},"
pre_png="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',kind:'Religioso · Filosófico · Político · Econômico',cover:'sistemas',image:'/entre-sistemas-v1-cover.png?v=20261009',status:'PRÉ-LANÇAMENTO · EM BREVE',group:'projetos',action:'Em breve'},"

# Normaliza a entrada da biblioteca para uma única versão, com cache-busting da capa.
text=text.replace("image:'/entre-sistemas-v1-cover.png'","image:'/entre-sistemas-v1-cover.png?v=20261009'")
text=text.replace(pre_jpg,pre_png)
if pre_png not in text:
    text=text.replace(cristo,cristo+'\n'+pre_png,1)

old="      {title:'Entre os Sistemas I',sub:'Religioso, Filosófico, Político e Econômico: Cristo, o Libertador',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},"
new="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',meta:'Religioso · Filosófico · Político · Econômico',image:'/entre-sistemas-v1-cover.png?v=20261009',status:'PRÉ-LANÇAMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},"
text=text.replace(old,new)

# O catálogo comercial não pode depender de uma única tentativa durante a abertura do PWA.
old_catalog="""  const [commercialCatalog,setCommercialCatalog]=useState({})
  useEffect(()=>{
    let active=true
    fetchCommercialCatalog().then(({products,error})=>{
      if(!active || error) return
      const byCode=Object.fromEntries(products.map(product=>[product.code,product]))
      setCommercialCatalog(byCode)
    })
    return ()=>{active=false}
  },[])
"""
new_catalog="""  const [commercialCatalog,setCommercialCatalog]=useState({})
  useEffect(()=>{
    let active=true
    let retryTimer=null
    const loadCatalog=async(attempt=0)=>{
      const {products,error}=await fetchCommercialCatalog()
      if(!active)return
      if(!error && products?.length){
        setCommercialCatalog(Object.fromEntries(products.map(product=>[product.code,product])))
        return
      }
      if(attempt<3)retryTimer=setTimeout(()=>loadCatalog(attempt+1),1200*(attempt+1))
    }
    loadCatalog()
    return ()=>{active=false;if(retryTimer)clearTimeout(retryTimer)}
  },[])
"""
if old_catalog in text:
    text=text.replace(old_catalog,new_catalog,1)

path.write_text(text,encoding='utf-8')
