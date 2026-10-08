const PIX_COPIA_COLA='00020126480014br.gov.bcb.pix0126biblia.chimarrao@gmail.com5204000053039865802BR5913Romulo Schutz6009Sao Paulo62230519daqr238603757697802630439FC';
const PIX_QR_ROWS='1fc4d7006a17f,10413dfac9741,175152f75a35d,175eea902d25d,1757207ee885d,10529ac50cc41,1fd555555557f,1898c664f00,17c45d7e7bc7c,7b90ab28bb9c,ec0185e0c32f,1393a6ad92278,1a4ad454afcee,11a6df485886a,13f979d3356bd,ab35b5e85e59,197de5bd3fbe1,8af56a3944ea,10e16afd7b8bb,1b05512f562fb,13744ad4af1c5,fa5f4ccf12c9,3f98ffc0fff5,1713984654312,195b91d68f15c,31e564663b10,1dfc407e7d7f9,5938b935800b,87eea904bfad,39668a2d999a,2d14e02e76d9,1b210cec694f0,94087a2c3f50,a896cd06892a,1f436682c1c7b,e2b6851621bb,1b5a778827255,a95adf46302d,8fad4421ffea,e13073e58891,1c7e79fe67ffd,1e66c633b10,1fcb95d67e553,105ab4c57a513,175e70fc693fc,17598ba3fbbb2,175cd51935d49,1041933285bd5,1fd443993d30f'.split(',');
function ApoiePixQR(){return <svg className="apoie-qr" viewBox="0 0 57 57" role="img" aria-label="QR Code Pix de Romulo Schutz"><rect width="57" height="57" fill="white"/>{PIX_QR_ROWS.flatMap((row,y)=>Array.from({length:49},(_,x)=>((BigInt('0x'+row)>>BigInt(48-x))&1n)===1n?<rect key={y+'-'+x} x={x+4} y={y+4} width="1" height="1" fill="#111"/>:null).filter(Boolean))}</svg>}
const SOCIAL_LINKS = { facebook:"https://www.facebook.com/romuloschutz", instagram:"https://www.instagram.com/romuloschutz/", youtube:"https://www.youtube.com/@romuloschutz", whatsapp:"https://wa.me/5549999004892", email:"mailto:biblia.chimarrao@gmail.com" } // WhatsApp centralizado aqui para facilitar futura troca do número.
import { useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import { fetchCommercialCatalog, formatCommercialPrice } from './lib/commercial-catalog-api.js'
import EpubReader from './EpubReader.jsx'
import AnnualPurchasePanel from './AnnualPurchasePanel.jsx'

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
  const [annualPurchaseBusy,setAnnualPurchaseBusy]=useState(false)
  const [annualPurchaseMessage,setAnnualPurchaseMessage]=useState('')
  const [paymentReturn,setPaymentReturn]=useState(null)
  const [favoritePreview, setFavoritePreview] = useState(false)
  const [savedPreview, setSavedPreview] = useState(false)
  const [pensarNote, setPensarNote] = useState('')
  const [passoNote, setPassoNote] = useState('')
  const [encounterStatus, setEncounterStatus] = useState('')
  const [encounterAudioState, setEncounterAudioState] = useState('stopped')
  const encounterAudioRef = useRef({segments:[],index:0,offset:0,narratorVoice:null,bibleVoice:null,mode:'stopped',token:0})
  const [encounter, setEncounter] = useState(null)
  const [encounterLoading, setEncounterLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [recoveryEmail,setRecoveryEmail]=useState('')
  const [recoveryPassword,setRecoveryPassword]=useState('')
  const [recoveryConfirm,setRecoveryConfirm]=useState('')
  const [recoveryMessage,setRecoveryMessage]=useState('')
  const [recoveryBusy,setRecoveryBusy]=useState(false)
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
  const [notebookItems,setNotebookItems]=useState([])
  const [notebookLoading,setNotebookLoading]=useState(false)
  const [notebookForm,setNotebookForm]=useState({id:null,title:'',body:''})
  const [notebookMessage,setNotebookMessage]=useState('')
  const [notebookHistory,setNotebookHistory]=useState([])
  const [notebookFuture,setNotebookFuture]=useState([])
  const [bookFilter, setBookFilter] = useState('todos')
  const [bookSearch, setBookSearch] = useState('')
  const [readerTitle, setReaderTitle] = useState('')
  const [readerUrl, setReaderUrl] = useState('')
  const [bookAccess,setBookAccess]=useState({})
  const [bookAccessLoading,setBookAccessLoading]=useState(false)
  const [bookAccessMessage,setBookAccessMessage]=useState('')
  const [commercialCatalog,setCommercialCatalog]=useState({})
  useEffect(()=>{
    let active=true
    fetchCommercialCatalog().then(({products,error})=>{
      if(!active || error) return
      const byCode=Object.fromEntries(products.map(product=>[product.code,product]))
      setCommercialCatalog(byCode)
    })
    return ()=>{active=false}
  },[])
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
  const [adminBookUser,setAdminBookUser]=useState(null)
  const [adminBookEntitlements,setAdminBookEntitlements]=useState([])
  const [adminBookLoading,setAdminBookLoading]=useState(false)
  const [adminAuthorItems,setAdminAuthorItems]=useState([])
  const [publishedAuthorContent,setPublishedAuthorContent]=useState([])
  const [authorContentLoading,setAuthorContentLoading]=useState(false)
  const [selectedAuthorBook,setSelectedAuthorBook]=useState('')
  const [readAuthorContentIds,setReadAuthorContentIds]=useState([])
  const [adminAuthorLoading,setAdminAuthorLoading]=useState(false)
  const [adminAuthorMessage,setAdminAuthorMessage]=useState('')
  const [adminAuthorFilter,setAdminAuthorFilter]=useState('all')
  const [adminAuthorStatusFilter,setAdminAuthorStatusFilter]=useState('all')
  const [adminAuthorSearch,setAdminAuthorSearch]=useState('')
  const [adminAuthorPreview,setAdminAuthorPreview]=useState(null)
  const [adminAuthorSort,setAdminAuthorSort]=useState('recent')
  const [adminAuthorDirty,setAdminAuthorDirty]=useState(false)
  const [adminAuthorForm,setAdminAuthorForm]=useState({id:null,content_type:'reflection',book_key:'',theme:'',title:'',highlight:'',body:'',media_url:'',media_kind:'',media_caption:'',is_published:false})
  const [installPrompt,setInstallPrompt]=useState(null)
  const [installMessage,setInstallMessage]=useState('')
  const [isStandalone,setIsStandalone]=useState(()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true)

  useEffect(()=>{
    localStorage.setItem('bc-appearance',appearance)
    const media=window.matchMedia('(prefers-color-scheme: dark)')
    const apply=()=>{document.documentElement.dataset.appearance=appearance==='system'?(media.matches?'dark':'light'):appearance}
    apply()
    media.addEventListener?.('change',apply)
    return ()=>media.removeEventListener?.('change',apply)
  },[appearance])
  useEffect(()=>{
    const onPrompt=e=>{e.preventDefault();setInstallPrompt(e)}
    const onInstalled=()=>{setInstallPrompt(null);setIsStandalone(true);setInstallMessage('✓ Bíblia + Chimarrão instalado.')}
    window.addEventListener('beforeinstallprompt',onPrompt)
    window.addEventListener('appinstalled',onInstalled)
    return()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled)}
  },[])

  async function installApp(){
    if(installPrompt){
      await installPrompt.prompt()
      const choice=await installPrompt.userChoice
      if(choice.outcome==='accepted')setInstallMessage('Instalação iniciada. O ícone ficará na tela do seu celular.')
      setInstallPrompt(null);return
    }
    const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent)
    setInstallMessage(isiOS?'No iPhone/iPad: abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.':'No navegador, abra o menu ⋮ e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.')
  }

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
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if(event==='PASSWORD_RECOVERY'){setRecoveryMessage('');setRecoveryPassword('');setRecoveryConfirm('');setScreen('resetPassword')}
    })
    return () => listener.subscription.unsubscribe()
  }, [])


  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const payment=params.get('payment_return')
    if(!['success','pending','failure'].includes(payment))return
    setPaymentReturn(payment)
    setScreen('paymentReturn')
    window.history.replaceState({},document.title,window.location.pathname)
  },[])

  useEffect(()=>{
    if(!user||!supabase){setIsAdmin(false);return}
    let cancelled=false
    supabase.rpc('is_app_admin').then(({data,error})=>{
      if(!cancelled) setIsAdmin(error ? false : data === true)
    })
    return()=>{cancelled=true}
  },[user?.id])

  useEffect(()=>{
    if(!user||!supabase){setPublishedAuthorContent([]);return}
    let cancelled=false
    setAuthorContentLoading(true)
    supabase.from('author_content').select('id,content_type,book_key,theme,title,highlight,body,media_url,media_kind,media_caption,sort_order,published_at,created_at').eq('is_published',true).order('published_at',{ascending:false}).then(({data,error})=>{
      if(!cancelled){setPublishedAuthorContent(error?[]:(data||[]));setAuthorContentLoading(false)}
    })
    return()=>{cancelled=true}
  },[user?.id])

  useEffect(()=>{
    if(!user?.id){setReadAuthorContentIds([]);return}
    try{setReadAuthorContentIds(JSON.parse(localStorage.getItem('bc-author-read-'+user.id)||'[]'))}catch{setReadAuthorContentIds([])}
  },[user?.id])

  function markAuthorContentRead(id){
    if(!user?.id||!id)return
    setReadAuthorContentIds(current=>{
      if(current.includes(id))return current
      const next=[...current,id]
      localStorage.setItem('bc-author-read-'+user.id,JSON.stringify(next))
      return next
    })
  }

  function openAuthorNotification(item){
    markAuthorContentRead(item.id)
    if(item.content_type==='reflection'){setScreen('ideas');return}
    if(item.book_key){openAuthorBookContent(item.book_key);return}
    setScreen('ideas')
  }

  function openAuthorBookContent(bookKey){
    const detailKey=bookKey==='Chimarrão com Deus — 365 Encontros com Deus'?'Chimarrão com Deus':bookKey
    setSelectedAuthorBook(detailKey)
    setScreen('authorBookContent')
    window.scrollTo(0,0)
  }

  async function loadBookAccess(){
    if(!user||!supabase)return
    setBookAccessLoading(true);setBookAccessMessage('')
    const {data,error}=await supabase.rpc('my_book_library')
    if(error){setBookAccessMessage('Não foi possível verificar sua biblioteca.');setBookAccess({});setBookAccessLoading(false);return}
    const map={}
    ;(data||[]).forEach(item=>{
      map[item.title]={...item}
      if(item.title==='Bíblia + Chimarrão')map['Chimarrão com Deus — 365 Encontros com Deus']={...item}
    })
    setBookAccess(map);setBookAccessLoading(false)
  }
  useEffect(()=>{if(user?.id)loadBookAccess();else setBookAccess({})},[user?.id])
  async function openBooks(){
    setBookAccessMessage('')
    await loadBookAccess()
    setScreen('books')
    window.scrollTo(0,0)
  }

  async function secureBookUrl(title,download=false){
    setBookAccessMessage('')
    const access=bookAccess[title]
    if(!access?.has_access||!access?.edition_id){setBookAccessMessage('Este livro ainda não está liberado para sua conta.');return null}
    const {data:sessionData}=await supabase.auth.getSession()
    if(!sessionData?.session){setBookAccessMessage('Sua sessão expirou. Entre novamente na sua conta para acessar o livro.');return null}
    const session=sessionData.session
    const endpoint=`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-epub-access`
    let response
    try{
      response=await fetch(endpoint,{method:'POST',headers:isAdmin?{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify(isAdmin?{edition_id:access.edition_id,access_token:session.access_token,download}:{edition_id:access.edition_id,download})})
    }catch(err){
      setBookAccessMessage('Não foi possível abrir o arquivo protegido: falha de conexão com o servidor.')
      return null
    }
    let data={}
    try{data=await response.json()}catch{}
    if(!response.ok||!data?.signed_url){if(download&&response.status===403&&data?.download_available_at){const when=new Date(data.download_available_at);setBookAccessMessage('Download protegido: disponível a partir de '+when.toLocaleDateString('pt-BR')+' às '+when.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'. A leitura no aplicativo continua liberada.');return null}setBookAccessMessage('Não foi possível abrir o arquivo protegido: '+(data?.error||('erro '+response.status+' ao gerar acesso temporário.')));return null}
    return data.signed_url
  }
  async function openSecureBook(title){
    const url=await secureBookUrl(title)
    if(!url)return
    setReaderTitle(title);setReaderUrl(url);setScreen('epub-reader');window.scrollTo(0,0)
  }
  async function downloadSecureBook(title){
    const url=await secureBookUrl(title,true);if(!url)return
    window.open(url,'_blank','noopener,noreferrer')
  }

  async function purchaseCommercialBook(book){
    const product=book?.productCode?commercialCatalog[book.productCode]:null
    if(!user||!supabase||!product?.isActive)return
    const accepted=window.confirm('Compra digital: a leitura no aplicativo será liberada após a confirmação do pagamento. O download do EPUB ficará disponível após 7 dias. Ao continuar, você confirma que leu e aceita a Política de Compra Digital e a Licença Digital. Deseja ir para o Mercado Pago?')
    if(!accepted)return
    setBookAccessMessage('Preparando checkout seguro do Mercado Pago...')
    const {data:sessionData}=await supabase.auth.getSession()
    const session=sessionData?.session
    if(!session){setBookAccessMessage('Sua sessão expirou. Entre novamente para comprar.');return}
    try{
      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-create-order`,{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},
        body:JSON.stringify({product_code:book.productCode,accepted:true})
      })
      let data={}
      try{data=await response.json()}catch{}
      if(!response.ok||!data?.checkout_url){setBookAccessMessage('Não foi possível iniciar a compra: '+(data?.error||('erro '+response.status))+'.');return}
      window.location.assign(data.checkout_url)
    }catch{setBookAccessMessage('Não foi possível conectar ao checkout do Mercado Pago.')}
  }

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
  // O estado isStandalone definido no início também atende às notificações.

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

  async function removeEncounterNote(id) {
    if (!user || !supabase || !id) return
    if (!window.confirm('Remover esta anotação? Esta ação não apaga o encontro nem o progresso da sua caminhada.')) return
    setNotesLoading(true); setMessage('')
    const { error } = await supabase.from('reader_records')
      .update({para_pensar_note:'',um_passo_para_hoje_note:''})
      .eq('id',id).eq('user_id',user.id)
    if (error) {
      setMessage('Não foi possível remover a anotação.')
      setNotesLoading(false)
      return
    }
    setNoteItems(items => items.filter(item => item.id !== id))
    setNotesLoading(false)
  }

  async function openNotebook(){
    if(!user||!supabase)return
    setNotebookLoading(true);setNotebookMessage('')
    const {data,error}=await supabase.from('reader_notebook').select('id,title,body,created_at,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false})
    if(error){setNotebookMessage('Não foi possível carregar seu caderno.');setNotebookItems([])}
    else setNotebookItems(data||[])
    setScreen('notebook');setNotebookLoading(false);window.scrollTo({top:0,behavior:'smooth'})
  }

  function updateNotebookBody(next){
    setNotebookHistory(h=>[...h.slice(-29),notebookForm.body])
    setNotebookFuture([])
    setNotebookForm(v=>({...v,body:next}))
  }
  function undoNotebook(){
    if(!notebookHistory.length)return
    const previous=notebookHistory[notebookHistory.length-1]
    setNotebookFuture(f=>[notebookForm.body,...f].slice(0,30))
    setNotebookHistory(h=>h.slice(0,-1))
    setNotebookForm(v=>({...v,body:previous}))
  }
  function redoNotebook(){
    if(!notebookFuture.length)return
    const next=notebookFuture[0]
    setNotebookHistory(h=>[...h.slice(-29),notebookForm.body])
    setNotebookFuture(f=>f.slice(1))
    setNotebookForm(v=>({...v,body:next}))
  }

  function formatNotebook(kind){
    const el=document.getElementById('notebook-body-editor');if(!el)return
    const start=el.selectionStart,end=el.selectionEnd,selected=el.value.slice(start,end)
    const formats={bold:['**','**'],italic:['*','*'],underline:['__','__'],highlight:['==','==']}
    if(kind==='list'){
      const text=selected||el.value.slice(start)
      const changed=text.split('\n').map(line=>line.trim()?'- '+line.replace(/^[-•]\s*/,''):line).join('\n')
      const next=el.value.slice(0,start)+changed+el.value.slice(end)
      updateNotebookBody(next);return
    }
    const pair=formats[kind];if(!pair)return
    const replacement=pair[0]+selected+pair[1]
    const next=el.value.slice(0,start)+replacement+el.value.slice(end)
    updateNotebookBody(next)
    setTimeout(()=>{el.focus();const pos=start+pair[0].length+(selected?selected.length+pair[1].length:0);el.setSelectionRange(pos,pos)},0)
  }

  async function saveNotebookEntry(e){
    e.preventDefault();if(!user||!supabase)return
    const title=notebookForm.title.trim()||'Minha anotação',body=notebookForm.body.trim()
    if(!body){setNotebookMessage('Escreva alguma coisa antes de salvar.');return}
    setNotebookLoading(true);setNotebookMessage('Salvando...')
    const payload={user_id:user.id,title,body,updated_at:new Date().toISOString()}
    const result=notebookForm.id?await supabase.from('reader_notebook').update(payload).eq('id',notebookForm.id).eq('user_id',user.id):await supabase.from('reader_notebook').insert(payload)
    if(result.error){setNotebookMessage('Não foi possível salvar: '+result.error.message);setNotebookLoading(false);return}
    setNotebookForm({id:null,title:'',body:''});setNotebookMessage('✓ Guardado no seu caderno.')
    const {data}=await supabase.from('reader_notebook').select('id,title,body,created_at,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false})
    setNotebookItems(data||[]);setNotebookLoading(false)
  }

  async function deleteNotebookEntry(id){
    if(!user||!supabase||!window.confirm('Excluir esta página do seu caderno?'))return
    const {error}=await supabase.from('reader_notebook').delete().eq('id',id).eq('user_id',user.id)
    if(error){setNotebookMessage('Não foi possível excluir.');return}
    setNotebookItems(list=>list.filter(x=>x.id!==id));setNotebookMessage('Página excluída.')
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
    if (!user) { setScreen('guestDemo'); setMessage('Os encontros completos fazem parte da edição anual 2027. Crie sua conta e adquira a edição para começar sua caminhada.'); return }
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

  function stopEncounterAudio() {
    if (!('speechSynthesis' in window)) return
    encounterAudioRef.current.mode = 'stopped'
    encounterAudioRef.current.token += 1
    window.speechSynthesis.cancel()
    setEncounterAudioState('stopped')
  }

  function speakEncounterSegment(index, offset = 0) {
    const audio = encounterAudioRef.current
    if (audio.mode !== 'playing' || index >= audio.segments.length) {
      if (index >= audio.segments.length) {
        audio.mode = 'stopped'
        setEncounterAudioState('stopped')
      }
      return
    }
    audio.index = index
    audio.offset = Math.max(0, offset)
    const [role, fullText] = audio.segments[index]
    const remaining = String(fullText).slice(audio.offset).trimStart()
    if (!remaining) { speakEncounterSegment(index + 1, 0); return }
    const leadingTrim = String(fullText).slice(audio.offset).length - remaining.length
    audio.offset += leadingTrim
    const utterance = new SpeechSynthesisUtterance(remaining)
    utterance.lang = 'pt-BR'
    utterance.rate = role === 'bible' ? 0.88 : 0.94
    utterance.pitch = role === 'bible' ? 0.92 : 1
    utterance.voice = role === 'bible' ? audio.bibleVoice : audio.narratorVoice
    const token = audio.token
    utterance.onboundary = event => {
      if (encounterAudioRef.current.token === token && typeof event.charIndex === 'number') {
        encounterAudioRef.current.offset = audio.offset + event.charIndex
      }
    }
    utterance.onend = () => {
      const current = encounterAudioRef.current
      if (current.token !== token || current.mode !== 'playing') return
      current.offset = 0
      speakEncounterSegment(index + 1, 0)
    }
    utterance.onerror = event => {
      const current = encounterAudioRef.current
      if (current.token !== token || current.mode === 'paused' || event.error === 'canceled' || event.error === 'interrupted') return
      current.mode = 'stopped'
      setEncounterAudioState('stopped')
    }
    window.speechSynthesis.speak(utterance)
  }

  function pauseResumeEncounterAudio() {
    if (!('speechSynthesis' in window)) return
    const audio = encounterAudioRef.current
    if (encounterAudioState === 'playing') {
      audio.mode = 'paused'
      audio.token += 1
      window.speechSynthesis.cancel()
      setEncounterAudioState('paused')
    } else if (encounterAudioState === 'paused') {
      audio.mode = 'playing'
      audio.token += 1
      setEncounterAudioState('playing')
      speakEncounterSegment(audio.index, audio.offset)
    }
  }

  function playEncounterAudio() {
    if (!encounter || !('speechSynthesis' in window)) {
      setEncounterStatus('A leitura em voz alta não está disponível neste dispositivo.')
      return
    }
    window.speechSynthesis.cancel()
    const voices = window.speechSynthesis.getVoices()
    const ptVoices = voices.filter(v => /^pt(-|_)/i.test(v.lang || ''))
    const narratorVoice = ptVoices[0] || voices[0] || null
    const bibleVoice = ptVoices.find(v => v.voiceURI !== narratorVoice?.voiceURI) || voices.find(v => v.voiceURI !== narratorVoice?.voiceURI) || narratorVoice
    const rawSegments = [
      ['narrator', 'Dia ' + encounter.day_number + '. ' + (encounter.title || '')],
      ['narrator', 'Bom Dia, Deus. ' + (encounter.bom_dia_deus || '')],
      ['narrator', 'A Palavra. ' + (encounter.verse_reference || '') + '. ' + (encounter.bible_version || 'Almeida 1911') + '.'],
      ['bible', encounter.verse_text || ''],
      ['narrator', 'Mate da Reflexão. ' + (encounter.reflection || '')],
      ['narrator', 'Para Pensar. ' + (encounter.para_pensar || '')],
      ['narrator', 'Conversa com Deus. ' + (encounter.conversa_com_deus || '')],
      ['narrator', 'Um Passo para Hoje. ' + (encounter.um_passo_para_hoje || '')]
    ].filter(([,text]) => String(text).trim())
    // Blocos curtos tornam Pausar/Continuar confiável também em navegadores
    // que não informam a posição exata (onboundary) da síntese de voz.
    const segments = rawSegments.flatMap(([role,text]) => {
      const parts = String(text).match(/[^.!?;:]+[.!?;:]?|[^.!?;:]+$/g) || [String(text)]
      const chunks = []
      for (const part of parts) {
        const clean = part.trim()
        if (!clean) continue
        if (clean.length <= 150) chunks.push(clean)
        else {
          const words = clean.split(/\s+/); let chunk = ''
          for (const word of words) {
            if ((chunk + ' ' + word).trim().length > 130 && chunk) { chunks.push(chunk); chunk = word }
            else chunk = (chunk + ' ' + word).trim()
          }
          if (chunk) chunks.push(chunk)
        }
      }
      return chunks.map(chunk => [role,chunk])
    })
    if (!segments.length) return
    encounterAudioRef.current = {segments,index:0,offset:0,narratorVoice,bibleVoice,mode:'playing',token:encounterAudioRef.current.token+1}
    setEncounterAudioState('playing')
    speakEncounterSegment(0,0)
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
  if(screen==='news'&&user){
    const unread=publishedAuthorContent.filter(item=>!readAuthorContentIds.includes(item.id))
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Notificações</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Voltar</button></header><section className="support-page"><h1>Novidades do autor</h1>{authorContentLoading?<p>Carregando novidades...</p>:publishedAuthorContent.length?<div className="admin-user-list">{publishedAuthorContent.slice(0,12).map(item=>{const isNew=!readAuthorContentIds.includes(item.id);return <button type="button" className="admin-user-card author-news-card" key={item.id} onClick={()=>openAuthorNotification(item)}><div className="admin-user-head"><div><strong>{item.title}</strong><small>{item.theme||item.book_key||'Publicação de Romulo Schutz'}</small></div>{isNew&&<span className="admin-status active">NOVO</span>}</div>{item.highlight&&<blockquote>“{item.highlight}”</blockquote>}<strong className="author-news-open">Abrir conteúdo →</strong></button>})}</div>:<p>Nenhuma publicação do autor no momento.</p>}{unread.length===0&&publishedAuthorContent.length>0&&<p className="author-news-read">✓ Você está em dia com as novidades.</p>}<button className="support-copy" onClick={()=>setScreen('reminder')}>Configurar Hora do Mate</button></section></main>}
  if (screen === 'ideas' && user) {
    const defaults = [
      {id:'default-tempo',theme:'TEMPO',highlight:'O tempo passa. O que fazemos com ele deixa marcas.',body:'Um espaço para perceber a vida com mais atenção — sem correr para uma resposta antes de compreender a pergunta.'},
      {id:'default-caminhada',theme:'CAMINHADA',highlight:'Nem todo passo precisa ser grande. Precisa ser verdadeiro.',body:'Há dias de avanço e dias de permanência. Ambos podem fazer parte de uma caminhada que amadurece.'},
      {id:'default-esperanca',theme:'ESPERANÇA',highlight:'Esperar não é ficar parado. É continuar caminhando sem possuir todas as respostas.',body:'A esperança sustenta o presente enquanto aquilo que ainda não vemos continua sendo construído.'},
      {id:'default-fe',theme:'FÉ E VIDA',highlight:'A fé não elimina as perguntas; ela muda o lugar de onde começamos a enfrentá-las.',body:'Aqui, fé, história e experiência humana podem conversar sem transformar a reflexão em respostas fáceis.'}
    ]
    const reflections = [...publishedAuthorContent.filter(item=>item.content_type==='reflection'),...defaults]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Ideias e Reflexões</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome ideas-head stage3-ideas-head"><p className="eyebrow">IDEIAS E REFLEXÕES</p><h2>Palavras para levar consigo.</h2><p>Um espaço para pensamentos, perguntas e pequenas pausas sobre tempo, história, fé, esperança e vida.</p><div className="ideas-author">Romulo Schutz<small>Notas do autor</small></div></section><section className="ideas-grid">{reflections.map((item,index)=><article className="idea-card stage3-idea" key={item.id||item.title||index}><div className="idea-number">{String(index+1).padStart(2,'0')}</div><div><span>{item.theme||'REFLEXÃO'}</span>{item.title&&<h3>{item.title}</h3>}{item.highlight&&<blockquote>“{item.highlight}”</blockquote>}{item.body&&<p>{item.body}</p>}<small>Romulo Schutz</small></div></article>)}</section><section className="ideas-note"><span>✦</span><div><strong>Um espaço que continuará crescendo.</strong><p>Novas ideias e reflexões poderão ser acrescentadas ao aplicativo ao longo da caminhada.</p></div></section></main>
  }

  if(screen==='authorBookContent'&&user){
    const items=publishedAuthorContent.filter(item=>item.book_key===selectedAuthorBook)
    const typeNames={book_page:'PÁGINA COMPLEMENTAR',quote:'CITAÇÃO / FRASE',note:'NOTA DO AUTOR',reflection:'REFLEXÃO',book_image:'IMAGEM DO LIVRO',book_video:'VÍDEO DO LIVRO'}
    const works=[
      {title:'Chimarrão com Deus',sub:'365 Encontros com Deus',meta:'Devocional diário 2027',image:'/capa-devocional-oficial.jpg',status:'DEVOCIONAL 2027',text:'Uma pausa diária para abrir a Palavra, refletir, conversar com Deus e transformar o encontro em um passo concreto para o dia.'},
      {title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus',meta:'História · Filosofia · Teologia',image:'/1000769251.jpg',status:'LIVRO PUBLICADO',text:'Uma obra sobre tempo, calendário, história e fé, percorrendo a construção humana do tempo e sua relação com a compreensão cristã.'},
      {title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado',meta:'Tempo · Corpo · Alma · Espírito',image:'/1000670931(1).jpg',status:'LIVRO PUBLICADO',text:'Uma reflexão sobre a vida no mundo acelerado e a esperança cristã, olhando para o ser humano em suas dimensões de tempo, corpo, alma e espírito.'},
      {title:'Cristo: O Marco Entre o Antes e o Depois',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo',meta:'História · Calendário · Fé',image:'/Cristo_O_Marco_Entre_O_Antes_E_O_Depois_CAPA_EBOOK.png',status:'LIVRO PUBLICADO',text:'Uma investigação histórica e reflexiva sobre como sociedades organizaram o tempo e como Cristo se tornou referência para a contagem da era cristã, distinguindo documentação histórica, interpretação e leitura teológica.'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',meta:'Trilogia em desenvolvimento',image:'/image (1).png',status:'EM DESENVOLVIMENTO',text:'Uma narrativa sobre cidade, escolhas, relações, fé e consequências. Três movimentos de uma mesma história: NASCE, CRESCE e VIVE.'},
      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',meta:'Religioso · Filosófico · Político · Econômico',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},
      {title:'Entre os Sistemas II',sub:'Fé e Doutrina: Suficiência de Cristo',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Continuação do projeto Entre os Sistemas, voltada à fé, à doutrina cristã e à suficiência de Cristo como fundamento da vida e da reflexão.'},
      {title:'Entre a Honra e a Gratidão',sub:'Fidelidade, Lealdade, Obediência e Amor',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Uma reflexão sobre honra e gratidão a partir da fidelidade, da lealdade, da obediência e do amor, relacionando esses valores à fé e às relações humanas.'}
    ]
    const work=works.find(x=>x.title===selectedAuthorBook)||{title:selectedAuthorBook,sub:'',meta:'',image:'/capa-app-oficial.png',status:'OBRA',text:''}
    const editorial={
      'Cristo: O Marco Entre o Antes e o Depois':{
        section:'Da contagem do tempo à mudança de referência',
        image:'/cristo-o-marco-imagem-editorial.png',
        cover:'A capa apresenta uma linha histórica de referências humanas para organizar o tempo. Roma, ruínas, livros e instrumentos de medição representam estruturas políticas, culturais e cronológicas. Os volumes dedicados a Roma, Diocleciano, Dionísio Exíguo, Beda e Gregório XIII conduzem o olhar por etapas distintas dessa história. O título CRISTO marca a mudança de referência: Roma e seus sistemas não desaparecem, mas a forma de numerar e interpretar a história passa, séculos depois, a tomar Cristo como eixo.',
        special:'A imagem editorial percorre a organização romana do tempo, a memória das perseguições, as tabelas pascais de Dionísio Exíguo, a escrita histórica de Beda e a reforma gregoriana até chegar ao calendário digital contemporâneo. A luz e a cruz funcionam como eixo simbólico entre o antes e o depois, sem transformar a leitura teológica em prova documental. César reorganizou o calendário; Dionísio propôs uma nova referência para a numeração dos anos; Beda ajudou a difundi-la na historiografia; e Gregório XIII corrigiu o calendário sem substituir a era cristã. Cristo não precisou do calendário para entrar na História. Foram os homens que, séculos depois, passaram a organizar a História tomando Cristo como referência.'
      },
      'Entre os Tempos':{
        section:'O tempo como criação, dádiva e limite',
        image:'/entre-os-tempos-imagem-editorial.png',
        cover:'A capa reúne fé, Antiguidade, instrumentos de medição e símbolos do tempo para lembrar que a humanidade aprendeu a observar e organizar os ciclos, mas não criou o tempo. A obra atravessa calendários, povos e séculos perguntando não apenas como contamos os dias, mas como compreendemos seu significado diante da eternidade.',
        special:'Antes que o homem construísse calendários, o tempo já pertencia a Deus. Luz e trevas, Sol e Lua, fases e estações aparecem como parte da ordem criada, não como divindades. Povos e civilizações olharam para o mesmo céu e transformaram a observação em calendários, colheitas, celebrações e formas de organizar a sociedade. No centro dessa história, porém, permanece uma verdade: o tempo não foi dado apenas para produzir. A pausa, a família e a contemplação recordam que há tempo para trabalhar e tempo para cessar. A Bíblia permanece como bússola para compreender o propósito. O mundo continua enquanto descansamos; não precisamos sustentar o universo com nossa ansiedade. O tempo não é somente aquilo que contamos. É também aquilo que recebemos — e aquilo que recebemos precisa ser vivido.'
      },
      'Entre o Já e o Ainda Não':{
        section:'A Mesa do Diálogo',
        image:'/entre-o-ja-e-o-ainda-nao-mesa-do-dialogo.png',
        cover:'A capa apresenta dois modos de atravessar o mesmo tempo. De um lado, cidade, velocidade e movimento; do outro, caminho, natureza, broto e horizonte. No centro, o relógio recorda que o tempo não acelera para quem corre nem desacelera para quem descansa. Entre o já e o ainda não, a questão não é apenas passar pelo tempo, mas aprender a vivê-lo.',
        special:'A imagem da mesa representa o próprio método do livro. O autor se senta com seu chimarrão e, ao lado, existe uma cadeira reservada ao leitor. Ao redor estão filósofos, teólogos, reformadores, escritores, pensadores e estudiosos da mente humana. Eles não são convocados para um tribunal, mas para uma conversa. A filosofia, o estoicismo, a literatura e a psicanálise ajudam a formular perguntas e compreender dimensões da experiência humana, embora nenhuma dessas vozes ocupe sozinha o centro. No centro estão a Bíblia e a cruz: a Bíblia como bússola que aponta para Cristo; Cristo como âncora da esperança. Muitas vozes participam da conversa, mas o leitor também tem lugar à mesa: sente-se conosco; essa pergunta também é sua.'
      },
      'Chimarrão com Deus':{
        section:'Aquilo que recebi no caminho, agora posso repartir',
        image:'/chimarrao-com-deus-imagem-editorial.png',
        cover:'A capa é um convite à pausa, à comunhão e à caminhada. O chimarrão pede presença; o caminho representa a jornada; o banco recorda o descanso; o ipê atravessa estações e continua revelando beleza; a igreja aponta para comunhão com Deus e com os irmãos; e o relógio recorda que o tempo não para. São 365 pausas não para fugir da vida, mas para retornar a ela depois de um encontro com Deus.',
        special:'A caminhada devocional amadurece até se transformar em generosidade. Recomeço, intimidade, fé, cruz, restauração, tempestades e esperança deixam de ser apenas experiências pessoais e passam a produzir fruto para o outro. A Bíblia aberta permanece no centro; o pão, o chimarrão e os alimentos representam aquilo que pode ser repartido; a igreja recorda comunhão; e o gesto de ajudar quem está atravessando uma dificuldade mostra que quem já enfrentou tempestades pode agora sentar-se ao lado de quem ainda está nelas. A comunhão com Deus começa a produzir comunhão com o próximo. Generosidade, aqui, é transformar aquilo que recebemos no caminho em presença, cuidado e partilha.'
      }
    }[selectedAuthorBook]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Obra de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={()=>setScreen('authorBooks')}>← Livros</button><button className="logout" onClick={()=>setScreen('dashboard')}>⌂ Início</button></div></header>
      <section className="author-work-detail"><div className="author-work-detail-cover"><img src={work.image} alt={'Capa de '+work.title}/></div><div className="author-work-detail-copy"><span className="author-work-status">{work.status}</span><h1>{work.title}</h1>{work.sub&&<h2>{work.sub}</h2>}<p>{work.text}</p>{work.meta&&<small>{work.meta}</small>}{work.status==='LIVRO PUBLICADO'&&(bookAccessLoading?<button className="book-disabled" disabled>Verificando acesso...</button>:bookAccess[work.title]?.has_access?<div className="book-actions"><button onClick={()=>openSecureBook(work.title)}>Ler no aplicativo →</button><button className="book-download" onClick={()=>downloadSecureBook(work.title)}>Baixar EPUB ↓</button></div>:<div className="book-actions"><button className="primary" disabled>Adquirir livro digital — em breve</button><small className="book-license-note">A compra será habilitada aqui quando o checkout estiver disponível.</small></div>)}{isAdmin&&<button className="primary" onClick={()=>{setAdminAuthorForm({id:null,content_type:'book_page',book_key:selectedAuthorBook,theme:'',title:'',highlight:'',body:'',media_url:'',media_kind:'',media_caption:'',is_published:false});setAdminAuthorMessage('');setScreen('adminAuthor');window.scrollTo(0,0)}}>✍ Adicionar conteúdo a esta obra</button>}</div></section>
      {editorial&&<section className="author-work-editorial"><p className="eyebrow">POR TRÁS DA OBRA</p><article><h2>O significado da capa</h2><p>{editorial.cover}</p></article><article className="author-work-special"><h2>{editorial.section}</h2><img className="author-work-editorial-image" src={editorial.image} alt={editorial.section+" — "+work.title} loading="lazy"/><p>{editorial.special}</p></article></section>}
      <section className="author-content-heading"><p className="eyebrow">DO AUTOR PARA O LEITOR</p><h2>Conteúdos complementares</h2><p>Notas, citações e páginas que ampliam a experiência desta obra sem alterar o EPUB.</p></section>
      <section className="author-content-list">{items.length?items.map(item=><article className={'author-content-card '+item.content_type} key={item.id}><span>{typeNames[item.content_type]||'CONTEÚDO'}</span>{item.theme&&<small>{item.theme}</small>}<h3>{item.title}</h3>{item.highlight&&<blockquote>“{item.highlight}”</blockquote>}{item.media_kind==='image'&&item.media_url&&<figure className="author-book-media"><img src={item.media_url} alt={item.media_caption||item.title} loading="lazy"/>{item.media_caption&&<figcaption>{item.media_caption}</figcaption>}</figure>}{item.media_kind==='youtube'&&item.media_url&&<div className="author-book-video"><iframe src={youtubeEmbedUrl(item.media_url)} title={item.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/></div>}{item.media_kind==='video'&&item.media_url&&<video className="author-book-native-video" controls preload="metadata" src={item.media_url}/>} {item.body&&<p>{item.body}</p>}<footer>Romulo Schutz</footer></article>):<article className="author-content-empty"><strong>Conteúdo em preparação.</strong><p>O autor ainda não publicou material complementar para esta obra.</p></article>}</section></main>
  }

  if (screen === 'author') {
    const published = ['Entre os Tempos — A Urgência de Compreender o Calendário de Deus', 'Entre o Já e o Ainda Não — Esperança Inabalável em um Mundo Acelerado', 'Cristo — O Marco entre o Antes e o Depois']
    const devotional = ['Chimarrão com Deus — 365 Encontros com Deus (devocional)']
    const inPreparation = ['Entre a Cidade e o Silêncio — texto concluído; ilustrações em preparação']
    const projects2027 = ['Entre os Sistemas I — Religioso, Filosófico, Político e Econômico: Cristo, o Libertador', 'Entre os Sistemas II — Fé e Doutrina: Suficiência de Cristo', 'Entre a Honra e a Gratidão — Fidelidade, Lealdade, Obediência e Amor']
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Conheça o autor</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header>
      <section className="author-profile-hero stage3-author-hero"><div className="author-profile-photo premium-author-welcome"><img src="/autor-romulo.jpg.png" alt="Olá, querido leitor — Romulo Schutz" onError={e=>{e.currentTarget.style.display='none'}}/><div className="author-photo-fallback">Romulo Schutz<small>Autor · História · Fé · Reflexão</small></div></div><div className="author-profile-intro"><p className="eyebrow">AUTOR</p><h2>Romulo Schutz</h2><p>Escritor, pesquisador e autor de obras que dialogam com história, filosofia, teologia e esperança cristã.</p><button onClick={() => setScreen('authorBooks')}>Conhecer as obras →</button></div></section>
      <section className="author-profile-body"><p className="eyebrow">SOBRE O AUTOR</p><h3>Entre a história, o pensamento e a fé.</h3><p>Romulo Schutz é escritor, graduado em História e pequeno empresário em Otacílio Costa, Santa Catarina, cidade onde vive com a esposa, Scheila Schutz, e os filhos, Marco Antônio e Maria Antônia. É presbítero da Assembleia de Deus em sua cidade.</p><p>Sua trajetória reúne a experiência familiar, o trabalho como empresário e a dedicação ao estudo. Além da formação em História, realiza cursos de teologia, filosofia e psicanálise, buscando ampliar seus referenciais, dialogar com diferentes perspectivas e manter uma aprendizagem contínua.</p><p>É desse encontro entre história, pensamento e experiência humana que nascem muitas das perguntas presentes em seus livros. Em sua escrita, o autor investiga o tempo, as estruturas da sociedade, as relações humanas, os conflitos da existência e os desafios da vida contemporânea. Ao percorrer diferentes correntes de pensamento, preserva a fé cristã e a centralidade de Cristo como fundamentos de sua reflexão.</p><p>Sua trajetória literária começou com <em>Entre os Tempos — A Urgência de Compreender o Calendário de Deus</em>, seguido por <em>Entre o Já e o Ainda Não — Esperança Inabalável em um Mundo Acelerado</em>, pelo devocional <em>Chimarrão com Deus — 365 Encontros com Deus</em> e por <em>Cristo — O Marco entre o Antes e o Depois</em>. Cada obra convida o leitor a conhecer, questionar e refletir, relacionando a investigação intelectual às questões da fé e da vida cotidiana.</p><p>Para 2027, prepara novos projetos literários que aprofundam o diálogo entre sociedade, história, doutrina cristã, honra, gratidão e relações humanas.</p></section>
      <section className="author-profile-works"><p className="eyebrow">OBRAS PUBLICADAS E PROJETOS</p><h3>Livros e próximos capítulos</h3><div className="author-work-groups"><article><h4>Livros publicados</h4>{published.map(x=><p key={x}>✓ {x}</p>)}</article><article><h4>Devocional</h4>{devotional.map(x=><p key={x}>◈ {x}</p>)}</article><article><h4>Em preparação</h4>{inPreparation.map(x=><p key={x}>◇ {x}</p>)}</article><article><h4>Projetos previstos para 2027</h4>{projects2027.map(x=><p key={x}>◇ {x}</p>)}</article></div><button onClick={() => setScreen('authorBooks')}>Ver livros do Romulo →</button></section><blockquote className="author-profile-quote">“Cada livro nasce de uma pergunta. Cada história procura deixar o leitor diante de uma escolha.”<small>Romulo Schutz</small></blockquote>
    </main>
  }

  if (screen === 'authorBooks' && user) {
    const works = [
      {title:'Chimarrão com Deus',sub:'365 Encontros com Deus',meta:'Devocional diário 2027',image:'/capa-devocional-oficial.jpg',status:'DEVOCIONAL 2027',text:'Uma pausa diária para abrir a Palavra, refletir, conversar com Deus e transformar o encontro em um passo concreto para o dia.'},
      {title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus',meta:'História · Filosofia · Teologia',image:'/1000769251.jpg',status:'LIVRO PUBLICADO',text:'Uma obra sobre tempo, calendário, história e fé, percorrendo a construção humana do tempo e sua relação com a compreensão cristã.'},
      {title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado',meta:'Tempo · Corpo · Alma · Espírito',image:'/1000670931(1).jpg',status:'LIVRO PUBLICADO',text:'Uma reflexão sobre a vida no mundo acelerado e a esperança cristã, olhando para o ser humano em suas dimensões de tempo, corpo, alma e espírito.'},
      {title:'Cristo: O Marco Entre o Antes e o Depois',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo',meta:'História · Calendário · Fé',image:'/Cristo_O_Marco_Entre_O_Antes_E_O_Depois_CAPA_EBOOK.png',status:'LIVRO PUBLICADO',text:'Uma investigação histórica e reflexiva sobre como sociedades organizaram o tempo e como Cristo se tornou referência para a contagem da era cristã, distinguindo documentação histórica, interpretação e leitura teológica.'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',meta:'Trilogia em desenvolvimento',image:'/image (1).png',status:'EM DESENVOLVIMENTO',text:'Uma narrativa sobre cidade, escolhas, relações, fé e consequências. Três movimentos de uma mesma história: NASCE, CRESCE e VIVE.'},
      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',meta:'Religioso · Filosófico · Político · Econômico',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO',text:'Uma reflexão sobre sistemas que moldam a sociedade e a experiência humana, examinados à luz da centralidade e da liberdade encontradas em Cristo.'},
      {title:'Entre os Sistemas II',sub:'Fé e Doutrina: Suficiência de Cristo',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Continuação do projeto Entre os Sistemas, voltada à fé, à doutrina cristã e à suficiência de Cristo como fundamento da vida e da reflexão.'},
      {title:'Entre a Honra e a Gratidão',sub:'Fidelidade, Lealdade, Obediência e Amor',meta:'Projeto literário em desenvolvimento',image:'/capa-app-oficial.png',status:'EM DESENVOLVIMENTO',text:'Uma reflexão sobre honra e gratidão a partir da fidelidade, da lealdade, da obediência e do amor, relacionando esses valores à fé e às relações humanas.'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Obras de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome author-books-head stage3-authorbooks-head"><p className="eyebrow">LIVROS DO ROMULO</p><h2>Tempo, história, fé e esperança.</h2><p>Conheça as obras e projetos de Romulo Schutz — livros que percorrem o tempo, a vida e as perguntas que acompanham a caminhada humana.</p><div className="author-signature">Romulo Schutz<small>Autor · História · Fé · Reflexão</small></div></section><section className="author-books-grid stage3-authorbooks-grid">{works.map(work=>{const openWork=()=>{openAuthorBookContent(work.title)};return <article className="author-book-card author-book-clickable" key={work.title} role="button" tabIndex={0} onClick={openWork} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openWork()}}}><div className="author-book-cover"><img src={work.image} alt={'Capa de '+work.title} loading="lazy" /></div><div className="author-book-copy"><span>{work.status}</span><h3>{work.title}</h3><h4>{work.sub}</h4><p>{work.text}</p><small>{work.meta}</small><strong className="author-book-open">Ver página da obra →</strong></div></article>})}</section><section className="author-books-footer"><strong>Uma obra. Uma ideia. Uma conversa que continua.</strong><p>Este espaço acompanhará os livros publicados e os projetos em desenvolvimento.</p></section></main>
  }

  if (screen === 'epub-reader' && user) {
    return <EpubReader title={readerTitle} epubUrl={readerUrl} onBack={() => {setReaderUrl('');setScreen('books')}} />
  }

  if (screen === 'books' && user) {
    const books = [
      {title:'Chimarrão com Deus',sub:'365 Encontros com Deus',kind:'Devocional diário 2027',cover:'devotional',image:'/capa-devocional-oficial.jpg',status:'Disponível no aplicativo',group:'disponivel',action:'Abrir devocional',open:()=>setScreen('devotional')},
      {title:'Chimarrão com Deus — 365 Encontros com Deus',productCode:'devocional_chimarrao_com_deus_2027',sub:'Edição digital EPUB · Prévia 2027',kind:'Livro digital · acesso autorizado',cover:'devotional',image:'/capa-devocional-oficial.jpg',status:'EPUB cadastrado · disponível para contas autorizadas',group:'disponivel',action:'Ler EPUB'},
      {title:'Entre os Tempos',productCode:'ebook_entre_os_tempos',sub:'A Urgência de Compreender o Calendário de Deus',kind:'História · Filosofia · Teologia',cover:'tempos',image:'/1000769251.jpg',status:'EPUB disponível no aplicativo',group:'publicados',action:'Ler EPUB'},
      {title:'Entre o Já e o Ainda Não',productCode:'ebook_entre_ja_ainda_nao',sub:'A Esperança Inabalável em um Mundo Acelerado',kind:'Tempo · Corpo · Alma · Espírito',cover:'ja',image:'/1000670931(1).jpg',status:'EPUB disponível no aplicativo',group:'publicados',action:'Ler EPUB'},
      {title:'Cristo: O Marco Entre o Antes e o Depois',productCode:'ebook_cristo_marco',sub:'Como a Fé, a História e o Calendário se Encontram na Linha do Tempo',kind:'História · Calendário · Fé',cover:'cristo',image:'/Cristo_O_Marco_Entre_O_Antes_E_O_Depois_CAPA_EBOOK.png',status:'EPUB disponível no aplicativo',group:'publicados',action:'Ler EPUB'},
      {title:'Entre os Sistemas — Volume 1',sub:'Cristo, o Libertador',kind:'Religioso · Filosófico · Político · Econômico',cover:'sistemas',image:'/entre-sistemas-v1-cover.jpg',status:'PRÉ-LANÇAMENTO · EM BREVE',group:'projetos',action:'Em breve'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',kind:'Trilogia em desenvolvimento',cover:'cidade',image:'/image (1).png',status:'Em breve',group:'projetos',action:'Projeto em desenvolvimento'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Biblioteca de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome books-head stage3-library-head premium-library-banner" aria-label="Meus Livros"><img src="/História, Fé e Esperança para Sua Jornada.png" alt="Meus Livros — História, fé e esperança para sua jornada" /></section><div className="library-controls"><label htmlFor="library-search">Buscar na biblioteca</label><input id="library-search" type="search" value={bookSearch} onChange={e=>setBookSearch(e.target.value)} placeholder="Digite o título de um livro..." /><div className="library-filters" aria-label="Filtrar livros">{[['todos','Todos'],['disponivel','No aplicativo'],['publicados','Publicados'],['projetos','Projetos']].map(([key,label])=><button key={key} className={bookFilter===key?'selected':''} onClick={()=>setBookFilter(key)} aria-pressed={bookFilter===key}>{label}</button>)}</div><p className="library-explainer">Os EPUBs ficam protegidos por conta. Livros adquiridos ou liberados pelo administrador podem ser lidos no aplicativo e baixados para uso pessoal.</p>{bookAccessMessage&&<p className="encounter-save-status">{bookAccessMessage}</p>}</div><section className="books-grid stage3-books-grid">{books.filter(book=>(bookFilter==='todos'||book.group===bookFilter)&&[book.title,book.sub,book.kind].join(' ').toLocaleLowerCase('pt-BR').includes(bookSearch.trim().toLocaleLowerCase('pt-BR'))).map(book=><article className="book-card stage3-book" key={book.title} role="button" tabIndex={0} onClick={()=>book.open?book.open():openAuthorBookContent(book.title)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();book.open?book.open():openAuthorBookContent(book.title)}}}><div className={'book-cover '+book.cover}><img src={book.image} alt={'Capa de '+book.title} loading="lazy" /></div><div className="book-info"><span className="book-status">{book.status}</span><h3>{book.title}</h3><p>{book.sub}</p><small>{book.kind}</small>{book.open?<button onClick={e=>{e.stopPropagation();book.open()}}>{book.action} →</button>:(book.group==='publicados'||book.action==='Ler EPUB')?(bookAccessLoading?<button className="book-disabled" disabled>Verificando acesso...</button>:bookAccess[book.title]?.has_access?<div className="book-actions"><button onClick={e=>{e.stopPropagation();openSecureBook(book.title)}}>Ler no aplicativo →</button><button className="book-download" onClick={e=>{e.stopPropagation();downloadSecureBook(book.title)}}>Baixar EPUB ↓</button><small className="book-license-note">Cópia para uso pessoal. Não compartilhe ou redistribua o arquivo.</small></div>:<div className="book-actions">{book.productCode&&commercialCatalog[book.productCode]?.isActive?<button className="primary" onClick={e=>{e.stopPropagation();purchaseCommercialBook(book)}}>Comprar · {formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)} →</button>:<button className="book-disabled" disabled>{book.productCode&&commercialCatalog[book.productCode]?`🔒 Livro não adquirido · ${formatCommercialPrice(commercialCatalog[book.productCode].amountCents,commercialCatalog[book.productCode].currency)}`:'🔒 Livro não adquirido'}</button>}<small className="book-license-note">Após a confirmação do pagamento, a leitura será liberada nesta conta. O download do EPUB fica protegido por 7 dias.</small></div>):<button className="book-disabled" disabled>{book.action}</button>}</div></article>)}</section>{!books.some(book=>(bookFilter==='todos'||book.group===bookFilter)&&[book.title,book.sub,book.kind].join(' ').toLocaleLowerCase('pt-BR').includes(bookSearch.trim().toLocaleLowerCase('pt-BR'))) && <p className="library-empty">Nenhum livro encontrado. Experimente outro título ou filtro.</p>}</main>
  }

  if(screen==='notebook'&&user){
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Meu Caderno</small></div><div className="header-actions"><button className="logout" onClick={()=>setScreen('notes')}>← Anotações</button><button className="logout" onClick={()=>setScreen('dashboard')}>⌂ Início</button></div></header>
      <section className="welcome notes-head stage2-banner"><img src="/devocional/mes_05.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MEU CADERNO</p><h2>Um espaço só seu</h2><p>Escreva pensamentos, orações, ideias e reflexões pessoais. Estas páginas pertencem à sua conta.</p></div></section>
      <section className="notebook-shell"><form className="reader-settings-panel notebook-editor" onSubmit={saveNotebookEntry}><h2>{notebookForm.id?'Editar página':'Nova página'}</h2><label>Título<input value={notebookForm.title} onChange={e=>setNotebookForm(v=>({...v,title:e.target.value}))} placeholder="Ex.: Reflexão de hoje"/></label><label>Escreva livremente<div className="notebook-toolbar" aria-label="Formatação do caderno"><button type="button" onClick={undoNotebook} disabled={!notebookHistory.length} title="Desfazer">↶</button><button type="button" onClick={redoNotebook} disabled={!notebookFuture.length} title="Refazer">↷</button><button type="button" onClick={()=>formatNotebook('bold')} title="Negrito"><b>B</b></button><button type="button" onClick={()=>formatNotebook('italic')} title="Itálico"><i>I</i></button><button type="button" onClick={()=>formatNotebook('underline')} title="Sublinhar"><u>U</u></button><button type="button" onClick={()=>formatNotebook('highlight')} title="Destacar">🖍</button><button type="button" onClick={()=>formatNotebook('list')} title="Lista">☷</button></div><small className="notebook-format-hint">Selecione uma palavra ou frase e escolha a formatação.</small><textarea id="notebook-body-editor" rows="10" value={notebookForm.body} onChange={e=>{setNotebookHistory(h=>[...h.slice(-29),notebookForm.body]);setNotebookFuture([]);setNotebookForm(v=>({...v,body:e.target.value}))}} placeholder="Este espaço é seu. Escreva uma oração, pensamento, trecho que deseja guardar ou uma reflexão pessoal..."/></label><div className="admin-actions"><button disabled={notebookLoading}>{notebookForm.id?'Salvar alterações':'Guardar no meu caderno'}</button>{notebookForm.id&&<button type="button" onClick={()=>setNotebookForm({id:null,title:'',body:''})}>Cancelar</button>}</div>{notebookMessage&&<p role="status">{notebookMessage}</p>}</form>
      <section className="notebook-pages"><h2>Minhas páginas</h2>{notebookLoading&&!notebookItems.length?<p>Carregando...</p>:notebookItems.length?notebookItems.map(item=><article className="note-card notebook-page" key={item.id}><small>{new Date(item.updated_at).toLocaleDateString('pt-BR')}</small><h3>{item.title}</h3><p>{item.body}</p><div className="admin-actions compact-actions"><button type="button" onClick={()=>{setNotebookForm({id:item.id,title:item.title,body:item.body});window.scrollTo({top:0,behavior:'smooth'})}}>Editar</button><button type="button" className="admin-block" onClick={()=>deleteNotebookEntry(item.id)}>Excluir</button></div></article>):<div className="empty-state"><span>📓</span><h3>Seu caderno está esperando por você</h3><p>Comece escrevendo sua primeira página.</p></div>}</section></section></main>
  }

  if (screen === 'notes' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome notes-head stage2-banner"><img src="/devocional/mes_05.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MINHAS ANOTAÇÕES</p><h2>Palavras da sua caminhada</h2><p>Suas reflexões e passos ficam reunidos aqui para você revisitar quando quiser.</p></div></section><section className="notes-notebook-entry"><button type="button" onClick={openNotebook} aria-label="Abrir Meu Caderno"><img src="/card-meu-caderno.png" alt="Meu Caderno — seu espaço pessoal para pensamentos, orações, ideias e reflexões."/></button></section>{notesLoading ? <p className="encounter-save-status">Carregando suas anotações...</p> : noteItems.length ? <section className="notes-list">{noteItems.map(item => { const e=item.encontros; return <article className="note-card stage2-list-card" key={item.id}><img className="stage2-list-thumb" src={"/devocional/mes_"+String(months.find(m=>m[1]?.toLowerCase()===String(e.month_name||"").toLowerCase())?.[0]||1).padStart(2,"0")+".jpg"} alt=""/><div className="note-card-top"><span>✍️</span><small>DIA {e.day_number} · {e.day_of_month} DE {String(e.month_name||'').toUpperCase()}</small></div><h3>{e.title}</h3>{item.para_pensar_note?.trim() && <div className="note-block"><strong>Para Pensar</strong><small>{e.para_pensar}</small><p>{item.para_pensar_note}</p></div>}{item.um_passo_para_hoje_note?.trim() && <div className="note-block"><strong>Um Passo para Hoje</strong><small>{e.um_passo_para_hoje}</small><p>{item.um_passo_para_hoje_note}</p></div>}<div className="note-card-actions"><button className="note-open" onClick={() => openEncounter(e.day_number)}>Abrir encontro →</button><button className="note-remove" type="button" onClick={() => removeEncounterNote(item.id)}>Remover</button></div></article>})}</section> : <section className="empty-state"><span>✍️</span><h3>Nenhuma anotação ainda</h3><p>Nos encontros, escreva em Para Pensar ou Um Passo para Hoje e toque em Salvar. Suas palavras ficarão guardadas aqui.</p><button onClick={() => setScreen('devotional')}>Explorar o devocional →</button></section>}</main>
  }

  if (screen === 'favorites' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome favorites-head stage2-banner"><img src="/devocional/mes_11.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MEUS FAVORITOS</p><h2>Encontros que falaram com você</h2><p>Guarde aqui as mensagens que deseja encontrar novamente.</p></div></section>{favoritesLoading ? <p className="encounter-save-status">Carregando seus favoritos...</p> : favoriteItems.length ? <section className="favorites-list">{favoriteItems.map(item => { const e=item.encontros; return <article className="favorite-card stage2-list-card" key={e.day_number}><img className="stage2-list-thumb" src={"/devocional/mes_"+String(months.find(m=>m[1]?.toLowerCase()===String(e.month_name||"").toLowerCase())?.[0]||1).padStart(2,"0")+".jpg"} alt=""/><div className="favorite-card-top"><span>♥</span><small>DIA {e.day_number} · {e.day_of_month} DE {String(e.month_name||'').toUpperCase()}</small></div><h3>{e.title}</h3><blockquote>{e.verse_text}</blockquote><p className="favorite-reference">{e.verse_reference}</p><div className="favorite-actions"><button onClick={() => openEncounter(e.day_number)}>Abrir encontro →</button><button className="favorite-remove" onClick={() => removeFavoriteFromList(e.day_number)}>♡ Remover</button></div></article>})}</section> : <section className="empty-state"><span>♡</span><h3>Nenhum favorito ainda</h3><p>Quando uma mensagem falar especialmente com você, toque em Favoritar no encontro. Ela ficará guardada aqui.</p><button onClick={() => setScreen('devotional')}>Explorar o devocional →</button></section>}</main>
  }

  if (screen === 'journey' && user) {
    const pct = Math.round((journey.completed / 365) * 100)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><section className="welcome journey-head stage2-banner"><img src="/devocional/mes_09.jpg" alt="" className="stage2-banner-image"/><div className="stage2-banner-content"><p className="eyebrow">MINHA CAMINHADA</p><h2>Um passo de cada vez</h2><p>Aqui você acompanha os encontros que já concluiu ao longo do ano.</p><div className="journey-progress"><div className="journey-progress-bar" style={{width:pct+'%'}}></div></div><strong className="journey-percent">{pct}% da caminhada · {journey.completed} de 365 encontros</strong></div></section>{journeyLoading ? <p className="encounter-save-status">Carregando sua caminhada...</p> : <><section className="journey-stats"><div><strong>{journey.completed}</strong><small>Concluídos</small></div><div><strong>{journey.notes}</strong><small>Anotações</small></div><div><strong>{journey.favorites}</strong><small>Favoritos</small></div></section><section className="journey-resume"><p className="eyebrow">CONTINUAR</p>{journey.lastDay ? <><h3>Seu último encontro concluído</h3><p>Dia {journey.lastDay} — {journey.lastTitle}</p><button onClick={() => openEncounter(Math.min(journey.lastDay + 1,365))}>Continuar do próximo encontro →</button></> : <><h3>Sua caminhada começa aqui</h3><p>Conclua seu primeiro encontro para começar a registrar seu progresso.</p><button onClick={() => openEncounter(1)}>Abrir o Dia 1 →</button></>}</section><section style={{marginTop:24}}><p className="eyebrow">CICLOS MENSAIS</p><h3>Um mês de cada vez</h3><p>Os dias preenchidos estão concluídos. Toque em um dia pendente para continuar. O ciclo se fecha ao completar todos os encontros do mês.</p><div className="journey-cycles-grid">{months.map(([number,name,theme])=>{const first=months.slice(0,number-1).reduce((sum,[m])=>sum+new Date(2027,m,0).getDate(),0)+1;const total=new Date(2027,number,0).getDate();const days=Array.from({length:total},(_,i)=>first+i);const count=days.filter(d=>completedDays.includes(d)).length;const closed=count===total;return <article className="stage2-cycle" key={number} style={{padding:16,border:'1px solid #bfa064',borderRadius:14}}><div className="stage2-cycle-cover"><img src={'/devocional/mes_'+String(number).padStart(2,'0')+'.jpg'} alt=""/><div><h3>{closed?'✓ ':'◯ '}{name}</h3><small>{theme}</small></div><b>{Math.round(count/total*100)}%</b></div><p><strong>{count}/{total}</strong> · {closed?'Ciclo concluído':'Em andamento'}</p><div style={{height:6,background:'#ddd',borderRadius:6,marginBottom:12}}><div style={{width:count/total*100+'%',height:'100%',background:'#a78442',borderRadius:6}}/></div><div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:5}}>{days.map((day,i)=>{const done=completedDays.includes(day);return <button key={day} type="button" onClick={()=>openEncounter(day)} title={name+' · dia '+(i+1)+(done?' concluído':' pendente')} aria-label={name+' dia '+(i+1)+(done?' concluído':' pendente')} style={{minWidth:0,aspectRatio:'1',borderRadius:'50%',border:done?'2px solid #a78442':'1px solid #aaa',background:done?'#a78442':'transparent',color:done?'#fff':'inherit',cursor:'pointer',fontSize:12}}>{i+1}</button>})}</div></article>})}</div></section></>}</main>
  }

  if (screen === 'devotional') {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · 365 Encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header>{message && !user && <div className="guest-demo-error" role="alert">{message}</div>}<section className="welcome devotional-intro"><p className="eyebrow">CHIMARRÃO COM DEUS · 365 ENCONTROS COM DEUS</p><h2>Escolha um mês</h2><p>Uma caminhada de 365 encontros, um dia de cada vez.</p></section>{!user && <section className="guest-demo-hint guest-demo-start"><h2>Conheça a edição 2027</h2><p>Veja os doze meses, os temas e a estrutura da caminhada. Os encontros completos são conteúdo da edição anual adquirida.</p><button onClick={()=>setScreen('signup')}>Criar conta e adquirir 2027 →</button></section>}<section className="months-grid">{months.map(([number,name,theme]) => <button key={number} className="month-card month-card-illustrated" onClick={() => openMonth(number)}><img className="month-cover-image" src={`/devocional/mes_${String(number).padStart(2, '0')}.jpg`} alt={`Ilustração de ${name}`} loading="lazy" /><span className="month-cover-caption"><span className="month-number">{String(number).padStart(2,'0')}</span><strong>{name}</strong><small>{theme}</small></span></button>)}</section>{!user && <section className="guest-demo-hint guest-demo-start"><h2>Gostou da apresentação?</h2><p>Crie sua conta para revisar a edição 2027, o valor e as condições antes de qualquer pagamento.</p><button onClick={()=>setScreen('signup')}>Quero adquirir a edição 2027 →</button></section>}</main>
  }

  if (screen === 'month') {
    const info = months.find(m => m[0] === selectedMonth)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · Devocional 2027</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('devotional')}>← Meses</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome devotional-intro"><img className="month-intro-image" src={`/devocional/mes_${String(selectedMonth).padStart(2, '0')}.jpg`} alt={`Ilustração de ${info?.[1] || 'mês'}`} /><p className="eyebrow">MÊS {selectedMonth}</p><h2>{info?.[1]}</h2><p>{info?.[2]}</p></section>{devotionalLoading ? <p className="encounter-save-status">Carregando...</p> : <section className="days-grid">{monthDays.map(day => <button key={day.day_number} className="day-card" onClick={() => user ? openEncounter(day.day_number) : setScreen('signup')}><span className="day-number">{day.day_of_month}</span><span className="day-copy"><small>Dia {day.day_number}</small><strong>{day.title}</strong></span><span className="day-arrow">{!user ? "🔒" : "›"}</span></button>)}</section>}</main>
  }

  if (screen === 'encounter') {
    if (encounterLoading || !encounter) return <main className="dashboard"><p className="encounter-save-status">Carregando encontro...</p></main>
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Chimarrão com Deus · Prévia 2027</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'guestDemo')}>← Voltar</button><button className="logout" onClick={() => setScreen(user ? 'dashboard' : 'landing')}>⌂ Início</button></div></header><article className="welcome stage2-encounter"><div className="stage2-encounter-hero"><img src={"/devocional/mes_"+String(months.find(m=>m[1]?.toLowerCase()===String(encounter.month_name||"").toLowerCase())?.[0]||1).padStart(2,"0")+".jpg"} alt=""/><div className="stage2-encounter-heading"><p className="eyebrow">DIA {encounter.day_number} · {encounter.day_of_month} DE {String(encounter.month_name || '').toUpperCase()}</p><h2>{encounter.title}</h2></div></div><div className="encounter-audio-controls" role="group" aria-label="Leitura em voz alta do encontro"><button type="button" onClick={playEncounterAudio} disabled={encounterAudioState==='playing'}>🔊 {encounterAudioState==='stopped'?'Ouvir o Encontro':'Reiniciar'}</button><button type="button" onClick={pauseResumeEncounterAudio} disabled={encounterAudioState==='stopped'}>{encounterAudioState==='paused'?'▶ Continuar':'⏸ Pausar'}</button><button type="button" onClick={stopEncounterAudio} disabled={encounterAudioState==='stopped'}>■ Parar</button></div><div className="dash-message">☀️ <strong>Bom Dia, Deus</strong><p>{encounter.bom_dia_deus}</p></div><div className="dash-message">📖 <strong>A Palavra</strong><p>{encounter.verse_text}</p><small><strong>{encounter.verse_reference}</strong>{encounter.bible_version ? ' — '+encounter.bible_version : ' — Almeida 1911'}</small></div><div className="dash-message"><div className="mate-title-row"><strong>🧉 Mate da Reflexão</strong><button className="share-mate" onClick={shareMate}>↗ Compartilhar</button></div>{String(encounter.reflection || '').split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div><div className="dash-message">💭 <strong>Para Pensar</strong><p>{encounter.para_pensar}</p><textarea disabled={!user} value={pensarNote} onChange={e => setPensarNote(e.target.value)} placeholder="Escreva aqui sua anotação..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><div className="dash-message">💬 <strong>Conversa com Deus</strong><p>{encounter.conversa_com_deus}</p></div><div className="dash-message">🌱 <strong>Um Passo para Hoje</strong><p>{encounter.um_passo_para_hoje}</p><textarea disabled={!user} value={passoNote} onChange={e => setPassoNote(e.target.value)} placeholder="Registre seu passo de hoje..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div>{!user && <div className="guest-preview-note"><strong>Gostou da experiência?</strong><p>Crie sua conta para registrar suas anotações e continuar sua caminhada.</p><button onClick={()=>setScreen("signup")}>Criar minha conta</button></div>}<nav className="encounter-actions" aria-label="Ações do encontro"><button disabled={encounter.day_number <= 1} onClick={goPrevious}>← <span>Anterior</span></button><button onClick={user ? saveEncounterNotes : ()=>setScreen("signup")}>✓ <span>{savedPreview ? 'Salvo!' : 'Salvar'}</span></button><button className={favoritePreview ? 'is-favorite' : ''} onClick={user ? toggleEncounterFavorite : ()=>setScreen("signup")}>{favoritePreview ? '♥' : '♡'} <span>{favoritePreview ? 'Favoritado' : 'Favoritar'}</span></button><button onClick={user || encounter.day_number<3 ? goNext : ()=>setScreen("guestDemo")}><span>Próximo</span> →</button></nav><button className="complete-encounter" onClick={user ? markEncounterCompleted : ()=>setScreen("signup")}>✓ Concluir este encontro</button>{encounterStatus && <p className="encounter-save-status" role="status">{encounterStatus}</p>}</article></main>
  }

  if (screen === 'reminder' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Hora do Mate</small></div><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></header>
      <section className="welcome reminder-panel stage3-reminder"><div className="stage3-reminder-art premium-mate-image"><img src="/Hora do Mate ao Amanhecer.png" alt="Hora do Mate — chimarrão, Bíblia e relógio ao amanhecer"/></div><p className="eyebrow">🧉 HORA DO MATE</p><h2>Reserve um momento para o que importa.</h2><p>Escolha quando deseja ser lembrado de preparar seu chimarrão e viver seu encontro com Deus.</p>
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

  async function openAdminBooks(item){
    if(!isAdmin||!supabase)return
    setAdminBookUser(item);setAdminBookLoading(true);setAdminMessage('')
    const {data,error}=await supabase.rpc('admin_list_book_entitlements',{target_user_id:item.user_id})
    if(error){setAdminMessage('Erro ao carregar livros: '+error.message);setAdminBookEntitlements([])}
    else setAdminBookEntitlements(data||[])
    setAdminBookLoading(false)
  }

  async function changeBookEntitlement(book,grant){
    if(!adminBookUser||!isAdmin||!supabase)return
    setAdminMessage(grant?'Liberando livro...':'Removendo acesso ao livro...')
    const rpc=grant?'admin_grant_book':'admin_revoke_book'
    const args=grant?{target_user_id:adminBookUser.user_id,target_edition_id:book.edition_id,grant_source:'admin'}:{target_user_id:adminBookUser.user_id,target_edition_id:book.edition_id}
    const {error}=await supabase.rpc(rpc,args)
    if(error){setAdminMessage('Erro: '+error.message);return}
    await openAdminBooks(adminBookUser)
    const {data}=await supabase.rpc('admin_list_users')
    if(data)setAdminUsers(data)
    setAdminMessage(grant?'✓ Livro liberado para este leitor.':'✓ Acesso ao livro removido.')
  }

  async function openAuthorArea(){
    if(!isAdmin||!supabase)return
    setAdminAuthorLoading(true);setAdminAuthorMessage('');setScreen('adminAuthor')
    const {data,error}=await supabase.from('author_content').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false})
    setAdminAuthorLoading(false)
    if(error){setAdminAuthorMessage('Erro ao carregar: '+error.message);return}
    setAdminAuthorItems(data||[])
  }

  function resetAuthorForm(){
    setAdminAuthorForm({id:null,content_type:'reflection',book_key:'',theme:'',title:'',highlight:'',body:'',media_url:'',media_kind:'',media_caption:'',is_published:false});setAdminAuthorDirty(false)
  }

  function updateAuthorForm(patch){setAdminAuthorForm(v=>({...v,...patch}));setAdminAuthorDirty(true)}

  function youtubeEmbedUrl(url){
    const value=String(url||'').trim()
    const match=value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{6,})/)
    return match?'https://www.youtube.com/embed/'+match[1]:value
  }

  async function uploadAuthorMedia(e){
    const file=e.target.files?.[0];e.target.value=''
    if(!file||!supabase||!isAdmin)return
    const isImage=file.type.startsWith('image/'),isVideo=file.type.startsWith('video/')
    if(!isImage&&!isVideo){setAdminAuthorMessage('Escolha uma imagem ou vídeo compatível.');return}
    if(file.size>50*1024*1024){setAdminAuthorMessage('O arquivo deve ter no máximo 50 MB.');return}
    setAdminAuthorLoading(true);setAdminAuthorMessage('Enviando mídia...')
    const safe=(file.name||'midia').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-')
    const path=(adminAuthorForm.book_key||'geral').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').toLowerCase()+'/'+Date.now()+'-'+safe
    const {error}=await supabase.storage.from('book-media').upload(path,file,{upsert:false,contentType:file.type})
    if(error){setAdminAuthorMessage('Erro ao enviar mídia: '+error.message);setAdminAuthorLoading(false);return}
    const {data}=supabase.storage.from('book-media').getPublicUrl(path)
    updateAuthorForm({media_url:data.publicUrl,media_kind:isImage?'image':'video',content_type:isImage?'book_image':'book_video'})
    setAdminAuthorMessage('✓ Mídia enviada. Complete o título e publique quando estiver pronto.')
    setAdminAuthorLoading(false)
  }

  async function saveAuthorContent(e){
    e.preventDefault();if(!isAdmin||!supabase)return
    if(!adminAuthorForm.title.trim()){setAdminAuthorMessage('Informe o título.');return}
    if(adminAuthorForm.content_type!=='reflection'&&!adminAuthorForm.book_key){setAdminAuthorMessage('Selecione o livro deste conteúdo.');return}
    setAdminAuthorLoading(true);setAdminAuthorMessage('Salvando...')
    const payload={content_type:adminAuthorForm.content_type,book_key:adminAuthorForm.book_key||null,theme:adminAuthorForm.theme||null,title:adminAuthorForm.title.trim(),highlight:adminAuthorForm.highlight||null,body:adminAuthorForm.body||null,media_url:adminAuthorForm.media_url||null,media_kind:adminAuthorForm.media_kind||null,media_caption:adminAuthorForm.media_caption||null,is_published:adminAuthorForm.is_published,published_at:adminAuthorForm.is_published?new Date().toISOString():null,updated_at:new Date().toISOString()}
    let result
    if(adminAuthorForm.id) result=await supabase.from('author_content').update(payload).eq('id',adminAuthorForm.id)
    else result=await supabase.from('author_content').insert({...payload,created_by:user.id})
    if(result.error){setAdminAuthorLoading(false);setAdminAuthorMessage('Erro ao salvar: '+result.error.message);return}
    setPublishedAuthorContent(list=>adminAuthorForm.id?list.map(x=>x.id===adminAuthorForm.id?{...x,...payload}:x):list)
    resetAuthorForm();setAdminAuthorMessage(adminAuthorForm.is_published?'✓ Conteúdo salvo e publicado.':'✓ Rascunho salvo.')
    const {data}=await supabase.from('author_content').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false})
    setAdminAuthorItems(data||[]);setAdminAuthorLoading(false)
  }

  async function toggleAuthorPublish(item){
    const next=!item.is_published
    const {error}=await supabase.from('author_content').update({is_published:next,published_at:next?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',item.id)
    if(error){setAdminAuthorMessage('Erro: '+error.message);return}
    setAdminAuthorItems(list=>list.map(x=>x.id===item.id?{...x,is_published:next,published_at:next?new Date().toISOString():null}:x))
    if(next)setPublishedAuthorContent(list=>list.some(x=>x.id===item.id)?list.map(x=>x.id===item.id?{...x,is_published:true}:x):[...list,{...item,is_published:true}])
    else setPublishedAuthorContent(list=>list.filter(x=>x.id!==item.id))
    setAdminAuthorMessage(next?'✓ Publicado para os leitores.':'✓ Retirado da publicação. O conteúdo continua salvo como rascunho.')
  }

  async function changeAdminAccess(item,status){
    if(!isAdmin||!supabase||item.is_admin)return
    setAdminMessage('Atualizando acesso...')
    const {error}=await supabase.rpc('admin_set_user_access',{target_user_id:item.user_id,new_status:status,new_access_until:null,admin_notes:'Alteração manual pelo painel administrativo'})
    if(error){setAdminMessage('Erro ao atualizar: '+error.message);return}
    setAdminUsers(list=>list.map(u=>u.user_id===item.user_id?{...u,status,source:'manual',access_until:null}:u))
    setAdminMessage(status==='active'?'✓ Acesso liberado.':'✓ Acesso bloqueado.')
  }

  if(screen==='adminAuthor'&&user&&isAdmin){
    const typeNames={reflection:'Ideia / Reflexão',book_page:'Página complementar',quote:'Citação / Frase',note:'Nota do autor',book_image:'Imagem / página do livro',book_video:'Vídeo do livro'}
    const books=['Chimarrão com Deus','Entre os Tempos','Entre o Já e o Ainda Não','Cristo: O Marco Entre o Antes e o Depois','Entre a Cidade e o Silêncio','Entre os Sistemas I','Entre os Sistemas II','Entre a Honra e a Gratidão']
    const filteredAuthorItems=adminAuthorItems.filter(item=>{
      const q=adminAuthorSearch.trim().toLocaleLowerCase('pt-BR')
      const matchesBook=adminAuthorFilter==='all'||(adminAuthorFilter==='general'&&!item.book_key)||item.book_key===adminAuthorFilter
      const matchesStatus=adminAuthorStatusFilter==='all'||(adminAuthorStatusFilter==='published'&&item.is_published)||(adminAuthorStatusFilter==='draft'&&!item.is_published)
      const matchesSearch=!q||[item.title,item.theme,item.highlight,item.body,item.book_key].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q))
      return matchesBook&&matchesStatus&&matchesSearch
    }).sort((a,b)=>{
      if(adminAuthorSort==='title')return String(a.title||'').localeCompare(String(b.title||''),'pt-BR')
      if(adminAuthorSort==='book')return String(a.book_key||'Reflexões gerais').localeCompare(String(b.book_key||'Reflexões gerais'),'pt-BR')||String(a.title||'').localeCompare(String(b.title||''),'pt-BR')
      if(adminAuthorSort==='oldest')return new Date(a.created_at||0)-new Date(b.created_at||0)
      return new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0)
    })
    return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Área do Autor</small></div><button className="logout" onClick={()=>setScreen('admin')}>← Painel</button></header>
      <section className="admin-panel"><div className="admin-title"><p className="eyebrow">ÁREA DO AUTOR</p><h1>Publicações e conteúdos</h1><p>Crie e edite reflexões, citações, notas e páginas complementares dos livros. Os EPUBs permanecem separados e não são alterados aqui.</p></div>
      <form className="reader-settings-panel" onSubmit={saveAuthorContent}><h2>{adminAuthorForm.id?'Editar conteúdo':'Novo conteúdo'}</h2>
        <label>Tipo<select value={adminAuthorForm.content_type} onChange={e=>updateAuthorForm({content_type:e.target.value})}>{Object.entries(typeNames).map(([k,n])=><option key={k} value={k}>{n}</option>)}</select></label>
        {adminAuthorForm.content_type!=='reflection'&&<label>Livro<select value={adminAuthorForm.book_key} onChange={e=>updateAuthorForm({book_key:e.target.value})}><option value="">Selecione...</option>{books.map(b=><option key={b}>{b}</option>)}</select></label>}
        <label>Tema<input value={adminAuthorForm.theme} onChange={e=>updateAuthorForm({theme:e.target.value})} placeholder="Ex.: Tempo, Esperança, Fé" /></label>
        <label>Título<input value={adminAuthorForm.title} onChange={e=>updateAuthorForm({title:e.target.value})} required /></label>
        <label>Frase de destaque<input value={adminAuthorForm.highlight} onChange={e=>updateAuthorForm({highlight:e.target.value})} /></label>
        <label>Texto<textarea rows="8" value={adminAuthorForm.body} onChange={e=>updateAuthorForm({body:e.target.value})} /></label>
        {adminAuthorForm.content_type!=='reflection'&&<fieldset className="author-media-fieldset"><legend>Mídia do livro</legend><label>Enviar imagem ou vídeo<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={uploadAuthorMedia} disabled={adminAuthorLoading}/></label><small>Para contracapa, sumário e páginas internas, envie uma imagem por conteúdo. Vídeos próprios: até 50 MB.</small><label>Ou cole o link do YouTube<input type="url" value={adminAuthorForm.media_kind==='youtube'?adminAuthorForm.media_url:''} onChange={e=>updateAuthorForm({media_url:e.target.value,media_kind:e.target.value?'youtube':'',content_type:e.target.value?'book_video':adminAuthorForm.content_type})} placeholder="https://www.youtube.com/watch?v=..." /></label><label>Legenda da mídia<input value={adminAuthorForm.media_caption} onChange={e=>updateAuthorForm({media_caption:e.target.value})} placeholder="Ex.: Sumário — página 1 de 3" /></label>{adminAuthorForm.media_url&&<p className="author-media-ready">✓ Mídia vinculada a este conteúdo.</p>}</fieldset>}
        <label><input type="checkbox" checked={adminAuthorForm.is_published} onChange={e=>updateAuthorForm({is_published:e.target.checked})} /> Publicar para os leitores</label>
        <div className="admin-actions"><button disabled={adminAuthorLoading}>{adminAuthorForm.id?'Salvar alterações':'Criar conteúdo'}</button>{adminAuthorForm.id&&<button type="button" onClick={()=>{if(adminAuthorDirty&&!window.confirm('Descartar as alterações ainda não salvas?'))return;resetAuthorForm()}}>Cancelar edição</button>}</div>{adminAuthorDirty&&<p className="author-unsaved-warning">● Alterações ainda não salvas</p>}
      </form>
      {adminAuthorMessage&&<p className="admin-message" role="status">{adminAuthorMessage}</p>}
      <div className="admin-author-summary"><div><strong>{adminAuthorItems.length}</strong><span>Total</span></div><div><strong>{adminAuthorItems.filter(x=>x.is_published).length}</strong><span>Publicados</span></div><div><strong>{adminAuthorItems.filter(x=>!x.is_published).length}</strong><span>Rascunhos</span></div></div>
      <section className="admin-author-filters"><label>Buscar<input type="search" value={adminAuthorSearch} onChange={e=>setAdminAuthorSearch(e.target.value)} placeholder="Título, tema, frase ou texto..." /></label><label>Obra<select value={adminAuthorFilter} onChange={e=>setAdminAuthorFilter(e.target.value)}><option value="all">Todas as obras</option><option value="general">Reflexões gerais</option>{books.map(b=><option key={b} value={b}>{b}</option>)}</select></label><label>Situação<select value={adminAuthorStatusFilter} onChange={e=>setAdminAuthorStatusFilter(e.target.value)}><option value="all">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option></select></label><label>Ordenar<select value={adminAuthorSort} onChange={e=>setAdminAuthorSort(e.target.value)}><option value="recent">Atualizados recentemente</option><option value="title">Título A–Z</option><option value="book">Por obra</option><option value="oldest">Mais antigos primeiro</option></select></label></section>
      {adminAuthorPreview&&<div className="author-preview-backdrop" role="dialog" aria-modal="true" aria-label="Pré-visualização do conteúdo" onClick={()=>setAdminAuthorPreview(null)}><article className="author-preview-card" onClick={e=>e.stopPropagation()}><button type="button" className="author-preview-close" onClick={()=>setAdminAuthorPreview(null)}>×</button><span>{typeNames[adminAuthorPreview.content_type]||'CONTEÚDO'}</span>{adminAuthorPreview.book_key&&<small>{adminAuthorPreview.book_key}</small>}{adminAuthorPreview.theme&&<small>{adminAuthorPreview.theme}</small>}<h2>{adminAuthorPreview.title}</h2>{adminAuthorPreview.highlight&&<blockquote>“{adminAuthorPreview.highlight}”</blockquote>}{adminAuthorPreview.media_kind==='image'&&adminAuthorPreview.media_url&&<img className="author-work-editorial-image" src={adminAuthorPreview.media_url} alt={adminAuthorPreview.media_caption||adminAuthorPreview.title}/>} {adminAuthorPreview.media_kind==='youtube'&&adminAuthorPreview.media_url&&<div className="author-book-video"><iframe src={youtubeEmbedUrl(adminAuthorPreview.media_url)} title={adminAuthorPreview.title} allowFullScreen/></div>} {adminAuthorPreview.media_kind==='video'&&adminAuthorPreview.media_url&&<video className="author-book-native-video" controls src={adminAuthorPreview.media_url}/>} {adminAuthorPreview.media_caption&&<small>{adminAuthorPreview.media_caption}</small>}{adminAuthorPreview.body&&<p>{adminAuthorPreview.body}</p>}<footer>Romulo Schutz</footer><em>{adminAuthorPreview.is_published?'Publicado para os leitores':'Prévia de rascunho — ainda não publicado'}</em></article></div>}
      <h2>Conteúdos cadastrados <small>({filteredAuthorItems.length})</small></h2>{adminAuthorLoading&&!adminAuthorItems.length?<p>Carregando...</p>:filteredAuthorItems.length?<div className="admin-user-list">{filteredAuthorItems.map(item=><article className="admin-user-card" key={item.id}><div className="admin-user-head"><div><strong>{item.title}</strong><small>{typeNames[item.content_type]}{item.book_key?' · '+item.book_key:''}</small></div><span className={'admin-status '+(item.is_published?'active':'pending')}>{item.is_published?'Publicado':'Rascunho'}</span></div>{item.highlight&&<p>“{item.highlight}”</p>}<div className="admin-actions compact-actions"><button type="button" onClick={()=>setAdminAuthorPreview(item)}>Pré-visualizar</button><button type="button" onClick={()=>{setAdminAuthorForm({id:item.id,content_type:item.content_type,book_key:item.book_key||'',theme:item.theme||'',title:item.title||'',highlight:item.highlight||'',body:item.body||'',media_url:item.media_url||'',media_kind:item.media_kind||'',media_caption:item.media_caption||'',is_published:item.is_published});setAdminAuthorDirty(false);window.scrollTo({top:0,behavior:'smooth'})}}>Editar</button><button type="button" onClick={()=>toggleAuthorPublish(item)}>{item.is_published?'Despublicar':'Publicar'}</button><button type="button" className="admin-block" onClick={async()=>{if(!window.confirm('Excluir definitivamente “'+item.title+'”? Esta ação não pode ser desfeita.'))return;const {error}=await supabase.from('author_content').delete().eq('id',item.id);if(error){setAdminAuthorMessage('Erro ao excluir: '+error.message);return}setAdminAuthorItems(list=>list.filter(x=>x.id!==item.id));setPublishedAuthorContent(list=>list.filter(x=>x.id!==item.id));setAdminAuthorMessage('✓ Conteúdo excluído.')}}>Excluir</button></div></article>)}</div>:<p className="admin-message">Nenhum conteúdo encontrado com estes filtros.</p>}
      </section></main>
  }

  if(screen==='admin'&&user&&isAdmin){
    const filteredAdminUsers=adminUsers.filter(item=>{const q=adminSearch.trim().toLocaleLowerCase('pt-BR');return !q||String(item.full_name||'').toLocaleLowerCase('pt-BR').includes(q)||String(item.email||'').toLocaleLowerCase('pt-BR').includes(q)})
    return <main className="dashboard admin-page">
      <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Painel Administrativo</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Menu</button></header>
      <section className="admin-panel"><div className="admin-title"><p className="eyebrow">ÁREA RESTRITA</p><h1>Leitores</h1><p>Clientes, edições adquiridas e controle de acesso.</p></div>
        <div className="admin-summary"><div><strong>{adminUsers.length}</strong><span>Clientes</span></div><div><strong>{adminUsers.filter(u=>u.status==='active').length}</strong><span>Ativos</span></div><div><strong>{adminUsers.filter(u=>u.status==='blocked').length}</strong><span>Bloqueados</span></div></div>
        <button type="button" className="support-copy" onClick={openAuthorArea}>✍ Área do Autor — publicar e editar conteúdos</button>
        <label className="admin-search"><span>Buscar cliente</span><input type="search" value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="Nome ou e-mail" /></label>
        {adminMessage&&<p className="admin-message" role="status">{adminMessage}</p>}
        {adminLoading?<p>Carregando usuários...</p>:<div className="admin-user-list">{filteredAdminUsers.map(item=><article className="admin-user-card admin-user-compact" key={item.user_id}><div className="admin-user-head"><div><strong>{item.full_name||'Leitor'}</strong><small>{item.email}</small></div><span className={'admin-status '+item.status}>{item.is_admin?'Administrador':item.status==='active'?'Ativo':item.status==='blocked'?'Bloqueado':item.status==='cancelled'?'Cancelado':'Pendente'}</span></div><div className="admin-editions"><strong>Edições:</strong> {item.editions?.length?item.editions.sort((a,b)=>a-b).map(year=><span key={year}>{year}</span>):<em>Nenhuma</em>}</div>{!item.is_admin&&<div className="admin-actions compact-actions"><button type="button" onClick={()=>changeAdminAccess(item,'active')} disabled={item.status==='active'}>✓ Liberar</button><button type="button" onClick={()=>openAdminBooks(item)}>📚 Livros</button><button type="button" className="admin-block" onClick={()=>changeAdminAccess(item,'blocked')} disabled={item.status==='blocked'}>Bloquear</button><button type="button" className="admin-notify" title="Avisar atualização" aria-label={'Avisar atualização para '+(item.full_name||item.email)} onClick={()=>setAdminMessage('Aviso de atualização: módulo de envio será conectado às notificações/e-mail.')}>↻ Atualizar</button></div>}</article>)}</div>}
        {adminBookUser&&<section className="admin-book-access"><div className="admin-book-access-head"><div><p className="eyebrow">BIBLIOTECA DO LEITOR</p><h2>{adminBookUser.full_name||adminBookUser.email}</h2><p>Libere ou remova cada obra individualmente. Esta é a mesma permissão que futuramente será concedida automaticamente pelo Mercado Pago.</p></div><button type="button" onClick={()=>{setAdminBookUser(null);setAdminBookEntitlements([])}}>Fechar</button></div>{adminBookLoading?<p>Carregando livros...</p>:<div className="admin-book-list">{adminBookEntitlements.map(book=><article key={book.edition_id}><div><strong>{book.title}</strong>{book.subtitle&&<small>{book.subtitle}</small>}<span>{book.has_access?'✓ Liberado'+(book.source?' · '+book.source:''):'Não adquirido'}</span></div><button type="button" className={book.has_access?'admin-block':''} onClick={()=>changeBookEntitlement(book,!book.has_access)}>{book.has_access?'Remover acesso':'Liberar livro'}</button></article>)}</div>}</section>}
      </section>
    </main>
  }

  if (screen === 'accessRestricted' && user) {
    const annualProduct=commercialCatalog['app_biblia_chimarrao']
    const annualPrice=annualProduct?formatCommercialPrice(annualProduct):'R$ 34,90'
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Edição 2027</small></div><button className="logout" onClick={()=>setScreen('dashboard')}>← Menu</button></header><section className="admin-shell"><div className="admin-hero"><p className="eyebrow">ACESSO PREMIUM 2027</p><h1>Bíblia + Chimarrão — Edição 2027</h1><p>Tenha acesso aos 365 encontros de 2027, Minha Caminhada, favoritos, anotações e aos recursos premium da edição.</p><h2>{annualPrice} <small>· pagamento único para a Edição 2027</small></h2>{message&&message!=='Seu acesso ainda não está liberado.'&&<p>{message}</p>}<button type="button" onClick={()=>{setAnnualPurchaseMessage('');setScreen('annualPurchase');window.scrollTo(0,0)}} disabled={!annualProduct?.isActive}>Adquirir Edição 2027 — {annualPrice}</button><p><small>Pagamento processado com segurança pelo Mercado Pago.</small></p><hr/><h3>Já recebeu seu acesso pela sua empresa?</h3><p>Se sua empresa adquiriu uma licença para você, o administrador pode liberar sua conta sem pagamento individual.</p><button type="button" className="logout" onClick={()=>setScreen('dashboard')}>Voltar ao menu</button></div></section></main>
  }

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

            <div className="visual-quick">{(()=>{const unreadCount=publishedAuthorContent.filter(item=>!readAuthorContentIds.includes(item.id)).length;return <button className={unreadCount?'has-new-author-content':''} onClick={()=>user?setScreen('news'):setScreen("guestDemo")} aria-label={unreadCount?`Notificações — ${unreadCount} novidade(s) não lida(s)`:'Notificações'}><span className="visual-quick-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>{unreadCount>0&&<b className="visual-notification-badge">{unreadCount>9?'9+':unreadCount}</b>}</span><small>{unreadCount?'Novidades':'Notificações'}</small></button>})()}<button onClick={()=>{setMessage('');setScreen(user?'support':'guestInfo')}} aria-label="Apoie"><span className="visual-quick-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></span><small>Apoie</small></button></div>
          </div>
          <div className="visual-greeting"><span className="reader-avatar">{user?.user_metadata?.avatar_data_url?<img src={user.user_metadata.avatar_data_url} alt="Foto do leitor"/>:<span>{name.charAt(0).toUpperCase()}</span>}</span><div><strong>Olá, {name}!</strong><span>{user ? "Que bom ter você aqui!" : "Conheça o Bíblia + Chimarrão antes de criar sua conta."}</span></div><em>Uma palavra.<br/>Uma pausa.<br/>Um encontro.</em></div>
          {!user && <div className="guest-preview-note"><strong>Conheça seu espaço de leitura</strong><p>Explore os recursos, os meses e os temas da edição 2027. Os encontros completos são liberados após a aquisição anual.</p><button onClick={()=>setScreen("guestDemo")}>Conhecer a edição 2027</button><button onClick={()=>setScreen("signup")}>Criar minha conta</button><button className="guest-login" onClick={()=>setScreen("login")}>Já tenho uma conta</button></div>}<nav className="visual-card-grid" aria-label="Recursos do aplicativo">
            {[
              ["Devocional","365 encontros com Deus","/card-devocional.jpg",()=>requirePaidAccess(()=>setScreen('devotional')),"▣"],
              ["Encontro de Hoje","Seu encontro de hoje","/card-encontro.jpg",()=>requirePaidAccess(()=>setScreen('todayHome')),"☀"],
              ["Minha Caminhada","Registre e acompanhe","/card-caminhada.jpg",()=>openJourney(),"⌁"],
              ["Favoritos","Encontros que tocaram você","/card-favoritos.jpg",()=>openFavorites(),"♡"],
              ["Minhas Anotações","Suas reflexões e orações","/card-anotacoes.jpg",()=>openNotes(),"✎"],
              ["Meus Livros","Sua biblioteca particular","/card-meus-livros.jpg",()=>openBooks(),"▤"],
              ["Livros do Romulo","Conheça todas as obras","/card-livros-romulo.jpg",()=>setScreen('authorBooks'),"▥"],
              ["Ideias e Reflexões","Conteúdos para inspirar","/card-ideias.jpg",()=>setScreen('ideas'),"✧"],
              ["Hora do Mate","Não perca seu encontro","/card-hora-mate.jpg",()=>{setReminderMessage('');setScreen('reminder')},"◷"],
              ["Sobre o Autor","Conheça Romulo Schutz","/card-sobre-autor.jpg",()=>setScreen('author'),"♙"],
            ].map(([title,subtitle,image,action,symbol])=><button key={title} type="button" className={`visual-card individual-card${["Encontro de Hoje","Favoritos","Minhas Anotações","Meus Livros","Hora do Mate"].includes(title) ? " visual-frame-tune" : ""}`} style={{backgroundImage:`url("${image}")`}} onClick={user ? action : title === "Devocional" ? ()=>setScreen("devotional") : title === "Encontro de Hoje" ? ()=>openEncounter(1) : ()=>setScreen("guestDemo")} aria-disabled={!user}><span className="visual-card-copy"><span className="visual-card-symbol" aria-hidden="true">{symbol}</span><strong>{title}</strong><small>{subtitle}</small></span></button>)}
            <div className="visual-wide-art visual-wide-social" aria-label="Redes Sociais">
              <img src="/card-redes-horizontal.png" alt="Redes Sociais — acompanhe e compartilhe"/>
              <div className="wide-social-hotspots">
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"></a>
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"></a>
                <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"></a>
                <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"></a>
                <a href={SOCIAL_LINKS.email} aria-label="E-mail"></a>
              </div>
            </div>
            <div className="visual-wide-art visual-wide-message" aria-label="Todo dia é um novo encontro com Deus. Romulo Schutz">
              <img src="/card-mensagem-horizontal.png" alt="Todo dia é um novo encontro com Deus. Romulo Schutz"/>
            </div>
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
                <div className="stage1-quick"><button onClick={openJourney}><span>▥</span>Minha Caminhada</button><button onClick={openFavorites}><span>♡</span>Meus Favoritos</button><button onClick={openNotes}><span>✎</span>Minhas Anotações</button><button onClick={()=>openBooks()}><span>▤</span>Meus Livros</button></div>
              </div>
            </section>
          </div>
</main>
 }


  async function requestPasswordRecovery(event){
    event.preventDefault()
    const target=(recoveryEmail||email).trim()
    if(!target||!supabase){setRecoveryMessage('Informe o e-mail da sua conta.');return}
    setRecoveryBusy(true);setRecoveryMessage('Enviando link seguro...')
    const redirectTo=window.location.origin+'/?password_recovery=1'
    const {error}=await supabase.auth.resetPasswordForEmail(target,{redirectTo})
    setRecoveryBusy(false)
    if(error){setRecoveryMessage('Não foi possível enviar o link agora. Confira o e-mail e tente novamente.');return}
    setRecoveryMessage('Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a pasta de spam.')
  }

  async function finishPasswordRecovery(event){
    event.preventDefault()
    if(recoveryPassword.length<8){setRecoveryMessage('A nova senha precisa ter pelo menos 8 caracteres.');return}
    if(recoveryPassword!==recoveryConfirm){setRecoveryMessage('As duas senhas não são iguais.');return}
    setRecoveryBusy(true);setRecoveryMessage('Salvando sua nova senha...')
    const {error}=await supabase.auth.updateUser({password:recoveryPassword})
    setRecoveryBusy(false)
    if(error){setRecoveryMessage('Não foi possível alterar a senha. O link pode ter expirado; solicite uma nova recuperação.');return}
    setRecoveryPassword('');setRecoveryConfirm('');setRecoveryMessage('✓ Senha alterada com sucesso. Você já pode continuar no aplicativo.')
  }

  async function purchaseAnnualEdition(){
    const product=commercialCatalog['app_biblia_chimarrao']
    if(!user||!supabase||!product?.isActive){setAnnualPurchaseMessage('A edição 2027 ainda não está disponível para compra.');return}
    setAnnualPurchaseBusy(true);setAnnualPurchaseMessage('Preparando checkout seguro do Mercado Pago...')
    const {data:sessionData}=await supabase.auth.getSession();const session=sessionData?.session
    if(!session){setAnnualPurchaseBusy(false);setAnnualPurchaseMessage('Sua sessão expirou. Entre novamente para continuar.');return}
    try{
      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-create-order`,{method:'POST',headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({product_code:'app_biblia_chimarrao',accepted:true,return_base_url:window.location.origin})})
      let data={};try{data=await response.json()}catch{}
      if(!response.ok||!data?.checkout_url){setAnnualPurchaseMessage('Não foi possível iniciar a compra: '+(data?.error||('erro '+response.status))+'.');setAnnualPurchaseBusy(false);return}
      window.location.assign(data.checkout_url)
    }catch{setAnnualPurchaseMessage('Não foi possível conectar ao checkout do Mercado Pago.');setAnnualPurchaseBusy(false)}
  }

  if(screen === 'annualPurchase' && user) return <AnnualPurchasePanel product={commercialCatalog['app_biblia_chimarrao']} busy={annualPurchaseBusy} message={annualPurchaseMessage} onBack={()=>setScreen('dashboard')} onContinue={purchaseAnnualEdition}/>

  if(screen === 'paymentReturn') {
    const approved=paymentReturn==='success'
    const pending=paymentReturn==='pending'
    return <main className="dashboard payment-return-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Retorno do pagamento · Edição 2027</small></div></header><section className="admin-shell"><div className="admin-hero payment-return-card"><p className="eyebrow">{approved?'PAGAMENTO RECEBIDO':pending?'CONFIRMAÇÃO EM ANDAMENTO':'PAGAMENTO NÃO CONCLUÍDO'}</p><h1>{approved?'Obrigado! Estamos confirmando seu acesso.':pending?'Seu pagamento está sendo confirmado.':'O pagamento não foi concluído.'}</h1><p>{approved?'A confirmação segura é feita pelo nosso sistema. Se o Mercado Pago já confirmou a transação, sua Edição 2027 estará disponível na conta.':pending?'Não é necessário pagar novamente. Aguarde a confirmação do Mercado Pago e volte para sua conta.':'Nenhum acesso é liberado por esta tela. Você pode voltar ao aplicativo e tentar novamente quando desejar.'}</p>{user?<><button type="button" onClick={async()=>{await loadBookAccess();setPaymentReturn(null);setScreen('dashboard');window.scrollTo(0,0)}}>{approved?'Entrar no Bíblia + Chimarrão':'Voltar ao aplicativo'}</button>{approved&&<button type="button" className="logout" onClick={async()=>{setPaymentReturn(null);await openEncounter(1)}}>Entrar no Devocional →</button>}</>:<><p><strong>Entre na mesma conta usada na compra para verificar sua liberação.</strong></p><button type="button" onClick={()=>setScreen('login')}>Entrar na minha conta</button></>}</div></section></main>
  }

  if(screen==='forgotPassword') return <main className="app"><section className="auth-card"><button className="back-button" onClick={()=>{setRecoveryMessage('');setScreen('login')}}>← Voltar</button><p className="eyebrow">BÍBLIA + CHIMARRÃO</p><h2>Recuperar minha senha</h2><p className="auth-intro">Informe o e-mail da sua conta. Enviaremos um link seguro para você criar uma nova senha.</p><form className="auth-form" onSubmit={requestPasswordRecovery}><label>E-mail<input type="email" value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)} autoComplete="email" required/></label><button type="submit" disabled={recoveryBusy}>{recoveryBusy?'Enviando...':'Enviar link de recuperação'}</button></form>{recoveryMessage&&<p className="form-message" role="status">{recoveryMessage}</p>}</section></main>

  if(screen==='resetPassword') return <main className="app"><section className="auth-card"><p className="eyebrow">BÍBLIA + CHIMARRÃO</p><h2>Criar nova senha</h2><p className="auth-intro">Digite uma nova senha para sua conta.</p><form className="auth-form" onSubmit={finishPasswordRecovery}><label>Nova senha<input type="password" minLength="8" autoComplete="new-password" value={recoveryPassword} onChange={e=>setRecoveryPassword(e.target.value)} required/></label><label>Confirmar nova senha<input type="password" minLength="8" autoComplete="new-password" value={recoveryConfirm} onChange={e=>setRecoveryConfirm(e.target.value)} required/></label><button type="submit" disabled={recoveryBusy}>{recoveryBusy?'Salvando...':'Salvar nova senha'}</button></form>{recoveryMessage&&<p className="form-message" role="status">{recoveryMessage}</p>}{recoveryMessage.startsWith('✓')&&<button type="button" onClick={()=>setScreen(user?'dashboard':'login')}>Continuar no aplicativo →</button>}</section></main>

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
          {creating && <div className="signup-consent"><label><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} required/> Li e concordo com os <button type="button" className="legal-link" onClick={()=>setScreen('terms')}>Termos de Uso</button> e a <button type="button" className="legal-link" onClick={()=>setScreen('privacy')}>Política de Privacidade</button>.</label><small>A criação da conta não gera cobrança. Você poderá conhecer o aplicativo e adquirir separadamente o acesso premium Bíblia + Chimarrão — Edição 2027.</small></div>}
          <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : creating ? 'Criar minha conta' : 'Entrar'}</button>
          {!creating && <button type="button" className="legal-link" onClick={()=>{setRecoveryEmail(email);setRecoveryMessage('');setScreen('forgotPassword')}}>Esqueci minha senha</button>}
        </form>
        {message && <p className="form-message" role="status">{message}</p>}
      </section></main>
    )
  }

  if (screen === 'landing') return <main className="premium-opening guest-landing"><div className="premium-opening-frame landing-cover-frame"><img src="/capa-app-oficial.png" alt="Capa oficial Bíblia + Chimarrão"/><div className="premium-opening-actions guest-landing-actions landing-overlay-actions"><button className="guest-round-action" onClick={()=>setScreen(user ? 'dashboard' : 'guestDemo')}><span className="guest-round-icon" aria-hidden="true">✦</span><span className="guest-round-label">{user ? 'Entrar no aplicativo' : 'Conhecer o aplicativo'}</span></button>{!isStandalone&&<button className="guest-round-action install-round-action" onClick={installApp}><span className="guest-round-icon" aria-hidden="true">↓</span><span className="guest-round-label">Instalar aplicativo</span></button>}{installMessage&&<span className="install-message" role="status">{installMessage}</span>}{!user && <><button className="guest-round-action" onClick={()=>setScreen('signup')}><span className="guest-round-icon" aria-hidden="true">＋</span><span className="guest-round-label">Criar minha conta</span></button><button className="guest-round-action" onClick={()=>setScreen('login')}><span className="guest-round-icon" aria-hidden="true">↳</span><span className="guest-round-label">Já tenho uma conta</span></button></>}</div></div></main>

  if (!user && screen === 'guestDemo') return <main className="dashboard guest-demo-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Apresentação do aplicativo</small></div><button className="logout" onClick={()=>setScreen('landing')}>← Voltar</button></header><section className="guest-demo-intro"><p className="eyebrow">CONHEÇA O APLICATIVO</p><h1>Uma palavra. Uma pausa. Um encontro.</h1><p>O Bíblia + Chimarrão reúne o devocional Chimarrão com Deus, seus registros de leitura, reflexões, lembretes e uma biblioteca de obras do autor.</p></section><section className="guest-about-author"><img src="/autor-boas-vindas-oficial.webp" alt="Foto do autor Romulo Schutz"/><div><h2>Romulo Schutz</h2><p>Escritor de Otacílio Costa, Santa Catarina. Suas obras aproximam história, filosofia, teologia e esperança cristã.</p><p>Este aplicativo nasceu para oferecer um momento diário de leitura, reflexão e oração.</p></div></section><section className="guest-demo-format"><h2>O que você encontrará?</h2><div className="guest-feature-list">{[['Devocional','365 encontros organizados em doze meses.'],['Minha Caminhada','Acompanhe sua jornada de leitura.'],['Favoritos e Anotações','Guarde reflexões e registros pessoais.'],['Hora do Mate','Organize seu lembrete diário.'],['Livros do Romulo','Conheça as obras do autor.'],['Ideias e Reflexões','Textos para inspirar sua caminhada.']].map(([title,desc])=><article key={title}><strong>{title}</strong><p>{desc}</p></article>)}</div><h2>Os doze meses</h2><div className="guest-demo-months">{months.map(([number,name,theme])=><article key={number} className="guest-demo-month"><img src={`/devocional/mes_${String(number).padStart(2,'0')}.jpg`} alt={`Ilustração de ${name}`} loading="lazy"/><div><strong>{name}</strong><small>{theme}</small></div></article>)}</div><h2>Como é cada encontro?</h2><ol>{['Bom Dia, Deus','A Palavra','Mate da Reflexão','Para Pensar','Conversa com Deus','Um Passo para Hoje'].map(item=><li key={item}>{item}</li>)}</ol><p>Conheça a proposta do aplicativo. Os encontros completos são liberados com a aquisição do acesso premium da Edição 2027.</p><div className="guest-demo-actions"><button onClick={()=>setScreen('signup')}>Criar minha conta</button><button onClick={()=>setScreen('login')}>Já tenho uma conta</button></div></section></main>

  if (['terms','privacy','purchasePolicy','digitalLicense'].includes(screen)) {
    const legalBack=()=>setScreen(user?'dashboard':'signup')
    return <main className="app"><section className="auth-card legal-document">
      <button className="back-button" onClick={legalBack}>← Voltar</button>
      {screen==='terms'&&<><h1>Termos de Uso — Bíblia + Chimarrão</h1><p><strong>Versão:</strong> 04/10/2026</p><h2>1. Objeto</h2><p>O Bíblia + Chimarrão é uma plataforma digital de leitura, devocionais, biblioteca e recursos pessoais de acompanhamento, incluindo favoritos, anotações, Meu Caderno, lembretes e reprodução de conteúdo em áudio.</p><h2>2. Conta do usuário</h2><p>A conta é pessoal e intransferível. O usuário deve fornecer informações corretas, proteger suas credenciais e comunicar uso indevido de sua conta. Recursos pessoais permanecem vinculados ao usuário autenticado.</p><h2>3. Conteúdo e propriedade intelectual</h2><p>Textos, livros, devocionais, imagens, identidade visual e demais conteúdos autorais disponibilizados na plataforma são protegidos pela legislação de direitos autorais. O acesso ao conteúdo não transfere ao usuário direitos de autoria ou exploração comercial.</p><h2>4. Recursos pagos</h2><p>Produtos pagos, valores, características, período ou edição abrangida e condições da oferta serão apresentados claramente antes da contratação. A compra de um produto digital não autoriza compartilhamento, revenda ou distribuição do arquivo ou do acesso.</p><h2>5. Conteúdo pessoal</h2><p>O usuário é responsável pelo conteúdo que inserir em anotações e no Meu Caderno. Recomenda-se não registrar dados pessoais sensíveis desnecessários.</p><h2>6. Disponibilidade e manutenção</h2><p>Atualizações técnicas e manutenções podem ocorrer para segurança, correções e continuidade do serviço. Alterações relevantes nas condições contratuais serão comunicadas de forma adequada.</p><h2>7. Atendimento</h2><p>Dúvidas, solicitações e questões relativas à conta podem ser encaminhadas para <strong>biblia.chimarrao@gmail.com</strong>.</p><h2>8. Legislação aplicável</h2><p>Aplicam-se a legislação brasileira, o Código de Defesa do Consumidor, a legislação de comércio eletrônico, a Lei Geral de Proteção de Dados e a legislação de direitos autorais, conforme o caso.</p></>}
      {screen==='privacy'&&<><h1>Política de Privacidade — Bíblia + Chimarrão</h1><p><strong>Versão:</strong> 04/10/2026</p><h2>1. Dados tratados</h2><p>Podem ser tratados nome, e-mail, credenciais de autenticação, foto fornecida pelo usuário, preferências, favoritos, progresso de leitura, lembretes, anotações, conteúdo do Meu Caderno, registros necessários à liberação de produtos e dados técnicos indispensáveis ao funcionamento e à segurança.</p><h2>2. Finalidades</h2><p>Os dados são utilizados para criar e autenticar a conta, fornecer os recursos solicitados, manter preferências e histórico, administrar acessos e produtos adquiridos, atender solicitações, prevenir abuso e manter a segurança do serviço.</p><h2>3. Bases legais</h2><p>O tratamento observará as bases legais aplicáveis da LGPD, incluindo execução de contrato ou procedimentos relacionados à contratação, cumprimento de obrigação legal ou regulatória e, quando pertinente, legítimo interesse ou consentimento.</p><h2>4. Prestadores de serviço</h2><p>A plataforma utiliza serviços tecnológicos necessários à operação, atualmente incluindo Supabase para autenticação, banco de dados e armazenamento e Cloudflare para hospedagem e entrega da aplicação. O provedor de pagamento será identificado no fluxo de compra quando os pagamentos forem ativados.</p><h2>5. Conservação e segurança</h2><p>Os dados serão mantidos pelo período necessário às finalidades informadas, ao cumprimento de obrigações legais e à defesa de direitos. São adotadas medidas técnicas e administrativas compatíveis com a operação para reduzir riscos de acesso não autorizado, perda, alteração ou divulgação indevida.</p><h2>6. Direitos do titular</h2><p>O titular pode exercer os direitos previstos na LGPD, conforme aplicáveis, incluindo confirmação de tratamento, acesso, correção, informação, oposição e eliminação nos casos previstos em lei. Solicitações podem ser encaminhadas para <strong>biblia.chimarrao@gmail.com</strong>.</p><h2>7. Transferências e infraestrutura</h2><p>Prestadores tecnológicos podem processar ou armazenar dados em infraestrutura localizada fora do Brasil. Quando aplicável, o tratamento deverá observar os requisitos legais de transferência internacional de dados.</p><h2>8. Atualizações</h2><p>Esta política poderá ser atualizada para refletir mudanças legais, técnicas ou operacionais. Alterações relevantes serão comunicadas de maneira adequada.</p></>}
      {screen==='purchasePolicy'&&<><h1>Política de Compra, Cancelamento e Reembolso Digital</h1><p><strong>Versão:</strong> 04/10/2026</p><h2>1. Informações antes da compra</h2><p>Antes do pagamento serão apresentados o produto ou edição adquirida, preço total, forma de pagamento, condições de acesso e demais características relevantes da oferta.</p><h2>2. Confirmação, leitura e download</h2><p>Após a confirmação do pagamento pelo provedor de pagamento, o acesso para leitura do livro digital no aplicativo será liberado à conta do comprador conforme a oferta. Para preservar o exercício do direito legal de arrependimento e proteger o conteúdo digital, o download do arquivo EPUB para uso pessoal será disponibilizado somente após o encerramento do prazo legal de 7 (sete) dias, contado na forma da legislação aplicável. A data prevista para liberação do download será informada ao comprador.</p><h2>3. Direito de arrependimento</h2><p>Nas contratações realizadas pela internet, o consumidor poderá exercer o direito de arrependimento no prazo legal de 7 (sete) dias, contado na forma da legislação aplicável. O pedido poderá ser encaminhado pelo canal eletrônico de atendimento e receberá confirmação de recebimento.</p><h2>4. Depois do prazo de arrependimento</h2><p>Encerrado o prazo legal de arrependimento, o download do EPUB adquirido poderá ser liberado automaticamente à conta, desde que a compra permaneça válida e não tenha sido cancelada ou reembolsada. Após esse prazo, não há cancelamento ou reembolso automático por mera mudança de vontade. Permanecem integralmente preservados os direitos do consumidor nas hipóteses previstas em lei, inclusive em caso de vício, falha na prestação ou descumprimento da oferta.</p><h2>5. Estorno</h2><p>Quando devido, o reembolso ou estorno será processado pelo meio compatível com a forma de pagamento utilizada, observados os procedimentos do provedor de pagamento e a legislação aplicável.</p><h2>6. Atendimento</h2><p>Pedidos relacionados a compra, arrependimento, cancelamento ou reembolso poderão ser enviados para <strong>biblia.chimarrao@gmail.com</strong>. O fluxo comercial também disponibilizará meio adequado para o exercício desses direitos.</p><h2>7. Identificação da oferta</h2><p>Os dados completos do fornecedor e as informações exigidas para o comércio eletrônico serão exibidos no ambiente de contratação antes da ativação das vendas.</p></>}
      {screen==='digitalLicense'&&<><h1>Licença de Uso de EPUBs e Conteúdos Digitais</h1><p><strong>Versão:</strong> 04/10/2026</p><h2>1. Licença pessoal</h2><p>A aquisição concede ao comprador uma licença pessoal, não exclusiva e intransferível para acessar e utilizar o conteúdo digital adquirido nas condições da oferta.</p><h2>2. Direitos autorais</h2><p>A aquisição não transfere direitos autorais, editoriais, de publicação ou de exploração comercial da obra. A autoria e os demais direitos permanecem com seus respectivos titulares.</p><h2>3. Uso permitido</h2><p>O usuário poderá ler a obra adquirida no aplicativo após a confirmação da compra. Quando a oferta incluir download, uma cópia do EPUB para uso pessoal será disponibilizada somente após o encerramento do prazo legal de arrependimento, desde que a compra permaneça válida. A liberação do download não amplia nem transfere os direitos autorais sobre a obra.</p><h2>4. Usos não autorizados</h2><p>Não é permitido redistribuir, revender, publicar, disponibilizar publicamente, compartilhar sistematicamente, remover mecanismos de proteção ou explorar comercialmente o conteúdo sem autorização do titular dos direitos.</p><h2>5. Direitos do consumidor</h2><p>Esta licença não exclui nem restringe direitos assegurados ao consumidor pela legislação brasileira.</p></>}
      <nav className="legal-nav" aria-label="Documentos legais"><button type="button" onClick={()=>setScreen('terms')}>Termos de Uso</button><button type="button" onClick={()=>setScreen('privacy')}>Privacidade</button><button type="button" onClick={()=>setScreen('purchasePolicy')}>Compras e Reembolsos</button><button type="button" onClick={()=>setScreen('digitalLicense')}>Licença Digital</button></nav>
      <p><strong>Contato:</strong> biblia.chimarrao@gmail.com</p>
    </section></main>
  }

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
