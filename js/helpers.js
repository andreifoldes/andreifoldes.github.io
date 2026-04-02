document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('is-open');
    });
  }

  // Email obfuscation
  var emailLinks = document.querySelectorAll('.email-link[data-user]');
  emailLinks.forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var addr = el.getAttribute('data-user') + '@' + el.getAttribute('data-domain');
      window.location.href = 'mailto:' + addr;
    });
  });

  // Live role from ORCID
  var roleEl = document.querySelector('[data-orcid-role]');
  if (roleEl) {
    var orcidId = roleEl.getAttribute('data-orcid-role');
    fetch('https://pub.orcid.org/v3.0/' + orcidId + '/employments', {
      headers: { Accept: 'application/json' }
    })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return;
        var groups = data['affiliation-group'] || [];
        // Find current position (no end-date)
        for (var i = 0; i < groups.length; i++) {
          var summaries = groups[i].summaries || [];
          for (var j = 0; j < summaries.length; j++) {
            var s = summaries[j]['employment-summary'];
            if (s && !s['end-date']) {
              var role = s['role-title'] || '';
              var org = s.organization ? s.organization.name : '';
              if (role && org) {
                roleEl.textContent = role + ', ' + org;
              }
              return;
            }
          }
        }
      })
      .catch(function () {});
  }

  // GitHub repo cards
  var grid = document.getElementById('repo-grid');
  if (grid && window.__FEATURED_REPOS) {
    fetchRepos(grid, window.__FEATURED_REPOS);
  }

  // Bluesky feed
  var bskyFeed = document.getElementById('bluesky-feed');
  if (bskyFeed && window.__BLUESKY_HANDLE) {
    fetchBlueskyFeed(bskyFeed, window.__BLUESKY_HANDLE);
  }
});

var LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  R: '#198CE7',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Dockerfile: '#384d54',
  Shell: '#89e051',
  Java: '#b07219',
  'Jupyter Notebook': '#DA5B0B'
};

var REPO_ICON = '<svg class="repo-card-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>';

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function fetchRepos(grid, repos) {
  Promise.all(
    repos.map(function (slug) {
      return fetch('https://api.github.com/repos/' + slug)
        .then(function (res) { return res.ok ? res.json() : null; })
        .catch(function () { return null; });
    })
  ).then(function (results) {
    grid.innerHTML = '';
    results.forEach(function (data) {
      if (!data) return;
      var card = createRepoCard(data);
      grid.appendChild(card);
    });
    if (grid.children.length === 0) {
      // Fallback: render static cards with repo links
      repos.forEach(function (slug) {
        var card = document.createElement('a');
        card.href = 'https://github.com/' + slug;
        card.className = 'repo-card';
        card.target = '_blank';
        card.rel = 'noopener';
        card.innerHTML =
          '<div class="repo-card-header">' +
            REPO_ICON +
            '<h3 class="repo-card-name">' + escapeHtml(slug) + '</h3>' +
            '<span class="repo-card-badge">Public</span>' +
          '</div>' +
          '<p class="repo-card-desc">View this project on GitHub</p>';
        grid.appendChild(card);
      });
    }
  });
}

function createRepoCard(data) {
  var card = document.createElement('a');
  card.href = data.html_url;
  card.className = 'repo-card';
  card.target = '_blank';
  card.rel = 'noopener';

  var langDot = '';
  if (data.language) {
    var color = LANG_COLORS[data.language] || '#8b949e';
    langDot = '<span class="repo-card-lang"><span class="lang-dot" style="background:' + color + '"></span>' + escapeHtml(data.language) + '</span>';
  }

  var stars = '';
  if (data.stargazers_count > 0) {
    stars = '<span class="repo-card-stars">&#9733; ' + data.stargazers_count + '</span>';
  }

  var forks = '';
  if (data.forks_count > 0) {
    forks = '<span class="repo-card-forks"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 0-1.5 0v.878H6.75a2.25 2.25 0 0 0-.75.124V5.372a2.25 2.25 0 1 0-1.5 0Zm0 5.256v-.878a2.25 2.25 0 1 0 1.5 0v.878a2.25 2.25 0 1 0-1.5 0Z"/></svg> ' + data.forks_count + '</span>';
  }

  card.innerHTML =
    '<div class="repo-card-header">' +
      REPO_ICON +
      '<h3 class="repo-card-name">' + escapeHtml(data.full_name) + '</h3>' +
      '<span class="repo-card-badge">Public</span>' +
    '</div>' +
    '<p class="repo-card-desc">' + escapeHtml(data.description || '') + '</p>' +
    '<div class="repo-card-meta">' + langDot + stars + forks + '</div>';

  return card;
}

