# PROMPT MESTRE — AGENTE 360

## 1. OBJECTIVO

Desenvolver uma aplicação empresarial chamada **Agente 360**, utilizando **Power Code**, com **SharePoint Lists** como principal fonte de dados.

O Agente 360 deve ser uma solução de gestão da rede de agentes, permitindo acompanhar o agente desde a sua **captação** até à sua actividade, visitas, materiais, desempenho e acompanhamento.

A aplicação não deve ser concebida apenas como uma aplicação de registo de visitas.

O conceito central é:

**CAPTAR → ACTIVAR → VISITAR → ACOMPANHAR → ANALISAR**

A experiência deve ser moderna, profissional, simples e optimizada para utilização em dispositivos móveis e desktop.

---

## 2. TECNOLOGIA OBRIGATÓRIA

Utilizar:

* Power Code
* React
* TypeScript
* SharePoint Lists como base de dados
* SharePoint Document Library para documentos/anexos, quando necessário
* Microsoft 365
* Componentes responsivos

**Não utilizar Supabase.**

**Não utilizar Firebase.**

**Não utilizar Dataverse nesta versão.**

A aplicação deve ser construída de forma modular para permitir futura expansão.

---

## 3. NOME E POSICIONAMENTO

Nome:

**Agente 360**

Descrição:

**Plataforma de gestão e acompanhamento da rede de agentes.**

O conceito "360" deve representar uma visão completa do agente:

* Quem é;
* Onde está;
* Como foi captado;
* Qual o seu tipo;
* Que documentos possui;
* Quando foi visitado;
* O que foi identificado na visita;
* Que materiais possui;
* Qual o seu desempenho;
* Que oportunidades existem;
* Qual o seu histórico.

---

## 4. IDENTIDADE VISUAL

Criar uma interface corporativa, moderna e tecnológica.

Cores principais:

* Azul escuro: `#003A7D`
* Azul secundário: `#003366`
* Amarelo/Dourado: `#FFD700` ou `#F5A623`
* Fundo: branco/cinza muito claro
* Texto principal: escuro
* Texto sobre azul: branco

Utilizar amarelo/dourado como cor de destaque para:

* Acções principais;
* Indicadores;
* Estados importantes;
* Elementos de navegação.

A aplicação deve transmitir:

**Confiança + Tecnologia + Gestão + Mobilidade + Performance**

Evitar uma aparência de formulário SharePoint.

> **Nota (v1 do design):** o protótipo em `design/agente-360-mobile-design.html` utiliza antes a paleta oficial de marca ZAP (`#FCD202`, `#CF1A6F`, `#017EC1`), por decisão tomada na fase de design, em vez das cores de exemplo listadas acima.

---

## 5. ESTRUTURA PRINCIPAL

Criar a seguinte navegação:

```text
AGENTE 360

├── Dashboard
│
├── Captar
│   └── Novo Agente
│
├── Agentes
│   ├── Todos
│   ├── Activos
│   ├── Em análise
│   └── Pendentes
│
├── Visitar
│   ├── Nova Visita
│   └── Histórico de Visitas
│
├── Checklist
│   └── Checklist de Visita
│
├── Rappel
│   └── Simulador de Rappel
│
├── Comunicações
│
└── Pagamentos
    └── Bónus / Rappel
```

A navegação deve adaptar-se ao dispositivo.

No mobile, utilizar uma navegação inferior ou menu compacto.

No desktop, utilizar navegação lateral.

---

## 6. DASHBOARD

Criar um Dashboard executivo e operacional.

O Dashboard deve apresentar uma visão rápida da rede de agentes e da actividade da equipa.

### KPIs

Apresentar cartões para:

* Total de Agentes
* Agentes Activos
* Novos Agentes Captados
* Agentes em Análise
* Agentes com Documentação Pendente
* Visitas Realizadas
* Visitas do Período
* Próximas Visitas

### Análises

Apresentar:

* Agentes por Província
* Agentes por Município
* Agentes por Tipo
* Evolução de novos agentes captados
* Evolução das visitas
* Actividade recente

### Actividade recente

Mostrar:

