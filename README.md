# Agente 360

**Plataforma de gestão e acompanhamento da rede de agentes.**

Aplicação empresarial mobile-first construída com **Power Code** (Power Apps Code App), **React** e **TypeScript**, utilizando **SharePoint Lists** como base de dados principal.

> Agente 360 — uma visão completa da rede de agentes, desde a captação até ao acompanhamento.

## Conceito

```
CAPTAR → ACTIVAR → VISITAR → ACOMPANHAR → ANALISAR
```

O objecto central da aplicação é o **Agente**. A partir dele estão relacionados: Captação → Documentos → Visitas → Checklists → Rappel → Pagamentos → Histórico → Performance.

## Estrutura do repositório

```
/
├── README.md                          # Este ficheiro
├── docs/
│   └── prompt-mestre-agente-360.md    # Especificação funcional completa (prompt mestre)
└── design/
    └── agente-360-mobile-design.html  # Protótipo interativo do design mobile
```

## Design

O protótipo em `design/agente-360-mobile-design.html` é um ficheiro HTML autónomo (abrir directamente no browser) que simula a aplicação mobile em ecrãs navegáveis:

**Dashboard · Captar · Confirmação · Agentes · Visão 360º · Visitar · Checklist · Rappel · Comunicações/Pagamentos**

### Identidade visual

Baseado nas cores oficiais de marca ZAP e nos princípios **Microsoft Fluent Design**:

| Cor | Hex | Uso |
|---|---|---|
| Amarelo ZAP | `#FCD202` | CTAs principais (Captar), destaques |
| Magenta ZAP | `#CF1A6F` | Identidade, avatares, acentos |
| Azul ZAP | `#017EC1` | Navegação activa, ecrãs informativos |
| Azul escuro | `#00263F` | Ecrã do Simulador de Rappel |

## Tecnologia

* Power Code (Power Apps Code App)
* React + TypeScript
* SharePoint Lists (Agentes, Visitas, Checklists, EscalasRappel, Pagamentos, Comunicacoes)
* SharePoint Document Library (DocumentosAgentes)
* Autenticação Microsoft 365 / Power Platform

Não utiliza Supabase, Firebase, nem Dataverse nesta versão.

## Modelo de dados (resumo)

Ver especificação completa em [`docs/prompt-mestre-agente-360.md`](docs/prompt-mestre-agente-360.md).

* **Agentes** — dados do agente, estado do ciclo de vida (Captado → Em análise → Documentação pendente → Aprovado → Activo → Inactivo / Rejeitado)
* **Visitas** — registo de visita com geolocalização
* **Checklists** — materiais de marketing e serviços utilizados por visita
* **EscalasRappel** — configuração das faixas de comissão
* **Pagamentos** — histórico de bónus/rappel por agente
* **Comunicacoes** — campanhas e comunicados para a rede

## Fases de desenvolvimento

1. **Fundação** — estrutura Power Code, navegação, SharePoint, modelo de dados, autenticação
2. **Agente** — Captar, lista de agentes, Visão 360º
3. **Campo** — Visitar, GPS, Checklist, histórico
4. **Performance** — Simulador de Rappel, Pagamentos, Comunicações
5. **Dashboard** — KPIs, indicadores, actividade, filtros

## Estado do projecto

🎨 Fase de design concluída · Desenvolvimento por iniciar
