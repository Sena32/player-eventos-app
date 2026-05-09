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
git clone <url-do-repositório>
cd player-eventos-app
npm install
```

### Variáveis de ambiente

Copie o exemplo e ajuste a URL da API:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_EXTERNAL_API_URL` | Base da API consumida pelo BFF (`/api/events/*`). Ex.: JSON estático (GitHub Pages) ou **json-server** local. |
| `NEXT_PUBLIC_EXTERNAL_API_KEY` | Opcional; enviada como `Authorization: Bearer` se preenchida. |

Sem `NEXT_PUBLIC_EXTERNAL_API_URL`, as rotas do BFF retornam erro de configuração (503).

### Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A raiz **`/`** redireciona para **`/events`** (listagem).

### Outros comandos úteis

| Comando | Uso |
|---------|-----|
| `npm run build` | Build de produção |
| `npm run start` | Servidor após `build` |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript sem emitir arquivos |
| `npm test` / `npm run test:run` | Vitest |
| `npm run test:e2e` | Playwright |

### API local com mutações (opcional)

A massa pública (ex.: GitHub Pages) é **somente leitura**. Para **persistir** check-ins em disco durante o desenvolvimento, use [json-server](https://github.com/typicode/json-server) com o repositório de dados de teste (ex.: `api_test`):

```bash
# No repositório da API de teste, após clonar
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
- **Acessibilidade e i18n**: revisão sistemática de `aria-*`, foco em modais, e textos externalizados se o produto for multilíngue.
- **Otimistic updates** no check-in com rollback em falha de rede, quando a mutação remota for obrigatória.
- **Sincronização de métricas**: garantir contrato explícito com o backend sobre `checkin_count`, `error_count` e `entry_rate` (hoje derivados/alinhados à massa de exemplo).

---

## (Opcional) Uso de IA no desenvolvimento

Ferramentas de IA (ex.: assistentes no editor) podem acelerar **boilerplate**, **refactors mecânicos** e **testes unitários**, desde que o resultado seja **revisado** contra as regras do projeto (`.cursor/rules`, `AGENTS.md`, ESLint/TS strict).

Sugestão de boas práticas:

- Pedir mudanças **por escopo fechado** (“só o BFF de check-in”) para facilitar review.
- Exigir que o código gerado **rode `lint` e `test`** antes do merge.
- Tratar sugestões de IA como **rascunho**: arquitetura e nomes devem seguir o padrão já estabelecido no repositório.

*Esta seção é opcional; ajuste ou remova conforme a política da sua equipe.*

---

## Estrutura (resumo)

- `src/app/` — rotas App Router e Route Handlers (`api/events/...`).
- `src/features/events/` — domínio eventos (componentes, queries, schemas, lógica de check-in).
- `src/components/` — UI compartilhada (shadcn, layout, charts).
- `src/lib/` — utilitários e cliente HTTP.
- `src/services/` — chamadas ao BFF a partir do cliente.

Documentação de contratos e enums da API: `.cursor/rules/03-api-reference.mdc`.
