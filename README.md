# Diário — observações pessoais

App web simples, em português do Brasil, para manter um diário privado de observações
(humor, sintomas, energia, acontecimentos do dia). Tudo é anotado **manualmente**.

O app **não** tem: previsão de ciclo, janela fértil, fertilidade, diagnóstico, recomendações
médicas, notificações, localização, coleta em segundo plano, acesso a mensagens, integração com
dados de saúde, analytics ou sincronização de registros na nuvem. O acesso usa e-mail/senha via
Supabase Auth; as anotações não são enviadas ao Supabase.

## Configurar login admin (Supabase)

1. No Supabase, deixe habilitado o provedor **Email** e desative novos cadastros públicos
   (Authentication → Sign In / Providers ou configurações de Auth, dependendo da versão do painel).
2. Em **Authentication → Users**, use **Add user** para criar manualmente a conta administradora
   com o e-mail e a senha desejados. Marque/confirme o e-mail no painel, se solicitado. Não coloque
   a senha nos arquivos do app nem a envie no chat. Remova contas existentes que não devam acessar.
3. Edite `js/auth-config.js` e informe a Project URL e a chave pública `anon`/publishable.
   Essa chave é destinada a clientes públicos; nunca use `service_role` ou uma chave secreta.
4. Sirva o app por HTTPS (ou `localhost` durante o desenvolvimento). A tela de entrada autentica
   contas existentes no Supabase; não há formulário de cadastro no app.

Sem a configuração, a tela informa `Configuração pendente` e mantém o diário fechado. A sessão fica
na `sessionStorage` desta aba e é encerrada ao sair. O Supabase recebe o e-mail e a senha para
autenticar a conta; as anotações continuam no `localStorage` e não são enviadas ao Supabase.
Como o app é estático e os dados são locais, o login não criptografa o armazenamento nem protege
contra alguém com acesso ao dispositivo, DevTools ou aos arquivos do site. Proteja também o acesso
ao dispositivo; uma barreira de hospedagem exigiria configuração adicional no serviço de deploy.

## Como executar

Requisito: qualquer navegador moderno (Chrome, Edge, Firefox, Safari). Não há dependências a instalar.

**Opção recomendada — servidor local** (o macOS já vem com Python 3):

```bash
cd diario
python3 -m http.server 8765 --bind 127.0.0.1
```

Depois abra <http://127.0.0.1:8765> no navegador. Para parar, `Ctrl+C` no terminal.

> Use sempre o **mesmo endereço** (mesmo host e porta). O navegador guarda os dados por
> endereço: `127.0.0.1:8765`, `localhost:8765` e `127.0.0.1:9000` são três diários separados.

**No celular:** o jeito mais simples é usar o navegador do próprio celular com o app servido a
partir de um computador na mesma rede (`python3 -m http.server 8765 --bind 0.0.0.0` e abrir
`http://IP-do-computador:8765`). Atenção: isso expõe o app na rede local enquanto o servidor
estiver rodando, e os dados ficam **no navegador do celular**, não no computador.
Alternativa: hospedar a pasta `diario/` em qualquer hospedagem estática com HTTPS — os
arquivos do app ficam públicos, mas as anotações continuam só no navegador de quem usa.

### Testes

```bash
cd diario
node --test
```

Testa validação, criar/editar/apagar, filtros, exportação/importação e tratamento de dados
corrompidos (Node 18+).

## Funcionalidades

- **Navegação:** barra de abas fixa no rodapé em celular e computador (Hoje · Anotações · Calendário · + · Análise · Dados).
- **Hoje:** mostra os últimos sete dias e destaca apenas as datas marcadas manualmente como menstruais. Não exibe cartões de anotações; os registros completos ficam na aba **Anotações**. O arco representa a quantidade de dias menstruais marcados na última semana e não prevê fases ou datas futuras.
- **Calendário:** grade mensal com navegação entre meses. Dias com anotações recebem um marcador; ao selecionar uma data,
  o app mostra os registros daquele dia e permite criar uma anotação para hoje ou uma data passada. Não calcula nem prevê fases do ciclo.
- **Análise:** médias retrospectivas de duração e variação entre períodos marcados, distribuição da intensidade menstrual,
  quantidade de registros por mês e detalhes expansíveis por categoria. A duração de ciclo só aparece com datas marcadas suficientes;
  é um resumo do histórico existente, sem previsão. Temperatura e peso mostram médias apenas dos valores digitados manualmente.
