from pathlib import Path
import subprocess

BRANCH='lab-commercial-prices-2026-10-07'
APP=Path('src/App.jsx')
branch=subprocess.check_output(['git','branch','--show-current'],text=True).strip()
if branch!=BRANCH: raise SystemExit(f'ABORTADO: branch {branch!r}; esperado {BRANCH!r}')
s=APP.read_text(encoding='utf-8')

old="body:JSON.stringify(isAdmin?{edition_id:access.edition_id,access_token:session.access_token}:{edition_id:access.edition_id})"
new="body:JSON.stringify(isAdmin?{edition_id:access.edition_id,access_token:session.access_token,download}:{edition_id:access.edition_id,download})"
if s.count(old)!=1: raise SystemExit(f'ABORTADO: chamada protegida apareceu {s.count(old)} vez(es)')
s=s.replace(old,new,1)

old2="if(!response.ok||!data?.signed_url){setBookAccessMessage('Não foi possível abrir o arquivo protegido: '+(data?.error||('erro '+response.status+' ao gerar acesso temporário.')));return null}"
new2="if(!response.ok||!data?.signed_url){if(download&&response.status===403&&data?.download_available_at){const when=new Date(data.download_available_at);setBookAccessMessage('Download protegido: disponível a partir de '+when.toLocaleDateString('pt-BR')+' às '+when.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'. A leitura no aplicativo continua liberada.');return null}setBookAccessMessage('Não foi possível abrir o arquivo protegido: '+(data?.error||('erro '+response.status+' ao gerar acesso temporário.')));return null}"
if s.count(old2)!=1: raise SystemExit(f'ABORTADO: tratamento de erro apareceu {s.count(old2)} vez(es)')
s=s.replace(old2,new2,1)

APP.write_text(s,encoding='utf-8')
print('OK: download=true agora chega à Edge Function.')
print('OK: leitura permanece imediata; download comprado respeita download_available_at/7 dias no servidor.')
print('OK: tentativa antecipada mostra ao leitor a data/hora de liberação.')