* Últimos agentes captados;
* Últimas visitas;
* Últimas actualizações;
* Documentação pendente.

---

## 7. CAPTAR — NOVO AGENTE

Esta é uma das funcionalidades principais da aplicação.

O botão deve chamar-se:

**CAPTAR**

Não utilizar "Registar".

O objectivo é permitir à equipa identificar e captar potenciais novos agentes.

Criar o ecrã:

### Captar novo agente

#### Dados pessoais/comerciais

Campos:

**Nome**

* Obrigatório

**Província**

* Obrigatório
* Dropdown com as províncias de Angola

**Município**

* Obrigatório
* Dropdown dependente da Província

**Endereço**

* Obrigatório

**Contacto**

* Obrigatório

**Email**

* Opcional, mas validar formato quando preenchido

#### Tipo de Agente

Campo:

**Tipo de Agente**

Opções:

* Produto
* Zapadinhas

#### Documentação

Permitir associar documentos ao potencial agente.

A solução deve utilizar uma estrutura compatível com SharePoint.

Quando os anexos nativos da SharePoint List não forem adequados para a implementação Power Code, utilizar uma **SharePoint Document Library** para armazenar os documentos.

Cada documento deve ficar associado ao:

**AgenteID**

Não duplicar documentos desnecessariamente.

---

## 8. ESTADO DO PROCESSO DE CAPTAÇÃO

Criar o campo:

**Estado do Agente**

Valores:

* Captado
* Em análise
* Documentação pendente
* Aprovado
* Rejeitado
* Activo
* Inactivo

Ao criar um novo agente, o estado inicial deve ser:

**Captado**

O estado deve poder evoluir ao longo do ciclo de vida do agente.

Fluxo:

```text
CAPTADO
   ↓
EM ANÁLISE
   ↓
DOCUMENTAÇÃO PENDENTE
   ↓
APROVADO
   ↓
ACTIVO
   ↓
INACTIVO
```

A opção "Rejeitado" deve poder ocorrer durante o processo de análise.

---

## 9. CONFIRMAÇÃO DE CAPTAÇÃO

Depois de guardar correctamente:

Mostrar uma confirmação visual:

**Agente captado com sucesso.**

Apresentar:

* Nome;
* ID do agente;
* Tipo de agente;
* Estado.

Gerar automaticamente um identificador único.

Exemplo:

`AGT-000001`

---

## 10. AGENTES

Criar o módulo:

### Agentes

Permitir consultar todos os agentes.

Criar:

* Pesquisa;
* Filtros;
* Ordenação;
* Paginação, se necessário.

Mostrar:

* ID;
* Nome;
* Província;
* Município;
* Tipo;
* Estado;
* Contacto;
* Data de captação;
* Última visita.

Criar filtros por:

* Estado;
* Província;
* Município;
* Tipo de agente;
* Data de captação.

---

## 11. PERFIL 360º DO AGENTE

Ao seleccionar um agente, abrir uma página detalhada denominada:

### Visão 360º

Esta deve ser uma das áreas mais importantes da aplicação.

Apresentar:

#### Dados do agente

* ID;
* Nome;
* Contacto;
* Email;
* Província;
* Município;
* Endereço;
* Tipo;
* Estado.

#### Resumo

* Data de captação;
* Última visita;
* Próxima visita;
* Número de visitas;
* Documentos disponíveis;
* Estado da documentação.

#### Histórico

Criar separadores:

**Resumo | Visitas | Checklist | Documentos | Rappel | Pagamentos**

O objectivo é que o utilizador tenha uma visão completa do agente numa única área.

---

## 12. VISITAR

Alterar o conceito existente.

Não utilizar:

**Entrar**

Não utilizar:

**Registar**

A principal acção deve chamar-se:

# VISITAR

O módulo permite realizar uma visita a um agente existente.

---

## 13. NOVA VISITA

Criar:

### Registar visita

O utilizador deve:

1. Seleccionar o agente;
2. Capturar automaticamente a localização;
3. Registar a visita;
4. Preencher as informações necessárias;
5. Executar o checklist;
6. Guardar a actividade.

#### Dados

