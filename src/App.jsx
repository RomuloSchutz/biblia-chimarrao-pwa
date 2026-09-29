const PIX_COPIA_COLA='00020126480014br.gov.bcb.pix0126biblia.chimarrao@gmail.com5204000053039865802BR5913Romulo Schutz6009Sao Paulo62230519daqr238603757697802630439FC';
const PIX_QR_ROWS='1fc4d7006a17f,10413dfac9741,175152f75a35d,175eea902d25d,1757207ee885d,10529ac50cc41,1fd555555557f,1898c664f00,17c45d7e7bc7c,7b90ab28bb9c,ec0185e0c32f,1393a6ad92278,1a4ad454afcee,11a6df485886a,13f979d3356bd,ab35b5e85e59,197de5bd3fbe1,8af56a3944ea,10e16afd7b8bb,1b05512f562fb,13744ad4af1c5,fa5f4ccf12c9,3f98ffc0fff5,1713984654312,195b91d68f15c,31e564663b10,1dfc407e7d7f9,5938b935800b,87eea904bfad,39668a2d999a,2d14e02e76d9,1b210cec694f0,94087a2c3f50,a896cd06892a,1f436682c1c7b,e2b6851621bb,1b5a778827255,a95adf46302d,8fad4421ffea,e13073e58891,1c7e79fe67ffd,1e66c633b10,1fcb95d67e553,105ab4c57a513,175e70fc693fc,17598ba3fbbb2,175cd51935d49,1041933285bd5,1fd443993d30f'.split(',');
function ApoiePixQR(){return <svg className="apoie-qr" viewBox="0 0 57 57" role="img" aria-label="QR Code Pix de Romulo Schutz"><rect width="57" height="57" fill="white"/>{PIX_QR_ROWS.flatMap((row,y)=>Array.from({length:49},(_,x)=>((BigInt('0x'+row)>>BigInt(48-x))&1n)===1n?<rect key={y+'-'+x} x={x+4} y={y+4} width="1" height="1" fill="#111"/>:null).filter(Boolean))}</svg>}
const SOCIAL_LINKS = { facebook:"https://www.facebook.com/romuloschutz", instagram:"https://www.instagram.com/romuloschutz/", youtube:"https://www.youtube.com/@romuloschutz" } // Preencher apenas com os perfis oficiais confirmados.
import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import EpubReader from './EpubReader.jsx'

