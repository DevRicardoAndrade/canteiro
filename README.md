# Canteiro — construtor de landing pages

Ferramenta simples, 100% em HTML/CSS/JS puro (sem build, sem dependências),
para montar landing pages arrastando blocos e exportar o HTML final.

## Arquivos
- `index.html` — estrutura do app
- `style.css` — visual do construtor
- `blocks.js` — definição dos blocos (hero, texto, imagem, preço, etc.)
- `app.js` — lógica: arrastar/soltar, editar, exportar

## Como usar
1. Abra `index.html` no navegador (funciona até com duplo clique local).
2. Arraste um bloco da lista à esquerda para a página no centro (ou toque nele).
3. Clique em um bloco na página para editar seus textos/imagens/cores no painel à direita.
4. Use as setas ↑↓ para reordenar, ⧉ para duplicar, ✕ para remover.
5. Clique em **"Pré-visualizar"** para ver a página final em uma aba nova.
6. Clique em **"Baixar site (.html)"** para gerar um `landing-page.html` pronto,
   independente do construtor — é esse arquivo que você publica.

O rascunho fica salvo automaticamente no navegador (localStorage), então você
pode fechar e voltar depois sem perder o trabalho.

## Como hospedar o construtor como site real
Qualquer serviço de hospedagem estática funciona, por exemplo:

**Netlify (mais simples):**
Arraste a pasta inteira em https://app.netlify.com/drop

**GitHub Pages:**
1. Crie um repositório e suba estes 4 arquivos na raiz.
2. Em Settings → Pages, escolha a branch principal como fonte.

**Vercel:**
```
npx vercel
```
na pasta do projeto (sem configuração extra, é site estático).

## Como hospedar a landing page exportada
O arquivo `landing-page.html` baixado pelo construtor é uma página HTML
completa e independente — pode ser hospedada da mesma forma (Netlify, GitHub
Pages, Vercel) ou simplesmente enviada para qualquer hospedagem que aceite
HTML estático.
