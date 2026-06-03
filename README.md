# GEFDP Atividades

Aplicação frontend React/Vite para gestão de atividades, tarefas, eventos, indicadores e acompanhamento interno da GEFDP.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/schema.sql`.
3. Em Authentication, habilite login por e-mail/senha.
4. Copie `Project URL` e `anon public key`.
5. Crie um arquivo `.env` com base em `.env.example`.

Nunca use a `service_role key` no frontend.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

Atualize `VITE_GITHUB_PAGES_BASE` no `.env` com o nome do repositório, por exemplo `/GEFDP-Atividades/`.

```bash
npm run deploy
```

O deploy usa `gh-pages` e publica a pasta `dist`.

## Perfis

Os perfis previstos são `admin`, `manager`, `coordinator` e `team`. O primeiro administrador deve ser promovido manualmente no Supabase, na tabela `profiles`, alterando o campo `role` para `admin`.

## Estrutura

- `src/components`: componentes reutilizáveis, layout, UI e módulos de atividades/eventos.
- `src/pages`: telas da aplicação.
- `src/lib`: clientes, contextos de autenticação e utilitários compartilhados.
- `src/services`: camada de acesso ao Supabase.
- `src/context`: contexto de tema claro/escuro.
- `src/styles`: CSS global/Tailwind.
- `supabase/schema.sql`: tabelas, triggers, RLS, storage bucket e dados iniciais.

## Mudanças realizadas

- Removidas dependências, plugin, imports e fluxo de autenticação Base44.
- Adicionado Supabase Auth por e-mail/senha.
- Adicionado cliente Supabase em `src/lib/supabaseClient.js`.
- Adicionada camada `db` em `src/services/dataService.js` para CRUD direto via Supabase.
- Adicionado upload para Supabase Storage no bucket `gef-dp-assets`.
- Reorganizada a aplicação para estrutura `src/`.
- Adicionado tema claro/escuro com persistência em `localStorage`.
- Configurado deploy no GitHub Pages com `gh-pages`.
- Mantidas telas de atividades, eventos, produtividade, recompensas, relatório e perfil.

## Pendências de decisão humana

- Criar o projeto real no Supabase e executar `supabase/schema.sql`.
- Definir URL pública do site no Supabase Auth para confirmação de cadastro e recuperação de senha.
- Promover manualmente o primeiro usuário administrador.
- Revisar textos institucionais finais e identidade visual oficial da GEFDP.
- Opcional: reduzir o bundle com code splitting, pois o build emite aviso de chunk grande.