const menuItems = [
  ['📖','Chimarrão com Deus','365 Encontros com Deus'],
  ['🌅','Encontro de Hoje','Seu encontro de hoje'],
  ['🧭','Minha Caminhada','Registre, acompanhe e siga em frente'],
  ['💛','Meus Favoritos','Encontros que tocaram você'],
  ['📝','Minhas Anotações','Suas reflexões e passos'],
  ['📚','Meus Livros','Sua biblioteca particular'],
  ['📖','Livros do Romulo','Conheça todas as obras'],
  ['🪶','Sobre o Autor','Conheça Romulo Schutz'],
  ['💡','Ideias e Reflexões','Palavras para levar consigo']
]

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [acceptedTerms,setAcceptedTerms]=useState(false)
  const [favoritePreview, setFavoritePreview] = useState(false)
  const [savedPreview, setSavedPreview] = useState(false)
  const [pensarNote, setPensarNote] = useState('')
  const [passoNote, setPassoNote] = useState('')
  const [encounterStatus, setEncounterStatus] = useState('')
  const [encounter, setEncounter] = useState(null)
  const [encounterLoading, setEncounterLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState(null)
  const [appearance,setAppearance]=useState(()=>localStorage.getItem('bc-appearance')||'system')
  const [currentPassword,setCurrentPassword]=useState('')
  const [visiblePasswords,setVisiblePasswords]=useState({current:false,next:false,confirm:false})
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [settingsMessage,setSettingsMessage]=useState('')
  const [settingsBusy,setSettingsBusy]=useState(false)
  const [monthDays, setMonthDays] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [devotionalLoading, setDevotionalLoading] = useState(false)
  const [journey, setJourney] = useState({completed:0,lastDay:0,lastTitle:'',favorites:0,notes:0})
  const [journeyLoading, setJourneyLoading] = useState(false)
  const [completedDays, setCompletedDays] = useState([])
  const [favoriteItems, setFavoriteItems] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [noteItems, setNoteItems] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [bookFilter, setBookFilter] = useState('todos')
  const [bookSearch, setBookSearch] = useState('')
  const [readerTitle, setReaderTitle] = useState('')
  const [reminderTime, setReminderTime] = useState('08:00')
  const [weeklySchedule, setWeeklySchedule] = useState(null)
  const WEEKDAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [reminderSaving, setReminderSaving] = useState(false)
  const [savedReminder, setSavedReminder] = useState(null)
  const [reminderClock, setReminderClock] = useState('')
  const [isAdmin,setIsAdmin]=useState(false)
  const [adminUsers,setAdminUsers]=useState([])
  const [adminLoading,setAdminLoading]=useState(false)
  const [adminMessage,setAdminMessage]=useState('')
  const [adminSearch,setAdminSearch]=useState('')

  useEffect(()=>{
    localStorage.setItem('bc-appearance',appearance)
    const media=window.matchMedia('(prefers-color-scheme: dark)')
    const apply=()=>{document.documentElement.dataset.appearance=appearance==='system'?(media.matches?'dark':'light'):appearance}
    apply()
    media.addEventListener?.('change',apply)
    return ()=>media.removeEventListener?.('change',apply)
  },[appearance])
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err =>
        console.info('Não foi possível registrar notificações do dispositivo:', err)
      )
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        // A capa oficial permanece como primeira tela, inclusive para leitores autenticados.
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(()=>{
    if(!user||!supabase){setIsAdmin(false);return}
    let cancelled=false
    supabase.rpc('is_app_admin').then(({data,error})=>{
      if(!cancelled) setIsAdmin(error ? false : data === true)
    })
    return()=>{cancelled=true}
  },[user?.id])

  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false
    Promise.all([
      supabase.from('reminder_preferences').select('enabled,local_time').eq('user_id',user.id).maybeSingle(),
      supabase.from('reminder_weekly_schedule').select('weekday,enabled,local_time').eq('user_id',user.id)
    ]).then(([preferences,weekly]) => {
      if (cancelled) return
      if (preferences.error || weekly.error) {
        setReminderMessage('Não foi possível carregar a programação dos lembretes.')
        return
      }
      const data = preferences.data
      const fallback = Array.from({length:7},(_,weekday)=>({weekday,enabled:true,time:weekday===0||weekday===6?'09:00':'07:00'}))
      const schedule = weekly.data?.length
        ? fallback.map(d=>{const found=weekly.data.find(item=>item.weekday===d.weekday);return found?{weekday:d.weekday,enabled:found.enabled,time:String(found.local_time).slice(0,5)}:d})
        : fallback
      setWeeklySchedule(schedule)
      if (data) {
        const time = String(data.local_time).slice(0,5)
        setReminderEnabled(data.enabled)
        setReminderTime(time)
        setSavedReminder({enabled:data.enabled,time,weekly:schedule})
      } else setSavedReminder(null)
    })
    return () => { cancelled = true }
  }, [user?.id])

  // Prévia local confiável: o navegador pode bloquear avisos do sistema,
  // por isso sempre exibimos também uma mensagem dentro do aplicativo.
  const [mateAlert, setMateAlert] = useState('')
  function showMateAlert() {
    const text = '🧉 Hora do Mate! Prepare seu chimarrão. Seu encontro com Deus está esperando.'
    setMateAlert(text)
    setReminderMessage(text)
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration =>
            registration.showNotification('Hora do Mate 🧉', {
              body: 'Prepare seu chimarrão. Seu encontro com Deus está esperando.',
              icon: '/image.png', badge: '/image.png', tag: 'hora-do-mate',
              data: { url: '/' }
            })
          ).catch(err => console.info('Notificação pelo service worker indisponível:', err))
        } else {
          new Notification('Hora do Mate 🧉', { body: 'Prepare seu chimarrão. Seu encontro com Deus está esperando.' })
        }
      }
    } catch (err) {
      // Alguns navegadores móveis não permitem Notification() diretamente.
      console.info('Aviso do sistema indisponível neste navegador:', err)
    }
  }

  useEffect(() => {
    if (!user || !savedReminder?.enabled || typeof window === 'undefined') return
    const check = () => {
      const now = new Date()
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', hour12:false
      }).formatToParts(now)
      const get = type => parts.find(part => part.type === type)?.value || ''
      const day = get('year') + '-' + get('month') + '-' + get('day')
      const current = (Number(get('hour')) % 24) * 60 + Number(get('minute'))
      setReminderClock(get('hour') + ':' + get('minute') + ' (Brasília)')
      const weekday = Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short'}).format(now).replace(/.*/,value=>({Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6})[value]))
      const todayRule = savedReminder.weekly?.find(item=>item.weekday===weekday)
      if (todayRule && !todayRule.enabled) return
      const todayTime = todayRule?.time || savedReminder.time
      const [h,m] = todayTime.split(':').map(Number)
      const scheduled = h * 60 + m
      // Tolerância curta caso a aba tenha ficado suspensa no horário exato.
      if (current < scheduled || current - scheduled > 5) return
      // A chave inclui horário: alterar o horário permite repetir o teste no mesmo dia.
      const key = 'mate-reminder-v3-' + user.id + '-' + day + '-' + todayTime
      if (localStorage.getItem(key)) return
      localStorage.setItem(key,'1')
      showMateAlert()
    }
    check()
    const timer = window.setInterval(check,15000)
    const resume = () => { if (!document.hidden) check() }
    document.addEventListener('visibilitychange',resume)
    window.addEventListener('focus',check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange',resume)
      window.removeEventListener('focus',check)
    }
  }, [user?.id,savedReminder])

  async function saveReminder(event) {
    event.preventDefault()
    if (!user || !supabase) return
    setReminderSaving(true); setReminderMessage('')
    const {error} = await supabase.from('reminder_preferences').upsert({user_id:user.id,enabled:reminderEnabled,local_time:reminderTime+':00',timezone:'America/Sao_Paulo',updated_at:new Date().toISOString()},{onConflict:'user_id'})
    const {error:weeklyError} = error || !weeklySchedule ? {error:null} : await supabase.from('reminder_weekly_schedule').upsert(weeklySchedule.map(d=>({user_id:user.id,weekday:d.weekday,enabled:d.enabled,local_time:d.time+':00',updated_at:new Date().toISOString()})),{onConflict:'user_id,weekday'})
    if (error || weeklyError) setReminderMessage('Erro ao salvar: '+(error||weeklyError).message)
    else { setSavedReminder({enabled:reminderEnabled,time:reminderTime,weekly:weeklySchedule?.map(d=>({...d}))}); setReminderMessage(reminderEnabled ? '✓ Programação semanal salva. Mantenha o aplicativo aberto para testar os avisos.' : '✓ Programação salva, mas os lembretes estão DESATIVADOS.') }
    setReminderSaving(false)
  }

  const VAPID_PUBLIC_KEY = 'BMfGc5ofxXq-TxFPadM90p3KN8gqb3KOfq3hUME1dibGBYLE7-3L2HxEq59qyIqilEe5AsPf7KCVtdBN9-0dHxQ'
  function vapidBytes(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4)
    const binary = atob((base64url + padding).replace(/-/g,'+').replace(/_/g,'/'))
    return Uint8Array.from(binary, character => character.charCodeAt(0))
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  async function registerClosedAppNotifications() {
    if (!user || !supabase) { setReminderMessage('Entre na sua conta para ativar as notificações.'); return }
    if (isIOS && !isStandalone) { setReminderMessage('No iPhone: abra este site no Safari, toque em Compartilhar e escolha Adicionar à Tela de Início. Abra o aplicativo pelo ícone criado e tente novamente. Requer iOS 16.4 ou posterior.'); return }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setReminderMessage('Este navegador não oferece notificações push. Os lembretes com o aplicativo aberto continuam disponíveis.'); return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setReminderMessage('Autorize as notificações nas configurações do navegador.'); return }
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const currentKey = subscription.options?.applicationServerKey
        const expected = vapidBytes(VAPID_PUBLIC_KEY)
        if (!currentKey || Array.from(new Uint8Array(currentKey)).some((value,index)=>value!==expected[index]) || new Uint8Array(currentKey).length!==expected.length) {
          await supabase.from('push_subscriptions').delete().eq('user_id',user.id).eq('endpoint',subscription.endpoint)
          await subscription.unsubscribe()
          subscription = null
        }
      }
      if (!subscription) subscription = await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(VAPID_PUBLIC_KEY)})
      const json = subscription.toJSON()
      const {error} = await supabase.from('push_subscriptions').upsert({
        user_id:user.id,endpoint:subscription.endpoint,p256dh:json.keys?.p256dh,auth_key:json.keys?.auth,
        user_agent:navigator.userAgent,enabled:true,updated_at:new Date().toISOString()
      },{onConflict:'endpoint'})
      if (error) throw error
      setReminderMessage('✓ Dispositivo registrado para receber notificações com o aplicativo fechado. Faça um teste de entrega no horário programado para confirmar o funcionamento.')
    } catch(error) { setReminderMessage('Não foi possível registrar este dispositivo: '+(error?.message || 'erro desconhecido')) }
  }

  async function enableReminderNotifications() {
    if (!('Notification' in window)) { setReminderMessage('Este navegador não permite notificações diretas. O aviso dentro do aplicativo continuará funcionando.'); return }
    try {
      const result = await Notification.requestPermission()
      setReminderMessage(result==='granted'?'✓ Permissão concedida. Use Testar aviso agora para verificar o dispositivo.':'Notificação do sistema não autorizada. O aviso dentro do aplicativo continuará funcionando.')
    } catch { setReminderMessage('Este navegador não permite solicitar a notificação. O aviso dentro do aplicativo continuará funcionando.') }
  }

  async function saveNewPassword(e){
    e.preventDefault();setSettingsMessage('')
    if(!currentPassword){setSettingsMessage('Digite sua senha atual para confirmar sua identidade.');return}
    if(newPassword.length<8){setSettingsMessage('A nova senha precisa ter pelo menos 8 caracteres.');return}
    if(newPassword!==confirmPassword){setSettingsMessage('As senhas não coincidem.');return}
    setSettingsBusy(true)
    try{
      const {error:authError}=await supabase.auth.signInWithPassword({email:user.email,password:currentPassword})
      if(authError){setSettingsMessage('Não foi possível confirmar sua senha atual. Confira a senha e tente novamente.');return}
      const {error}=await supabase.auth.updateUser({password:newPassword})
      if(error){
        if(/reauth|nonce/i.test(error.message||'')){
          setSettingsMessage('Por segurança, é necessária uma confirmação adicional da conta. Solicite a recuperação de senha na tela de entrada.')
        }else setSettingsMessage('Não foi possível trocar a senha: '+error.message)
      }else{
        setCurrentPassword('');setNewPassword('');setConfirmPassword('')
        setSettingsMessage('Sua senha foi atualizada com sucesso.')
      }
    }catch(err){setSettingsMessage('Não foi possível concluir a alteração. Tente novamente.')}
    finally{setSettingsBusy(false)}
  }
  async function saveReaderPhoto(e){
    const file=e.target.files?.[0];e.target.value=''
    if(!file)return
    if(!file.type.startsWith('image/')||file.size>8*1024*1024){setSettingsMessage('Escolha uma foto de até 8 MB.');return}
    setSettingsBusy(true);setSettingsMessage('')
    try{
      const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas')
      canvas.width=192;canvas.height=192
      const ctx=canvas.getContext('2d'),side=Math.min(bitmap.width,bitmap.height)
      ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,192,192)
      bitmap.close?.()
      const {data,error}=await supabase.auth.updateUser({data:{avatar_data_url:canvas.toDataURL('image/jpeg',.72)}})
      if(error)throw error
      setUser(data.user);setSettingsMessage('Foto atualizada com sucesso.')
    }catch(err){setSettingsMessage(err.message||'Erro ao salvar a foto.')}
    finally{setSettingsBusy(false)}
  }
  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (screen === 'signup' && !acceptedTerms) { setMessage('Leia e aceite os Termos de Uso e a Política de Privacidade para continuar.'); return }
    if (!supabaseConfigured || !supabase) {
      setMessage('A conexão com o Supabase ainda não está disponível.')
      return
    }
    setLoading(true)
    try {
      if (screen === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setUser(data.user)
        setScreen('dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName, terms_accepted_at: new Date().toISOString(), terms_version: 'draft-2026-09' } }
        })
        if (error) throw error
        if (data.session) {
          setUser(data.user)
          setScreen('dashboard')
        } else {
          setMessage('Conta criada. Confira seu e-mail para confirmar o cadastro.')
        }
      }
    } catch (error) {
      setMessage(error?.message || 'Não foi possível concluir. Tente novamente.')
    } finally { setLoading(false) }
  }

  const months = [
    [1,'Janeiro','Recomeços'],[2,'Fevereiro','Intimidade'],[3,'Março','Fé'],
    [4,'Abril','A vida à luz da cruz e da ressurreição'],[5,'Maio','Relacionamentos'],[6,'Junho','Propósito'],
    [7,'Julho','Tempo e espera'],[8,'Agosto','Tempestades'],[9,'Setembro','Transformação'],
    [10,'Outubro','Gratidão'],[11,'Novembro','Generosidade'],[12,'Dezembro','Esperança e celebração']
  ]

  async function requirePaidAccess(action) {
    if (!user || !supabase) { setScreen('login'); setMessage('Entre na sua conta para continuar.'); return false }
    const { data, error } = await supabase.rpc('get_my_app_access')
    const access = Array.isArray(data) ? data[0] : data
    if (error || !access?.allowed) {
      setMessage(access?.status === 'blocked' ? 'Seu acesso está bloqueado. Fale com a administração para regularizar.' : access?.access_until && new Date(access.access_until) <= new Date() ? 'Seu acesso venceu. Renove para continuar.' : 'Seu acesso ainda não está liberado.')
      setScreen('accessRestricted')
      window.scrollTo({top:0,behavior:'smooth'})
      return false
    }
    if (typeof action === 'function') action()
    return true
  }

  async function openNotes() {
    if (!user || !supabase) return
    setNotesLoading(true); setMessage('')
    const { data, error } = await supabase.from('reader_records')
      .select('id,updated_at,para_pensar_note,um_passo_para_hoje_note,encontros(day_number,day_of_month,month_name,title,para_pensar,um_passo_para_hoje)')
      .eq('user_id',user.id).order('updated_at',{ascending:false})
    if (error) { setMessage('Não foi possível carregar suas anotações.'); setNoteItems([]) }
    else setNoteItems((data || []).filter(item => item.encontros && (item.para_pensar_note?.trim() || item.um_passo_para_hoje_note?.trim())))
    setScreen('notes'); setNotesLoading(false); window.scrollTo({top:0,behavior:'smooth'})
  }

  async function openFavorites() {
    if (!user || !supabase) return
    setFavoritesLoading(true); setMessage('')
    const { data, error } = await supabase.from('favorites')
      .select('created_at,encontros(day_number,day_of_month,month_name,title,verse_reference,verse_text)')
      .eq('user_id',user.id).order('created_at',{ascending:false})
    if (error) { setMessage('Não foi possível carregar seus favoritos.'); setFavoriteItems([]) }
    else setFavoriteItems((data || []).filter(item => item.encontros))
    setScreen('favorites'); setFavoritesLoading(false); window.scrollTo({top:0,behavior:'smooth'})
  }

  async function removeFavoriteFromList(dayNumber) {
    const item = favoriteItems.find(x => x.encontros?.day_number === dayNumber)
    if (!item || !user || !supabase) return
    const { data: enc } = await supabase.from('encontros').select('id').eq('edition_id','e9ced096-9c32-4f64-b3af-d25fc6781fb6').eq('day_number',dayNumber).single()
    if (!enc) return
    const { error } = await supabase.from('favorites').delete().eq('user_id',user.id).eq('encontro_id',enc.id)
    if (!error) setFavoriteItems(items => items.filter(x => x.encontros?.day_number !== dayNumber))
  }

  async function openJourney() {
    if (!user || !supabase) return
    setJourneyLoading(true)
    const [{ data: progress }, { count: favorites }, { count: notes }] = await Promise.all([
      supabase.from('progress').select('completed,completed_at,encontros(day_number,title)').eq('user_id',user.id).eq('completed',true).order('completed_at',{ascending:false}),
      supabase.from('favorites').select('*',{count:'exact',head:true}).eq('user_id',user.id),
      supabase.from('reader_records').select('*',{count:'exact',head:true}).eq('user_id',user.id)
    ])
    const done = progress || []
    const last = done[0]?.encontros
    setCompletedDays([...new Set(done.map(item=>item.encontros?.day_number).filter(Boolean))])
    setJourney({completed:new Set(done.map(item=>item.encontros?.day_number).filter(Boolean)).size,lastDay:last?.day_number || 0,lastTitle:last?.title || '',favorites:favorites || 0,notes:notes || 0})
    setScreen('journey'); setJourneyLoading(false); window.scrollTo({top:0,behavior:'smooth'})
  }

  async function markEncounterCompleted() {
    if (!user || !encounter || !supabase) return
    setEncounterStatus('Registrando sua caminhada...')
    const { error } = await supabase.from('progress').upsert({user_id:user.id,encontro_id:encounter.id,completed:true,completed_at:new Date().toISOString()},{onConflict:'user_id,encontro_id'})
    if (error) { setEncounterStatus('Não foi possível registrar este encontro: ' + error.message); return }
    setEncounterStatus('✓ Encontro concluído e registrado em Minha Caminhada.')
  }

  async function openMonth(monthNumber) {
    if (!supabase) { setMessage('Prévia indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis de compilação do Cloudflare.'); setScreen('devotional'); return }
    setDevotionalLoading(true)
    setMessage('')
    const { data, error } = await supabase.from('encontros')
      .select('day_number,day_of_month,title,month_name,theme')
      .eq('edition_id','e9ced096-9c32-4f64-b3af-d25fc6781fb6')
      .eq('month_number',monthNumber).eq('is_published',true).order('day_number')
    if (error) { console.error('Falha ao carregar mês:',error); setMessage('Não foi possível carregar este mês (' + (error.code || 'erro de conexão') + ').'); setDevotionalLoading(false); return }
    setMonthDays(data || [])
    setSelectedMonth(monthNumber)
    setScreen('month')
    setDevotionalLoading(false)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  async function openEncounter(dayNumber = 1) {
    if (!user && (dayNumber < 1 || dayNumber > 3)) { setScreen('signup'); setMessage('Crie sua conta para continuar além da prévia gratuita.'); return }
    if (!supabase) { setMessage('Prévia indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis de compilação do Cloudflare.'); setScreen('devotional'); return }
    if (user) {
      const { data: accessData, error: accessError } = await supabase.rpc('get_my_app_access')
      const access = Array.isArray(accessData) ? accessData[0] : accessData
      if (accessError || !access?.allowed) {
        setMessage(access?.status === 'blocked' ? 'Seu acesso está bloqueado. Fale com a administração para regularizar.' : access?.access_until && new Date(access.access_until) <= new Date() ? 'Seu acesso venceu. Renove para continuar.' : 'Seu acesso ainda não está liberado.')
        setScreen('accessRestricted')
        window.scrollTo({top:0,behavior:'smooth'})
        return
      }
    }
    setEncounterLoading(true)
    setEncounterStatus('')
    const { data, error } = await supabase.from('encontros').select('*').eq('edition_id','e9ced096-9c32-4f64-b3af-d25fc6781fb6').eq('day_number',dayNumber).eq('is_published',true).maybeSingle()
    if (error || !data) { console.error('Falha ao carregar encontro:',error); setMessage('Não foi possível abrir este encontro (' + (error?.code || 'conteúdo não encontrado') + ').'); setEncounterLoading(false); setScreen('devotional'); return }
    setEncounter(data)
    if (!user) { setPensarNote(''); setPassoNote(''); setFavoritePreview(false); setScreen('encounter'); setEncounterLoading(false); window.scrollTo({top:0,behavior:'smooth'}); return }
    const [{ data: note }, { data: fav }] = await Promise.all([
      supabase.from('reader_records').select('para_pensar_note,um_passo_para_hoje_note').eq('user_id', user.id).eq('encontro_id', data.id).maybeSingle(),
      supabase.from('favorites').select('encontro_id').eq('user_id', user.id).eq('encontro_id', data.id).maybeSingle()
    ])
    setPensarNote(note?.para_pensar_note || '')
    setPassoNote(note?.um_passo_para_hoje_note || '')
    setFavoritePreview(Boolean(fav))
    setScreen('encounter')
    setEncounterLoading(false)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  async function saveEncounterNotes() {
    setEncounterStatus('Salvando...')
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUser = sessionData.session?.user
    if (!activeUser) { setEncounterStatus('Sua sessão expirou. Entre novamente para salvar.'); return }
    const { data, error } = await supabase.from('reader_records').upsert({
      user_id:activeUser.id,encontro_id:encounter.id,
      para_pensar_note:pensarNote,um_passo_para_hoje_note:passoNote
    },{onConflict:'user_id,encontro_id'}).select('id,para_pensar_note,um_passo_para_hoje_note').single()
    if (error || !data) { setEncounterStatus('Erro ao salvar: ' + (error?.message || 'sem confirmação do banco')); return }
    setPensarNote(data.para_pensar_note || '')
    setPassoNote(data.um_passo_para_hoje_note || '')
    setSavedPreview(true); setEncounterStatus('✓ Anotações salvas na sua conta.')
    setTimeout(() => setSavedPreview(false),2200)
  }

  async function toggleEncounterFavorite() {
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUser = sessionData.session?.user
    if (!activeUser) { setEncounterStatus('Sua sessão expirou. Entre novamente para favoritar.'); return }
    if (favoritePreview) {
      const { error } = await supabase.from('favorites').delete().eq('user_id',activeUser.id).eq('encontro_id',encounter.id)
      if (error) { setEncounterStatus('Erro ao remover favorito: ' + error.message); return }
      setFavoritePreview(false); setEncounterStatus('Removido dos seus favoritos.')
    } else {
      const { data, error } = await supabase.from('favorites').upsert({user_id:activeUser.id,encontro_id:encounter.id},{onConflict:'user_id,encontro_id'}).select('encontro_id').single()
      if (error || !data) { setEncounterStatus('Erro ao favoritar: ' + (error?.message || 'sem confirmação do banco')); return }
      setFavoritePreview(true); setEncounterStatus('♥ Encontro salvo em Meus Favoritos.')
    }
  }

  async function shareMate() {
    if (!encounter) return
    const text = encounter.title + '\n\n' + encounter.reflection + '\n\nChimarrão com Deus — 365 Encontros com Deus | no aplicativo Bíblia + Chimarrão | Romulo Schutz'
    try {
      if (navigator.share) await navigator.share({ title:'Mate da Reflexão — ' + encounter.title, text })
      else { await navigator.clipboard.writeText(text); setEncounterStatus('✓ Mate da Reflexão copiado para compartilhar.') }
    } catch (error) {
      if (error?.name !== 'AbortError') setEncounterStatus('Não foi possível compartilhar agora.')
    }
  }

  function goPrevious() {
    if (!encounter || encounter.day_number <= 1) { setEncounterStatus('Este é o primeiro encontro da edição.'); return }
    openEncounter(encounter.day_number - 1)
  }

  function goNext() {
    if (!encounter) return
    openEncounter(encounter.day_number + 1)
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    setUser(null); setScreen('landing'); setMessage('')
  }




  if(screen==='support'&&user){return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Apoie as obras</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Voltar</button></header><section className="support-page"><span className="support-heart">♥</span><h1>Apoie as obras de Romulo Schutz</h1><p>Se os livros, devocionais e reflexões têm contribuído para sua caminhada, você pode apoiar espontaneamente a continuidade deste trabalho. Toda contribuição é voluntária.</p><div className="support-qr-frame"><ApoiePixQR/></div><strong>Contribuição via Pix · Mercado Pago</strong><p>Chave Pix: <b>biblia.chimarrao@gmail.com</b></p><button className="support-copy" onClick={async()=>{try{await navigator.clipboard.writeText(PIX_COPIA_COLA);setMessage('Código Pix copiado. Confira os dados no aplicativo do seu banco.')}catch{setMessage('Use a chave Pix informada acima.')}}}>Copiar código Pix</button>{message&&<p role="status">{message}</p>}<p>Confira o destinatário antes de confirmar. Obrigado pelo apoio!</p></section></main>}
  if(screen==='news'&&user){return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Notificações</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Voltar</button></header><section className="support-page"><h1>Notificações</h1><p>As novidades e comunicados do autor aparecerão aqui quando o painel de publicação estiver disponível.</p><button className="support-copy" onClick={()=>setScreen('reminder')}>Configurar Hora do Mate</button></section></main>}
  if (screen === 'ideas' && user) {
    const reflections = [
      {kicker:'TEMPO',quote:'O tempo passa. O que fazemos com ele deixa marcas.',text:'Um espaço para perceber a vida com mais atenção — sem correr para uma resposta antes de compreender a pergunta.'},
      {kicker:'CAMINHADA',quote:'Nem todo passo precisa ser grande. Precisa ser verdadeiro.',text:'Há dias de avanço e dias de permanência. Ambos podem fazer parte de uma caminhada que amadurece.'},
      {kicker:'ESPERANÇA',quote:'Esperar não é ficar parado. É continuar caminhando sem possuir todas as respostas.',text:'A esperança sustenta o presente enquanto aquilo que ainda não vemos continua sendo construído.'},
      {kicker:'FÉ E VIDA',quote:'A fé não elimina as perguntas; ela muda o lugar de onde começamos a enfrentá-las.',text:'Aqui, fé, história e experiência humana podem conversar sem transformar a reflexão em respostas fáceis.'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Ideias e Reflexões</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome ideas-head stage3-ideas-head"><p className="eyebrow">IDEIAS E REFLEXÕES</p><h2>Palavras para levar consigo.</h2><p>Um espaço para pensamentos, perguntas e pequenas pausas sobre tempo, história, fé, esperança e vida.</p><div className="ideas-author">Romulo Schutz<small>Notas do autor</small></div></section><section className="ideas-grid">{reflections.map((item,index)=><article className="idea-card stage3-idea" key={item.kicker}><div className="idea-number">{String(index+1).padStart(2,'0')}</div><div><span>{item.kicker}</span><blockquote>“{item.quote}”</blockquote><p>{item.text}</p><small>Romulo Schutz</small></div></article>)}</section><section className="ideas-note"><span>✦</span><div><strong>Um espaço que continuará crescendo.</strong><p>Novas ideias e reflexões poderão ser acrescentadas ao aplicativo ao longo da caminhada.</p></div></section></main>
  }

  if (screen === 'author') {
    const published = ['Entre os Tempos — A Urgência de Compreender o Calendário de Deus', 'Entre o Já e o Ainda Não — Esperança Inabalável em um Mundo Acelerado']
    const devotional = ['Chimarrão com Deus — 365 Encontros com Deus (devocional)']
    const inPreparation = ['Entre a Cidade e o Silêncio — texto concluído; ilustrações em preparação']
    const projects2027 = ['Entre os Sistemas I — Religioso, Filosófico, Político e Econômico: Cristo, o Libertador', 'Entre os Sistemas II — Fé, Doutrina e Suficiência de Cristo', 'Entre a Honra de Servir — Fidelidade, Lealdade, Obediência e Amor']
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Conheça o autor</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header>
      <section className="author-profile-hero stage3-author-hero"><div className="author-profile-photo"><img src="/autor-boas-vindas-oficial.webp" alt="Retrato de Romulo Schutz" onError={e=>{e.currentTarget.style.display='none'}}/><div className="author-photo-fallback">Romulo Schutz<small>Autor · História · Fé · Reflexão</small></div></div><div className="author-profile-intro"><p className="eyebrow">AUTOR</p><h2>Romulo Schutz</h2><p>Escritor, pesquisador e autor de obras que dialogam com história, filosofia, teologia e esperança cristã.</p><button onClick={() => setScreen('authorBooks')}>Conhecer as obras →</button></div></section>
      <section className="author-profile-body"><p className="eyebrow">SOBRE O AUTOR</p><h3>Entre a história, o pensamento e a fé.</h3><p>Romulo Schutz é escritor, graduado em História e pequeno empresário em Otacílio Costa, Santa Catarina, cidade onde vive com a esposa, Scheila Schutz, e os filhos, Marco Antônio e Maria Antônia. É presbítero da Assembleia de Deus em sua cidade.</p><p>Sua trajetória reúne a experiência familiar, o trabalho como empresário e a dedicação ao estudo. Além da formação em História, realiza cursos de teologia, filosofia e psicanálise, buscando ampliar seus referenciais, dialogar com diferentes perspectivas e manter uma aprendizagem contínua.</p><p>É desse encontro entre história, pensamento e experiência humana que nascem muitas das perguntas presentes em seus livros. Em sua escrita, o autor investiga o tempo, as estruturas da sociedade, as relações humanas, os conflitos da existência e os desafios da vida contemporânea. Ao percorrer diferentes correntes de pensamento, preserva a fé cristã e a centralidade de Cristo como fundamentos de sua reflexão.</p><p>Sua trajetória literária começou com <em>Entre os Tempos — A Urgência de Compreender o Calendário de Deus</em>, seguido por <em>Entre o Já e o Ainda Não — Esperança Inabalável em um Mundo Acelerado</em> e pelo devocional <em>Chimarrão com Deus — 365 Encontros com Deus</em>. Cada obra convida o leitor a conhecer, questionar e refletir, relacionando a investigação intelectual às questões da fé e da vida cotidiana.</p><p>Para 2027, prepara novos projetos literários que aprofundam o diálogo entre sociedade, história, doutrina cristã, serviço e relações humanas.</p></section>
      <section className="author-profile-works"><p className="eyebrow">OBRAS PUBLICADAS E PROJETOS</p><h3>Livros e próximos capítulos</h3><div className="author-work-groups"><article><h4>Livros publicados</h4>{published.map(x=><p key={x}>✓ {x}</p>)}</article><article><h4>Devocional</h4>{devotional.map(x=><p key={x}>◈ {x}</p>)}</article><article><h4>Em preparação</h4>{inPreparation.map(x=><p key={x}>◇ {x}</p>)}</article><article><h4>Projetos previstos para 2027</h4>{projects2027.map(x=><p key={x}>◇ {x}</p>)}</article></div><button onClick={() => setScreen('authorBooks')}>Ver livros do Romulo →</button></section><blockquote className="author-profile-quote">“Cada livro nasce de uma pergunta. Cada história procura deixar o leitor diante de uma escolha.”<small>Romulo Schutz</small></blockquote>
    </main>
  }

  if (screen === 'authorBooks' && user) {
    const works = [
      {title:'Chimarrão com Deus',sub:'365 Encontros com Deus',meta:'Devocional diário 2027',image:'/menu-favoritos-v2.webp',status:'DEVOCIONAL 2027',text:'Uma pausa diária para abrir a Palavra, refletir, conversar com Deus e transformar o encontro em um passo concreto para o dia.'},
      {title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus',meta:'História · Filosofia · Teologia',image:'/1000769251.jpg',status:'LIVRO PUBLICADO',text:'Uma obra sobre tempo, calendário, história e fé, percorrendo a construção humana do tempo e sua relação com a compreensão cristã.'},
      {title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado',meta:'Tempo · Corpo · Alma · Espírito',image:'/1000670931(1).jpg',status:'LIVRO PUBLICADO',text:'Uma reflexão sobre a vida no mundo acelerado e a esperança cristã, olhando para o ser humano em suas dimensões de tempo, corpo, alma e espírito.'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',meta:'Trilogia em desenvolvimento',image:'/image (1).png',status:'EM DESENVOLVIMENTO',text:'Uma narrativa sobre cidade, escolhas, relações, fé e consequências. Três movimentos de uma mesma história: NASCE, CRESCE e VIVE.'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Obras de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome author-books-head stage3-authorbooks-head"><p className="eyebrow">LIVROS DO ROMULO</p><h2>Tempo, história, fé e esperança.</h2><p>Conheça as obras e projetos de Romulo Schutz — livros que percorrem o tempo, a vida e as perguntas que acompanham a caminhada humana.</p><div className="author-signature">Romulo Schutz<small>Autor · História · Fé · Reflexão</small></div></section><section className="author-books-grid stage3-authorbooks-grid">{works.map(work=><article className="author-book-card" key={work.title}><div className="author-book-cover"><img src={work.image} alt={'Capa de '+work.title} loading="lazy" /></div><div className="author-book-copy"><span>{work.status}</span><h3>{work.title}</h3><h4>{work.sub}</h4><p>{work.text}</p><small>{work.meta}</small></div></article>)}</section><section className="author-books-footer"><strong>Uma obra. Uma ideia. Uma conversa que continua.</strong><p>Este espaço acompanhará os livros publicados e os projetos em desenvolvimento.</p></section></main>
  }

  if (screen === 'epub-reader' && user) return <EpubReader title={readerTitle} epubUrl={null} onBack={() => setScreen('books')} />

  if (screen === 'books' && user) {
    const books = [
      {title:'Chimarrão com Deus',sub:'365 Encontros com Deus',kind:'Devocional diário 2027',cover:'devotional',image:'/menu-favoritos-v2.webp',status:'Disponível no aplicativo',group:'disponivel',action:'Abrir devocional',open:()=>setScreen('devotional')},
      {title:'Chimarrão com Deus — 365 Encontros com Deus',sub:'Edição digital EPUB · Prévia 2027',kind:'Livro digital · acesso autorizado',cover:'devotional',image:'/menu-favoritos-v2.webp',status:'EPUB cadastrado · disponível para contas autorizadas',group:'disponivel',action:'Ler EPUB'},
      {title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus',kind:'História · Filosofia · Teologia',cover:'tempos',image:'/1000769251.jpg',status:'Livro publicado · leitura digital em preparação',group:'publicados',action:'Conhecer leitor'},
      {title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado',kind:'Tempo · Corpo · Alma · Espírito',cover:'ja',image:'/1000670931(1).jpg',status:'Livro publicado · leitura digital em preparação',group:'publicados',action:'Conhecer leitor'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',kind:'Trilogia em desenvolvimento',cover:'cidade',image:'/image (1).png',status:'Em breve',group:'projetos',action:'Projeto em desenvolvimento'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Biblioteca de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome books-head stage3-library-head"><p className="eyebrow">MEUS LIVROS</p><h2>História, fé e esperança para a sua jornada.</h2><p>Este espaço reúne as obras que fazem parte da caminhada do autor e do leitor.</p><div className="author-mark">Bíblia <b>+</b> Chimarrão <small>Plataforma de leitura, encontros e reflexões · Romulo Schutz</small></div></section><div className="library-controls"><label htmlFor="library-search">Buscar na biblioteca</label><input id="library-search" type="search" value={bookSearch} onChange={e=>setBookSearch(e.target.value)} placeholder="Digite o título de um livro..." /><div className="library-filters" aria-label="Filtrar livros">{[['todos','Todos'],['disponivel','No aplicativo'],['publicados','Publicados'],['projetos','Projetos']].map(([key,label])=><button key={key} className={bookFilter===key?'selected':''} onClick={()=>setBookFilter(key)} aria-pressed={bookFilter===key}>{label}</button>)}</div><p className="library-explainer">O devocional pode ser aberto aqui. A edição EPUB do devocional está disponível para contas autorizadas. Os demais livros dependem da preparação dos arquivos e da liberação de acesso.</p></div><section className="books-grid stage3-books-grid">{books.filter(book=>(bookFilter==='todos'||book.group===bookFilter)&&[book.title,book.sub,book.kind].join(' ').toLocaleLowerCase('pt-BR').includes(bookSearch.trim().toLocaleLowerCase('pt-BR'))).map(book=><article className="book-card stage3-book" key={book.title}><div className={'book-cover '+book.cover}><img src={book.image} alt={'Capa de '+book.title} loading="lazy" /></div><div className="book-info"><span className="book-status">{book.status}</span><h3>{book.title}</h3><p>{book.sub}</p><small>{book.kind}</small>{book.open?<button onClick={book.open}>{book.action} →</button>:(book.group==='publicados'||book.action==='Ler EPUB')?<button onClick={()=>{setReaderTitle(book.title);setScreen('epub-reader');window.scrollTo(0,0)}}>{book.action} →</button>:<button className="book-disabled" disabled>{book.action}</button>}</div></article>)}</section>{!books.some(book=>(bookFilter==='todos'||book.group===bookFilter)&&[book.title,book.sub,book.kind].join(' ').toLocaleLowerCase('pt-BR').includes(bookSearch.trim().toLocaleLowerCase('pt-BR'))) && <p className="library-empty">Nenhum livro encontrado. Experimente outro título ou filtro.</p>}</main>
  }

  if (screen === 'notes' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome notes-head stage2-banner"><img src="/devocional/mes_05.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MINHAS ANOTAÇÕES</p><h2>Palavras da sua caminhada</h2><p>Suas reflexões e passos ficam reunidos aqui para você revisitar quando quiser.</p></div></section>{notesLoading ? <p className="encounter-save-status">Carregando suas anotações...</p> : noteItems.length ? <section className="notes-list">{noteItems.map(item => { const e=item.encontros; return <article className="note-card stage2-list-card" key={item.id}><img className="stage2-list-thumb" src={"/devocional/mes_"+String(months.find(m=>m[1]?.toLowerCase()===String(e.month_name||"").toLowerCase())?.[0]||1).padStart(2,"0")+".jpg"} alt=""/><div className="note-card-top"><span>✍️</span><small>DIA {e.day_number} · {e.day_of_month} DE {String(e.month_name||'').toUpperCase()}</small></div><h3>{e.title}</h3>{item.para_pensar_note?.trim() && <div className="note-block"><strong>Para Pensar</strong><small>{e.para_pensar}</small><p>{item.para_pensar_note}</p></div>}{item.um_passo_para_hoje_note?.trim() && <div className="note-block"><strong>Um Passo para Hoje</strong><small>{e.um_passo_para_hoje}</small><p>{item.um_passo_para_hoje_note}</p></div>}<button className="note-open" onClick={() => openEncounter(e.day_number)}>Abrir encontro →</button></article>})}</section> : <section className="empty-state"><span>✍️</span><h3>Nenhuma anotação ainda</h3><p>Nos encontros, escreva em Para Pensar ou Um Passo para Hoje e toque em Salvar. Suas palavras ficarão guardadas aqui.</p><button onClick={() => setScreen('devotional')}>Explorar o devocional →</button></section>}</main>
  }

  if (screen === 'favorites' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome favorites-head stage2-banner"><img src="/devocional/mes_11.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MEUS FAVORITOS</p><h2>Encontros que falaram com você</h2><p>Guarde aqui as mensagens que deseja encontrar novamente.</p></div></section>{favoritesLoading ? <p className="encounter-save-status">Carregando seus favoritos...</p> : favoriteItems.length ? <section className="favorites-list">{favoriteItems.map(item => { const e=item.encontros; return <article className="favorite-card stage2-list-card" key={e.day_number}><img className="stage2-list-thumb" src={"/devocional/mes_"+String(months.find(m=>m[1]?.toLowerCase()===String(e.month_name||"").toLowerCase())?.[0]||1).padStart(2,"0")+".jpg"} alt=""/><div className="favorite-card-top"><span>♥</span><small>DIA {e.day_number} · {e.day_of_month} DE {String(e.month_name||'').toUpperCase()}</small></div><h3>{e.title}</h3><blockquote>{e.verse_text}</blockquote><p className="favorite-reference">{e.verse_reference}</p><div className="favorite-actions"><button onClick={() => openEncounter(e.day_number)}>Abrir encontro →</button><button className="favorite-remove" onClick={() => removeFavoriteFromList(e.day_number)}>♡ Remover</button></div></article>})}</section> : <section className="empty-state"><span>♡</span><h3>Nenhum favorito ainda</h3><p>Quando uma mensagem falar especialmente com você, toque em Favoritar no encontro. Ela ficará guardada aqui.</p><button onClick={() => setScreen('devotional')}>Explorar o devocional →</button></section>}</main>
  }

  if (screen === 'journey' && user) {
    const pct = Math.round((journey.completed / 365) * 100)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome journey-head stage2-banner"><img src="/devocional/mes_09.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MINHA CAMINHADA</p><h2>Um passo de cada vez</h2><p>Aqui você acompanha os encontros que já concluiu ao longo do ano.</p><div className="journey-progress"><div className="journey-progress-bar" style={{width:pct+'%'}}></div></div><strong className="journey-percent">{pct}% da caminhada · {journey.completed} de 365 encontros</strong></div></section>{journeyLoading ? <p className="encounter-save-status">Carregando sua caminhada...</p> : <><section className="journey-stats"><div><strong>{journey.completed}</strong><small>Concluídos</small></div><div><strong>{journey.notes}</strong><small>Anotações</small></div><div><strong>{journey.favorites}</strong><small>Favoritos</small></div></section><section className="journey-resume"><p className="eyebrow">CONTINUAR</p>{journey.lastDay ? <><h3>Seu último encontro concluído</h3><p>Dia {journey.lastDay} — {journey.lastTitle}</p><button onClick={() => openEncounter(Math.min(journey.lastDay + 1,365))}>Continuar do próximo encontro →</button></> : <><h3>Sua caminhada começa aqui</h3><p>Conclua seu primeiro encontro para começar a registrar seu progresso.</p><button onClick={() => openEncounter(1)}>Abrir o Dia 1 →</button></>}</section><section style={{marginTop:24}}><p className="eyebrow">CICLOS MENSAIS</p><h3>Um mês de cada vez</h3><p>Os dias preenchidos estão concluídos. Toque em um dia pendente para continuar. O ciclo se fecha ao completar todos os encontros do mês.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,290px),1fr))',gap:16}}>{months.map(([number,name,theme])=>{const first=months.slice(0,number-1).reduce((sum,[m])=>sum+new Date(2027,m,0).getDate(),0)+1;const total=new Date(2027,number,0).getDate();const days=Array.from({length:total},(_,i)=>first+i);const count=days.filter(d=>completedDays.includes(d)).length;const closed=count===total;return <article className="stage2-cycle" key={number} style={{padding:16,border:'1px solid #bfa064',borderRadius:14}}><div className="stage2-cycle-cover"><img src={'/devocional/mes_'+String(number).padStart(2,'0')+'.jpg'} alt=""/><div><h3>{closed?'✓ ':'◯ '}{name}</h3><small>{theme}</small></div><b>{Math.round(count/total*100)}%</b></div><p><strong>{count}/{total}</strong> · {closed?'Ciclo concluído':'Em andamento'}</p><div style={{height:6,background:'#ddd',borderRadius:6,marginBottom:12}}><div style={{width:count/total*100+'%',height:'100%',background:'#a78442',borderRadius:6}}/></div><div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:5}}>{days.map((day,i)=>{const done=completedDays.includes(day);return <button key={day} type="button" onClick={()=>openEncounter(day)} title={name+' · dia '+(i+1)+(done?' concluído':' pendente')} aria-label={name+' dia '+(i+1)+(done?' concluído':' pendente')} style={{minWidth:0,aspectRatio:'1',borderRadius:'50%',border:done?'2px solid #a78442':'1px solid #aaa',background:done?'#a78442':'transparent',color:done?'#fff':'inherit',cursor:'pointer',fontSize:12}}>{i+1}</button>})}</div></article>})}</div></section></>}</main>
  }

  if (screen === 'devotional') {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header>{message && !user && <div className="guest-demo-error" role="alert">{message}</div>}<section className="welcome devotional-intro"><p className="eyebrow">CHIMARRÃO COM DEUS · 365 ENCONTROS COM DEUS</p><h2>Escolha um mês</h2><p>Uma caminhada de 365 encontros, um dia de cada vez.</p></section>{!user && <section className="guest-demo-hint guest-demo-start"><h2>Experimente antes de criar sua conta</h2><p>Conheça os doze meses e leia gratuitamente os três primeiros encontros de janeiro.</p><button onClick={()=>openEncounter(1)}>Ler o primeiro encontro →</button></section>}<section className="months-grid">{months.map(([number,name,theme]) => <button key={number} className="month-card month-card-illustrated" onClick={() => openMonth(number)}><img className="month-cover-image" src={`/devocional/mes_${String(number).padStart(2, '0')}.jpg`} alt={`Ilustração de ${name}`} loading="lazy" /><span className="month-cover-caption"><span className="month-number">{String(number).padStart(2,'0')}</span><strong>{name}</strong><small>{theme}</small></span></button>)}</section>{!user && <section className="guest-demo-hint guest-demo-start"><h2>Gostou da apresentação?</h2><p>Leia o primeiro encontro e conheça o conteúdo do devocional antes de se cadastrar.</p><button onClick={()=>openEncounter(1)}>Ler o primeiro encontro gratuitamente →</button></section>}</main>
  }

  if (screen === 'month') {
    const info = months.find(m => m[0] === selectedMonth)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · Devocional 2027</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('devotional')}>← Meses</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome devotional-intro"><img className="month-intro-image" src={`/devocional/mes_${String(selectedMonth).padStart(2, '0')}.jpg`} alt={`Ilustração de ${info?.[1] || 'mês'}`} /><p className="eyebrow">MÊS {selectedMonth}</p><h2>{info?.[1]}</h2><p>{info?.[2]}</p></section>{devotionalLoading ? <p className="encounter-save-status">Carregando...</p> : <section className="days-grid">{monthDays.map(day => <button key={day.day_number} className="day-card" onClick={() => user || day.day_number<=3 ? openEncounter(day.day_number) : setScreen('guestInfo')}><span className="day-number">{day.day_of_month}</span><span className="day-copy"><small>Dia {day.day_number}</small><strong>{day.title}</strong></span><span className="day-arrow">{!user && day.day_number>3 ? "🔒" : "›"}</span></button>)}</section>}</main>
  }

  if (screen === 'encounter') {
    if (encounterLoading || !encounter) return <main className="dashboard"><p className="encounter-save-status">Carregando encontro...</p></main>
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · Prévia 2027</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><article className="welcome stage2-encounter"><div className="stage2-encounter-hero"><img src={"/devocional/mes_"+String(months.find(m=>m[1]?.toLowerCase()===String(encounter.month_name||"").toLowerCase())?.[0]||1).padStart(2,"0")+".jpg"} alt=""/><div className="stage2-encounter-heading"><p className="eyebrow">DIA {encounter.day_number} · {encounter.day_of_month} DE {String(encounter.month_name || '').toUpperCase()}</p><h2>{encounter.title}</h2></div></div><div className="dash-message">☀️ <strong>Bom Dia, Deus</strong><p>{encounter.bom_dia_deus}</p></div><div className="dash-message">📖 <strong>A Palavra</strong><p>{encounter.verse_text}</p><small>{encounter.verse_reference}</small></div><div className="dash-message"><div className="mate-title-row"><strong>🧉 Mate da Reflexão</strong><button className="share-mate" onClick={shareMate}>↗ Compartilhar</button></div>{String(encounter.reflection || '').split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div><div className="dash-message">💭 <strong>Para Pensar</strong><p>{encounter.para_pensar}</p><textarea disabled={!user} value={pensarNote} onChange={e => setPensarNote(e.target.value)} placeholder="Escreva aqui sua anotação..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><div className="dash-message">💬 <strong>Conversa com Deus</strong><p>{encounter.conversa_com_deus}</p></div><div className="dash-message">🌱 <strong>Um Passo para Hoje</strong><p>{encounter.um_passo_para_hoje}</p><textarea disabled={!user} value={passoNote} onChange={e => setPassoNote(e.target.value)} placeholder="Registre seu passo de hoje..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div>{!user && <div className="guest-preview-note"><strong>Gostou da experiência?</strong><p>Crie sua conta para registrar suas anotações e continuar sua caminhada.</p><button onClick={()=>setScreen("signup")}>Criar minha conta</button></div>}<nav className="encounter-actions" aria-label="Ações do encontro"><button disabled={encounter.day_number <= 1} onClick={goPrevious}>← <span>Anterior</span></button><button onClick={user ? saveEncounterNotes : ()=>setScreen("signup")}>✓ <span>{savedPreview ? 'Salvo!' : 'Salvar'}</span></button><button className={favoritePreview ? 'is-favorite' : ''} onClick={user ? toggleEncounterFavorite : ()=>setScreen("signup")}>{favoritePreview ? '♥' : '♡'} <span>{favoritePreview ? 'Favoritado' : 'Favoritar'}</span></button><button onClick={user || encounter.day_number<3 ? goNext : ()=>setScreen("guestDemo")}><span>Próximo</span> →</button></nav><button className="complete-encounter" onClick={user ? markEncounterCompleted : ()=>setScreen("signup")}>✓ Concluir este encontro</button>{encounterStatus && <p className="encounter-save-status" role="status">{encounterStatus}</p>}</article></main>
  }

  if (screen === 'reminder' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Hora do Mate</small></div><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></header>
      <section className="welcome reminder-panel stage3-reminder"><div className="stage3-reminder-art" aria-hidden="true"><span>◷</span><span>🧉</span></div><p className="eyebrow">🧉 HORA DO MATE</p><h2>Reserve um momento para o que importa.</h2><p>Escolha quando deseja ser lembrado de preparar seu chimarrão e viver seu encontro com Deus.</p>
      <form onSubmit={saveReminder} className="reminder-form"><label className="reminder-switch"><input type="checkbox" checked={reminderEnabled} onChange={e=>setReminderEnabled(e.target.checked)}/> Ativar meus lembretes</label><p>Escolha os dias e horários (Brasília). Exemplo: segunda a sexta às 07:00, sábado e domingo às 09:00.</p>{weeklySchedule?.map(day=><div key={day.weekday} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'12px 0',borderBottom:'1px solid #d3b77c'}}><label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={day.enabled} onChange={e=>setWeeklySchedule(old=>old.map(d=>d.weekday===day.weekday?{...d,enabled:e.target.checked}:d))}/>{WEEKDAYS[day.weekday]}</label><input aria-label={'Horário de '+WEEKDAYS[day.weekday]} type="time" disabled={!day.enabled} value={day.time} onChange={e=>setWeeklySchedule(old=>old.map(d=>d.weekday===day.weekday?{...d,time:e.target.value}:d))}/></div>)}<button type="submit" disabled={reminderSaving||!weeklySchedule}>{reminderSaving?'Salvando...':'Salvar programação semanal'}</button></form>
      <p className="encounter-save-status" role="status"><strong>Estado do agendamento:</strong> {savedReminder ? (savedReminder.enabled ? 'ATIVO · programação semanal' : 'DESATIVADO') : 'Carregando ou ainda não salvo'} · <strong>Relógio:</strong> {reminderClock || 'Aguardando verificação'} · <strong>Permissão:</strong> {typeof Notification === 'undefined' ? 'indisponível' : Notification.permission}</p>
      {isIOS && !isStandalone && <p role="note">📱 iPhone/iPad: para receber avisos com o aplicativo fechado, abra no Safari, toque em Compartilhar → Adicionar à Tela de Início e depois abra pelo novo ícone (iOS 16.4 ou posterior).</p>}
              <button className="reminder-permission" onClick={enableReminderNotifications}>Permitir notificações neste dispositivo</button> <button className="reminder-permission" type="button" onClick={registerClosedAppNotifications}>🔔 Preparar avisos com aplicativo fechado</button> <button className="reminder-permission" type="button" onClick={showMateAlert}>🧉 Testar aviso agora</button>{mateAlert && <div className="mate-alert" role="alert"><strong>{mateAlert}</strong><button type="button" onClick={()=>setMateAlert('')}>Fechar</button></div>}<p className="reminder-disclaimer">Para receber notificações com o aplicativo fechado, autorize os avisos neste dispositivo e mantenha a programação semanal ativada. A entrega depende também das permissões do navegador e do sistema.</p>{reminderMessage&&<p className="encounter-save-status" role="status">{reminderMessage}</p>}</section></main>
  }

  if (screen === 'opening' && user) return <main className="premium-opening"><div className="premium-opening-frame"><img src="/capa-app-oficial.png" alt="Capa oficial do aplicativo Bíblia + Chimarrão"/><div className="premium-opening-actions"><button onClick={()=>setScreen('dashboard')}>Entrar no aplicativo →</button></div></div></main>

  async function openAdminPanel(){
    if(!user||!supabase)return
    setAdminLoading(true);setAdminMessage('')
    const {data,error}=await supabase.rpc('admin_list_users')
    if(error){setAdminMessage('Acesso administrativo não autorizado.');setAdminUsers([]);setAdminLoading(false);return}
    setIsAdmin(true);setAdminUsers(data||[])
    setAdminLoading(false);setScreen('admin');window.scrollTo({top:0,behavior:'smooth'})
  }

  async function changeAdminAccess(item,status){
    if(!isAdmin||!supabase||item.is_admin)return
    setAdminMessage('Atualizando acesso...')
    const {error}=await supabase.rpc('admin_set_user_access',{target_user_id:item.user_id,new_status:status,new_access_until:null,admin_notes:'Alteração manual pelo painel administrativo'})
    if(error){setAdminMessage('Erro ao atualizar: '+error.message);return}
    setAdminUsers(list=>list.map(u=>u.user_id===item.user_id?{...u,status,source:'manual',access_until:null}:u))
    setAdminMessage(status==='active'?'✓ Acesso liberado.':'✓ Acesso bloqueado.')
  }

  if(screen==='admin'&&user&&isAdmin){
    const filteredAdminUsers=adminUsers.filter(item=>{const q=adminSearch.trim().toLocaleLowerCase('pt-BR');return !q||String(item.full_name||'').toLocaleLowerCase('pt-BR').includes(q)||String(item.email||'').toLocaleLowerCase('pt-BR').includes(q)})
    return <main className="dashboard admin-page">
      <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Painel Administrativo</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Menu</button></header>
      <section className="admin-panel"><div className="admin-title"><p className="eyebrow">ÁREA RESTRITA</p><h1>Leitores</h1><p>Clientes, edições adquiridas e controle de acesso.</p></div>
        <div className="admin-summary"><div><strong>{adminUsers.length}</strong><span>Clientes</span></div><div><strong>{adminUsers.filter(u=>u.status==='active').length}</strong><span>Ativos</span></div><div><strong>{adminUsers.filter(u=>u.status==='blocked').length}</strong><span>Bloqueados</span></div></div>
        <label className="admin-search"><span>Buscar cliente</span><input type="search" value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="Nome ou e-mail" /></label>
        {adminMessage&&<p className="admin-message" role="status">{adminMessage}</p>}
        {adminLoading?<p>Carregando usuários...</p>:<div className="admin-user-list">{filteredAdminUsers.map(item=><article className="admin-user-card admin-user-compact" key={item.user_id}><div className="admin-user-head"><div><strong>{item.full_name||'Leitor'}</strong><small>{item.email}</small></div><span className={'admin-status '+item.status}>{item.is_admin?'Administrador':item.status==='active'?'Ativo':item.status==='blocked'?'Bloqueado':item.status==='cancelled'?'Cancelado':'Pendente'}</span></div><div className="admin-editions"><strong>Edições:</strong> {item.editions?.length?item.editions.sort((a,b)=>a-b).map(year=><span key={year}>{year}</span>):<em>Nenhuma</em>}</div>{!item.is_admin&&<div className="admin-actions compact-actions"><button type="button" onClick={()=>changeAdminAccess(item,'active')} disabled={item.status==='active'}>✓ Liberar</button><button type="button" className="admin-block" onClick={()=>changeAdminAccess(item,'blocked')} disabled={item.status==='blocked'}>Bloquear</button><button type="button" className="admin-notify" title="Avisar atualização" aria-label={'Avisar atualização para '+(item.full_name||item.email)} onClick={()=>setAdminMessage('Aviso de atualização: módulo de envio será conectado às notificações/e-mail.')}>↻ Atualizar</button></div>}</article>)}</div>}
      </section>
    </main>
  }

  if (screen === 'accessRestricted' && user) return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Controle de acesso</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Menu</button></header><section className="admin-shell"><div className="admin-hero"><p className="eyebrow">ÁREA DO LEITOR</p><h1>Acesso restrito</h1><p>{message || 'Seu acesso ao conteúdo protegido ainda não está liberado.'}</p><button type="button" onClick={()=>setScreen('dashboard')}>Voltar ao menu</button></div></section></main>

  if (screen === 'dashboard') {
    const name = user ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'Leitor') : 'Visitante'
    return (
      <main className="dashboard">
        <header className="dash-header">
          <div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div>
          {user ? <button className="logout" onClick={handleLogout}>Sair</button> : <div className="guest-header-actions"><button className="logout" onClick={()=>setScreen("login")}>Entrar</button><button className="logout" onClick={()=>setScreen("signup")}>Criar conta</button></div>}
        </header>
        <section className="visual-dashboard" aria-label="Menu principal ilustrado">
          <div className="visual-dashboard-top">
            <div className="visual-brand"><span>ROMULO SCHUTZ</span><small>Livros · Devocionais · Histórias<br/>Ideias · Reflexões</small></div>

            <div className="visual-quick"><button onClick={()=>user?setScreen('news'):setScreen("guestDemo")} aria-label="Notificações"><span className="visual-quick-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg></span><small>Notificações</small></button><button onClick={()=>{setMessage('');setScreen(user?'support':'guestInfo')}} aria-label="Apoie"><span className="visual-quick-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></span><small>Apoie</small></button></div>
          </div>
          <div className="visual-greeting"><span className="reader-avatar">{user?.user_metadata?.avatar_data_url?<img src={user.user_metadata.avatar_data_url} alt="Foto do leitor"/>:<span>{name.charAt(0).toUpperCase()}</span>}</span><div><strong>Olá, {name}!</strong><span>{user ? "Que bom ter você aqui!" : "Conheça o Bíblia + Chimarrão antes de criar sua conta."}</span></div><em>Uma palavra.<br/>Uma pausa.<br/>Um encontro.</em></div>
          {!user && <div className="guest-preview-note"><strong>Conheça seu espaço de leitura</strong><p>Explore os recursos e experimente gratuitamente os três primeiros encontros. Para registrar sua caminhada, crie uma conta.</p><button onClick={()=>setScreen("devotional")}>Experimentar 3 encontros</button><button onClick={()=>setScreen("signup")}>Criar minha conta</button><button className="guest-login" onClick={()=>setScreen("login")}>Já tenho uma conta</button></div>}<nav className="visual-card-grid" aria-label="Recursos do aplicativo">
            {[
              ["Devocional","365 encontros com Deus","/card-devocional.webp",()=>requirePaidAccess(()=>setScreen('devotional')),"▣"],
              ["Encontro de Hoje","Seu encontro de hoje","/card-encontro.webp",()=>requirePaidAccess(()=>setScreen('todayHome')),"☀"],
              ["Minha Caminhada","Registre e acompanhe","/card-caminhada.webp",()=>openJourney(),"⌁"],
              ["Favoritos","Encontros que tocaram você","/card-favoritos.webp",()=>openFavorites(),"♡"],
              ["Minhas Anotações","Suas reflexões e orações","/card-anotacoes.webp",()=>openNotes(),"✎"],
              ["Meus Livros","Sua biblioteca particular","/card-meus-livros.webp",()=>setScreen('books'),"▤"],
              ["Livros do Romulo","Conheça todas as obras","/card-livros-romulo.webp",()=>setScreen('authorBooks'),"▥"],
              ["Ideias e Reflexões","Conteúdos para inspirar","/card-ideias.webp",()=>setScreen('ideas'),"✧"],
              ["Hora do Mate","Não perca seu encontro","/card-hora-mate.webp",()=>{setReminderMessage('');setScreen('reminder')},"◷"],
              ["Sobre o Autor","Conheça Romulo Schutz","/card-sobre-autor.webp",()=>setScreen('author'),"♙"],
            ].map(([title,subtitle,image,action,symbol])=><button key={title} type="button" className="visual-card individual-card" style={{backgroundImage:`url("${image}")`}} onClick={user ? action : title === "Devocional" ? ()=>setScreen("devotional") : title === "Encontro de Hoje" ? ()=>openEncounter(1) : ()=>setScreen("guestDemo")} aria-disabled={!user}><span className="visual-card-copy"><span className="visual-card-symbol" aria-hidden="true">{symbol}</span><strong>{title}</strong><small>{subtitle}</small></span></button>)}
            <div className="visual-card visual-social-card individual-card" style={{backgroundImage:'url("/card-redes.webp")'}} aria-label="Siga Romulo Schutz nas redes sociais"><div className="visual-social-links"><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">◎</a><a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a><a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a></div></div>
            <div className="visual-card visual-quote visual-quote-tile individual-card" style={{backgroundImage:'url("/card-mensagem.webp")'}} aria-label="Todo dia é um novo encontro com Deus. Romulo Schutz"></div>
          </nav>
          <div className="visual-bottom">

            {user && isAdmin && <button type="button" className="visual-settings-bar admin-entry" onClick={openAdminPanel}><span aria-hidden="true">♜</span><span><strong>Painel Administrativo</strong><small>Gerencie usuários e acessos</small></span><span aria-hidden="true">→</span></button>}
            <button type="button" className="visual-settings-bar" onClick={()=>user? (setSettingsMessage(''),setScreen('settings')):setScreen('guestInfo')}><span aria-hidden="true">⚙</span><span><strong>Configurações</strong><small>Personalize seu aplicativo</small></span><span aria-hidden="true">→</span></button>
          </div>
        </section>
        {message && <p className="dash-message">{message}</p>}
      </main>
    )
  }

  if(screen==='settings'&&user)return <main className="dashboard reader-settings-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Configurações da conta</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Menu</button></header>
    <section className="reader-settings"><h1>Configurações</h1><p>Personalize seu espaço de leitura.</p>
      <div className="reader-settings-panel"><h2>Aparência</h2><p>Escolha o tema do aplicativo.</p><div className="reader-appearance" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6,width:"100%",flexWrap:"nowrap"}}>
        <button aria-pressed={appearance==='light'} className={appearance==='light'?'selected':''} onClick={()=>setAppearance('light')}>☀ Claro</button>
        <button aria-pressed={appearance==='dark'} className={appearance==='dark'?'selected':''} onClick={()=>setAppearance('dark')}>☾ Escuro</button>
        <button aria-pressed={appearance==='system'} className={appearance==='system'?'selected':''} onClick={()=>setAppearance('system')}>◐ Do sistema</button>
      </div></div>
      <div className="reader-settings-panel"><h2>Minha conta</h2><label className="reader-setting-label">E-mail<input type="email" readOnly value={user.email||''}/></label>
        <h3>Foto do leitor</h3><div className="reader-photo-row"><span className="reader-avatar reader-avatar-large">{user.user_metadata?.avatar_data_url?<img src={user.user_metadata.avatar_data_url} alt="Sua foto"/>:<span>{(user.user_metadata?.full_name||user.email||'L').charAt(0).toUpperCase()}</span>}</span><label className="reader-photo-upload">Inserir ou trocar foto<input type="file" accept="image/*" onChange={saveReaderPhoto} disabled={settingsBusy}/></label></div>
        <h3>Trocar senha</h3><form className="reader-password-form" onSubmit={saveNewPassword}><p>Para sua segurança, confirme a senha atual antes de alterá-la.</p><label>Senha atual<span className="reader-password-field"><input type={visiblePasswords.current?'text':'password'} autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/><button className="reader-password-eye" style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:40,minWidth:40,height:40,padding:0,display:"grid",placeItems:"center"}} type="button" aria-label={visiblePasswords.current?'Ocultar senha atual':'Mostrar senha atual'} aria-pressed={visiblePasswords.current} onClick={()=>setVisiblePasswords(v=>({...v,current:!v.current}))}><svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{!visiblePasswords.current&&<path d="M3 3l18 18"/>}</svg></button></span></label><label>Nova senha<span className="reader-password-field"><input type={visiblePasswords.next?'text':'password'} minLength="8" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/><button className="reader-password-eye" style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:40,minWidth:40,height:40,padding:0,display:"grid",placeItems:"center"}} type="button" aria-label={visiblePasswords.next?'Ocultar nova senha':'Mostrar nova senha'} aria-pressed={visiblePasswords.next} onClick={()=>setVisiblePasswords(v=>({...v,next:!v.next}))}><svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{!visiblePasswords.next&&<path d="M3 3l18 18"/>}</svg></button></span></label><label>Confirmar senha<span className="reader-password-field"><input type={visiblePasswords.confirm?'text':'password'} minLength="8" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/><button className="reader-password-eye" style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:40,minWidth:40,height:40,padding:0,display:"grid",placeItems:"center"}} type="button" aria-label={visiblePasswords.confirm?'Ocultar confirmar senha':'Mostrar confirmar senha'} aria-pressed={visiblePasswords.confirm} onClick={()=>setVisiblePasswords(v=>({...v,confirm:!v.confirm}))}><svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{!visiblePasswords.confirm&&<path d="M3 3l18 18"/>}</svg></button></span></label><button disabled={settingsBusy}>Salvar nova senha</button></form>
        {settingsMessage&&<p role="status" className="reader-settings-status">{settingsMessage}</p>}</div>
      <div className="reader-settings-panel"><h2>Sobre o aplicativo</h2><p>Versão: 0.1.0</p><p>Build: 20260927-settings-4</p></div>
    </section></main>
  if (screen === 'todayHome' && user) {
 const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Leitor'
 return <main className="dashboard premium-today-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Encontro do dia</small></div><button className="back-button" onClick={()=>setScreen('dashboard')}>← Menu</button></header>
<div className="stage1-main">
            <section className="stage1-today" aria-label="Encontro do dia"><div className="stage1-month-art"><img src={"/devocional/mes_"+new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",month:"2-digit"}).format(new Date())+".jpg"} alt={"Capa ilustrada do mês atual"} /></div><div className="stage1-month-label">ENCONTRO DO DIA</div>
              <div className="stage1-today-shade">

                <p className="stage1-date">{new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long',day:'numeric',month:'long'}).format(new Date())}</p>
                <h2>Olá, {name}!</h2>
                <p>Prepare seu chimarrão e venha ter um encontro com Deus hoje.</p>
                <div className="stage1-day-title"><small>DEVOCIONAL DO DIA</small><strong>Seu encontro com Deus</strong></div>
                <button className="stage1-enter" onClick={()=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',month:'numeric',day:'numeric'}).formatToParts(new Date());const m=Number(parts.find(p=>p.type==='month')?.value);const d=Number(parts.find(p=>p.type==='day')?.value);const day=new Date(2027,m-1,d);const start=new Date(2027,0,1);openEncounter(Math.floor((day-start)/86400000)+1)}}>📖 Entrar no Encontro de Hoje <span aria-hidden="true">›</span></button>
                <div className="stage1-quick"><button onClick={openJourney}><span>▥</span>Minha Caminhada</button><button onClick={openFavorites}><span>♡</span>Meus Favoritos</button><button onClick={openNotes}><span>✎</span>Minhas Anotações</button><button onClick={()=>setScreen('books')}><span>▤</span>Meus Livros</button></div>
              </div>
            </section>
          </div>
</main>
 }

  if (screen === 'login' || screen === 'signup') {
    const creating = screen === 'signup'
    return (
      <main className="app"><section className="auth-card">
        <button className="back-button" onClick={() => { setScreen(user?'dashboard':'landing'); setMessage('') }}>← Voltar</button>
        <p className="eyebrow">BÍBLIA + CHIMARRÃO</p>
        <h2>{creating ? 'Criar minha conta' : 'Entrar na minha conta'}</h2>
        <p className="auth-intro">{creating ? 'Crie seu acesso para registrar sua caminhada diária.' : 'Use seu e-mail e senha para continuar sua caminhada.'}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {creating && <label>Nome<input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required /></label>}
          <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Senha<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={creating ? 'new-password' : 'current-password'} minLength="6" required /><button type="button" className="eye-button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? '🙈' : '👁'}</button></div></label>
          {creating && <div className="signup-consent"><label><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} required/> Li e concordo com os <button type="button" className="legal-link" onClick={()=>setScreen('terms')}>Termos de Uso</button> e a <button type="button" className="legal-link" onClick={()=>setScreen('privacy')}>Política de Privacidade</button>.</label><small>O cadastro é gratuito nesta etapa. Nenhuma cobrança será realizada agora.</small></div>}
          <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : creating ? 'Criar minha conta' : 'Entrar'}</button>
        </form>
        {message && <p className="form-message" role="status">{message}</p>}
      </section></main>
    )
  }

  if (screen === 'landing') return <main className="premium-opening guest-landing"><div className="premium-opening-frame"><img src="/capa-app-oficial.png" alt="Capa oficial Bíblia + Chimarrão"/><div className="premium-opening-actions guest-landing-actions"><button className="guest-round-action" onClick={()=>setScreen(user ? 'dashboard' : 'guestDemo')}><span className="guest-round-icon" aria-hidden="true">✦</span><span className="guest-round-label">{user ? 'Entrar no aplicativo' : 'Conhecer o aplicativo'}</span></button>{!user && <><button className="guest-round-action" onClick={()=>setScreen('signup')}><span className="guest-round-icon" aria-hidden="true">＋</span><span className="guest-round-label">Criar minha conta</span></button><button className="guest-round-action" onClick={()=>setScreen('login')}><span className="guest-round-icon" aria-hidden="true">↳</span><span className="guest-round-label">Já tenho uma conta</span></button></>}</div></div></main>

  if (!user && screen === 'guestDemo') return <main className="dashboard guest-demo-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Apresentação do aplicativo</small></div><button className="logout" onClick={()=>setScreen('landing')}>← Voltar</button></header><section className="guest-demo-intro"><p className="eyebrow">CONHEÇA O APLICATIVO</p><h1>Uma palavra. Uma pausa. Um encontro.</h1><p>O Bíblia + Chimarrão reúne o devocional Chimarrão com Deus, seus registros de leitura, reflexões, lembretes e uma biblioteca de obras do autor.</p></section><section className="guest-about-author"><img src="/autor-boas-vindas-oficial.webp" alt="Foto do autor Romulo Schutz"/><div><h2>Romulo Schutz</h2><p>Escritor de Otacílio Costa, Santa Catarina. Suas obras aproximam história, filosofia, teologia e esperança cristã.</p><p>Este aplicativo nasceu para oferecer um momento diário de leitura, reflexão e oração.</p></div></section><section className="guest-demo-format"><h2>O que você encontrará?</h2><div className="guest-feature-list">{[['Devocional','365 encontros organizados em doze meses.'],['Minha Caminhada','Acompanhe sua jornada de leitura.'],['Favoritos e Anotações','Guarde reflexões e registros pessoais.'],['Hora do Mate','Organize seu lembrete diário.'],['Livros do Romulo','Conheça as obras do autor.'],['Ideias e Reflexões','Textos para inspirar sua caminhada.']].map(([title,desc])=><article key={title}><strong>{title}</strong><p>{desc}</p></article>)}</div><h2>Os doze meses</h2><div className="guest-demo-months">{months.map(([number,name,theme])=><article key={number} className="guest-demo-month"><img src={`/devocional/mes_${String(number).padStart(2,'0')}.jpg`} alt={`Ilustração de ${name}`} loading="lazy"/><div><strong>{name}</strong><small>{theme}</small></div></article>)}</div><h2>Como é cada encontro?</h2><ol>{['Bom Dia, Deus','A Palavra','Mate da Reflexão','Para Pensar','Conversa com Deus','Um Passo para Hoje'].map(item=><li key={item}>{item}</li>)}</ol><p>Conheça a proposta do devocional e crie sua conta para acessar os recursos disponíveis.</p><div className="guest-demo-actions"><button onClick={()=>setScreen('signup')}>Criar minha conta</button><button onClick={()=>setScreen('login')}>Já tenho uma conta</button></div></section></main>

  if (screen === 'terms' || screen === 'privacy') return <main className="app"><section className="auth-card legal-document"><button className="back-button" onClick={()=>setScreen('signup')}>← Voltar ao cadastro</button>{screen==='terms'?<><h1>Termos de Uso — minuta</h1><p>O Bíblia + Chimarrão disponibiliza conteúdo devocional e recursos pessoais de leitura. A conta é individual; o usuário deve fornecer dados corretos e proteger sua senha. Textos, imagens e obras do autor são protegidos por direitos autorais e não podem ser redistribuídos sem autorização. O usuário é responsável pelas anotações que inserir. O acesso gratuito e eventuais recursos pagos serão identificados antes da contratação. Nenhuma cobrança está ativa nesta etapa. Em caso de alterações relevantes, será publicada uma versão atualizada destes termos.</p></>:<><h1>Política de Privacidade — minuta</h1><p>Para criar e administrar a conta, o aplicativo utiliza nome, e-mail, credenciais de autenticação e dados associados ao uso dos recursos, como anotações, favoritos, lembretes e foto, quando fornecidos. O serviço utiliza infraestrutura de autenticação e armazenamento do Supabase e hospedagem no Cloudflare. As informações são usadas para autenticar o leitor, manter suas preferências e disponibilizar os recursos solicitados. Não informe dados sensíveis desnecessários em anotações. Você pode solicitar informações sobre seus dados ou sua exclusão pelo canal de contato indicado antes do lançamento comercial. A versão definitiva deverá detalhar contato do controlador, prazos de retenção, transferências internacionais e procedimentos para exercício dos direitos previstos na LGPD.</p></>}<p><strong>Documento preliminar:</strong> será revisado antes da abertura pública dos cadastros.</p></section></main>

  if (screen === 'access') return (
    <main className="app"><section className="auth-card">
      <button className="back-button" onClick={() => setScreen('landing')}>← Voltar</button>
      <p className="eyebrow">BÍBLIA + CHIMARRÃO</p><h2>Bem-vindo ao seu encontro</h2>
      <p className="auth-intro">Entre na sua conta para continuar sua caminhada ou crie seu acesso para começar.</p>
      <div className="auth-actions"><button onClick={() => setScreen('login')}>Entrar</button><button className="secondary-action" onClick={() => setScreen('signup')}>Criar minha conta</button></div>
    </section></main>
  )

  return <main className="guest-cover-entry" aria-label="Apresentação do Bíblia + Chimarrão">
    <div className="guest-cover-shell">
      <img className="guest-cover-art" src="/capa-app-oficial.png" alt="Capa oficial Bíblia + Chimarrão, com Bíblia, chimarrão, cruz pincelada e carimbo do autor" />
      <div className="guest-cover-bottom"><button className="guest-cover-primary" onClick={()=>setScreen("devotional")}>Conhecer o aplicativo</button><button onClick={()=>setScreen('signup')}>Criar minha conta</button><button onClick={()=>setScreen('login')}>Já tenho uma conta</button></div>
    </div>
  </main>
}
