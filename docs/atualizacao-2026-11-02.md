# Atualização de EPUBs e correções — 02/11/2026

Os EPUBs revisados de Cristo, o Marco; Entre os Sistemas 1 e 2; e Entre a Honra e a Gratidão foram conferidos com os arquivos das pastas Atualizado da Área de Trabalho por SHA-256. Foram enviados ao bucket privado paid-epubs com nomes novos. Os quatro vínculos em edition_epub_assets foram atualizados sem alterar os identificadores das edições, direitos de compra, preços ou ativação comercial. Os objetos antigos foram preservados.

## Código preparado para revisão

- Capas frontais atualizadas com caminhos novos, evitando reutilizar imagens antigas no cache.
- Sanitização do caderno reconstrói apenas elementos permitidos e examina todos os descendentes, inclusive wrappers removidos.
- Progresso, favoritos e destaques locais do leitor usam identidade estável da edição e da conta, sem depender da assinatura temporária da URL. Dados locais antigos não são apagados nem atribuídos automaticamente a outra conta; marca-páginas sincronizados permanecem na tabela existente.
- As três funções Supabase versionadas foram reconciliadas com o código implantado. Checkout e acesso EPUB são snapshots da produção, sem nova implantação proposta para essas duas funções.
- O webhook corrigido valida valores contra o pedido acordado, sem exigir preço atual do catálogo; concessão/revogação de livro usa a edição do pedido. Erros de gravação de estados e de cancelamento/reembolso de cupom retornam falha recuperável.
- Lockfile, correção de xmldom para 0.8.15 e testes antes de publicar o frontend. A atualização de xmldom evita uma migração ampla do leitor para outra versão de epubjs.

## Validação e limites

Nove regressões passaram para sanitização e conciliação. Compilação de produção passou. npm audit não apontou vulnerabilidades conhecidas após a atualização. Os quatro EPUBs passaram por integridade ZIP/CRC, mimetype, parsing de XML e conferência de tamanho; isso não equivale a EPUBCheck nem à revisão visual em dispositivos.

Os testes do webhook usam provedor e banco simulados e não geram compras ou alteram pedidos reais. A tentativa de teste visual local foi bloqueada pela conectividade com localhost; revisão de abertura em dispositivo continua pendente.

A publicação do frontend e a implantação do webhook são etapas separadas. Este PR não executa automaticamente deploy de funções Supabase.

## Pendências de lançamento

- A leitura entrega o EPUB completo por URL assinada: a espera do botão de download não impede salvar o arquivo usado pelo leitor. Uma proteção diferente exige decisão sobre arquitetura e política comercial.
- Entre a Cidade e o Silêncio não foi incluído: é necessário confirmar os EPUBs finais de Nasce, Cresce e Vive e sua organização no catálogo.
- Os livros que estavam comercialmente inativos continuam inativos; substituir conteúdo não muda preço ou agenda de lançamento.
- Rever os três PRs antigos separadamente. Não foram mesclados nesta atualização.

## Recuperação dos EPUBs anteriores

Os objetos antigos seguem no bucket. Caso a leitura de uma edição revisada apresente problema, restaurar apenas o respectivo object_path em edition_epub_assets para:

| Edição | Objeto anterior |
|---|---|
| Cristo, o Marco | Cristo_O_Marco_Entre_O_Antes_E_O_Depois_REFLOWABLE (1).epub |
| Entre os Sistemas 1 | Entre_os_Sistemas_Volume_1_REFLOWABLE (1).epub |
| Entre os Sistemas 2 | Entre_os_Sistemas_Volume_2_REFLOWABLE_50MB (1).epub |
| Entre a Honra e a Gratidão | Entre_a_Honra_e_a_Gratidao_REFLOWABLE (1).epub |
