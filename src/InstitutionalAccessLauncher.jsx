import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'

const panelStyle={width:'min(880px,calc(100% - 24px))',margin:'18px auto 34px',padding:'14px',display:'grid',gridTemplateColumns:'1fr',gap:'10px',border:'1px solid rgba(185,139,63,.55)',borderRadius:'18px',background:'rgba(7,28,23,.96)',boxShadow:'0 10px 28px rgba(0,0,0,.18)'}
const buttonStyle={width:'100%',margin:0,border:'1px solid #8d5a2b',background:'#1b0d05',color:'#f5e7d6',borderRadius:'14px',padding:'13px 16px',fontWeight:700,fontSize:'15px',boxShadow:'none',cursor:'pointer',textAlign:'left'}
const adminButtonStyle={...buttonStyle,background:'#3d1a08',borderColor:'#c4874a'}

export default function InstitutionalAccessLauncher(){
  const [user,setUser]=useState(null)
  const [isAdmin,setIsAdmin]=useState(false)

  useEffect(()=>{
    if(!supabaseConfigured||!supabase)return
    let cancelled=false
    const resolve=async(sessionUser)=>{
      if(cancelled)return
      setUser(sessionUser||null)
      if(!sessionUser){setIsAdmin(false);return}
      const {data,error}=await supabase.rpc('is_app_admin')
      if(!cancelled)setIsAdmin(!error&&data===true)
    }
    supabase.auth.getSession().then(({data})=>resolve(data.session?.user||null))
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>resolve(session?.user||null))
    return()=>{cancelled=true;listener.subscription.unsubscribe()}
  },[])

  if(!user)return null

  const go=(key)=>{
    const url=new URL(window.location.href)
    url.search=''
    url.searchParams.set(key,'1')
    window.location.href=url.toString()
  }

  return <section style={panelStyle} aria-label="Acessos institucionais">
    {isAdmin&&<button type="button" style={adminButtonStyle} onClick={()=>go('institutional-admin')}>🏢 Acessos institucionais <span style={{display:'block',fontSize:'12px',fontWeight:500,opacity:.8,marginTop:'3px'}}>Gerencie empresas, lotes e ativações</span></button>}
    <button type="button" style={buttonStyle} onClick={()=>go('institutional-redeem')}>🎟 Tenho um código institucional <span style={{display:'block',fontSize:'12px',fontWeight:500,opacity:.8,marginTop:'3px'}}>Use o código recebido da sua instituição</span></button>
  </section>
}
