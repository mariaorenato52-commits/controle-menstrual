/*
 * Modelo de dados, validação, filtros e armazenamento do Diário.
 * Sem dependências e sem rede: funciona no navegador (window.Diario)
 * e no Node (require) para os testes.
 */
(function (root) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = "diario-observacoes:v1";
  const EXPORT_APP_ID = "diario-observacoes";

  const ORIGENS = {
    ela_contou: "Ela me contou",
    minha_observacao: "Minha observação",
  };

  const HUMORES = [
    "Bem",
    "Feliz",
    "Tranquila",
    "Animada",
    "Carinhosa",
    "Cansada",
    "Sensível",
    "Ansiosa",
    "Irritada",
    "Estressada",
    "Triste",
    "Instável",
  ];

  const SINTOMAS = [
    "Cólica",
    "Dor de cabeça",
    "Inchaço",
    "Sensibilidade nos seios",
    "Dor nas costas",
    "Náusea",
    "Acne",
    "Vontade de doces",
    "Fome maior",
    "Cansaço",
    "Insônia",
    "Sono a mais",
  ];

  const MENSTRUACAO = {
    sim: "Sim",
    nao: "Não",
    nao_sei: "Não sei",
  };

  const ENERGIA = {
    1: "Muito baixa",
    2: "Baixa",
    3: "Normal",
    4: "Boa",
    5: "Muito alta",
  };

  const LIMITES = {
    contexto: 300,
    observacoes: 3000,
    sintomasOutros: 200,
  };

  const CAMPOS_DURACAO = new Set(["sono_minutos", "meditacao_minutos"]);

  function normalizarParteDuracao(valor) {
    if (valor === undefined || valor === null || valor === "") return 0;
    if (typeof valor === "number") return valor;
    if (typeof valor === "string" && valor.trim()) return Number(valor);
    return NaN;
  }

  // ---------- utilidades de data (sempre no fuso local) ----------

  function hojeISO(agora) {
    const d = agora instanceof Date ? agora : new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${dia}`;
  }

  function dataValida(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const [a, m, d] = iso.split("-").map(Number);
    const dt = new Date(a, m - 1, d);
    return dt.getFullYear() === a && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function gerarId() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") {
      return root.crypto.randomUUID();
    }
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  // ---------- normalização e validação ----------

  function texto(v) {
    return typeof v === "string" ? v.trim() : "";
  }

  /** Converte dados brutos (formulário ou importação) no formato canônico. */
  function normalizar(bruto) {
    const b = bruto && typeof bruto === "object" ? bruto : {};
    const energiaNum = b.energia === "" || b.energia == null ? null : Number(b.energia);
    const sintomas = Array.isArray(b.sintomas)
      ? Array.from(new Set(b.sintomas.filter((s) => typeof s === "string")))
      : [];
    const respostas = b.respostas && typeof b.respostas === "object" && !Array.isArray(b.respostas)
      ? { ...b.respostas }
      : {};
    for (const chave of CAMPOS_DURACAO) {
      const duracao = respostas[chave];
      if (duracao && typeof duracao === "object" && !Array.isArray(duracao)) {
        respostas[chave] = {
          h: normalizarParteDuracao(duracao.h ?? duracao.horas),
          m: normalizarParteDuracao(duracao.m ?? duracao.minutos),
        };
      }
    }

    return {
      id: typeof b.id === "string" && b.id ? b.id : null,
      schema_version: SCHEMA_VERSION,
      data: texto(b.data),
      origem: texto(b.origem),
      humor: texto(b.humor),
      energia: Number.isNaN(energiaNum) ? NaN : energiaNum,
      menstruacao: texto(b.menstruacao),
      sintomas,
      sintomasOutros: texto(b.sintomasOutros),
      contexto: texto(b.contexto),
      observacoes: texto(b.observacoes),
      respostas,
      criadoEm: typeof b.criadoEm === "string" ? b.criadoEm : null,
      atualizadoEm: typeof b.atualizadoEm === "string" ? b.atualizadoEm : null,
    };
  }

  /**
   * Valida um registro normalizado.
   * Retorna um objeto { campo: mensagem }; vazio significa válido.
   */
  function validar(reg, opcoes) {
    const op = opcoes || {};
    const erros = {};
    const hoje = hojeISO(op.agora);

    if (!reg.data) erros.data = "Informe a data.";
    else if (!dataValida(reg.data)) erros.data = "Data inválida.";
    else if (!op.permitirFuturo && reg.data > hoje) erros.data = "A data não pode estar no futuro.";

    if (!reg.origem) erros.origem = "Escolha a origem da informação.";
    else if (!Object.prototype.hasOwnProperty.call(ORIGENS, reg.origem)) erros.origem = "Origem inválida.";

    if (reg.humor && !HUMORES.includes(reg.humor)) erros.humor = "Humor inválido.";

    if (reg.energia !== null) {
      if (!Number.isInteger(reg.energia) || reg.energia < 1 || reg.energia > 5) {
        erros.energia = "Energia deve ser de 1 a 5.";
      }
    }

    if (reg.menstruacao && !Object.prototype.hasOwnProperty.call(MENSTRUACAO, reg.menstruacao)) {
      erros.menstruacao = "Valor inválido.";
    }

    const invalidos = reg.sintomas.filter((s) => !SINTOMAS.includes(s));
    if (invalidos.length) erros.sintomas = "Sintoma inválido: " + invalidos.join(", ");

    for (const campo of Object.keys(LIMITES)) {
      if (reg[campo].length > LIMITES[campo]) {
        erros[campo] = `Máximo de ${LIMITES[campo]} caracteres (atual: ${reg[campo].length}).`;
      }
    }

    let tamanhoRespostas = 0;
    try { tamanhoRespostas = JSON.stringify(reg.respostas).length; } catch (_) { tamanhoRespostas = 100001; }
    if (tamanhoRespostas > 100000) erros.respostas = "As respostas excedem o limite de armazenamento.";
    for (const [chave, valor] of Object.entries(reg.respostas || {})) {
      if (!/^[a-z_]{1,40}$/.test(chave)) { erros.respostas = "Campo de resposta inválido."; break; }
      if (typeof valor === "number" && (!Number.isFinite(valor) || valor < 0 || valor > 500)) erros.respostas = "Informe um número válido entre 0 e 500.";
      else if (Array.isArray(valor) && (valor.length > 100 || valor.some((v) => typeof v !== "string" || v.length > 120))) erros.respostas = "Uma das opções selecionadas é inválida.";
      else if (typeof valor === "string" && valor.length > 3000) erros.respostas = "A nota diária pode ter até 3.000 caracteres.";
      else if (CAMPOS_DURACAO.has(chave) && valor && typeof valor === "object" && !Array.isArray(valor) &&
        (!Number.isInteger(valor.h) || valor.h < 0 || valor.h > 24 || !Number.isInteger(valor.m) || valor.m < 0 || valor.m > 59)) {
        erros[chave] = "Informe horas inteiras entre 0 e 24 e minutos entre 0 e 59.";
      } else if (valor && typeof valor === "object" && !Array.isArray(valor)) {
        erros.respostas = "Formato de resposta inválido.";
      }
    }

    const temConteudo =
      reg.humor ||
      reg.energia !== null ||
      reg.menstruacao ||
      reg.sintomas.length ||
      Object.keys(reg.respostas).length ||
      reg.sintomasOutros ||
      reg.contexto ||
      reg.observacoes;
    if (!temConteudo) {
      erros.geral = "Preencha pelo menos um campo além da data e da origem.";
    }

    return erros;
  }

  // ---------- ordenação, busca e filtros ----------

  function ordenar(registros) {
    return registros.slice().sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      return (b.atualizadoEm || "").localeCompare(a.atualizadoEm || "");
    });
  }

  function semAcento(s) {
    return String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  /**
   * Filtra registros. Critérios (todos opcionais):
   * { busca, de, ate, humor, sintoma, origem }
   */
  function filtrar(registros, criterios) {
    const c = criterios || {};
    const termo = c.busca ? semAcento(c.busca.trim()) : "";
    return ordenar(
      registros.filter((r) => {
        if (c.de && r.data < c.de) return false;
        if (c.ate && r.data > c.ate) return false;
        if (c.humor && r.humor !== c.humor) return false;
        if (c.origem && r.origem !== c.origem) return false;
        if (c.sintoma) {
          if (c.sintoma === "__outros") {
            if (!r.sintomasOutros) return false;
          } else {
            const respostas = Object.values(r.respostas || {}).flatMap((v) => Array.isArray(v) ? v : (typeof v === "string" ? [v] : []));
            if (!r.sintomas.includes(c.sintoma) && !respostas.includes(c.sintoma)) return false;
          }
        }
        if (termo) {
          const alvo = semAcento(
            [r.observacoes, r.contexto, r.sintomasOutros, r.humor, r.sintomas.join(" "), JSON.stringify(r.respostas || {})].join(" ")
          );
          if (!alvo.includes(termo)) return false;
        }
        return true;
      })
    );
  }

  // ---------- armazenamento (localStorage) ----------

  function criarRepositorio(storage) {
    function disponivel() {
      try {
        const k = STORAGE_KEY + ":teste";
        storage.setItem(k, "1");
        storage.removeItem(k);
        return true;
      } catch (_) {
        return false;
      }
    }

    function carregar() {
      let bruto;
      try {
        bruto = storage.getItem(STORAGE_KEY);
      } catch (_) {
        return [];
      }
      if (!bruto) return [];
      let dados;
      try {
        dados = JSON.parse(bruto);
      } catch (_) {
        throw new Error("Os dados salvos estão corrompidos e não puderam ser lidos.");
      }
      const lista = Array.isArray(dados && dados.registros) ? dados.registros : [];
      return lista.map(normalizar).filter((r) => r.id);
    }

    function gravar(registros) {
      const payload = JSON.stringify({ schema_version: SCHEMA_VERSION, registros });
      storage.setItem(STORAGE_KEY, payload); // lança em caso de cota cheia/bloqueio
    }

    function salvar(bruto, agora) {
      const reg = normalizar(bruto);
      const erros = validar(reg, { agora });
      if (Object.keys(erros).length) return { ok: false, erros };

      const registros = carregar();
      const instante = (agora || new Date()).toISOString();
      const idx = reg.id ? registros.findIndex((r) => r.id === reg.id) : -1;
      if (idx >= 0) {
        reg.criadoEm = registros[idx].criadoEm || instante;
        reg.atualizadoEm = instante;
        registros[idx] = reg;
      } else {
        reg.id = gerarId();
        reg.criadoEm = instante;
        reg.atualizadoEm = instante;
        registros.push(reg);
      }
      gravar(registros);
      return { ok: true, registro: reg, novo: idx < 0 };
    }

    function obter(id) {
      return carregar().find((r) => r.id === id) || null;
    }

    function apagar(id) {
      const registros = carregar();
      const restantes = registros.filter((r) => r.id !== id);
      if (restantes.length === registros.length) return false;
      gravar(restantes);
      return true;
    }

    function apagarTudo() {
      storage.removeItem(STORAGE_KEY);
    }

    function exportar(agora) {
      return JSON.stringify(
        {
          app: EXPORT_APP_ID,
          schema_version: SCHEMA_VERSION,
          exportadoEm: (agora || new Date()).toISOString(),
          registros: ordenar(carregar()),
        },
        null,
        2
      );
    }

    /**
     * Lê um arquivo exportado e mescla com os dados atuais.
     * Registros com o mesmo id são substituídos. Nada é gravado se houver erro.
     */
    function analisarImportacao(textoJson) {
      let dados;
      try {
        dados = JSON.parse(textoJson);
      } catch (_) {
        return { ok: false, erro: "O arquivo não é um JSON válido." };
      }
      if (!dados || dados.app !== EXPORT_APP_ID || !Array.isArray(dados.registros)) {
        return { ok: false, erro: "O arquivo não parece ser uma exportação deste diário." };
      }
      if (dados.schema_version > SCHEMA_VERSION) {
        return { ok: false, erro: "O arquivo foi gerado por uma versão mais nova do app." };
      }
      const validos = [];
      let invalidos = 0;
      for (const bruto of dados.registros) {
        const reg = normalizar(bruto);
        const erros = validar(reg, { permitirFuturo: true });
        if (!reg.id || Object.keys(erros).length) invalidos++;
        else validos.push(reg);
      }
      return { ok: true, validos, invalidos };
    }

    function aplicarImportacao(validos) {
      const mapa = new Map(carregar().map((r) => [r.id, r]));
      let substituidos = 0;
      for (const reg of validos) {
        if (mapa.has(reg.id)) substituidos++;
        mapa.set(reg.id, reg);
      }
      gravar(Array.from(mapa.values()));
      return { importados: validos.length, substituidos };
    }

    return {
      disponivel,
      carregar,
      salvar,
      obter,
      apagar,
      apagarTudo,
      exportar,
      analisarImportacao,
      aplicarImportacao,
    };
  }

  const api = {
    SCHEMA_VERSION,
    STORAGE_KEY,
    ORIGENS,
    HUMORES,
    SINTOMAS,
    MENSTRUACAO,
    ENERGIA,
    LIMITES,
    hojeISO,
    dataValida,
    normalizar,
    validar,
    ordenar,
    filtrar,
    criarRepositorio,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Diario = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
