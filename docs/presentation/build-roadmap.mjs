import pptxgen from "pptxgenjs";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dir, "Agente360-Roadmap-Implementacao.pptx");

const THEME = {
  name: "Agente 360 ZAP",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "00385E",
    lt1: "FFFFFF",
    dk2: "1A1A1A",
    lt2: "F3F5F7",
    accent1: "017EC1",
    accent2: "FCD202",
    accent3: "CF1A6F",
    accent4: "107C10",
    accent5: "003A7D",
    accent6: "6B7280",
    hlink: "017EC1",
    folHlink: "017EC1",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "ZAP — Agente 360";
pres.title = "Roadmap de Implementação — Agente 360";
pres.subject = "Power Apps Code App + SharePoint";

const C = {
  navy: "00385E",
  blue: "017EC1",
  yellow: "FCD202",
  magenta: "CF1A6F",
  white: "FFFFFF",
  text: "1A1A1A",
  muted: "6B7280",
  light: "F3F5F7",
  green: "107C10",
};

function slideTitleDark(title, subtitle) {
  const s = pres.addSlide();
  s.background = { color: C.navy };
  s.addText(title, {
    x: 0.6,
    y: 1.85,
    w: 8.8,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: C.white,
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6,
      y: 3.15,
      w: 8.8,
      h: 0.8,
      fontSize: 16,
      color: C.yellow,
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
    });
  }
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 5.0,
    w: 1.2,
    h: 0.08,
    fill: { color: C.yellow },
    line: { color: C.yellow, width: 0 },
  });
  return s;
}

function slideSection(title) {
  const s = pres.addSlide();
  s.background = { color: C.blue };
  s.addText(title, {
    x: 0.6,
    y: 2.2,
    w: 8.8,
    h: 1,
    fontSize: 32,
    bold: true,
    color: C.white,
    align: "center",
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  return s;
}

function slideContent(title, bullets, footer) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addText(title, {
    x: 0.55,
    y: 0.45,
    w: 8.9,
    h: 0.65,
    fontSize: 28,
    bold: true,
    color: C.navy,
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  s.addText(
    bullets.map((t) => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } })),
    {
      x: 0.55,
      y: 1.25,
      w: 8.9,
      h: 4.0,
      fontSize: 14,
      color: C.text,
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
      valign: "top",
    },
  );
  if (footer) {
    s.addText(footer, {
      x: 0.55,
      y: 5.15,
      w: 8.9,
      h: 0.35,
      fontSize: 10,
      color: C.muted,
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
    });
  }
  s.addText("Agente 360", {
    x: 8.2,
    y: 5.15,
    w: 1.3,
    h: 0.35,
    fontSize: 10,
    color: C.blue,
    align: "right",
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  return s;
}

function slideTwoCol(title, leftTitle, leftBullets, rightTitle, rightBullets) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addText(title, {
    x: 0.55,
    y: 0.45,
    w: 8.9,
    h: 0.65,
    fontSize: 26,
    bold: true,
    color: C.navy,
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  s.addText(leftTitle, {
    x: 0.55,
    y: 1.15,
    w: 4.2,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: C.blue,
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  s.addText(
    leftBullets.map((t) => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 4 } })),
    {
      x: 0.55,
      y: 1.55,
      w: 4.2,
      h: 3.6,
      fontSize: 13,
      color: C.text,
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
      valign: "top",
    },
  );
  s.addText(rightTitle, {
    x: 5.0,
    y: 1.15,
    w: 4.45,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: C.magenta,
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  s.addText(
    rightBullets.map((t) => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 4 } })),
    {
      x: 5.0,
      y: 1.55,
      w: 4.45,
      h: 3.6,
      fontSize: 13,
      color: C.text,
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
      valign: "top",
    },
  );
  return s;
}

function slideTimeline(title, phases) {
  const s = pres.addSlide();
  s.background = { color: C.light };
  s.addText(title, {
    x: 0.55,
    y: 0.4,
    w: 8.9,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: C.navy,
    fontFace: "Calibri",
    isTextBox: true,
    margin: 0,
  });
  const startX = 0.55;
  const boxW = 1.55;
  const gap = 0.35;
  phases.forEach((ph, i) => {
    const x = startX + i * (boxW + gap);
    const fill = i === 0 ? C.green : i === phases.length - 1 ? C.muted : C.blue;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.35,
      w: boxW,
      h: 0.55,
      fill: { color: fill },
      line: { color: fill, width: 0 },
      rectRadius: 0.08,
    });
    s.addText(ph.label, {
      x,
      y: 1.42,
      w: boxW,
      h: 0.45,
      fontSize: 11,
      bold: true,
      color: C.white,
      align: "center",
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
    });
    s.addText(ph.items.map((t) => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 3 } })), {
      x,
      y: 2.05,
      w: boxW,
      h: 2.9,
      fontSize: 9.5,
      color: C.text,
      fontFace: "Calibri",
      isTextBox: true,
      margin: 0,
      valign: "top",
    });
    if (i < phases.length - 1) {
      s.addText("→", {
        x: x + boxW + 0.05,
        y: 1.45,
        w: 0.25,
        h: 0.4,
        fontSize: 18,
        color: C.navy,
        align: "center",
        fontFace: "Calibri",
        isTextBox: true,
        margin: 0,
      });
    }
  });
  return s;
}

