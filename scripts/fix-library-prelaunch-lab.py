from pathlib import Path

path=Path('src/App.jsx')
text=path.read_text(encoding='utf-8')

cristo="      {title:'Cristo: O Marco Entre o Antes e o Depois',productCode:'ebook_cristo_marco',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo',kind:'História · Calendário · Fé',cover:'cristo',image:'/Cristo_O_Marco_Entre_O_Antes_E_O_Depois_CAPA_EBOOK.png',status:'EPUB disponível no aplicativo',group:'publicados',action:'Ler EPUB'},"
pre_jpg="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',kind:'Religioso · Filosófico · Político · Econômico',cover:'sistemas',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO · EM BREVE',group:'projetos',action:'Em breve'},"
pre_png="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',kind:'Religioso · Filosófico · Político · Econômico',cover:'sistemas',image:'/entre-sistemas-v1-cover.png?v=20261009',status:'PRÉ-LANÇAMENTO · EM BREVE',group:'projetos',action:'Em breve'},"

text=text.replace("image:'/entre-sistemas-v1-cover.png'","image:'/entre-sistemas-v1-cover.png?v=20261009'")
text=text.replace(pre_jpg,pre_png)
if pre_png not in text:
    text=text.replace(cristo,cristo+'\n'+pre_png,1)

old="      {title:'Entre os Sistemas I',sub:'Religioso, Filosófico, Político e Econômico: Cristo, o Libertador',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},"
new="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',meta:'Religioso · Filosófico · Político · Econômico',image:'/entre-sistemas-v1-cover.png?v=20261009',status:'PRÉ-LANÇAMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},"
text=text.replace(old,new)

editorial_anchor="""    const editorial={
      'Cristo: O Marco Entre o Antes e o Depois':{
"""
editorial_entry="""    const editorial={
      'Entre os Sistemas — Volume 1':{
        section:'Quando os sistemas se tornam prisões',
        image:'/entre-sistemas-por-tras-da-obra.png?v=20261009',
        cover:'A capa de Entre os Sistemas — Volume 1: Cristo, o Libertador reúne símbolos dos grandes sistemas que atravessam a história humana. As ruínas e construções representam civilizações e estruturas de poder; os livros apontam para a religião, a filosofia, a política e a economia; as moedas, a coroa e as correntes simbolizam riqueza, autoridade e também os sistemas que podem aprisionar o ser humano. No centro, porém, está a cruz iluminada: Cristo não aparece como mais um sistema entre tantos outros, mas como aquele que rompe as correntes e oferece uma liberdade que nenhum sistema humano consegue produzir.',
        special:'Religião, filosofia, política e economia fazem parte da construção das sociedades e podem contribuir para organizar a vida humana. O perigo surge quando aquilo que deveria servir ao homem passa a dominá-lo. Crenças podem transformar-se em controle; ideias, em ideologias; poder, em opressão; riqueza, em medida do valor humano. Entre os Sistemas convida o leitor a reconhecer essas estruturas, compreender sua influência e perguntar onde está depositando sua liberdade. O centro da obra é o contraste: sistemas humanos prometem segurança, ordem e sentido, mas nenhum deles pode ocupar o lugar de Cristo. A verdadeira libertação começa quando as correntes — inclusive as que aprendemos a chamar de normais — são reconhecidas e confrontadas.'
      },
      'Cristo: O Marco Entre o Antes e o Depois':{
"""
if "'Entre os Sistemas — Volume 1':{\n        section:'Quando os sistemas se tornam prisões'" not in text and editorial_anchor in text:
    text=text.replace(editorial_anchor,editorial_entry,1)

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