* Agente;
* Tipo de visita;
* Data;
* Hora;
* Latitude;
* Longitude;
* Nome do parceiro;
* Número de pontos de venda;
* Flybanner;
* Observações;
* Resultado da visita.

A data e hora devem ser registadas automaticamente no momento do envio.

---

## 14. GEOLOCALIZAÇÃO

Ao iniciar uma visita, tentar obter:

* Latitude;
* Longitude;
* Data/hora da localização.

Se a localização não estiver disponível:

Mostrar:

**Não foi possível obter a localização. Active a localização do dispositivo e tente novamente.**

Não permitir guardar uma visita se a localização for obrigatória para aquela actividade.

Preparar a arquitectura para futura implementação de:

* Mapa;
* Geofencing;
* Distância entre agente e ponto visitado.

---

## 15. CHECKLIST DE VISITA

Criar o módulo:

### Checklist

Associar cada checklist a:

* Agente;
* Visita;
* Data;
* Utilizador.

#### Materiais de Marketing

Criar campos/dropdowns para:

* Flybanner;
* Merchandising;
* Placa Ponto ZAP;
* Boxe Demonstração;
* Pendurantes Aberto;
* Pendurantes Fechado;
* Pintura de Parede;
* Stock de Boxes;
* Zapadinhas/Pontos.

#### Serviços utilizados

Criar toggles para:

* Usa Meio de Carregamento USSD;
* Usa o antigo ZAP Agentes Mobile;
* Usa o novo ZAP Agentes Mobile;
* Usa ZAP Agentes Web.

#### Observação

Campo de texto livre.

#### Próxima visita

Campo de data.

A data da próxima visita não pode ser anterior à data actual.

---

## 16. SIMULADOR DE RAPPEL

Criar módulo:

# SIMULADOR DE RAPPEL

Utilizar fundo azul escuro.

Campos:

* ID do Agente;
* Tipo de Agente;
* Nome do Agente;
* Montante PVP AOA;
* Montante sem IVA.

Campos calculados:

* Escala %;
* Valor da Comissão.

Criar uma tabela visual:

| Faixa de Volume | Percentagem |
| --------------- | ----------- |
| Escala 1        | X%          |
| Escala 2        | X%          |
| Escala 3        | X%          |
| Escala 4        | X%          |

**IMPORTANTE:**

Não inventar percentagens.

A estrutura deve permitir configurar posteriormente as escalas reais de rappel através de uma SharePoint List.

O cálculo deve utilizar a tabela de configuração.

Fórmula conceptual:

```text
Montante sem IVA
        ↓
Identificar escala
        ↓
Obter %
        ↓
Calcular comissão
        ↓
Apresentar resultado
```

---

## 17. COMUNICAÇÕES

Criar módulo:

### Comunicações

Apresentar campanhas e comunicações destinadas aos agentes.

Interface:

* Cards;
* Imagem;
* Título;
* Data;
* Descrição;
* Categoria.

Ordenação:

**Mais recentes primeiro.**

Permitir seleccionar uma comunicação para abrir o conteúdo completo.

Os conteúdos devem ser carregados a partir de SharePoint.

---

## 18. PAGAMENTOS / BÓNUS

Criar módulo:

### Pagamentos

Permitir ao agente consultar os seus pagamentos de rappel/bónus.

Mostrar:

* Período;
* Valor;
* Data;
* Estado.

Estados possíveis:

* Pendente;
* Em processamento;
* Pago;
* Não pago;
* Processado.

Criar filtros:

* Período;
* Estado.

---

## 19. SHAREPOINT — MODELO DE DADOS

Criar a solução preparada para utilizar várias SharePoint Lists relacionadas.

### Lista: Agentes

Campos:

* ID
* CodigoAgente
* Nome
* Provincia
* Municipio
* Endereco
* Contacto
* Email
* TipoAgente
* Estado
* DataCaptacao
* UtilizadorCaptacao
* DataActualizacao

---

### Lista: Visitas

Campos:

* ID
* VisitaID
* AgenteID
* TipoVisita
* DataVisita
* HoraVisita
* Latitude
* Longitude
* NomeParceiro
* NumeroPontosVenda
* Flybanner
* Observacao
* Resultado
* Utilizador
* DataRegisto

