# Suporte Integrado · CRMLiguer

Migração do protótipo HTML único pra **Next.js 14 + TypeScript** com:

- Dados separados em `/data` (todos os JSONs editáveis sem mexer no código)
- Tipos centralizados em `/lib/types.ts`
- Hooks de estado em `/hooks/`
- Componentes por tela / modal em `/components/`
- CSS preservado **fielmente** do protótipo original em `app/globals.css`
- Persistência local via `localStorage` (com fallback em memória) — pronto pra trocar por Supabase

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Usuários de teste

Pra adicionar mais acessos é só editar `data/usuarios.json`:

| Usuário  | Senha       | Papel     |
| -------- | ----------- | --------- |
| `admin`  | `admin`     | admin     |
| `lucas`  | `lucas123`  | analista  |
| `lorena` | `lorena123` | analista  |

> ⚠️ Senhas em plaintext são **só pra demo**. Quando migrar pro Supabase, esse JSON some e os usuários vão pra `auth.users` + `public.usuarios` com RLS.

## Estrutura

```
crmliguer/
├── app/
│   ├── layout.tsx          # RootLayout (metadata + lang pt-BR)
│   ├── page.tsx            # Orquestrador principal: telas + modais
│   └── globals.css         # CSS extraído integral do protótipo
│
├── components/
│   ├── LoginScreen.tsx
│   ├── TelaInicial.tsx
│   ├── TelaKanban.tsx
│   ├── KanbanCard.tsx
│   ├── ModalDetalhe.tsx
│   ├── ModalIndicadores.tsx
│   ├── ModalAtribuirAnalista.tsx
│   ├── ModalClassificarMarcadores.tsx
│   ├── ModalHistorico.tsx
│   ├── DialogChamado.tsx       # Form grande de criar/editar chamado
│   ├── MarcadoresSelects.tsx   # 4 selects encadeados (reutilizável)
│   ├── PopoverMembros.tsx
│   └── Lightbox.tsx
│
├── data/                       # ← TUDO QUE É DADO ESTÁTICO
│   ├── usuarios.json           # ← contas de acesso
│   ├── colunas.json            # colunas do kanban
│   ├── tags.json               # tags disponíveis
│   ├── team.json               # membros do time + quem é o "atual"
│   ├── arvore-classificacao.json   # tipo → categoria → subcategoria → motivo
│   ├── templates-transferencia.json # mocks da simulação de transferência
│   ├── cliente-padrao.json     # cliente pré-preenchido em "abrir chamado"
│   └── conversa-exemplo.json   # histórico fake do botão "ver conversa"
│
├── hooks/
│   ├── useAuth.ts              # sessão (login/logout) com persistência
│   └── useCards.ts             # CRUD de chamados + SLA + transferência mock
│
├── lib/
│   ├── types.ts                # TODOS os tipos (Card, Membro, Conversa, etc)
│   ├── utils.ts                # helpers (datas, máscaras, validação, etc)
│   ├── config.ts               # constantes de regra (SLA, cores, storage keys)
│   ├── auth.ts                 # validação contra usuarios.json
│   └── storeCards.ts           # wrapper de localStorage → futuramente Supabase
│
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Adicionando mais usuários

Abre `data/usuarios.json` e adiciona um objeto novo:

```json
{
  "usuario": "joao",
  "senha": "joao123",
  "nome": "João Silva",
  "papel": "analista"
}
```

Salva, reinicia o `npm run dev` e pronto. Por enquanto a senha vai em plaintext — quando migrar pro Supabase isso some.

## Migração futura pro Supabase

Os pontos de mudança já estão isolados:

- **Auth**: substitui `lib/auth.ts` por chamadas a `supabase.auth.signIn/signOut`
- **Cards**: substitui `lib/storeCards.ts` por `supabase.from('chamados').select/insert/update`
- O resto da app (componentes, hooks, regras) não precisa mudar

## Regras de negócio preservadas do protótipo

- **SLA**: cards na coluna "Novo chamado" há mais de 5 min começam a piscar vermelho
- **Atribuir analista**: quando um card sem analista é movido pra qualquer coluna que não seja "Transferido", abre modal pedindo o responsável
- **Classificar antes de concluir**: ao mover pra "Concluído" sem ter tipo/categoria/motivo, abre modal pedindo a classificação
- **Transferir chamado (mock)**: o botão vermelho no header simula a chegada de um novo chamado do ChatLiguer
- **Persistência**: tudo vai no `localStorage` (chave `crmliguer_cards`) com fallback em memória
- **Reset durante testes**: no DevTools, pode usar `localStorage.removeItem('crmliguer_cards')` e dar refresh
