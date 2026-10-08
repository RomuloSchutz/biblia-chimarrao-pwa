from pathlib import Path

path=Path('src/App.jsx')
text=path.read_text(encoding='utf-8')

cristo="      {title:'Cristo: O Marco Entre o Antes e o Depois',productCode:'ebook_cristo_marco',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo',kind:'História · Calendário · Fé',cover:'cristo',image:'/Cristo_O_Marco_Entre_O_Antes_E_O_Depois_CAPA_EBOOK.png',status:'EPUB disponível no aplicativo',group:'publicados',action:'Ler EPUB'},"
pre="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',kind:'Religioso · Filosófico · Político · Econômico',cover:'sistemas',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO · EM BREVE',group:'projetos',action:'Em breve'},"
if pre not in text:
    text=text.replace(cristo,cristo+'\n'+pre,1)

old="      {title:'Entre os Sistemas I',sub:'Religioso, Filosófico, Político e Econômico: Cristo, o Libertador',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},"
new="      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',meta:'Religioso · Filosófico · Político · Econômico',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},"
text=text.replace(old,new)

path.write_text(text,encoding='utf-8')
