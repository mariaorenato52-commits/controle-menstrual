/* Supabase Auth por e-mail/senha, sem SDK/CDN. Os registros continuam locais. */
(function () {
  "use strict";
  const cfg = window.DIARIO_SUPABASE_CONFIG || {};
  const gate = document.querySelector("#login-gate");
  const form = document.querySelector("#login-form");
  const submit = document.querySelector("#login-submit");
  const status = document.querySelector("#login-status");
  const sessionKey = "diario.auth.session:v1";
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.projectUrl || "") &&
    typeof cfg.anonKey === "string" && cfg.anonKey.length > 20;

  function falar(mensagem) { status.textContent = mensagem; }
  function urlBase() { return cfg.projectUrl.replace(/\/$/, ""); }
  function guardarSessao(sessao) {
    if (sessao && !sessao.expires_at && sessao.expires_in) sessao.expires_at = Math.floor(Date.now() / 1000) + Number(sessao.expires_in);
    sessionStorage.setItem(sessionKey, JSON.stringify(sessao));
  }
  function lerSessao() {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || "null"); } catch (_) { return null; }
  }
  function limparSessao() { sessionStorage.removeItem(sessionKey); }
  async function requisitar(path, body, token) {
    const headers = { apikey: cfg.anonKey, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resposta = await fetch(urlBase() + path, { method: "POST", headers, body: JSON.stringify(body) });
    const json = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(json.msg || json.message || "E-mail ou senha inválidos.");
    return json;
  }
  function liberar(sessao) {
    if (!sessao || !sessao.access_token || !sessao.user) return false;
    document.querySelector("#app-abas").hidden = false;
    document.querySelector("#app-palco").hidden = false;
    gate.hidden = true;
    const appScript = document.createElement("script");
    appScript.src = "js/app.js";
    appScript.onerror = () => { gate.hidden = false; falar("Não foi possível carregar o diário. Recarregue a página."); };
    document.body.append(appScript);
    const conta = document.querySelector("#conta-atual");
    if (conta) conta.textContent = `Sessão ativa: ${sessao.user.email}. As anotações continuam neste dispositivo.`;
    return true;
  }
  async function atualizarSePreciso(sessao) {
    if (!sessao || !sessao.access_token || !sessao.user) return null;
    if (Number(sessao.expires_at || 0) > Math.floor(Date.now() / 1000) + 60) return sessao;
    if (!sessao.refresh_token) return null;
    const renovada = await requisitar("/auth/v1/token?grant_type=refresh_token", { refresh_token: sessao.refresh_token });
    guardarSessao(renovada);
    return renovada;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!configured || submit.disabled) return;
    submit.disabled = true;
    falar("Validando acesso…");
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      const sessao = await requisitar("/auth/v1/token?grant_type=password", { email, password });
      guardarSessao(sessao);
      form.password.value = "";
      if (!liberar(sessao)) throw new Error("O Supabase não retornou uma sessão válida para esta conta.");
    } catch (erro) {
      form.password.value = "";
      submit.disabled = false;
      falar(erro.message || "Não foi possível entrar. Confira os dados e tente novamente.");
    }
  });

  const sair = document.querySelector("#btn-sair");
  if (sair) sair.addEventListener("click", async () => {
    const sessao = lerSessao();
    limparSessao();
    try { if (sessao && sessao.access_token) await requisitar("/auth/v1/logout", {}, sessao.access_token); } catch (_) { /* sessão local já encerrada */ }
    location.reload();
  });

  (async function inicializar() {
    if (!configured) {
      falar("Configuração pendente: informe a URL do projeto Supabase e a chave pública anon/publishable em js/auth-config.js.");
      return;
    }
    try {
      const sessao = await atualizarSePreciso(lerSessao());
      if (sessao && liberar(sessao)) return;
      limparSessao();
      submit.disabled = false;
      falar("Entre com a conta administradora criada no Supabase.");
    } catch (_) {
      limparSessao();
      submit.disabled = false;
      falar("Sua sessão expirou. Entre novamente com a conta administradora.");
    }
  })();
})();