---

### Lista: Checklists

Campos:

* ID
* ChecklistID
* AgenteID
* VisitaID
* Flybanner
* Merchandising
* PlacaPontoZap
* BoxeDemonstracao
* PenduranteAberto
* PenduranteFechado
* PinturaParede
* StockBoxes
* ZapadinhasPontos
* UsaUSSD
* UsaAntigoMobile
* UsaNovoMobile
* UsaWeb
* Observacao
* DataProximaVisita
* DataRegisto
* Utilizador

---

### Lista: EscalasRappel

Campos:

* ID
* TipoAgente
* VolumeMinimo
* VolumeMaximo
* Percentagem
* Activo
* DataInicio
* DataFim

---

### Lista: Pagamentos

Campos:

* ID
* AgenteID
* Periodo
* ValorBonus
* DataPagamento
* Estado
* Observacao

---

### Lista: Comunicacoes

Campos:

* ID
* Titulo
* Descricao
* Imagem
* Categoria
* DataPublicacao
* Activo
* DataFim

---

### Document Library: DocumentosAgentes

Criar uma biblioteca documental para documentos associados aos agentes.

Cada documento deve possuir, sempre que possível:

* AgenteID;
* TipoDocumento;
* DataUpload;
* UtilizadorUpload.

A relação principal deve ser:

**AgenteID → Documentos**

---

## 20. AUTENTICAÇÃO

Utilizar autenticação compatível com o ambiente Microsoft 365/Power Platform.

A aplicação deve identificar o utilizador autenticado.

Sempre que possível, obter:

* Nome;
* Email;
* Perfil;
* Data/hora da sessão.

Não criar autenticação própria com passwords armazenadas numa SharePoint List.

Utilizar os mecanismos de autenticação disponibilizados pelo ambiente Microsoft.

---

## 21. SEGURANÇA E PERMISSÕES

A solução deve ser preparada para controlo de acesso.

Perfis previstos:

### Agente / Comercial

Pode:

* Consultar agentes;
* Captar agentes;
* Registar visitas;
* Preencher checklists;
* Consultar comunicações;
* Consultar pagamentos autorizados.

### Supervisor / Gestor

Pode:

* Consultar todos os agentes;
* Consultar visitas;
* Consultar checklists;
* Acompanhar captações;
* Alterar estados;
* Consultar indicadores.

### Administrador

Pode:

* Gerir configurações;
* Gerir escalas de rappel;
* Gerir comunicações;
* Gerir dados;
* Consultar toda a actividade.

Implementar a segurança tanto quanto possível através das permissões Microsoft/SharePoint e da lógica da aplicação.

---

## 22. VALIDAÇÕES

Implementar validações para:

* Campos obrigatórios;
* Email;
* Contacto;
* Província;
* Município;
* Tipo de agente;
* Datas;
* Localização;
* Documentação.

Não permitir submissão de formulários incompletos.

Apresentar mensagens de erro claras e humanas.

---

## 23. TRATAMENTO DE ERROS

Tratar pelo menos:

### Falha de ligação

Mostrar:

**Não foi possível guardar os dados. Verifique a ligação e tente novamente.**

### Falha GPS

Mostrar:

**Não foi possível obter a localização. Active a localização do dispositivo.**

### Campos incompletos

Destacar os campos que precisam de preenchimento.

### Sessão expirada

Redireccionar para autenticação.

### Falha no carregamento

Mostrar botão:

**Tentar novamente**

---

## 24. EXPERIÊNCIA DE UTILIZAÇÃO

A aplicação será utilizada principalmente em contexto de campo.

Por isso:

* Minimizar o número de cliques;
* Evitar formulários excessivamente longos;
* Utilizar dropdowns;
* Utilizar pesquisa;
* Utilizar cards;
* Utilizar indicadores visuais;
* Mostrar mensagens de sucesso;
* Optimizar para utilização em smartphone.

A acção principal deve estar sempre evidente:

**CAPTAR**

ou

**VISITAR**

---

## 25. RESPONSIVIDADE

A aplicação deve funcionar correctamente em:

* Smartphone;
* Tablet;
* Desktop.

No mobile:

