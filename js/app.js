/* Interface do Diário: rotas, renderização e interações. */
(function () {
  "use strict";

  const D = window.Diario;
  const repo = D.criarRepositorio(window.localStorage);
  const $ = (sel, el) => (el || document).querySelector(sel);

  const RECENTES = 5;

  const ICONES_HUMOR = {
    Bem: "🙂", Feliz: "😄", Tranquila: "😌", Animada: "🤩", Carinhosa: "🥰", Cansada: "😴",
    Sensível: "🥺", Ansiosa: "😟", Irritada: "😠", Estressada: "😣", Triste: "😢", Instável: "🎢",
  };
  const ICONES_SINTOMAS = {
    "Cólica": "⚡", "Dor de cabeça": "🤕", "Inchaço": "🎈", "Sensibilidade nos seios": "💗",
    "Dor nas costas": "🦴", "Náusea": "🤢", "Acne": "🔴", "Vontade de doces": "🍫",
    "Fome maior": "🍽️", "Cansaço": "🥱", "Insônia": "🌙", "Sono a mais": "💤",
  };
  const ICONES_MENS = { sim: "💧", nao: "○", nao_sei: "?" };

  // Catálogo de registro manual inspirado nas referências visuais do usuário.
  // Nenhuma opção calcula fases, previsões ou interpreta os dados.
  const CATEGORIAS = [
    ["menstrual_intensidade", "Menstruação", "🔴", ["Leve", "Mediana", "Intensa", "Muito intensa"], "radio"],
    ["sangue_escape", "Sangue de escape", "🩸", ["Vermelho", "Marrom"], "radio"],
    ["sentimentos", "Sentimentos", "☀️", ["Alterações de humor", "Falta de controle", "Bem", "Feliz", "Triste", "Sensível", "Raiva", "Confiante", "Exultante", "Irritável", "Ansiedade" ]],
    ["dores", "Dores", "✚", ["Sem dor", "Cólicas", "Ovulação", "Sensibilidade nos seios", "Dor de cabeça", "Enxaqueca", "Enxaqueca com aura", "Lombar", "Pernas", "Articulações", "Dor vulvar"]],
    ["tpm", "TPM", "☁️", ["TPM"], "radio"],
    ["qualidade_sono", "Qualidade do sono", "🌙", ["Difícil de dormir", "Energia ao acordar", "Cansaço ao acordar", "Sono agitado", "Sonhos intensos", "Suores noturnos"]],
    ["sono_minutos", "Sono", "◷", [], "duration"],
    ["vida_sexual", "Vida sexual", "♡", ["Protegido", "Desprotegido", "Coito interrompido", "Não fiz sexo hoje", "Libido alta", "Libido baixa", "Masturbação", "Brinquedos eróticos", "Orgasmo", "Sem orgasmo", "Fantasias", "Sexo com dor"]],
    ["vitalidade", "Vitalidade", "⚡", ["Exaustão", "Cansaço", "OK", "Energia", "Muita energia"], "radio"],
    ["metodo_coleta", "Método de coleta", "💧", ["Absorvente interno", "Absorvente", "Protetor diário", "Coletor"]],
    ["mente", "Mente", "☼", ["Lapsos de memória", "Confusão mental", "Calma", "Estresse", "Boa atenção", "Distração", "Motivação", "Desânimo", "Criatividade", "Alta produtividade", "Baixa produtividade"]],
    ["vida_social", "Vida social", "☻", ["Sociável", "Introversão", "Compreensão", "Conflitante"]],
    ["desejos", "Desejos", "◇", ["Doce", "Salgado", "Gorduroso", "Picante", "Carboidratos"]],
    ["corrimento", "Corrimento", "〰", ["Nenhum", "Pegajoso", "Cremoso", "Clara de ovo", "Atípico"]],
    ["pele", "Pele", "◉", ["OK", "Boa", "Acne", "Seca", "Oleosa", "Coceira"]],
    ["cabelo", "Cabelo", "⌁", ["Cabelo OK", "Cabelo bonito", "Cabelo indisciplinado", "Couro cabeludo oleoso", "Couro cabeludo seco", "Perda de cabelo"]],
    ["peso", "Peso", "⚖", [], "number", "kg"],
    ["digestao", "Digestão", "◌", ["OK", "Inchaço", "Com gases", "Azia", "Enjoo", "Vômitos"]],
    ["banheiro", "Banheiro", "♧", ["OK", "Prisão de ventre", "Diarreia"], "radio"],
    ["temperatura", "Temperatura corporal", "°", [], "number", "°C"],
    ["exercicio", "Exercício", "♧", ["Corrida", "Natação", "Yoga", "Bicicleta", "Caminhada", "Pilates", "Treinamento de força", "Alongamento", "Kegels", "Dia de descanso"]],
    ["meditacao_minutos", "Meditação", "◷", [], "duration"],
    ["lazer", "Lazer", "✦", ["Férias", "Viagem", "Encontro"]],
    ["festa", "Festa", "♫", ["Álcool", "Cigarros", "Noitada", "Ressaca"]],
    ["testes", "Testes registrados", "▣", ["Ovulação: positivo", "Ovulação: negativo", "Gravidez: positivo", "Gravidez: negativo"]],
    ["consultas", "Consultas", "＋", ["Ginecologista/obstetra", "Papanicolau", "Check-up de IST", "Check-up", "Vacinação"]],
    ["medicacao", "Medicação", "▤", ["Terapia hormonal (TRH)", "Analgésicos", "Anti-histamínico", "Antibiótico", "Antigripal", "Terapia de estrogênio", "Terapia de progesterona", "Terapia de testosterona", "Contracepção de emergência", "GLP-1"]],
    ["doenca", "Doença", "✚", ["Resfriado ou gripe", "Alergia", "Febre", "Infecção urinária", "IST"]],
    ["pilula", "Pílula", "◉", ["Tomada", "Esquecida", "Dia sem pílula ou pílula placebo"], "radio"],
    ["diu", "DIU", "⊕", ["Acompanhamento", "Inserido", "Removido", "Substituído"]],
    ["injecao", "Injeção", "＋", ["Administrada"]],
    ["implante", "Implante subcutâneo", "▰", ["Inserido", "Removido", "Substituído"]],
    ["adesivo", "Adesivo", "▱", ["Colocado", "Removido", "Colocado com atraso", "Removido com atraso", "Substituído"]],
    ["seios", "Seios e peito", "♡", ["OK", "Secreção no mamilo", "Denso ou intenso", "Seios inchados"]],
    ["urina", "Urina", "◍", ["Urinando com frequência", "Sensação de queimação", "Vazamentos ou gotejamento"]],
    ["ondas_calor", "Ondas de calor", "☼", ["Nada hoje", "Leve", "Moderada", "Intensa", "Muito intensa"], "radio"],
    ["vulva", "Vulva e vagina", "♡", ["Secura vaginal", "Coceira"]],
  ];

  const fmtLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
  const fmtDiaMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });
  const fmtMesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const fmtMesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

  let armazenamentoOk = repo.disponivel();
  let formSujo = false;
  let editandoId = null;
  let etiquetasAtuais = [];
  let calendarioSelecionado = D.hojeISO();
  let calendarioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // ---------- utilidades ----------

  function lerTodos() {
    try {
      return repo.carregar();
    } catch (e) {
      mostrarFaixa(e.message + " Verifique o armazenamento do navegador.");
      return [];
    }
  }

  function paraData(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d);
  }

  function capitalizar(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function formatarData(iso) {
    return capitalizar(fmtLongo.format(paraData(iso)));
  }

  function rotuloRelativo(iso) {
    const hoje = D.hojeISO();
    const ontem = D.hojeISO(new Date(Date.now() - 864e5));
    if (iso === hoje) return "Hoje";
    if (iso === ontem) return "Ontem";
    return capitalizar(fmtSemana.format(paraData(iso))) + ", " + fmtDiaMes.format(paraData(iso));
  }

  function el(tag, attrs, texto) {
    const n = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) n.setAttribute(k, attrs[k]);
    if (texto != null) n.textContent = texto;
    return n;
  }

  let avisoTimer;
  function avisar(msg) {
    const a = $("#aviso");
    a.textContent = msg;
    a.classList.add("visivel");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => a.classList.remove("visivel"), 3500);
  }

  function mostrarFaixa(msg) {
    const f = $("#aviso-armazenamento");
    f.textContent = msg;
    f.hidden = false;
  }

  /** Diálogo de confirmação. Resolve true/false. */
  function confirmar({ titulo, texto, botao, exigirTexto, perigo = true }) {
    const dlg = $("#dialogo");
    $("#dialogo-titulo").textContent = titulo;
    $("#dialogo-texto").textContent = texto;
    const btn = $("#dialogo-confirmar");
    btn.textContent = botao || "Confirmar";
    btn.className = "botao " + (perigo ? "botao-perigo" : "botao-primario");
    const extra = $("#dialogo-extra");
    const input = $("#dialogo-input");
    input.value = "";
    if (exigirTexto) {
      extra.hidden = false;
      $("#dialogo-input-rotulo").textContent = `Digite ${exigirTexto} para confirmar`;
      btn.disabled = true;
      input.oninput = () => {
        btn.disabled = input.value.trim().toUpperCase() !== exigirTexto;
      };
    } else {
      extra.hidden = true;
      btn.disabled = false;
      input.oninput = null;
    }
    const focoAnterior = document.activeElement;
    return new Promise((resolve) => {
      dlg.returnValue = "";
      dlg.addEventListener(
        "close",
        () => {
          if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
          resolve(dlg.returnValue === "confirmar");
        },
        { once: true }
      );
      dlg.showModal();
      (exigirTexto ? input : $("#dialogo-cancelar")).focus();
    });
  }

  function preencherSelect(select, opcoes) {
    for (const [valor, rotulo] of opcoes) select.append(el("option", { value: valor }, rotulo));
  }

  // ---------- cartões ----------

  function criarCartao(r) {
    const frag = $("#tpl-cartao").content.cloneNode(true);
    const li = frag.querySelector("li");
    li.dataset.id = r.id;
    const dt = paraData(r.data);

    li.querySelector(".cartao-dia-num").textContent = String(dt.getDate());
    li.querySelector(".cartao-dia-mes").textContent = fmtMesCurto.format(dt).replace(".", "");

    const time = li.querySelector("time");
    time.dateTime = r.data;
    time.textContent = rotuloRelativo(r.data);
    time.title = formatarData(r.data);

    const selo = li.querySelector(".selo");
    selo.textContent = D.ORIGENS[r.origem];
    selo.classList.add(r.origem === "ela_contou" ? "selo-contou" : "selo-observacao");

    const tags = li.querySelector(".cartao-tags");
    const tag = (cls, txt, rotuloAcessivel) => {
      const t = el("li", { class: "tag " + cls }, txt);
      if (rotuloAcessivel) t.setAttribute("aria-label", rotuloAcessivel);
      tags.append(t);
    };
    if (r.humor) tag("tag-humor", `${ICONES_HUMOR[r.humor] || ""} ${r.humor}`.trim(), "Humor: " + r.humor);
    if (r.energia !== null) {
      tag("tag-energia", `⚡ ${D.ENERGIA[r.energia]}`, `Energia: ${r.energia} de 5, ${D.ENERGIA[r.energia]}`);
    }
    if (r.menstruacao) {
      const txt = { sim: "💧 Menstruada", nao: "Não menstruada", nao_sei: "Menstruação: não sei" }[r.menstruacao];
      tag("tag-mens", txt, "Está menstruada: " + D.MENSTRUACAO[r.menstruacao]);
    }
    for (const s of r.sintomas) tag("tag-sint", `${ICONES_SINTOMAS[s] || ""} ${s}`.trim(), "Sintoma: " + s);
    if (r.sintomasOutros) tag("tag-sint", r.sintomasOutros, "Outros sintomas: " + r.sintomasOutros);
    for (const [key, value] of Object.entries(r.respostas || {})) {
      const valores = Array.isArray(value) ? value : (typeof value === "object" ? [`${value.h || 0}h ${value.m || 0}min`] : [String(value)]);
      valores.forEach((v) => tag("tag-sint", v, `${key}: ${v}`));
    }
    if (!tags.children.length) tags.remove();

    if (r.contexto) {
      const p = li.querySelector(".cartao-contexto");
      p.hidden = false;
      p.append(el("span", { class: "rotulo-inline" }, "Contexto: "), document.createTextNode(r.contexto));
    }
    if (r.observacoes) {
      const p = li.querySelector(".cartao-obs");
      p.hidden = false;
      p.textContent = r.observacoes;
    }

    const editar = li.querySelector('[data-acao="editar"]');
    editar.href = "#/editar/" + encodeURIComponent(r.id);
    editar.setAttribute("aria-label", "Editar anotação de " + formatarData(r.data));
    const apagar = li.querySelector('[data-acao="apagar"]');
    apagar.setAttribute("aria-label", "Apagar anotação de " + formatarData(r.data));
    apagar.addEventListener("click", () => apagarRegistro(r));
    return frag;
  }

  async function apagarRegistro(r, depois) {
    const ok = await confirmar({
      titulo: "Apagar anotação?",
      texto: `A anotação de ${formatarData(r.data)} será apagada permanentemente.`,
      botao: "Apagar",
    });
    if (!ok) return;
    try {
      repo.apagar(r.id);
    } catch (e) {
      avisar("Não foi possível apagar: armazenamento indisponível.");
      return;
    }
    avisar("Anotação apagada.");
    if (depois) depois();
    else renderizar();
  }

  // ---------- Hoje ----------

  function renderInicio() {
    const todos = D.ordenar(lerTodos());
    const hoje = D.hojeISO();
    $("#hero-dia-semana").textContent = "DIÁRIO PRIVADO";
    $("#t-inicio").textContent = "Seu diário";
    $("#resumo-inicio").textContent = todos.length
      ? `${todos.length} ${todos.length === 1 ? "anotação" : "anotações"} registrada${todos.length === 1 ? "" : "s"} manualmente`
      : "Anotações feitas manualmente, no seu tempo.";

    const temHoje = todos.some((r) => r.data === hoje);
    $("#vazio-inicio").hidden = todos.length > 0;
    $("#hoje-cta").hidden = todos.length === 0 || temHoje;
    $("#titulo-recentes").hidden = todos.length === 0;
    $("#ver-todas").hidden = todos.length <= RECENTES;

    const lista = $("#lista-inicio");
    lista.replaceChildren();
    for (const r of todos.slice(0, RECENTES)) lista.append(criarCartao(r));
  }

  // ---------- Calendário manual ----------

  function renderCalendario() {
    const todos = D.ordenar(lerTodos());
    const porDia = new Map();
    for (const r of todos) {
      const grupo = porDia.get(r.data) || [];
      grupo.push(r);
      porDia.set(r.data, grupo);
    }

    $("#cal-mes-atual").textContent = capitalizar(fmtMesAno.format(calendarioMes));
    const grade = $("#cal-grade");
    grade.replaceChildren();
    const ano = calendarioMes.getFullYear();
    const mes = calendarioMes.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const totalCelulas = Math.ceil((primeiroDiaSemana + diasNoMes) / 7) * 7;
    const hoje = D.hojeISO();

    for (let i = 0; i < totalCelulas; i++) {
      const dia = i - primeiroDiaSemana + 1;
      if (dia < 1 || dia > diasNoMes) {
        grade.append(el("span", { class: "cal-celula-vazia", "aria-hidden": "true" }));
        continue;
      }
      const data = D.hojeISO(new Date(ano, mes, dia));
      const registrosDia = porDia.get(data) || [];
      const classes = ["cal-dia"];
      if (data === hoje) classes.push("cal-hoje");
      if (data === calendarioSelecionado) classes.push("cal-selecionado");
      if (registrosDia.length) classes.push("cal-com-registro");
      const botao = el("button", {
        type: "button",
        class: classes.join(" "),
        role: "gridcell",
        "aria-pressed": String(data === calendarioSelecionado),
        "aria-label": formatarData(data) + (registrosDia.length ? `, ${registrosDia.length} ${registrosDia.length === 1 ? "anotação" : "anotações"}` : ", sem anotações"),
        "data-data": data,
      });
      botao.append(el("span", { class: "cal-numero" }, String(dia)));
      botao.append(el("span", { class: "cal-ponto", "aria-hidden": "true" }));
      grade.append(botao);
    }

    const registrosSelecionados = porDia.get(calendarioSelecionado) || [];
    $("#cal-dia-titulo").textContent = formatarData(calendarioSelecionado);
    $("#cal-contagem").textContent = registrosSelecionados.length
      ? `${registrosSelecionados.length} ${registrosSelecionados.length === 1 ? "anotação neste dia" : "anotações neste dia"}`
      : "";
    $("#cal-vazio").hidden = registrosSelecionados.length > 0;
    $("#cal-vazio-texto").textContent = "Nenhuma anotação salva para esta data.";
    const nova = $("#cal-nova");
    const podeAnotar = calendarioSelecionado <= hoje;
    nova.hidden = !podeAnotar;
    nova.href = "#/nova/" + calendarioSelecionado;

    const lista = $("#cal-lista");
    lista.replaceChildren();
    for (const r of registrosSelecionados) lista.append(criarCartao(r));
  }

  function mudarMesCalendario(delta) {
    calendarioMes = new Date(calendarioMes.getFullYear(), calendarioMes.getMonth() + delta, 1);
    calendarioSelecionado = D.hojeISO(calendarioMes);
    renderCalendario();
  }

  // ---------- Lista ----------

  function criteriosDoFormulario() {
    const f = $("#form-filtros");
    return {
      busca: f.busca.value,
      de: f.de.value,
      ate: f.ate.value,
      humor: f.humor.value,
      sintoma: f.sintoma.value,
      origem: f.origem.value,
    };
  }

  function renderLista() {
    const todos = lerTodos();
    const c = criteriosDoFormulario();
    const res = D.filtrar(todos, c);
    const lista = $("#lista-todas");
    lista.replaceChildren();
    for (const r of res) lista.append(criarCartao(r));

    const ativos = ["de", "ate", "humor", "sintoma", "origem"].filter((k) => c[k]).length;
    const cont = $("#contador-filtros");
    cont.hidden = ativos === 0;
    cont.textContent = String(ativos);

    const filtrando = Object.values(c).some(Boolean);
    const total = `${todos.length} ${todos.length === 1 ? "anotação" : "anotações"}`;
    $("#contagem-lista").textContent = todos.length ? (filtrando ? `${res.length} de ${total}` : total) : "";
    if (c.de && c.ate && c.de > c.ate) {
      $("#contagem-lista").textContent = "A data “De” é posterior à data “Até”.";
    }

    $("#vazio-lista").hidden = res.length > 0;
    if (!todos.length) {
      $("#vazio-lista-titulo").textContent = "Nenhuma anotação ainda";
      $("#vazio-lista-texto").textContent = "Use o botão + para registrar o primeiro dia.";
    } else if (!res.length) {
      $("#vazio-lista-titulo").textContent = "Nada encontrado";
      $("#vazio-lista-texto").textContent = "Nenhuma anotação corresponde à busca ou aos filtros.";
    }
  }

  function aplicarDiaNaLista(dia) {
    const f = $("#form-filtros");
    f.reset();
    f.de.value = dia;
    f.ate.value = dia;
    $("#mais-filtros").open = true;
  }

  // ---------- Formulário ----------

  function limparErros() {
    for (const p of document.querySelectorAll("#form-registro .erro")) p.textContent = "";
    for (const n of document.querySelectorAll("#form-registro [aria-invalid]")) n.removeAttribute("aria-invalid");
    $("#erro-geral").hidden = true;
  }

  function mostrarErros(erros) {
    limparErros();
    let primeiro = null;
    for (const [campo, msg] of Object.entries(erros)) {
      if (campo === "geral") {
        const g = $("#erro-geral");
        g.textContent = msg;
        g.hidden = false;
        primeiro = primeiro || g;
        continue;
      }
      const p = $("#e-" + campo);
      if (p) p.textContent = msg;
      else if (campo !== "geral") {
        const g = $("#erro-geral");
        g.textContent = msg;
        g.hidden = false;
        primeiro = primeiro || g;
      }
      const alvo = $(`#r-${campo}`) || $(`#r-${campo}-grupo input`) || $(`[name="resposta:${campo}:h"]`);
      if (alvo) {
        alvo.setAttribute("aria-invalid", "true");
        primeiro = primeiro || alvo;
      }
    }
    if (primeiro) {
      if (primeiro.id === "erro-geral") primeiro.scrollIntoView({ block: "center" });
      else {
        primeiro.focus({ preventScroll: true });
        (primeiro.closest(".categoria") || primeiro).scrollIntoView({ block: "center" });
      }
    }
  }

  function marcarRadio(nome, valor) {
    const f = $("#form-registro");
    for (const i of f.querySelectorAll(`[name="${nome}"]`)) i.checked = i.value === String(valor ?? "");
  }

  function renderForm(id, dataInicial) {
    const f = $("#form-registro");
    f.reset();
    limparErros();
    editandoId = null;
    let r = null;
    if (id) {
      r = repo.obter(id);
      if (!r) {
        avisar("Anotação não encontrada.");
        location.hash = "#/lista";
        return;
      }
      editandoId = id;
    }
    $("#t-form").textContent = r ? "Editar anotação" : "Nova anotação";
    $("#btn-apagar-form").hidden = !r;
    f.data.max = D.hojeISO();

    if (r) {
      f.data.value = r.data;
      marcarRadio("origem", r.origem);
      marcarRadio("humor", r.humor);
      marcarRadio("menstruacao", r.menstruacao);
      marcarRadio("energia", r.energia === null ? "" : r.energia);
      for (const cb of f.querySelectorAll('[name="sintomas"]')) cb.checked = r.sintomas.includes(cb.value);
      f.sintomasOutros.value = r.sintomasOutros;
      f.contexto.value = r.contexto;
      f.observacoes.value = r.observacoes;
      aplicarRespostas(r.respostas || {});
      etiquetasAtuais = Array.isArray(r.respostas && r.respostas.etiquetas) ? r.respostas.etiquetas.slice() : [];
    } else {
      f.data.value = dataInicial && D.dataValida(dataInicial) ? dataInicial : D.hojeISO();
      etiquetasAtuais = [];
    }
    desenharEtiquetas();
    atualizarContador();
    formSujo = false;
  }

  function valorRadio(nome) {
    const i = $(`#form-registro [name="${nome}"]:checked`);
    return i ? i.value : "";
  }

  function dadosDoFormulario() {
    const f = $("#form-registro");
    return {
      id: editandoId,
      data: f.data.value,
      origem: valorRadio("origem"),
      humor: valorRadio("humor"),
      energia: valorRadio("energia"),
      menstruacao: valorRadio("menstruacao"),
      sintomas: Array.from(f.querySelectorAll('[name="sintomas"]:checked')).map((c) => c.value),
      sintomasOutros: f.sintomasOutros.value,
      contexto: f.contexto.value,
      observacoes: f.observacoes.value,
      respostas: lerRespostas(),
    };
  }

  function atualizarContador() {
    $("#c-observacoes").textContent = `${$("#r-observacoes").value.length}/${D.LIMITES.observacoes}`;
  }

  /** Cria um "tile": input acessível + ícone redondo + rótulo. */
  function tile(tipo, nome, valor, icone, rotulo) {
    const lab = el("label", { class: "tile" });
    const input = el("input", { type: tipo, name: nome, value: valor });
    const corpo = el("span", { class: "tile-corpo" });
    const ic = el("span", { class: "tile-icone", "aria-hidden": "true" });
    if (typeof icone === "string") ic.textContent = icone;
    else ic.append(icone);
    corpo.append(ic, el("span", { class: "tile-rotulo" }, rotulo));
    lab.append(input, corpo);
    return lab;
  }

  function barras(n) {
    const b = el("span", { class: "barras" });
    for (let i = 1; i <= 5; i++) {
      const bar = el("i", { class: i <= n ? "on" : "" });
      bar.style.height = 6 + i * 3.6 + "px";
      b.append(bar);
    }
    return b;
  }

  /** Radios de tiles podem ser desmarcados com um segundo toque (campo opcional). */
  function permitirDesmarcar(grupo) {
    let marcadoAntes = null;
    grupo.addEventListener("pointerdown", (ev) => {
      const lab = ev.target.closest("label");
      const input = lab && lab.querySelector('input[type="radio"]');
      marcadoAntes = input && input.checked ? input : null;
    });
    grupo.addEventListener("click", (ev) => {
      const lab = ev.target.closest("label");
      const input = lab && lab.querySelector('input[type="radio"]');
      if (input && input === marcadoAntes && ev.detail > 0) {
        input.checked = false;
        formSujo = true;
      }
      marcadoAntes = null;
    });
  }

  // ---------- roteamento ----------

  const VIEWS = ["inicio", "lista", "calendario", "analise", "form", "dados"];

  function rotaAtual() {
    const h = location.hash.replace(/^#\/?/, "");
    const [caminho, query] = h.split("?");
    const params = new URLSearchParams(query || "");
    if (caminho === "lista") return { view: "lista", dia: params.get("dia") };
    if (caminho === "calendario") return { view: "calendario" };
    if (caminho === "analise") return { view: "analise" };
    if (caminho === "dados") return { view: "dados" };
    if (caminho === "nova") return { view: "form" };
    if (caminho.startsWith("nova/")) return { view: "form", data: caminho.slice(5) };
    if (caminho.startsWith("editar/")) return { view: "form", id: decodeURIComponent(caminho.slice(7)) };
    return { view: "inicio" };
  }

  let rotaAnterior = location.hash;
  let ultimaView = null;

  function renderizar(focar) {
    const rota = rotaAtual();
    document.body.classList.toggle("pagina-hoje", rota.view === "inicio");
    document.body.classList.toggle("pagina-calendario", rota.view === "calendario");
    document.body.classList.toggle("pagina-analise", rota.view === "analise");
    for (const v of VIEWS) $("#view-" + v).hidden = v !== rota.view;
    for (const a of document.querySelectorAll(".abas a")) {
      if (a.dataset.rota === rota.view) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }

    if (rota.view === "inicio") renderInicio();
    else if (rota.view === "lista") {
      if (rota.dia && D.dataValida(rota.dia)) aplicarDiaNaLista(rota.dia);
      renderLista();
    } else if (rota.view === "calendario") renderCalendario();
    else if (rota.view === "analise") renderAnalise();
    else if (rota.view === "form") renderForm(rota.id, rota.data);
    else if (rota.view === "dados") renderDados();

    const titulos = { inicio: "Diário", lista: "Anotações · Diário", calendario: "Calendário · Diário", analise: "Análise · Diário", form: "Anotação · Diário", dados: "Dados · Diário" };
    document.title = titulos[rota.view];

    if (focar && ultimaView !== null) {
      const h1 = $(`#view-${rota.view} h1`);
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    ultimaView = rota.view;
  }

  window.addEventListener("hashchange", async () => {
    if (formSujo) {
      const destino = location.hash;
      history.replaceState(null, "", rotaAnterior || "#/");
      const ok = await confirmar({
        titulo: "Descartar alterações?",
        texto: "Você tem alterações não salvas nesta anotação.",
        botao: "Descartar",
      });
      if (!ok) return;
      formSujo = false;
      history.replaceState(null, "", destino);
    }
    rotaAnterior = location.hash;
    renderizar(true);
  });

  window.addEventListener("beforeunload", (ev) => {
    if (formSujo) {
      ev.preventDefault();
      ev.returnValue = "";
    }
  });

  // Mantém abas do navegador sincronizadas.
  window.addEventListener("storage", (ev) => {
    if (ev.key === D.STORAGE_KEY && rotaAtual().view !== "form") renderizar(false);
  });

  // ---------- Dados ----------

  function renderAnalise() {
    const registros = D.ordenar(lerTodos());
    const diasMarcados = Array.from(new Set(registros.filter((r) => r.respostas && r.respostas.menstrual_intensidade).map((r) => r.data))).sort();
    const periodos = [];
    for (const dia of diasMarcados) {
      const anterior = periodos[periodos.length - 1];
      const diferenca = anterior ? (paraData(dia) - paraData(anterior.fim)) / 86400000 : 0;
      if (!anterior || diferenca !== 1) periodos.push({ inicio: dia, fim: dia, dias: 1 });
      else { anterior.fim = dia; anterior.dias++; }
    }
    const intervalos = periodos.slice(1).map((p, i) => Math.round((paraData(p.inicio) - paraData(periodos[i].inicio)) / 86400000)).slice(-6);
    const media = (nums) => nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : null;
    const mediaCiclo = media(intervalos);
    const variacao = intervalos.length > 1 ? Math.max(...intervalos) - Math.min(...intervalos) : null;
    const mediaMens = media(periodos.map((p) => p.dias));
    const stats = $("#analise-estatisticas");
    stats.replaceChildren();
    const stat = (titulo, valor, unidade, icon) => {
      const card = el("article", { class: "analise-stat" });
      card.append(el("span", { class: "analise-anel " + (icon || "") }, ""));
      const corpo = el("div", { class: "analise-stat-corpo" });
      corpo.append(el("span", { class: "analise-stat-titulo" }, titulo), el("strong", null, valor == null ? "—" : `${Number.isInteger(valor) ? valor : valor.toFixed(1)} ${unidade}`));
      card.append(corpo);
      stats.append(card);
    };
    stat("Duração média do ciclo", mediaCiclo, "dias", "anel-azul");
    stat("Variação entre ciclos", variacao, "dias", "anel-cinza");
    stat("Duração média da menstruação", mediaMens, "dias", "anel-vermelho");
    const notaStats = el("p", { class: "analise-nota" }, intervalos.length ? `Cálculo retrospectivo dos ${intervalos.length} intervalos mais recentes entre períodos marcados. São necessárias duas datas de início para calcular a duração do ciclo.` : "Marque a intensidade da menstruação nas datas correspondentes para formar um histórico. O resumo só aparece quando houver dados suficientes.");
    stats.append(notaStats);

    const menstruacao = $("#analise-menstruacao");
    menstruacao.replaceChildren();
    const niveis = ["Leve", "Mediana", "Intensa", "Muito intensa"];
    const contagens = niveis.map((nivel) => registros.filter((r) => r.respostas && r.respostas.menstrual_intensidade === nivel).length);
    const soma = contagens.reduce((a, b) => a + b, 0);
    if (!soma) {
      menstruacao.append(el("p", { class: "analise-vazio" }, "Marque a intensidade menstrual nos registros diários para ver a distribuição."));
    } else {
      const lista = el("div", { class: "analise-legenda" });
      niveis.forEach((nivel, i) => {
        const item = el("div", { class: "analise-legenda-item" });
        item.append(el("span", { class: `ponto-menstrual nivel-${i}` }), el("span", null, `${nivel}: ${contagens[i]} ${contagens[i] === 1 ? "dia" : "dias"}`));
        lista.append(item);
      });
      menstruacao.append(lista);
      const barra = el("div", { class: "analise-barra", role: "img", "aria-label": "Distribuição dos níveis de intensidade menstrual" });
      contagens.forEach((n, i) => { if (n) barra.append(el("span", { class: `nivel-${i}`, style: `width:${n / soma * 100}%` })); });
      menstruacao.append(barra);
    }

    const grafico = $("#analise-grafico");
    grafico.replaceChildren();
    const meses = [];
    const hoje = new Date();
    for (let offset = 5; offset >= 0; offset--) {
      const dt = new Date(hoje.getFullYear(), hoje.getMonth() - offset, 1);
      const id = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const n = registros.filter((r) => r.data.startsWith(id)).length;
      meses.push({ id, nome: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dt).replace(".", ""), n });
    }
    if (!registros.length) grafico.append(el("p", { class: "analise-vazio" }, "Ainda não há registros para mostrar no gráfico."));
    else {
      const max = Math.max(1, ...meses.map((m) => m.n));
      const barras = el("div", { class: "analise-grafico-barras", role: "img", "aria-label": "Quantidade de registros por mês, nos últimos seis meses" });
      meses.forEach((m) => {
        const col = el("div", { class: "analise-coluna" });
        const trilho = el("div", { class: "analise-trilho" });
        trilho.append(el("span", { style: `height:${m.n ? Math.max(5, m.n / max * 100) : 0}%` }));
        col.append(el("strong", null, String(m.n)), trilho, el("span", null, m.nome));
        barras.append(col);
      });
      grafico.append(barras);
    }

    const detalhes = $("#analise-detalhes");
    detalhes.replaceChildren();
    const foco = [
      ["dores", "Dores", "✦"], ["sentimentos", "Sentimentos", "☻"], ["temperatura", "Temperatura corporal basal", "♨"],
      ["peso", "Peso", "⚖"], ["sono_minutos", "Sono", "☾"], ["qualidade_sono", "Qualidade do sono", "☾"],
    ];
    const usados = new Set(foco.map(([key]) => key));
    CATEGORIAS.forEach(([key, title, icon]) => { if (!usados.has(key)) foco.push([key, title, icon]); });
    foco.forEach(([key, title, icon]) => {
      const card = el("details", { class: "analise-detalhe" });
      const sum = el("summary");
      sum.append(el("span", { class: "analise-icone" }, icon), el("span", null, title), el("span", { class: "analise-chevron", "aria-hidden": "true" }, "›"));
      card.append(sum);
      const valores = new Map();
      registros.forEach((r) => {
        const v = r.respostas && r.respostas[key];
        (Array.isArray(v) ? v : v == null ? [] : [typeof v === "object" ? `${v.h || 0}h ${v.m || 0}min` : String(v)]).forEach((item) => valores.set(item, (valores.get(item) || 0) + 1));
      });
      const corpo = el("div", { class: "analise-detalhe-corpo" });
      if (!valores.size) corpo.append(el("p", { class: "analise-vazio" }, "Sem registros nesta categoria ainda."));
      else {
        const ordenados = Array.from(valores).sort((a, b) => b[1] - a[1]);
        ordenados.slice(0, 10).forEach(([nome, n]) => {
          const linha = el("div", { class: "analise-frequencia" });
          linha.append(el("span", null, nome), el("strong", null, `${n} ${n === 1 ? "registro" : "registros"}`));
          corpo.append(linha);
        });
        const numericos = registros.map((r) => r.respostas && r.respostas[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
        if (numericos.length) corpo.append(el("p", { class: "analise-nota" }, `Média manual: ${media(numericos).toFixed(1)}${key === "peso" ? " kg" : " °C"} · ${numericos.length} medições`));
      }
      card.append(corpo);
      detalhes.append(card);
    });
  }

  function renderDados() {
    const n = lerTodos().length;
    const base = armazenamentoOk
      ? `Armazenamento local disponível. ${n} ${n === 1 ? "anotação salva" : "anotações salvas"}.`
      : "Armazenamento local indisponível neste navegador (janela privada ou bloqueio de dados do site).";
    const info = $("#info-armazenamento");
    info.textContent = base;
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((p) => {
        info.textContent =
          base +
          (p
            ? " O navegador marcou este armazenamento como persistente (menos chance de ser limpo automaticamente)."
            : " O navegador não garantiu armazenamento persistente; ele pode ser limpo automaticamente em caso de pouco espaço.");
      });
    }
    $("#btn-exportar").disabled = n === 0;
    $("#btn-apagar-tudo").disabled = n === 0;
  }

  // ---------- montagem ----------

  function montarFormulario() {
    const gHumor = $("#r-humor-grupo");
    for (const h of D.HUMORES) gHumor.append(tile("radio", "humor", h, ICONES_HUMOR[h] || "•", h));
    const gEnergia = $("#r-energia-grupo");
    for (const [v, rot] of Object.entries(D.ENERGIA)) gEnergia.append(tile("radio", "energia", v, barras(Number(v)), rot));
    const gMens = $("#r-menstruacao-grupo");
    for (const [v, rot] of Object.entries(D.MENSTRUACAO)) gMens.append(tile("radio", "menstruacao", v, ICONES_MENS[v], rot));
    const gSint = $("#r-sintomas-grupo");
    for (const s of D.SINTOMAS) gSint.append(tile("checkbox", "sintomas", s, ICONES_SINTOMAS[s] || "•", s));
    [gHumor, gEnergia, gMens].forEach(permitirDesmarcar);

    const host = $("#categorias-expandidas");
    for (const [chave, titulo, icone, opcoes, tipo = "checkbox", unidade = ""] of CATEGORIAS) {
      const bloco = el("fieldset", { class: "categoria categoria-extra" });
      bloco.append(el("legend", null, `${icone} ${titulo}`));
      if (tipo === "number") {
        const campo = el("label", { class: "medida-campo" });
        const input = el("input", { type: "number", name: `resposta:${chave}`, min: "0", max: chave === "temperatura" ? "50" : "500", step: chave === "temperatura" ? "0.1" : "0.1", inputmode: "decimal", placeholder: "Opcional" });
        campo.append(input, el("span", null, unidade));
        bloco.append(campo);
      } else if (tipo === "duration") {
        const linha = el("div", { class: "duracao-linha" });
        const inputH = el("input", { type: "number", name: `resposta:${chave}:h`, min: "0", max: "24", step: "1", inputmode: "numeric", placeholder: "00", "aria-label": `${titulo}: horas` });
        const inputM = el("input", { type: "number", name: `resposta:${chave}:m`, min: "0", max: "59", step: "1", inputmode: "numeric", placeholder: "00", "aria-label": `${titulo}: minutos` });
        linha.append(inputH, el("span", null, "h"), inputM, el("span", null, "min"));
        bloco.append(linha);
        bloco.append(el("p", { class: "erro", id: `e-${chave}` }));
      } else {
        const grade = el("div", { class: "tiles" });
        opcoes.forEach((rotulo) => grade.append(tile(tipo, `resposta:${chave}`, rotulo, icone, rotulo)));
        if (tipo === "radio") permitirDesmarcar(grade);
        bloco.append(grade);
      }
      host.append(bloco);
    }

    preencherSelect($("#f-humor"), D.HUMORES.map((h) => [h, h]));
    const opcoesFiltro = new Set(D.SINTOMAS);
    CATEGORIAS.forEach(([, , , opcoes]) => opcoes.forEach((v) => opcoesFiltro.add(v)));
    preencherSelect($("#f-sintoma"), Array.from(opcoesFiltro, (s) => [s, s]).concat([["__outros", "Outros (texto livre)"]]));
    preencherSelect($("#f-origem"), Object.entries(D.ORIGENS));

    const f = $("#form-registro");
    f.addEventListener("input", () => {
      formSujo = true;
    });
    f.addEventListener("change", () => {
      formSujo = true;
    });
    $("#r-observacoes").addEventListener("input", atualizarContador);
    $("#btn-etiqueta").addEventListener("click", () => {
      const input = $("#r-etiqueta");
      const nome = input.value.trim();
      if (!nome || etiquetasAtuais.some((e) => e.toLocaleLowerCase() === nome.toLocaleLowerCase())) return;
      etiquetasAtuais.push(nome);
      input.value = "";
      desenharEtiquetas();
      formSujo = true;
    });
    $("#r-etiqueta").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); $("#btn-etiqueta").click(); }
    });

    f.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!armazenamentoOk) {
        mostrarErros({ geral: "Não é possível salvar: o armazenamento local do navegador está indisponível." });
        return;
      }
      let res;
      try {
        res = repo.salvar(dadosDoFormulario());
      } catch (e) {
        mostrarErros({ geral: "Não foi possível salvar (armazenamento cheio, bloqueado ou corrompido). Exporte e libere espaço." });
        return;
      }
      if (!res.ok) {
        mostrarErros(res.erros);
        return;
      }
      formSujo = false;
      avisar(res.novo ? `Respostas salvas em ${formatarData(res.registro.data)}.` : "Alterações salvas.");
      location.hash = res.novo ? "#/" : "#/lista";
    });

    $("#btn-cancelar").addEventListener("click", () => {
      location.hash = editandoId ? "#/lista" : "#/";
    });

    $("#btn-apagar-form").addEventListener("click", () => {
      const r = editandoId && repo.obter(editandoId);
      if (!r) return;
      apagarRegistro(r, () => {
        formSujo = false;
        location.hash = "#/lista";
      });
    });

    const ff = $("#form-filtros");
    ff.addEventListener("input", renderLista);
    ff.addEventListener("change", renderLista);
    ff.addEventListener("submit", (ev) => ev.preventDefault());
    ff.addEventListener("reset", () => setTimeout(renderLista, 0));
  }

  function lerRespostas() {
    const respostas = {};
    for (const [key, , , , tipo] of CATEGORIAS) {
      if (tipo === "duration") {
        const campoH = $(`[name="resposta:${key}:h"]`);
        const campoM = $(`[name="resposta:${key}:m"]`);
        const textoH = campoH.value.trim();
        const textoM = campoM.value.trim();
        if (textoH || textoM || campoH.validity.badInput || campoM.validity.badInput) {
          respostas[key] = {
            h: campoH.validity.badInput ? NaN : (textoH === "" ? 0 : Number(textoH)),
            m: campoM.validity.badInput ? NaN : (textoM === "" ? 0 : Number(textoM)),
          };
        }
      } else if (tipo === "number") {
        const v = $(`[name="resposta:${key}"]`).value;
        if (v !== "") respostas[key] = Number(v);
      } else if (tipo === "radio") {
        const i = $(`[name="resposta:${key}"]:checked`);
        if (i) respostas[key] = i.value;
      } else {
        const valores = Array.from(document.querySelectorAll(`[name="resposta:${key}"]:checked`)).map((i) => i.value);
        if (valores.length) respostas[key] = valores;
      }
    }
    if ($("#r-observacoes").value) respostas.nota_diaria = $("#r-observacoes").value;
    if (etiquetasAtuais.length) respostas.etiquetas = etiquetasAtuais;
    return respostas;
  }

  function aplicarRespostas(respostas) {
    for (const [key, , , , tipo] of CATEGORIAS) {
      const valor = respostas[key];
      if (tipo === "duration") {
        $(`[name="resposta:${key}:h"]`).value = valor ? valor.h : "";
        $(`[name="resposta:${key}:m"]`).value = valor ? valor.m : "";
      } else if (tipo === "number") {
        $(`[name="resposta:${key}"]`).value = valor ?? "";
      } else if (tipo === "radio") {
        document.querySelectorAll(`[name="resposta:${key}"]`).forEach((i) => { i.checked = i.value === valor; });
      } else {
        const lista = Array.isArray(valor) ? valor : [];
        document.querySelectorAll(`[name="resposta:${key}"]`).forEach((i) => { i.checked = lista.includes(i.value); });
      }
    }
    if (respostas.nota_diaria) $("#r-observacoes").value = respostas.nota_diaria;
  }

  function desenharEtiquetas() {
    const lista = $("#r-etiquetas");
    lista.replaceChildren();
    etiquetasAtuais.forEach((nome, indice) => {
      const botao = el("button", { type: "button", class: "etiqueta-item", "aria-label": `Remover etiqueta ${nome}` }, `${nome} ×`);
      botao.addEventListener("click", () => {
        etiquetasAtuais.splice(indice, 1);
        desenharEtiquetas();
        formSujo = true;
      });
      lista.append(botao);
    });
  }

  function montarDados() {
    $("#btn-exportar").addEventListener("click", () => {
      let json;
      try {
        json = repo.exportar();
      } catch (e) {
        avisar("Não foi possível ler os dados para exportar.");
        return;
      }
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = el("a", { href: url, download: `diario-backup-${D.hojeISO()}.json` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      avisar("Arquivo de exportação gerado.");
    });

    $("#arquivo-importar").addEventListener("change", async (ev) => {
      const input = ev.target;
      const arq = input.files && input.files[0];
      if (!arq) return;
      try {
        if (arq.size > 10 * 1024 * 1024) {
          avisar("Arquivo grande demais (máximo 10 MB).");
          return;
        }
        const an = repo.analisarImportacao(await arq.text());
        if (!an.ok) {
          avisar(an.erro);
          return;
        }
        if (!an.validos.length) {
          avisar("Nenhuma anotação válida encontrada no arquivo.");
          return;
        }
        const ok = await confirmar({
          titulo: "Importar backup?",
          texto:
            `${an.validos.length} ${an.validos.length === 1 ? "anotação válida encontrada" : "anotações válidas encontradas"}` +
            (an.invalidos ? ` (${an.invalidos} ignoradas por estarem inválidas)` : "") +
            ". Anotações com o mesmo identificador serão substituídas.",
          botao: "Importar",
          perigo: false,
        });
        if (!ok) return;
        const r = repo.aplicarImportacao(an.validos);
        avisar(`${r.importados} importadas` + (r.substituidos ? `, ${r.substituidos} substituídas.` : "."));
        renderDados();
      } catch (e) {
        avisar("Não foi possível importar o arquivo.");
      } finally {
        input.value = "";
      }
    });

    $("#btn-apagar-tudo").addEventListener("click", async () => {
      const n = lerTodos().length;
      const ok = await confirmar({
        titulo: "Apagar todos os registros?",
        texto: `Isso remove permanentemente ${n} ${n === 1 ? "anotação" : "anotações"} deste dispositivo. Não há como desfazer.`,
        botao: "Apagar tudo",
        exigirTexto: "APAGAR",
      });
      if (!ok) return;
      try {
        repo.apagarTudo();
      } catch (e) {
        avisar("Não foi possível apagar: armazenamento indisponível.");
        return;
      }
      avisar("Todos os registros foram apagados.");
      renderDados();
    });
  }

  function montarCalendario() {
    $("#cal-anterior").addEventListener("click", () => mudarMesCalendario(-1));
    $("#cal-proximo").addEventListener("click", () => mudarMesCalendario(1));
    $("#cal-grade").addEventListener("click", (ev) => {
      const botao = ev.target.closest("button[data-data]");
      if (!botao) return;
      calendarioSelecionado = botao.dataset.data;
      const [ano, mes] = calendarioSelecionado.split("-").map(Number);
      calendarioMes = new Date(ano, mes - 1, 1);
      renderCalendario();
    });
  }

  montarFormulario();
  montarDados();
  montarCalendario();
  if (!armazenamentoOk) {
    mostrarFaixa("O armazenamento local está indisponível (janela privada ou dados do site bloqueados). As anotações não serão salvas.");
  } else if (navigator.storage && navigator.storage.persist) {
    // Pede ao navegador para não limpar os dados automaticamente. Local; não envia nada.
    navigator.storage.persist().catch(() => {});
  }
  renderizar(false);
})();
