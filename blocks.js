/* Canteiro — definições de blocos
   Cada bloco tem: label, icon, desc (para a paleta), defaultData,
   fields (para o inspetor) e render(data) -> string HTML do bloco. */

function esc(str){
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function nl2br(str){
  return esc(str).replace(/\n/g,'<br>');
}

const BLOCK_DEFS = {

  hero: {
    label: 'Herói (topo)',
    icon: '◈',
    desc: 'Título de impacto + botão',
    defaultData: {
      titulo: 'Sua ideia, no ar em minutos',
      subtitulo: 'Monte uma landing page simples arrastando blocos, sem precisar programar.',
      textoBotao: 'Começar agora',
      linkBotao: '#',
      corFundo: '#FAF9F4'
    },
    fields: [
      { key:'titulo', label:'Título', type:'text' },
      { key:'subtitulo', label:'Subtítulo', type:'textarea' },
      { key:'textoBotao', label:'Texto do botão', type:'text' },
      { key:'linkBotao', label:'Link do botão', type:'url' },
      { key:'corFundo', label:'Cor de fundo', type:'color' },
    ],
    render(d){
      return `<div class="blk-section blk-hero" style="background:${esc(d.corFundo)}">
        <h1>${esc(d.titulo)}</h1>
        <p>${esc(d.subtitulo)}</p>
        <a class="cta-button" href="${esc(d.linkBotao)}">${esc(d.textoBotao)}</a>
      </div>`;
    }
  },

  heading: {
    label: 'Título de seção',
    icon: 'H',
    desc: 'Título + linha de apoio',
    defaultData: { titulo: 'Como funciona', subtitulo: 'Três passos simples para sua página no ar.' },
    fields: [
      { key:'titulo', label:'Título', type:'text' },
      { key:'subtitulo', label:'Texto de apoio', type:'text' },
    ],
    render(d){
      return `<div class="blk-section blk-heading" style="text-align:center">
        <h2>${esc(d.titulo)}</h2>
        ${d.subtitulo ? `<p>${esc(d.subtitulo)}</p>` : ''}
      </div>`;
    }
  },

  text: {
    label: 'Parágrafo',
    icon: '¶',
    desc: 'Bloco de texto livre',
    defaultData: { texto: 'Escreva aqui um parágrafo explicando melhor o seu produto, serviço ou ideia.' },
    fields: [
      { key:'texto', label:'Texto', type:'textarea' },
    ],
    render(d){
      return `<div class="blk-section blk-text"><p>${nl2br(d.texto)}</p></div>`;
    }
  },

  image: {
    label: 'Imagem',
    icon: '▧',
    desc: 'Foto ou ilustração com legenda',
    defaultData: {
      url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=1200&q=80',
      alt: 'Descrição da imagem',
      legenda: ''
    },
    fields: [
      { key:'url', label:'URL da imagem', type:'url' },
      { key:'alt', label:'Texto alternativo', type:'text' },
      { key:'legenda', label:'Legenda (opcional)', type:'text' },
    ],
    render(d){
      return `<figure class="blk-section blk-image">
        <img src="${esc(d.url)}" alt="${esc(d.alt)}">
        ${d.legenda ? `<figcaption>${esc(d.legenda)}</figcaption>` : ''}
      </figure>`;
    }
  },

  button: {
    label: 'Botão / CTA',
    icon: '▶',
    desc: 'Chamada para ação isolada',
    defaultData: { texto: 'Quero começar', link: '#', corBotao: '#E07A3E' },
    fields: [
      { key:'texto', label:'Texto do botão', type:'text' },
      { key:'link', label:'Link', type:'url' },
      { key:'corBotao', label:'Cor do botão', type:'color' },
    ],
    render(d){
      return `<div class="blk-section blk-button">
        <a class="cta-button" style="background:${esc(d.corBotao)}" href="${esc(d.link)}">${esc(d.texto)}</a>
      </div>`;
    }
  },

  features: {
    label: 'Recursos (3 colunas)',
    icon: '▦',
    desc: 'Grade com três diferenciais',
    defaultData: {
      itens: [
        { icone:'★', titulo:'Rápido', texto:'Publique sua página em poucos minutos.' },
        { icone:'⬡', titulo:'Simples', texto:'Sem código, sem complicação.' },
        { icone:'⬢', titulo:'Seu', texto:'Exporte o HTML e hospede onde quiser.' },
      ]
    },
    fields: [
      { key:'itens', label:'Itens', type:'repeat', itemFields:[
          {key:'icone', label:'Ícone (emoji ou símbolo)', type:'text'},
          {key:'titulo', label:'Título', type:'text'},
          {key:'texto', label:'Texto', type:'textarea'},
      ]},
    ],
    render(d){
      const items = (d.itens||[]).map(it => `
        <div class="feat">
          <div class="feat-icon">${esc(it.icone)}</div>
          <h3>${esc(it.titulo)}</h3>
          <p>${esc(it.texto)}</p>
        </div>`).join('');
      return `<div class="blk-section blk-features">${items}</div>`;
    }
  },

  testimonial: {
    label: 'Depoimento',
    icon: '❝',
    desc: 'Citação de um cliente',
    defaultData: { citacao: 'Consegui montar minha página em 10 minutos, sem ajuda de ninguém.', autor: 'Maria Silva', cargo: 'Fundadora, Ateliê Flor' },
    fields: [
      { key:'citacao', label:'Citação', type:'textarea' },
      { key:'autor', label:'Nome', type:'text' },
      { key:'cargo', label:'Cargo / empresa', type:'text' },
    ],
    render(d){
      return `<div class="blk-section blk-testimonial">
        <p class="quote">"${esc(d.citacao)}"</p>
        <p class="who">${esc(d.autor)}${d.cargo ? ' — '+esc(d.cargo) : ''}</p>
      </div>`;
    }
  },

  pricing: {
    label: 'Preço',
    icon: '$',
    desc: 'Cartão de plano único',
    defaultData: { plano:'Plano único', preco:'R$ 29', periodo:'/mês', descricao:'Tudo que você precisa para começar.', textoBotao:'Assinar agora', link:'#' },
    fields: [
      { key:'plano', label:'Nome do plano', type:'text' },
      { key:'preco', label:'Preço', type:'text' },
      { key:'periodo', label:'Período (ex: /mês)', type:'text' },
      { key:'descricao', label:'Descrição', type:'text' },
      { key:'textoBotao', label:'Texto do botão', type:'text' },
      { key:'link', label:'Link do botão', type:'url' },
    ],
    render(d){
      return `<div class="blk-section blk-pricing">
        <p style="font-weight:700;color:var(--ink-soft);text-transform:uppercase;font-size:12px;letter-spacing:.06em">${esc(d.plano)}</p>
        <p class="price">${esc(d.preco)}<span>${esc(d.periodo)}</span></p>
        <p style="color:var(--ink-soft);font-size:14px;margin-bottom:18px">${esc(d.descricao)}</p>
        <a class="cta-button" href="${esc(d.link)}">${esc(d.textoBotao)}</a>
      </div>`;
    }
  },

  form: {
    label: 'Captura de e-mail',
    icon: '✉',
    desc: 'Formulário simples de contato',
    defaultData: { titulo:'Fique por dentro', textoBotao:'Inscrever', placeholder:'seu@email.com' },
    fields: [
      { key:'titulo', label:'Título', type:'text' },
      { key:'placeholder', label:'Texto do campo', type:'text' },
      { key:'textoBotao', label:'Texto do botão', type:'text' },
    ],
    render(d){
      return `<div class="blk-section blk-form">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:4px">${esc(d.titulo)}</h3>
        <form class="form-row" onsubmit="return false;">
          <input type="email" placeholder="${esc(d.placeholder)}" required>
          <button type="submit" class="cta-button" style="border:none">${esc(d.textoBotao)}</button>
        </form>
      </div>`;
    }
  },

  divider: {
    label: 'Divisor',
    icon: '—',
    desc: 'Linha separadora',
    defaultData: {},
    fields: [],
    render(){ return `<div class="blk-divider"><hr></div>`; }
  },

  footer: {
    label: 'Rodapé',
    icon: '▁',
    desc: 'Texto final da página',
    defaultData: { texto: '© 2026 Sua Empresa. Todos os direitos reservados.' },
    fields: [
      { key:'texto', label:'Texto do rodapé', type:'text' },
    ],
    render(d){
      return `<div class="blk-footer">${esc(d.texto)}</div>`;
    }
  },

};

const BLOCK_ORDER = ['hero','heading','text','image','features','testimonial','pricing','button','form','divider','footer'];
