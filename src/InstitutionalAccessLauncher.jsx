import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'

const panelStyle={position:'fixed',right:'14px',bottom:'14px',zIndex:9997,display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end',maxWidth:'calc(100vw - 28px)'}
const buttonStyle={border:'1px solid #8d5a2b',background:'#1b0d05',color:'#f5e7d6',borderRadius:'999px',padding:'10px 14px',fontWeight:700,fontSize:'14px',boxShadow:'0 8px 24px rgba(0,0,0,.28)',cursor:'pointer'}
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

  return <div style={panelStyle} aria-label="Acessos institucionais">
    {isAdmin&&<button type="button" style={adminButtonStyle} onClick={()=>go('institutional-admin')}>🏢 Acessos institucionais</button>}
    <button type="button" style={buttonStyle} onClick={()=>go('institutional-redeem')}>🎟 Tenho um código institucional</button>
  </div>
}
