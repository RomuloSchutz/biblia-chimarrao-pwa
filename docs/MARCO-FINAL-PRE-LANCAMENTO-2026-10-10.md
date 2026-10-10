# MARCO FINAL PRÉ-LANÇAMENTO — BÍBLIA + CHIMARRÃO

**Data do marco:** 10/10/2026  
**Lançamento público planejado:** 07/11/2026  
**Repositório oficial:** `RomuloSchutz/biblia-chimarrao-pwa`  
**Aplicativo oficial:** PWA Bíblia + Chimarrão  
**Produção:** `https://biblia-chimarrao-pwa.rommar2179.workers.dev`

## 1. Finalidade deste marco

Este documento congela a base técnica homologada do aplicativo Bíblia + Chimarrão para o período de pré-lançamento. A partir deste ponto, a regra é preservar o que já foi aprovado e testado, evitando regressões, reconstruções desnecessárias ou criação de outro aplicativo.

Alterações posteriores devem ser pequenas, justificadas, testadas e restritas ao necessário para correção de defeito comprovado, segurança, obrigação comercial/legal ou requisito indispensável ao lançamento.

## 2. Base funcional homologada em produção

Foram homologados manualmente no aplicativo oficial:

- login da conta administrativa;
- Home e cards principais;
- Painel Administrador visível e funcional para a conta administrativa;
- navegação por livros/biblioteca;
- Minha Caminhada;
- demais cards e comandos testados pelo administrador;
- login e navegação com conta comum/cliente;
- experiência do cliente sem exposição do Painel Administrador;
- biblioteca do cliente;
- preços dos livros exibidos no aplicativo;
- abertura de livro já adquirido;
- regra de liberação programada do EPUB, mantendo o download bloqueado até a data prevista;
- acesso anual por edição implantado para 2027;
- checkout Mercado Pago em produção com retorno permitido para a URL oficial;
- Supabase Auth configurado para redirecionamento no domínio oficial;
- recuperação de senha preparada para o domínio oficial.

## 3. Pagamentos e acesso

Modelo comercial preservado:

- conta gratuita para entrada e exploração;
- conteúdo premium anual vendido por edição;
- edição 2027 com acesso independente das futuras edições;
- edições adquiridas permanecem vinculadas ao usuário;
- e-books/devocionais vendidos separadamente não devem conceder acesso anual indevido;
- compra anual não deve conceder automaticamente e-books vendidos separadamente;
- redirecionamento do checkout, isoladamente, nunca deve liberar conteúdo: a liberação depende da confirmação registrada no backend.

A função de checkout `mercado-pago-create-order` foi conferida em produção como **ACTIVE, versão 21**, contendo a origem oficial entre as URLs de retorno permitidas.

## 4. Segurança — estado no fechamento

Foi realizada auditoria de leitura no Supabase antes deste marco.

Constatações principais:

- RLS está habilitado nas estruturas sensíveis verificadas;
- direitos anuais são consultados de forma vinculada ao usuário, com exceção administrativa prevista;
- direitos de livros são vinculados ao usuário;
- o armazenamento `paid-epubs` possui políticas que condicionam leitura/download ao direito sobre a edição;
- tabelas com aviso `RLS Enabled No Policy` verificadas não apresentaram, na inspeção realizada, liberação direta de leitura/escrita para público anônimo;
- avisos `SECURITY DEFINER` devem ser avaliados função por função e não justificam revogação automática, pois várias RPCs fazem parte do desenho controlado do aplicativo;
- não foi identificado bloqueador técnico de lançamento nesta auditoria;
- alertas de desempenho existentes ficam registrados como manutenção futura e não justificam alteração arriscada da base homologada neste momento.

A proteção de senhas vazadas do Supabase não será ativada neste marco se implicar mudança de plano/custo. A política atual do projeto permanece: **zero custo adicional sem autorização expressa do responsável pelo projeto**.

## 5. Política de custo

Até nova decisão expressa:

- não contratar plano pago do Supabase;
- não contratar plano pago do GitHub;
- não contratar plano pago do Cloudflare;
- não introduzir serviço pago adicional;
- acompanhar consumo real conforme a base de clientes crescer;
- qualquer custo novo exige autorização prévia e explícita.

## 6. Itens deliberadamente fora deste marco

Permanece postergado, por decisão do responsável pelo projeto, o pagamento/regularização financeira relacionada à proteção/registro do aplicativo e/ou marca. Este documento não classifica juridicamente essa obrigação nem substitui orientação jurídica especializada.

Também permanecem para a fase comercial final, conforme aplicável:

- revisão final dos dados do fornecedor e canais de atendimento/cancelamento;
- revisão dos documentos comerciais e jurídicos antes da abertura pública de vendas;
- conferência final do catálogo que estará efetivamente disponível no lançamento;
- inserção/finalização dos EPUBs ainda em preparação.

## 7. Regra de não regressão

A partir deste marco:

1. não criar outro aplicativo para substituir o projeto oficial;
2. não refazer funcionalidades homologadas sem defeito comprovado;
3. não alterar produção/backend compartilhado sem necessidade e autorização explícita quando a mudança for sensível;
4. não substituir regras de acesso anual por controles globais antigos;
5. não misturar direitos de e-books com direitos da edição anual;
6. não remover proteções de EPUB, RLS ou verificações de propriedade para simplificar implementação;
7. não realizar nova compra real apenas para repetir testes já comprovados, salvo necessidade objetiva;
8. preservar a identidade visual e a experiência já aprovadas;
9. priorizar correções mínimas em vez de reconstruções amplas;
10. documentar mudanças relevantes posteriores a este marco.

## 8. Próxima fase oficial

Com a base técnica congelada, o projeto entra na fase de **pré-lançamento e mídia**.

Sequência prevista:

1. apresentação institucional do projeto;
2. material para apresentação a empresas/parceiros;
3. campanha de conhecimento da marca e do aplicativo;
4. incentivo à criação gratuita de contas no pré-lançamento, quando comercialmente adequado;
5. divulgação da edição Bíblia + Chimarrão 2027;
6. preparação da campanha para o lançamento público de 07/11/2026.

## 9. Estado do projeto neste marco

**BASE TÉCNICA HOMOLOGADA PARA PRÉ-LANÇAMENTO.**

O objetivo a partir deste documento não é continuar reconstruindo o aplicativo. É preservar a estabilidade alcançada, concluir apenas pendências realmente necessárias para o lançamento e concentrar o trabalho em conteúdo, apresentação comercial, comunicação e mídia.
