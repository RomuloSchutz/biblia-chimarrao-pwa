import { supabase,supabaseConfigured } from './lib/supabase.js'

if(supabaseConfigured&&supabase){
  const originalSignIn=supabase.auth.signInWithPassword.bind(supabase.auth)
  supabase.auth.signInWithPassword=async credentials=>{
    const result=await originalSignIn(credentials)
    if(!result.error&&result.data?.session){
      // Keep the login that just succeeded and revoke refresh tokens for all other devices.
      await supabase.auth.signOut({scope:'others'})
    }
    return result
  }

  let checking=false
  async function validateCurrentSession(){
    if(checking||document.visibilityState==='hidden')return
    checking=true
    try{
      const {data:sessionData}=await supabase.auth.getSession()
      if(!sessionData?.session)return
      const {data,error}=await supabase.rpc('is_current_auth_session')
      if(!error&&data===false){
        await supabase.auth.signOut({scope:'local'}).catch(()=>{})
        window.alert('Sua conta foi acessada em outro dispositivo. Entre novamente para continuar.')
        window.location.replace(window.location.origin+window.location.pathname)
      }
    }finally{checking=false}
  }

  // The old device is removed on its next interaction/return to the app.
  window.setInterval(validateCurrentSession,30000)
  window.addEventListener('focus',validateCurrentSession)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')validateCurrentSession()})
}
