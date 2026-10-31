const params=new URLSearchParams(window.location.search)
const shouldOpenAdmin=params.get('open-admin')==='1'

if(shouldOpenAdmin){
  params.delete('open-admin')
  const clean=window.location.pathname+(params.toString()?`?${params.toString()}`:'')+window.location.hash
  window.history.replaceState({},document.title,clean)

  let attempts=0
  const timer=window.setInterval(()=>{
    attempts+=1

    // Se o painel já abriu, encerramos sem interferir em mais nada.
    if(document.querySelector('.admin-page .admin-panel')){
      window.clearInterval(timer)
      return
    }

    const buttons=[...document.querySelectorAll('button')]
    const adminButton=buttons.find(button=>button.textContent.includes('Painel Administrativo'))
    if(adminButton){
      adminButton.click()
      window.clearInterval(timer)
      return
    }

    // O App preserva a capa como tela inicial mesmo para usuário autenticado.
    // Avançamos somente pelas telas de entrada até o dashboard, onde o botão
    // administrativo nativo assume a navegação e valida as permissões.
    const enterButton=buttons.find(button=>button.textContent.trim().startsWith('Entrar no aplicativo'))
    if(enterButton)enterButton.click()

    if(attempts>=80)window.clearInterval(timer)
  },250)
}