// Bluesky feed
function fetchBlueskyFeed(container, handle) {
  var API = 'https://public.api.bsky.app/xrpc/';

  fetch(API + 'app.bsky.actor.getProfile?actor=' + encodeURIComponent(handle))
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (profile) {
      if (!profile) {
        container.innerHTML = '<p class="bluesky-loading">Could not load feed.</p>';
        return;
      }
      var did = profile.did;
      return fetch(API + 'app.bsky.feed.getAuthorFeed?actor=' + encodeURIComponent(did) + '&limit=3&filter=posts_and_author_threads')
        .then(function (res) { return res.ok ? res.json() : null; });
    })
    .then(function (data) {
      if (!data || !data.feed || data.feed.length === 0) {
        container.innerHTML = '<p class="bluesky-loading">No posts yet.</p>';
        return;
      }
      container.innerHTML = '';
      data.feed.forEach(function (item) {
        var post = item.post;
        var record = post.record;
        var isRepost = !!item.reason && item.reason['$type'] === 'app.bsky.feed.defs#reasonRepost';
        var text = record.text || '';
        var date = new Date(record.createdAt);
        var timeAgo = getTimeAgo(date);
        var postUri = post.uri.replace('at://', '').replace('app.bsky.feed.post/', '');
        var parts = postUri.split('/');
        var postUrl = 'https://bsky.app/profile/' + post.author.handle + '/post/' + parts[parts.length - 1];

        // Detect if post has images
        var imageHtml = '';
        if (record.embed && record.embed['$type'] === 'app.bsky.embed.images') {
          var images = record.embed.images || [];
          if (images.length > 0 && post.embed && post.embed.images) {
            imageHtml = '<div class="bsky-images">';
            post.embed.images.forEach(function (img) {
              imageHtml += '<img src="' + img.thumb + '" alt="' + escapeHtml(img.alt || '') + '" class="bsky-thumb" loading="lazy">';
            });
            imageHtml += '</div>';
          }
        }

        var repostLabel = isRepost
          ? '<span class="bsky-repost-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Reposted</span>'
          : '';

        var el = document.createElement('a');
        el.href = postUrl;
        el.className = 'bsky-post';
        el.target = '_blank';
        el.rel = 'noopener';
        el.innerHTML =
          repostLabel +
          '<div class="bsky-post-header">' +
            '<img src="' + (post.author.avatar || '') + '" alt="" class="bsky-avatar">' +
            '<span class="bsky-author">' + escapeHtml(post.author.displayName || post.author.handle) + '</span>' +
            '<span class="bsky-time">' + timeAgo + '</span>' +
          '</div>' +
          '<p class="bsky-text">' + escapeHtml(text) + '</p>' +
          imageHtml +
          '<div class="bsky-post-meta">' +
            '<span>&#9825; ' + (post.likeCount || 0) + '</span>' +
            '<span>&#8634; ' + (post.repostCount || 0) + '</span>' +
            '<span>&#9993; ' + (post.replyCount || 0) + '</span>' +
          '</div>';
        container.appendChild(el);
      });
    })
    .catch(function () {
      container.innerHTML = '<p class="bluesky-loading">Could not load feed.</p>';
    });
}

function getTimeAgo(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h';
  var days = Math.floor(hours / 24);
  if (days < 30) return days + 'd';
  var months = Math.floor(days / 30);
  if (months < 12) return months + 'mo';
  return Math.floor(months / 12) + 'y';
}
