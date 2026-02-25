/* 96 Research — Site Logic */

var CATEGORIES = {
  'equity-research': 'Equity Research',
  'market-commentary': 'Market Commentary',
  'media': 'Media'
};

function formatDate(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function createArticleLink(article) {
  var li = document.createElement('li');
  var div = document.createElement('div');
  div.className = 'article-item';

  var a = document.createElement('a');
  a.href = 'article.html?slug=' + article.slug;
  a.textContent = article.title;

  if (article.category === 'media') {
    var tag = document.createElement('span');
    tag.className = 'media-tag';
    tag.textContent = 'media';
    a.appendChild(document.createTextNode(' '));
    a.appendChild(tag);
  }

  var span = document.createElement('span');
  span.className = 'article-date';
  span.textContent = formatDateShort(article.date);

  div.appendChild(a);
  div.appendChild(span);
  li.appendChild(div);
  return li;
}

function loadHomepage(articles) {
  var sections = {
    'equity-research': document.getElementById('equity-research-list'),
    'market-commentary': document.getElementById('market-commentary-list'),
    'media': document.getElementById('media-list')
  };

  Object.keys(sections).forEach(function(cat) {
    var el = sections[cat];
    if (!el) return;
    var items = articles.filter(function(a) { return a.category === cat; });
    items.slice(0, 3).forEach(function(article) {
      el.appendChild(createArticleLink(article));
    });
  });
}

function loadArchive(articles) {
  var container = document.getElementById('archive-list');
  if (!container) return;

  if (articles.length === 0) {
    container.innerHTML = '<p class="empty-state">No articles yet.</p>';
    return;
  }

  var ul = document.createElement('ul');
  ul.className = 'article-list';
  articles.forEach(function(article) {
    ul.appendChild(createArticleLink(article));
  });
  container.appendChild(ul);
}

function loadArticle(articles) {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug');

  if (!slug) { window.location.href = 'archive.html'; return; }

  var article = articles.find(function(a) { return a.slug === slug; });

  // Hub page — special full-page layout
  var isHub = slug === 'turning-the-tide-gsl';
  if (isHub) {
    document.body.classList.add('hub-page');
    var backLink = document.createElement('a');
    backLink.href = 'archive.html';
    backLink.className = 'hub-back';
    backLink.textContent = '\u2190 Archive';
    document.body.appendChild(backLink);
  }

  // Hidden article — not in articles.json but may exist as a markdown file
  if (!article && !isHub) {
    document.body.classList.add('sector-page');
    var hiddenBack = document.createElement('a');
    hiddenBack.href = 'article.html?slug=turning-the-tide-gsl';
    hiddenBack.className = 'hub-back';
    hiddenBack.textContent = '\u2190 Back';
    document.body.appendChild(hiddenBack);
    fetch('articles/' + slug + '.md')
      .then(function(res) {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(function(md) {
        var titleMatch = md.match(/^#\s+(.+)/m);
        if (titleMatch) document.title = titleMatch[1] + ' \u2014 96 Research';
        document.getElementById('article-body').innerHTML = renderMarkdown(md);
        loadGslReturn();
      })
      .catch(function() {
        document.getElementById('article-body').innerHTML =
          '<p>The requested article could not be found. <a href="archive.html">Return to archive</a>.</p>';
      });
    return;
  }

  if (!article) {
    document.getElementById('article-title').textContent = 'Article not found';
    document.getElementById('article-body').innerHTML =
      '<p>The requested article could not be found. <a href="archive.html">Return to archive</a>.</p>';
    return;
  }

  document.title = article.title + ' \u2014 96 Research';
  document.getElementById('article-title').textContent = article.title;
  document.getElementById('article-meta').innerHTML =
    '<span class="article-category">' + CATEGORIES[article.category] + '</span> &middot; ' + formatDate(article.date);

  fetch('articles/' + slug + '.md')
    .then(function(res) {
      if (!res.ok) throw new Error('Not found');
      return res.text();
    })
    .then(function(md) {
      var rendered = renderMarkdown(md);
      if (isHub) {
        document.getElementById('article-body').innerHTML =
          '<div class="hub-layout">' +
            '<div class="hub-left">' +
              '<img class="hub-hero" src="images/Joseph_Mallord_William_Turner_-_Snow_Storm_-_Steam-Boat_off_a_Harbour\'s_Mouth_-_WGA23178.jpg" alt="J.M.W. Turner \u2014 Snow Storm: Steam-Boat off a Harbour\'s Mouth">' +
              '<p class="hub-caption">Snow Storm \u2014 J.M.W. Turner, 1842</p>' +
            '</div>' +
            '<div class="hub-right">' +
              rendered +
            '</div>' +
          '</div>';
      } else {
        document.getElementById('article-body').innerHTML = rendered;
      loadGslReturn();
      }
    })
    .catch(function() {
      document.getElementById('article-body').innerHTML =
        '<p>' + article.description + '</p>';
    });
}

/* Minimal Markdown Renderer */
function renderMarkdown(text) {
  text = text.replace(/^---[\s\S]*?---\n*/m, '');
  var lines = text.split('\n');
  var html = '';
  var inList = false, inOList = false, inBq = false, inCode = false;
  var codeBuf = '', para = '';

  function flush() { if (para.trim()) { html += '<p>' + inline(para.trim()) + '</p>\n'; para = ''; } }
  function closeLists() { if (inList) { html += '</ul>\n'; inList = false; } if (inOList) { html += '</ol>\n'; inOList = false; } }
  function closeBq() { if (inBq) { html += '</blockquote>\n'; inBq = false; } }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.trim().indexOf('```') === 0) {
      if (inCode) { html += '<pre><code>' + esc(codeBuf.replace(/\n$/, '')) + '</code></pre>\n'; codeBuf = ''; inCode = false; }
      else { flush(); closeLists(); closeBq(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf += line + '\n'; continue; }
    if (line.trim() === '') { flush(); closeLists(); closeBq(); continue; }

    var hm = line.match(/^(#{1,6})\s+(.*)/);
    if (hm) { flush(); closeLists(); closeBq(); html += '<h' + hm[1].length + '>' + inline(hm[2]) + '</h' + hm[1].length + '>\n'; continue; }
    if (/^[-*_]{3,}\s*$/.test(line.trim())) { flush(); closeLists(); closeBq(); html += '<hr>\n'; continue; }
    if (line.trim().indexOf('>') === 0) { flush(); closeLists(); if (!inBq) { html += '<blockquote>\n'; inBq = true; } html += '<p>' + inline(line.trim().replace(/^>\s*/, '')) + '</p>\n'; continue; }
    if (/^\s*[-*+]\s+/.test(line)) { flush(); closeBq(); if (inOList) { html += '</ol>\n'; inOList = false; } if (!inList) { html += '<ul>\n'; inList = true; } html += '<li>' + inline(line.replace(/^\s*[-*+]\s+/, '')) + '</li>\n'; continue; }
    if (/^\s*\d+\.\s+/.test(line)) { flush(); closeBq(); if (inList) { html += '</ul>\n'; inList = false; } if (!inOList) { html += '<ol>\n'; inOList = true; } html += '<li>' + inline(line.replace(/^\s*\d+\.\s+/, '')) + '</li>\n'; continue; }

    if (line.indexOf('|') !== -1 && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
      flush(); closeLists(); closeBq();
      var hdrs = line.split('|').filter(function(c) { return c.trim(); });
      html += '<table><thead><tr>'; hdrs.forEach(function(h) { html += '<th>' + inline(h.trim()) + '</th>'; }); html += '</tr></thead><tbody>\n';
      i++;
      while (i + 1 < lines.length && lines[i + 1].indexOf('|') !== -1) { i++; var cells = lines[i].split('|').filter(function(c) { return c.trim(); }); html += '<tr>'; cells.forEach(function(c) { html += '<td>' + inline(c.trim()) + '</td>'; }); html += '</tr>\n'; }
      html += '</tbody></table>\n'; continue;
    }

    if (para) para += ' ';
    para += line;
  }
  flush(); closeLists(); closeBq();
  return html;
}

function inline(t) {
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function loadGslReturn() {
  var el = document.getElementById('gsl-return');
  if (!el) return;
  fetch('data/gsl-return.json')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.total_return === null) return;
      var rounded = Math.round(d.total_return);
      var sign = rounded >= 0 ? '+' : '';
      var isPositive = rounded >= 0;
      var color = isPositive ? '#2a7a2a' : '#c0392b';
      el.className = 'gsl-return-banner' + (isPositive ? '' : ' negative');
      el.innerHTML =
        '<span class="gsl-return-value" style="color:' + color + '">' + sign + rounded + '%</span>' +
        '<span class="gsl-return-label">GSL Total Return (incl. dividends)</span>' +
        '<span class="gsl-return-date">since ' + formatDateShort(d.start_date) + ' &middot; as of ' + formatDateShort(d.as_of) + '</span>';
    })
    .catch(function() {});
}

/* Init */
document.addEventListener('DOMContentLoaded', function() {
  fetch('articles/articles.json')
    .then(function(r) { return r.json(); })
    .then(function(articles) {
      articles.sort(function(a, b) { return b.date.localeCompare(a.date); });
      var page = document.body.getAttribute('data-page');
      if (page === 'home') loadHomepage(articles);
      else if (page === 'archive') loadArchive(articles);
      else if (page === 'article') loadArticle(articles);
    })
    .catch(function(e) { console.error('Failed to load articles:', e); });
});
