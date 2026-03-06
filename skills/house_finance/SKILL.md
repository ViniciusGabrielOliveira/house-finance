---
title: House Finance Development
description: Regras e padrões para desenvolvimento do sistema House Finance.
---

# 🚀 Skill: House Finance (Gestão Financeira DOMéstica)

Bem-vindo(a) às diretrizes de desenvolvimento do aplicativo House Finance. Qualquer criação de novas funcionalidades, páginas ou manutenções *deve* seguir as regras abaixo.

## 1. Arquitetura e Stack
Para garantir escalabilidade, reatividade e sincronismo na nuvem em múltiplos dispositivos:
- **Backend/DB:** Sistema Serverless usando **Firebase** (Firestore + Firebase Auth).
- **Frontend Core:** **Angular 20**. O aplicativo fará forte uso da nova API de Reactivity (Signals), Control Flow (`@if`, `@for`) e Standalone Components.
- **Variáveis de Ambiente:** Através do `environments/environment.ts` do Angular CLI. A integração oficial se dará via `@angular/fire` para manter os streams nativos (Observables) quando necessário ou integrações com Signals.
- **Estilização:** SCSS (Sass) global apontando para CSS Variables. O tema **DEVE** ser Dark Mode e obrigatoriamente usar padrões de UI modernos (Glassmorphism - fundo translúcidos/blur e bordas suaves).

## 2. Gerenciamento de Rotas (Frontend URLs)
Sempre que uma nova "tela" ou formulário principal for criado (ex: Tela de Cadastro de Nova Conta), ela deve possuir sua própria **rota de frontend (URL)** bem definida, como `/cadastro`, `/lazer`, `/contas-fixas`.
- O servidor Express foi configurado para direcionar qualquer caminho (`/*`) para o `index.html`.
- O Frontend *deve* ler o caminho atual da URL (usando a History API do Javascript e `window.location.pathname`) para mostrar/ocultar a "tela" (div) correta.
- As mudanças de tela não recarregam a página (continua sendo um SPA), mas a URL no navegador e o histórico devem atualizar.
- Todas as rotas devem ser amplamente responsivas (Mobile-first).

## 3. Padrões de Layout e Componentes
- **Layouts e Formulários:** Mantenha os formulários objetivos, focados e centrais. Sempre envolva formulários em cartões (`glass-card`).
- **Lançamento Prioritário:** O sistema prevê muito Lançamento de "Lazer". Essa tela de lançamento deve ter o menor número possível de cliques — apenas inputs de *Valor* e *Descrição*.
- **Datas Automáticas:** Qualquer lançamento de despesa deve vir com a data (input de data) pré-preenchida com o dia de HOJE automaticamente.

## 4. Autenticação e Persistência de Dados
- **Login com o Google:** Para segurança e facilidade em múltiplos dispositivos, o sistema **DEVE** utilizar autenticação social (Google Login). Isso pode ser feito via Firebase Auth ou pela biblioteca nativa `@react-oauth/google` / Google Identity Services, que gerará um token JWT.
- **Autorização (Backend):** O backend Node.js validará o token do Google nas requisições. 
- Toda a lógica de leitura do usuário, carregamento dos lançamentos e salvamento acontece em um único objeto de estado `.js` na memória (`appData`), sendo sincronizado (*fetch POST*) assincronamente com o Node.
- O sistema gerencia Sessões localmente salvando o Token/Sessão do Google usando o `localStorage` atrelado ao próprio navegador do Device, para não precisar refazer o login a cada acesso.
Ao receber o pedido de um novo formulário ou nova feature:
1. Adicione a rota no Javascript (`History API`) mapeada.
2. Adicione os Blocos HTML base envoltos em uma Div `.route`.
3. Escreva apenas CSS Vanilla se necessário na folha principal.
