from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

if "import AnnualPurchasePanel" not in text:
    text = text.replace("import EpubReader from './EpubReader.jsx'", "import EpubReader from './EpubReader.jsx'\nimport AnnualPurchasePanel from './AnnualPurchasePanel.jsx'")

text = text.replace("  const [acceptedTerms,setAcceptedTerms]=useState(false)", "  const [acceptedTerms,setAcceptedTerms]=useState(false)\n  const [annualPurchaseBusy,setAnnualPurchaseBusy]=useState(false)\n  const [annualPurchaseMessage,setAnnualPurchaseMessage]=useState('')")

old = """  async function openEncounter(dayNumber = 1) {\n    if (!user && (dayNumber < 1 || dayNumber > 3)) { setScreen('signup'); setMessage('Crie sua conta para continuar além da prévia gratuita.'); return }"""
new = """  async function openEncounter(dayNumber = 1) {\n    if (!user) { setScreen('guestDemo'); setMessage('Os encontros completos fazem parte da edição anual 2027. Crie sua conta e adquira o acesso premium para começar sua caminhada.'); return }"""
text = text.replace(old, new)

text = text.replace("<small>O cadastro é gratuito nesta etapa. Nenhuma cobrança será realizada agora.</small>", "<small>A criação da conta não gera cobrança. Você poderá conhecer o aplicativo e adquirir separadamente o acesso premium Bíblia + Chimarrão — Edição 2027.</small>")
text = text.replace("<small>A criação da conta não gera cobrança. Depois de confirmar seu cadastro, você poderá revisar e adquirir separadamente a edição anual Bíblia + Chimarrão 2027.</small>", "<small>A criação da conta não gera cobrança. Você poderá conhecer o aplicativo e adquirir separadamente o acesso premium Bíblia + Chimarrão — Edição 2027.</small>")

text = text.replace("setUser(data.user)\n          setScreen('dashboard')", "setUser(data.user)\n          setScreen('dashboard')", 1)
text = text.replace("setUser(data.user)\n          setScreen('annualPurchase')", "setUser(data.user)\n          setScreen('dashboard')", 1)

text = text.replace("<p>Conheça a proposta do devocional e crie sua conta para acessar os recursos disponíveis.</p><div className=\"guest-demo-actions\"><button onClick={()=>setScreen('signup')}>Criar minha conta</button>", "<p>Conheça a proposta do aplicativo. Os encontros completos são liberados com a aquisição do acesso premium da Edição 2027.</p><div className=\"guest-demo-actions\"><button onClick={()=>setScreen('signup')}>Criar minha conta</button>")
text = text.replace("<p>Conheça a proposta do devocional. Os encontros completos são liberados com a aquisição da edição anual 2027.</p><div className=\"guest-demo-actions\"><button onClick={()=>setScreen('signup')}>Criar conta e adquirir 2027</button>", "<p>Conheça a proposta do aplicativo. Os encontros completos são liberados com a aquisição do acesso premium da Edição 2027.</p><div className=\"guest-demo-actions\"><button onClick={()=>setScreen('signup')}>Criar minha conta</button>")

text = text.replace("{!user && <section className=\"guest-demo-hint guest-demo-start\"><h2>Experimente antes de criar sua conta</h2><p>Conheça os doze meses e leia gratuitamente os três primeiros encontros de janeiro.</p><button onClick={()=>openEncounter(1)}>Ler o primeiro encontro →</button></section>}", "{!user && <section className=\"guest-demo-hint guest-demo-start\"><h2>Conheça a edição 2027</h2><p>Veja os doze meses, os temas e a estrutura da caminhada. Os encontros completos são conteúdo do acesso premium anual.</p><button onClick={()=>setScreen('signup')}>Criar minha conta →</button></section>}")
text = text.replace("{!user && <section className=\"guest-demo-hint guest-demo-start\"><h2>Gostou da apresentação?</h2><p>Leia o primeiro encontro e conheça o conteúdo do devocional antes de se cadastrar.</p><button onClick={()=>openEncounter(1)}>Ler o primeiro encontro gratuitamente →</button></section>}", "{!user && <section className=\"guest-demo-hint guest-demo-start\"><h2>Gostou da apresentação?</h2><p>Crie sua conta gratuitamente para conhecer o aplicativo. O acesso premium da Edição 2027 pode ser adquirido depois.</p><button onClick={()=>setScreen('signup')}>Criar minha conta →</button></section>}")

text = text.replace("onClick={() => user || day.day_number<=3 ? openEncounter(day.day_number) : setScreen('guestInfo')}", "onClick={() => user ? openEncounter(day.day_number) : setScreen('signup')}")
text = text.replace("{!user && day.day_number>3 ? \"🔒\" : \"›\"}", "{!user ? \"🔒\" : \"›\"}")

text = text.replace("<p>Explore os recursos e experimente gratuitamente os três primeiros encontros. Para registrar sua caminhada, crie uma conta.</p><button onClick={()=>setScreen(\"devotional\")}>Experimentar 3 encontros</button>", "<p>Explore os recursos, os meses e os temas da edição 2027. Os encontros completos são liberados pelo acesso premium anual.</p><button onClick={()=>setScreen(\"guestDemo\")}>Conhecer a edição 2027</button>")

# Corrige o produto comercial: acesso premium do aplicativo (R$ 34,90), não o e-book/devocional digital (R$ 24,90).
text = text.replace("commercialCatalog['devocional_chimarrao_com_deus_2027']", "commercialCatalog['app_biblia_chimarrao']")
text = text.replace("product_code:'devocional_chimarrao_com_deus_2027'", "product_code:'app_biblia_chimarrao'")

anchor = "  if (screen === 'login' || screen === 'signup') {"
if "screen === 'annualPurchase'" not in text:
    annual = """  async function purchaseAnnualEdition(){\n    const product=commercialCatalog['app_biblia_chimarrao']\n    if(!user||!supabase||!product?.isActive){setAnnualPurchaseMessage('O acesso premium da Edição 2027 ainda não está disponível para compra.');return}\n    setAnnualPurchaseBusy(true);setAnnualPurchaseMessage('Preparando checkout seguro do Mercado Pago...')\n    const {data:sessionData}=await supabase.auth.getSession();const session=sessionData?.session\n    if(!session){setAnnualPurchaseBusy(false);setAnnualPurchaseMessage('Sua sessão expirou. Entre novamente para continuar.');return}\n    try{\n      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-create-order`,{method:'POST',headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({product_code:'app_biblia_chimarrao',accepted:true})})\n      let data={};try{data=await response.json()}catch{}\n      if(!response.ok||!data?.checkout_url){setAnnualPurchaseMessage('Não foi possível iniciar a compra: '+(data?.error||('erro '+response.status))+'.');setAnnualPurchaseBusy(false);return}\n      window.location.assign(data.checkout_url)\n    }catch{setAnnualPurchaseMessage('Não foi possível conectar ao checkout do Mercado Pago.');setAnnualPurchaseBusy(false)}\n  }\n\n  if(screen === 'annualPurchase' && user) return <AnnualPurchasePanel product={commercialCatalog['app_biblia_chimarrao']} busy={annualPurchaseBusy} message={annualPurchaseMessage} onBack={()=>setScreen('dashboard')} onContinue={purchaseAnnualEdition}/>\n\n"""
    text = text.replace(anchor, annual + anchor)

path.write_text(text, encoding='utf-8')
print('Fluxo anual 2027 aplicado ao laboratório com produto de acesso premium do app.')
