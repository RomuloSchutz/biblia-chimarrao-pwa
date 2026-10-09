# Integração LAB — painel anual

Arquivos preparados:

- `src/AnnualAccessAdminPanel.jsx`
- `src/lib/annual-access-admin.js`
- `src/lib/commercial-terms.js`

A integração no `App.jsx` deve ocorrer somente na branch LAB e substituir visualmente os botões globais de `admin_set_user_access` pelo painel anual por leitor. O controle de livros permanece separado.

## Alterações exatas esperadas no App.jsx

1. Importar `AnnualAccessAdminPanel`.
2. Ao selecionar um leitor no painel administrativo, renderizar o componente com `supabase` e o leitor selecionado.
3. Remover da UI comercial os botões genéricos `Liberar` e `Bloquear` que chamam `changeAdminAccess`.
4. Não remover ainda o fallback legado de `requirePaidAccess`; ele só sai depois que contas legadas forem verificadas/migradas.
5. Não alterar a área `Livros`, `admin_grant_book` ou `admin_revoke_book`.
6. Trocar os literais `08/10/2026` do checkout de e-books pelo helper centralizado quando a integração for feita.

## Motivo da integração em etapa separada

`App.jsx` é um arquivo grande e crítico. A integração deve ser feita com o conteúdo integral atual da branch e validada por build/preview, evitando substituir o arquivo a partir de trechos parciais ou truncados.