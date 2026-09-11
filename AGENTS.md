# Agente 360 — instruções para Claude e Cursor

Fonte de verdade da app no Power Platform: pasta `app/` (Power Apps Code App).

O HTML em `design/` é só protótipo. **Alterações de UI não entram no Power Platform até haver `npm run push` a partir de `app/`.**

## Publicar no Power Platform

Ambiente: **DEV: Paulino Quicassa** (`85de9078-2a11-e636-a7d4-4cfe77ad3656`)  
App: **Agente 360** (`65c47048-dcae-43a8-aa7d-e3916c319689`)  
Conta PAC: `paulino.quicassa@zap.co.ao`

```bash
cd app
npm install
npm run push
```

`npm run push` faz `vite build` e depois `pac code push`. O `appId` em `app/power.config.json` **não deve ser apagado nem trocado** — é o que actualiza a app existente em vez de criar outra.

## Trabalho em simultâneo

1. `git pull` em `main` antes de editar.
2. Alterar ecrãs/estilos em `app/src/` (não só no HTML de design).
3. Publicar com `npm run push`.
4. `git add` / commit / `git push` para o outro agente ver o mesmo código.

## Não fazer

- Não criar uma segunda Code App com o mesmo nome.
- Não assumir que `git push` publica no Power Apps.
- Não editar só `Agente 360 V2.html` ou `design/*.html` se o objectivo for a app em execução.