* Menu inferior;
* Cards empilhados;
* Botões grandes;
* Formulários em coluna única.

No desktop:

* Sidebar;
* Dashboard com múltiplas colunas;
* Tabelas;
* Filtros horizontais.

---

## 26. FUNCIONALIDADES FUTURAS

Não implementar nesta primeira versão, mas deixar a arquitectura preparada para:

* GPS avançado;
* Mapas;
* Geofencing;
* Fotografias de visita;
* Assinatura digital;
* Modo offline;
* Sincronização;
* Notificações;
* WhatsApp;
* Power BI;
* Ranking de agentes;
* Gamificação;
* Score do agente;
* Inteligência artificial;
* Previsão de desempenho;
* Detecção de agentes inactivos;
* Alertas de próxima visita;
* Gestão avançada de oportunidades.

---

## 27. CRITÉRIOS DE ACEITAÇÃO

A primeira versão será considerada funcional quando for possível:

### CAPTAR

1. Abrir o módulo Captar;
2. Preencher Nome;
3. Seleccionar Província;
4. Seleccionar Município;
5. Introduzir Endereço;
6. Introduzir Contacto;
7. Introduzir Email;
8. Seleccionar Tipo de Agente;
9. Associar documentação;
10. Guardar o agente;
11. Gerar ID;
12. Apresentar confirmação.

### VISITAR

13. Seleccionar um agente;
14. Iniciar visita;
15. Capturar localização;
16. Registar informações;
17. Guardar visita.

### CHECKLIST

18. Seleccionar os materiais;
19. Preencher os toggles;
20. Adicionar observação;
21. Definir próxima visita;
22. Guardar checklist.

### AGENTE 360

23. Pesquisar um agente;
24. Abrir o seu perfil;
25. Consultar os seus dados;
26. Consultar visitas;
27. Consultar checklists;
28. Consultar documentos;
29. Consultar informação de rappel;
30. Consultar pagamentos.

### RAPPEL

31. Introduzir volume;
32. Identificar escala;
33. Calcular comissão;
34. Apresentar resultado.

### COMUNICAÇÕES

35. Consultar campanhas;
36. Abrir comunicação;
37. Ver conteúdos recentes.

### DASHBOARD

38. Visualizar KPIs;
39. Visualizar actividade recente;
40. Filtrar informação.

---

## 28. PRINCÍPIO DE DESENVOLVIMENTO

Não construir apenas uma colecção de ecrãs.

Construir uma **aplicação coerente**, onde todos os módulos estejam relacionados através do agente.

O objecto central da aplicação é:

# AGENTE

A partir do agente devem estar relacionados:

**Agente**
→ Captação
→ Documentos
→ Visitas
→ Checklists
→ Rappel
→ Pagamentos
→ Histórico
→ Performance

---

## 29. PRIORIDADE DE DESENVOLVIMENTO

Implementar por esta ordem:

### FASE 1 — Fundação

* Estrutura Power Code;
* Navegação;
* SharePoint;
* Modelo de dados;
* Autenticação.

### FASE 2 — Agente

* Captar;
* Lista de agentes;
* Detalhe do agente;
* Visão 360º.

### FASE 3 — Campo

* Visitar;
* GPS;
* Checklist;
* Histórico.

### FASE 4 — Performance

* Simulador de Rappel;
* Pagamentos;
* Comunicações.

### FASE 5 — Dashboard

* KPIs;
* Indicadores;
* Actividade;
* Filtros.

---

## 30. RESULTADO FINAL

Entregar uma aplicação denominada:

# AGENTE 360

Com o seguinte posicionamento:

> **Agente 360 — uma visão completa da rede de agentes, desde a captação até ao acompanhamento.**

A aplicação deve apresentar uma experiência empresarial moderna, responsiva e orientada para utilização no terreno.

As duas acções estratégicas da aplicação devem ser claramente visíveis:

**CAPTAR** — trazer novos agentes para a rede.

**VISITAR** — acompanhar e desenvolver os agentes existentes.

O resultado deve ser uma aplicação Power Code funcional, ligada ao SharePoint, com arquitectura modular, código organizado e preparada para evolução futura.