// --- Slides ---

slideTitleDark(
  "Agente 360",
  "Roadmap de implementação · Power Apps Code App + SharePoint (AgentesAO)",
);

slideContent("Objectivo da solução", [
  "Plataforma móvel e desktop para consultores gerirem a sua carteira de agentes ZAP de ponta a ponta.",
  "Ciclo operacional: CAPTAR → REGISTAR VISITA → CHECKLIST → ACOMPANHAR → ANALISAR (KPIs e rappel).",
  "Fonte de verdade: listas SharePoint no site AgentesAO — sem Dataverse nesta versão.",
  "Autenticação Microsoft 365 no player Power Apps; cada consultor vê apenas a sua carteira e as suas visitas.",
  "Publicação contínua via Power Apps CLI (pac code push) a partir do repositório app/.",
]);

slideSection("O que a aplicação faz");

slideContent("Descrição completa da app — visão 360º", [
  "Início (Dashboard): KPIs da carteira do consultor (total, com/sem investimentos, novos no mês, tipos Produto/Zapadinha); KPIs de visitas (hoje, mês, agendadas hoje, por visitar, 7 dias); distribuição por província; actividade recente; atalhos Captar e Visitar.",
  "Cabeçalho inteligente: saudação, logo ZAP, resumo da carteira + visitados no mês + por visitar + agendados hoje + visitas hoje (dados SharePoint).",
  "Agentes: lista pesquisável e filtros (com/sem investimentos); apenas agentes onde o consultor é responsável (campo Consultor).",
  "Captar: registo de novo agente na BD_Agentes_Palhativa (nome, província, município, tipo, email) com consultor preenchido automaticamente.",
  "Perfil 360º: ficha do agente, separadores Resumo, Visitas, Checklist, Documentos, Rappel, Pagamentos (roadmap); iniciar visita a partir do perfil.",
  "Visitar: seleccionar agente da carteira, GPS obrigatório, tipo de visita; grava item na Controlo de visitas Agentes.",
  "Checklist: materiais de marketing, serviços digitais, observações e data da próxima visita — actualiza o mesmo item de visita.",
  "Simulador de Rappel: cálculo por escalas oficiais ZAP (PVP, IVA, percentagem por faixa).",
  "Mais: comunicações, simulador, dados do consultor, actualizar app e sair para o portal Power Apps.",
], "Estado reflecte a Code App publicada no ambiente DEV Agente 360.");

slideTwoCol(
  "Fontes de dados SharePoint",
  "BD_Agentes_Palhativa",
  [
    "~3 700 agentes da rede; código em Title; consultor em field_5.",
    "Tipo, província, município, estado (c/ s/ investimentos), notas comerciais e localização.",
    "Filtro OData por consultor logado — nunca carga total da base na app.",
    "Create/update via serviços gerados Power Apps SDK.",
  ],
  "Controlo de visitas Agentes",
  [
    "~56 000 visitas + checklist num único item.",
    "Filtros por Datadavisita (indexada) + Author (consultor).",
    "Campos: código agente, GPS, tipos de visita, checklist, próxima visita.",
    "Resumo mensal e histórico por agente na carteira.",
  ],
);

slideTwoCol(
  "Stack técnica e publicação",
  "Power Code App",
  [
    "React + TypeScript + Vite; HashRouter; design system ZAP (azul, amarelo, magenta).",
    "Conectores: BD_Agentes_PalhativaService, ControlodevisitasAgentesService.",
    "Host: getContext() para utilizador M365; detecção Power Apps player.",
    "appId fixo em power.config.json — push actualiza app existente.",
  ],
  "Ambiente alvo",
  [
    "DEV: Paulino Quicassa (85de9078-2a11-e636-a7d4-4cfe77ad3656).",
    "App: Agente 360 (65c47048-dcae-43a8-aa7d-e3916c319689).",
    "Site: zapcoao.sharepoint.com/sites/AgentesAO.",
    "Fluxo: git → npm run push → validação no player → git push código.",
  ],
);

slideSection("Roadmap de implementação");

