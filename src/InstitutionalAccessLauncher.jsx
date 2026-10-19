import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import { getInstitutionalManagerContext } from './lib/institutional-licensing.js'

const panelStyle={width:'min(880px,calc(100% - 24px))',margin:'18px auto 34px',padding:'14px',display:'grid',gridTemplateColumns:'1fr',gap:'10px',border:'1px solid rgba(185,139,63,.55)',borderRadius:'18px',background:'rgba(7,28,23,.96)',boxShadow:'0 10px 28px rgba(0,0,0,.18)'}
const buttonStyle={width:'100%',margin:0,border:'1px solid #8d5a2b',background:'#1b0d05',color:'#f5e7d6',borderRadius:'14px',padding:'13px 16px',fontWeight:700,fontSize:'15px',boxShadow:'none',cursor:'pointer',textAlign:'left'}
const adminButtonStyle={...buttonStyle,background:'#3d1a08',borderColor:'#c4874a'}
const managerButtonStyle={...buttonStyle,background:'#123c31',borderColor:'#b98b3f'}

export default function InstitutionalAccessLauncher(){
  const [user,setUser]=useState(null)
  const [isAdmin,setIsAdmin]=useState(false)
  const [managerContext,setManagerContext]=useState(null)

  useEffect(()=>{
    if(!supabaseConfigured||!supabase)return
    let cancelled=false
    const resolve=async(sessionUser)=>{
      if(cancelled)return
      setUser(sessionUser||null);setIsAdmin(false);setManagerContext(null)
      if(!sessionUser)return
      const {data:admin,error:adminError}=await supabase.rpc('is_app_admin')
      if(cancelled)return
      if(!adminError&&admin===true){setIsAdmin(true);return}
      const {data,error}=await getInstitutionalManagerContext(supabase)
      if(!cancelled&&!error&&Array.isArray(data)&&data[0]?.manager_status==='active'&&data[0]?.institution_status==='active')setManagerContext(data[0])
    }
    supabase.auth.getSession().then(({data})=>resolve(data.session?.user||null))
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>resolve(session?.user||null))
    return()=>{cancelled=true;listener.subscription.unsubscribe()}
  },[])

  useEffect(()=>{
    if(!user)return
    const params=new URLSearchParams(window.location.search)
    if(params.get('app-return')!=='dashboard')return
    params.delete('app-return')
    const clean=window.location.pathname+(params.toString()?`?${params.toString()}`:'')+window.location.hash
    window.history.replaceState({},document.title,clean)
    let attempts=0
    const openDashboard=()=>{
      const button=document.querySelector('.guest-landing-actions .guest-round-action')
      if(button){button.click();return}
      if(attempts++<20)window.setTimeout(openDashboard,50)
    }
    openDashboard()
  },[user?.id])

  if(!user)return null

  const go=(key)=>{
    const url=new URL(window.location.href)
    url.search=''
    url.searchParams.set(key,'1')
    window.location.href=url.toString()
  }

  return <section style={panelStyle} aria-label="Acessos institucionais">
    {isAdmin&&<button type="button" style={adminButtonStyle} onClick={()=>go('institutional-admin')}>🏢 Acessos institucionais <span style={{display:'block',fontSize:'12px',fontWeight:500,opacity:.8,marginTop:'3px'}}>Gerencie empresas, lotes e ativações</span></button>}
    {!isAdmin&&managerContext&&<button type="button" style={managerButtonStyle} onClick={()=>go('institutional-admin')}>🏢 Painel da instituição <span style={{display:'block',fontSize:'12px',fontWeight:500,opacity:.8,marginTop:'3px'}}>Administrar {managerContext.institution_name||'minha instituição'}</span></button>}
    <button type="button" style={buttonStyle} onClick={()=>go('institutional-redeem')}>🎟 Tenho um código institucional <span style={{display:'block',fontSize:'12px',fontWeight:500,opacity:.8,marginTop:'3px'}}>Use o código recebido da sua instituição</span></button>
  </section>
}
