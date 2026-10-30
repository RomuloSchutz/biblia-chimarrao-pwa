import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'

export default function ReaderSettingsRoute(){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [appearance,setAppearance]=useState(()=>localStorage.getItem('bc-appearance')||'system')
  const [currentPassword,setCurrentPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [visible,setVisible]=useState({current:false,next:false,confirm:false})
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    if(!supabaseConfigured||!supabase){setLoading(false);return}
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active){setUser(data.session?.user||null);setLoading(false)}})
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setUser(session?.user||null)})
    return()=>{active=false;listener.subscription.unsubscribe()}
  },[])

  useEffect(()=>{
    localStorage.setItem('bc-appearance',appearance)
    const media=window.matchMedia('(prefers-color-scheme: dark)')
    const apply=()=>{document.documentElement.dataset.appearance=appearance==='system'?(media.matches?'dark':'light'):appearance}
    apply();media.addEventListener?.('change',apply)
    return()=>media.removeEventListener?.('change',apply)
  },[appearance])

  const back=()=>{window.location.href=window.location.pathname+'?app-return=dashboard'}

  async function savePassword(e){
    e.preventDefault();setMessage('')
    if(!user||!supabase)return
    if(!currentPassword){setMessage('Digite sua senha atual para confirmar sua identidade.');return}
    if(newPassword.length<8){setMessage('A nova senha precisa ter pelo menos 8 caracteres.');return}
    if(newPassword!==confirmPassword){setMessage('As senhas não coincidem.');return}
    setBusy(true)
    try{
      const {error:authError}=await supabase.auth.signInWithPassword({email:user.email,password:currentPassword})
      if(authError){setMessage('Não foi possível confirmar sua senha atual. Confira a senha e tente novamente.');return}
      const {error}=await supabase.auth.updateUser({password:newPassword})
      if(error){setMessage('Não foi possível trocar a senha: '+error.message);return}
      setCurrentPassword('');setNewPassword('');setConfirmPassword('');setMessage('✓ Sua senha foi atualizada com sucesso.')
    }catch{setMessage('Não foi possível concluir a alteração. Tente novamente.')}
    finally{setBusy(false)}
  }

  async function savePhoto(e){
    const file=e.target.files?.[0];e.target.value=''
    if(!file||!user||!supabase)return
    if(!file.type.startsWith('image/')||file.size>8*1024*1024){setMessage('Escolha uma foto de até 8 MB.');return}
    setBusy(true);setMessage('')
    try{
      const img=await createImageBitmap(file),canvas=document.createElement('canvas')
      canvas.width=192;canvas.height=192
      const ctx=canvas.getContext('2d'),side=Math.min(img.width,img.height)
      ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,192,192);img.close?.()
      const {data,error}=await supabase.auth.updateUser({data:{avatar_data_url:canvas.toDataURL('image/jpeg',.72)}})
      if(error)throw error
      setUser(data.user);setMessage('✓ Foto atualizada com sucesso.')
    }catch(error){setMessage(error?.message||'Erro ao salvar a foto.')}
    finally{setBusy(false)}
  }

  if(loading)return <main className="dashboard"><p className="encounter-save-status">Carregando configurações...</p></main>
  if(!user)return <main className="app"><section className="auth-card"><h2>Sessão encerrada</h2><p>Entre novamente para acessar suas configurações.</p><button onClick={()=>{window.location.href=window.location.pathname}}>Voltar ao aplicativo</button></section></main>

  const initial=(user.user_metadata?.full_name||user.email||'L').charAt(0).toUpperCase()
  const Eye=({open})=><svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{!open&&<path d="M3 3l18 18"/>}</svg>

  return <main className="dashboard reader-settings-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Configurações da conta</small></div><button className="logout" onClick={back}>← Menu</button></header>
    <section className="reader-settings"><h1>Configurações</h1><p>Personalize seu espaço de leitura.</p>
      <div className="reader-settings-panel"><h2>Aparência</h2><p>Escolha o tema do aplicativo.</p><div className="reader-appearance">
        <button aria-pressed={appearance==='light'} className={appearance==='light'?'selected':''} onClick={()=>setAppearance('light')}>☀ Claro</button>
        <button aria-pressed={appearance==='dark'} className={appearance==='dark'?'selected':''} onClick={()=>setAppearance('dark')}>☾ Escuro</button>
        <button aria-pressed={appearance==='system'} className={appearance==='system'?'selected':''} onClick={()=>setAppearance('system')}>◐ Do sistema</button>
      </div></div>
      <div className="reader-settings-panel"><h2>Minha conta</h2><label className="reader-setting-label">E-mail<input type="email" readOnly value={user.email||''}/></label>
        <h3>Foto do leitor</h3><div className="reader-photo-row"><span className="reader-avatar reader-avatar-large">{user.user_metadata?.avatar_data_url?<img src={user.user_metadata.avatar_data_url} alt="Sua foto"/>:<span>{initial}</span>}</span><label className="reader-photo-upload">Inserir ou trocar foto<input type="file" accept="image/*" onChange={savePhoto} disabled={busy}/></label></div>
        <h3>Trocar senha</h3><form className="reader-password-form" onSubmit={savePassword}><p>Para sua segurança, confirme a senha atual antes de alterá-la.</p>
          {[['current','Senha atual',currentPassword,setCurrentPassword,'current-password'],['next','Nova senha',newPassword,setNewPassword,'new-password'],['confirm','Confirmar senha',confirmPassword,setConfirmPassword,'new-password']].map(([key,label,value,setValue,auto])=><label key={key}>{label}<span className="reader-password-field"><input type={visible[key]?'text':'password'} minLength={key==='current'?undefined:8} autoComplete={auto} value={value} onChange={e=>setValue(e.target.value)} required/><button className="reader-password-eye" type="button" aria-label={visible[key]?'Ocultar senha':'Mostrar senha'} onClick={()=>setVisible(v=>({...v,[key]:!v[key]}))}><Eye open={visible[key]}/></button></span></label>)}
          <button disabled={busy}>Salvar nova senha</button></form>{message&&<p role="status" className="reader-settings-status">{message}</p>}</div>
      <div className="reader-settings-panel"><h2>Sobre o aplicativo</h2><p>Bíblia + Chimarrão</p><p>Configurações da conta e leitura.</p></div>
    </section>
  </main>
}