slideTimeline("Fases do roadmap (alto nível)", [
  {
    label: "Fase 1\nConcluída",
    items: ["Code App base", "Auth M365", "Carteira consultor", "Captar + Agentes", "Visitar + Checklist SP", "Dashboard KPIs", "Rappel simulador"],
  },
  {
    label: "Fase 2\nEstabilização",
    items: ["QA consultores", "Match Consultor/UPN", "Performance visitas", "Anexos/documentos", "Editar agente", "UAT DEV"],
  },
  {
    label: "Fase 3\nProdução",
    items: ["Ambiente PROD", "Permissões SP", "Formação", "Monitorização", "Rollback plan", "Go-live"],
  },
  {
    label: "Fase 4\nEvolução",
    items: ["Comunicações SP", "Mapas/rota", "Pagamentos rappel", "Power BI", "Automations", "Offline PWA"],
  },
]);

slideContent("Fase 1 — Fundação (estado actual)", [
  "Power Apps Code App Agente 360 ligada às duas listas principais.",
  "Regra de negócio: dados scoped ao consultor (carteira + visitas Author).",
  "Ecrãs: Dashboard, Agentes, Captar, Perfil, Visitar, Checklist, Confirmações, Rappel, Mais.",
  "Indicadores de visitas e cabeçalho operacional alinhados à lista Controlo de visitas.",
  "Pipeline npm run build + pac code push documentado em AGENTS.md.",
]);

slideContent("Fase 2 — Estabilização e completude funcional", [
  "Validar alinhamento nome/e-mail M365 ↔ campo Consultor em todos os consultores.",
  "Documentos/anexos: biblioteca SharePoint ou HasAttachments com UX de upload no Captar/Perfil.",
  "Edição completa do agente captado; validação de campos notas (telefone, morada, GPS).",
  "Optimizar cargas (cache carteira, janelas mensais visitas, retry e mensagens de erro claras).",
  "Testes de campo em dispositivos Android/iOS no player Power Apps.",
  "Correcções de UX: voltar, logo, acessibilidade, performance listas longas.",
]);

slideContent("Fase 3 — Preparação produção", [
  "Replicar solução para ambiente PROD (appId/ambiente separados ou promote controlado).",
  "Governança: owners das listas, DLP, grupos M365 por região/equipa.",
  "Plano de formação (captação, visita, checklist, leitura KPIs).",
  "Suporte L1/L2 e runbook (actualizar app, invalidar cache, erros SharePoint 5000).",
  "Critérios de go-live assinados com negócio (Rede de Agentes).",
]);

slideContent("Fase 4 — Evolução e analytics", [
  "Comunicações corporativas desde lista SharePoint dedicada (ecrã Mais).",
  "Integração pagamentos/comissões se lista ou ERP disponível (fora do scope actual).",
  "Dashboards Power BI sobre BD_Agentes e visitas (visão gestão, não só consultor).",
  "Power Automate: notificações próxima visita, alertas agentes sem visita no mês.",
  "Melhorias mapa, rotas e modo offline se requisitos de campo o exigirem.",
]);

slideTwoCol(
  "Riscos e mitigação",
  "Riscos",
  [
    "Limite 5000 itens SharePoint em filtros não indexados.",
    "Inconsistência campo Consultor vs identidade M365.",
    "Dependência do player Power Apps (sem host = sem dados).",
    "Carga lenta em redes móveis fracas.",
  ],
  "Mitigação",
  [
    "Filtros sempre por Datadavisita + Author; paginação OData.",
    "Normalização de nomes; guia de preenchimento na lista.",
    "Mensagens claras; testes só no player oficial.",
    "Cache carteira; indicadores progressivos; retry.",
  ],
);

slideContent("Próximos passos recomendados", [
  "Sessão de validação com 3–5 consultores reais (carteira, visitas, captar).",
  "Checklist de aceitação por ecrã (critérios pass/fail).",
  "Fechar gaps Fase 2 prioritários (anexos, editar agente se ainda em falta).",
  "Definir data alvo PROD e responsáveis (IT + Negócio).",
  "Manter repositório Git como fonte única; publicar só via npm run push.",
]);

slideTitleDark("Obrigado", "Agente 360 · Gestão completa da carteira de agentes ZAP");

await pres.writeFile({ fileName: outPath });
console.log("Written:", outPath);

const skillDir =
  "C:/Users/paulino.quicassa/.claude/skills/synced/b911cb35-cb1f-4c99-84e0-ae0039141cdd_b32c140b-601c-46cf-8b0c-41003026a2ec/pptx";
try {
  execSync(`node "${join(skillDir, "scripts/apply_theme.js")}" "${outPath}"`, {
    stdio: "inherit",
    cwd: skillDir,
  });
  const themeJson = join(__dir, "theme.json");
  writeFileSync(themeJson, JSON.stringify(THEME));
  execSync(`node "${join(skillDir, "scripts/apply_theme.js")}" "${outPath}" "${themeJson}"`, {
    stdio: "inherit",
  });
} catch (e) {
  console.warn("apply_theme skipped:", e.message);
}

try {
  execSync(`python "${join(skillDir, "scripts/office/validate.py")}" "${outPath}"`, {
    stdio: "inherit",
  });
} catch {
  console.warn("validate skipped or failed");
}
