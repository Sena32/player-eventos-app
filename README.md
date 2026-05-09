# Player Eventos

Painel web para **gestão e acompanhamento de eventos**: listagem com filtros, detalhe com métricas e gráficos, e fluxo de **check-in / check-out** com regras para participantes VIP, normais e eventos encerrados.

Stack principal: **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**, **TanStack Query**, **Zustand**, **Zod**, **Recharts** e **Vitest**.

---

## Rodar o projeto localmente

### Pré-requisitos

- **Node.js 24+** (conforme `engines` em `package.json`)
- **npm** (ou gerenciador compatível)

### Instalação

```bash
git clone git@github.com:Sena32/player-eventos-app.git
cd player-eventos-app
npm install
```

### Variáveis de ambiente

Copie o exemplo e ajuste a URL da API:

```bash
cp .env.example .env.local
```


| Variável                       | Descrição                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_EXTERNAL_API_URL` | Base da API consumida pelo BFF (`/api/events/*`). Ex.: JSON estático (GitHub Pages) ou **json-server** local. |
| `NEXT_PUBLIC_EXTERNAL_API_KEY` | Opcional; enviada como `Authorization: Bearer` se preenchida.                                                 |


Sem `NEXT_PUBLIC_EXTERNAL_API_URL`, as rotas do BFF retornam erro de configuração (503).

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A raiz `**/**` redireciona para `**/events**` (listagem).

### Outros comandos úteis


| Comando                         | Uso                            |
| ------------------------------- | ------------------------------ |
| `npm run build`                 | Build de produção              |
| `npm run start`                 | Servidor após `build`          |
| `npm run lint`                  | ESLint                         |
| `npm run type-check`            | TypeScript sem emitir arquivos |
| `npm test` / `npm run test:run` | Vitest                         |
| `npm run test:e2e`              | Playwright                     |


### API local com mutações (opcional)

A massa pública (ex.: GitHub Pages) é **somente leitura**. Para **persistir** check-ins em disco durante o desenvolvimento, use [json-server](https://github.com/typicode/json-server) com o repositório de dados de teste (ex.: `api_test`):

```bash
# No repositório da API de teste, após clonar
git clone https://github.com/ThiagoLifters/api_test.git
cd api_test
npm install -g json-server
json-server --watch db.json --port 3001
```

No `.env.local`:

```env
NEXT_PUBLIC_EXTERNAL_API_URL=http://localhost:3001
```

O BFF detecta o formato “coleções separadas” (`/events`, `/participants`, `/checkins`), monta o detalhe do evento e, no **POST `/api/events/[id]/checkin`**, orquestra `POST /checkins`, `PATCH /participants/:id` e `PATCH /events/:id` conforme a referência do projeto. Com payload **aninhado** (JSON estático com `participants` no mesmo arquivo), as regras de negócio rodam no servidor, mas **não há escrita** na origem.

---

## Decisões técnicas e justificativas

1. **Next.js App Router + Route Handlers como BFF**
  O browser chama apenas o próprio domínio (`/api/events/...`). Isso evita expor CORS e chaves em cenários futuros e permite adaptar **uma** API de leitura estática e **outra** local com CRUD sem mudar o front.
2. **TanStack Query para dados remotos**
  Cache, refetch e chaves estáveis (`eventsKeys`) centralizam o estado de servidor. O detalhe do evento é atualizado após check-in via `setQueryData` ou resposta do BFF.
3. **Regras de check-in em funções puras (`registerCheckin`)**
  VIP (múltiplas entradas/saídas), normal (uma entrada; nova tentativa com feedback e registro de erro), evento fechado/cancelado bloqueados — tudo testável com **Vitest**, independente de HTTP.
4. **Dois “modos” de API no mesmo contrato**
  `fetchEventDetailSnapshot` distingue JSON **aninhado** (arquivo único) de **json-server** (agrega `events` + `participants` + `checkins`). Assim um único `EventDetail` Zod vale para produção estática e para dev com escrita.
5. **Client Components só onde necessário**
  Listagem/detalhe com formulários, gráficos e diálogos usam `'use client'`; o restante segue RSC quando possível, alinhado às regras do repositório.
6. **Zod em borda**
  Respostas da API e payloads de formulário são validados/parseados antes de chegar à UI, reduzindo `undefined` silencioso.
7. **Redirecionar `/` → `/events`**
  A experiência principal é a listagem; evita uma “home” vazia e mantém uma única página de entrada ao domínio de negócio.

---

## Melhorias com mais tempo

- **Persistência opcional no browser** (ex.: `localStorage` por `eventId`) quando a API for só leitura, para não perder simulações ao dar refresh.
- **Autenticação e perfis** (operador vs leitura), com proteção das rotas de mutação.
- **Testes E2E** cobrindo listagem, filtro, detalhe e fluxo de check-in (incluindo json-server ou mocks de rede).
- **Observabilidade**: substituir logs ad-hoc por logger estruturado e correlacionar erros BFF ↔ cliente.
- **Acessibilidade e i18n**: revisão sistemática de `aria-`*, foco em modais, e textos externalizados se o produto for multilíngue.

---

## Uso de IA no desenvolvimento

Fiz o uso de ferramentas como o cursor para acelerar o desenvolvimento utilizando técnicas recomendadas, como uso de **rules especializadas**, **MCPs**, realizando testes e fazendo code reviews, da seguinte forma:

Estratégia utilizada:

- **Análise e Estudo do Case Proposto** Analisei e estudei a documentação e pedi para o claude fragmentar as regras de negocio em rules para usar no cursor, além disso pedi que estruturasse um boilerplate inicial da aplicação usando a stack mencionada nesse documento.
- **Implementação do Boileplate** Executei um prompt no cursor, gerado no claude, que gerou a estrutura da aplicação;
- **Configuração Claude** Adicionei na Configuração do Cursor as rules com as regras do projeto;
- **Plano de Requisitos** Executei a implementação dos requisitos com o agent do cursor, que já gerava os testes como guia nas rules;
- **Review Final** Revisão final do Projeto;

---

## Estrutura (resumo)

- `src/app/` — rotas App Router e Route Handlers (`api/events/...`).
- `src/features/events/` — domínio eventos (componentes, queries, schemas, lógica de check-in).
- `src/components/` — UI compartilhada (shadcn, layout, charts).
- `src/lib/` — utilitários e cliente HTTP.
- `src/services/` — chamadas ao BFF a partir do cliente.

Documentação de contratos e enums da API: `.cursor/rules/03-api-reference.mdc`.