- **Formulário por categorias inspirado nas referências enviadas**, com opções selecionáveis de
  menstruação, sentimentos, dores, TPM, sono, vida sexual, vitalidade, método de coleta, mente,
  vida social, desejos, corrimento, pele/cabelo, peso, digestão, banheiro, temperatura, exercício,
  meditação, lazer, festa, testes, consultas e registros manuais de medicação e métodos contraceptivos.
  Campos de texto, números, duração e etiquetas pessoais também estão disponíveis. O botão de salvar fica no rodapé do formulário.
- **Criar, editar e apagar** anotações. Apagar pede confirmação; sair do formulário com alterações não salvas também.
  Mensagens de confirmação aparecem ao salvar, editar e apagar.
- **Campos** (todos opcionais, exceto data e origem; é preciso preencher pelo menos um):
  - Data (não aceita data futura)
  - **Origem:** “Ela me contou” ou “Minha observação” — exibida em destaque em cada anotação,
    com visual diferente (selo sólido 💬 vs. tracejado 👁), para não confundir impressão com informação confirmada
  - Humor (lista), Energia (1 a 5), “Está menstruada?” (Sim / Não / Não sei)
  - Sintomas (lista de marcação) + “Outros sintomas” (texto)
  - Contexto do dia (até 300 caracteres)
  - Nota diária — texto livre (até 3.000 caracteres)
  - Respostas às categorias — guardadas junto com o registro do dia escolhido e editáveis depois
- **Busca e filtros:** texto (ignora acentos), intervalo de datas, humor, sintoma e origem.
- Os itens “Testes”, “Medicação” e métodos contraceptivos são apenas anotações manuais. O app não
  interpreta esses registros, nem calcula ciclo, ovulação, fertilidade ou gravidez.
- A análise usa exclusivamente os registros salvos no próprio dispositivo; não usa sensores, dispositivos conectados ou serviços externos.
- **Dados e privacidade:** explicação de onde os dados ficam, exportar (JSON), importar backup e apagar tudo
  (exige digitar `APAGAR`).
- Estados vazios, validação com mensagens por campo, tema claro/escuro automático, navegação por teclado,
  rótulos acessíveis, áreas de toque ≥ 44 px, layout responsivo.

## Onde ficam os dados e limitações (leia)

- As anotações ficam **apenas no `localStorage` do navegador, neste dispositivo**; não são enviadas ao Supabase.
  Para o login, o navegador se conecta ao endpoint Supabase configurado. A Content-Security-Policy permite
  conexões somente ao próprio site e a domínios Supabase (`connect-src`).
- **Não há criptografia nem senha.** Quem tiver acesso ao seu navegador/usuário do sistema pode abrir o app e
  ler tudo; o arquivo exportado também é texto puro. A proteção real é o bloqueio de tela do dispositivo
  e o cuidado com onde você guarda o backup.
- **Os dados podem ser perdidos** ao limpar dados de navegação/do site, usar janela anônima (nada é mantido
  depois de fechar), desinstalar o navegador, trocar de dispositivo ou se o navegador liberar espaço
  automaticamente. O Safari pode apagar dados de sites não visitados por cerca de 7 dias.
  O app pede ao navegador armazenamento persistente (`navigator.storage.persist()`), mas o navegador pode recusar —
  a tela “Dados” mostra o resultado. **Exporte backups regularmente.**
- Não há sincronização entre dispositivos ou navegadores. Para mover os dados, exporte em um e importe no outro.
- Limite prático do `localStorage`: ~5 MB por endereço — algo como dezenas de milhares de anotações de tamanho comum.
- A importação mescla: mantém as anotações atuais e substitui as que tiverem o mesmo identificador.

## Estrutura

```
diario/
├── index.html        # marcação das telas
├── css/styles.css    # estilos (responsivo, claro/escuro)
├── js/model.js       # dados: validação, filtros, armazenamento, exportação/importação
├── js/auth-config.js # URL e chave pública do Supabase
├── js/auth.js        # login por e-mail/senha e sessão Supabase
├── js/app.js         # interface: rotas, renderização, eventos
└── tests/model.test.js
```

## Uma observação

Este diário trata de informações íntimas de outra pessoa. Vale considerar contar a ela que você
mantém essas anotações — ser transparente costuma ajudar mais do que um registro feito em segredo.
