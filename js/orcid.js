/**
 * ORCID Public API integration.
 * Fetches Employment, Funding, and Works from pub.orcid.org (no auth required).
 */

(function () {
  'use strict';

  var API_BASE = 'https://pub.orcid.org/v3.0';
  var HEADERS = { Accept: 'application/json' };

  // University logo mapping (org name substring → logo path)
  var ORG_LOGOS = {
    'Surrey': '/img/logos/surrey.png',
    'Oxford': '/img/logos/oxford.png',
    'Cardiff': '/img/logos/cardiff.png'
  };

  function getOrgLogo(orgName) {
    if (!orgName) return '';
    for (var key in ORG_LOGOS) {
      if (orgName.indexOf(key) !== -1) {
        return '<img class="org-logo" src="' + ORG_LOGOS[key] + '" alt="' + escapeHtml(key) + ' logo" width="32" height="32">';
      }
    }
    return '<span class="org-logo-placeholder"></span>';
  }

  // Manual overrides for ORCID entries with incomplete metadata
  var WORK_OVERRIDES = {
    'Model-based analysis of time-dependent consolidation': {
      year: '2023',
      type: 'dissertation',
      journal: 'Cardiff University',
      url: 'https://orca.cardiff.ac.uk/168270'
    }
  };

  function getOrcidId() {
    var el = document.querySelector('[data-orcid-id]');
    return el ? el.getAttribute('data-orcid-id') : null;
  }

  function fetchOrcid(orcidId, section) {
    var url = API_BASE + '/' + orcidId + '/' + section;
    return fetch(url, { headers: HEADERS })
      .then(function (res) {
        if (!res.ok) throw new Error('ORCID API ' + res.status);
        return res.json();
      });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ── Renderers ──

  function renderEmployments(data, container) {
    var groups = data['affiliation-group'] || [];
    if (groups.length === 0) {
      container.closest('.orcid-block').style.display = 'none';
      return;
    }

    var html = '';
    groups.forEach(function (group) {
      var summaries = group.summaries || [];
      summaries.forEach(function (item) {
        var s = item['employment-summary'];
        if (!s) return;

        var org = s.organization ? s.organization.name : '';
        var role = s['role-title'] || '';
        var dept = s['department-name'] || '';
        var start = formatDate(s['start-date']);
        var end = s['end-date'] ? formatDate(s['end-date']) : 'Present';
        var dateStr = (start || end !== 'Present') ? (start + ' — ' + end) : '';

        html += '<div class="orcid-entry">';
        html += getOrgLogo(org);
        html += '<div class="orcid-entry-main">';
        if (role) html += '<div class="orcid-entry-title">' + escapeHtml(role) + '</div>';
        html += '<div class="orcid-entry-subtitle">' + escapeHtml(org);
        if (dept) html += '<span class="orcid-entry-dept"> · ' + escapeHtml(dept) + '</span>';
        html += '</div>';
        html += '</div>';
        if (dateStr) {
          html += '<div class="orcid-entry-date">' + dateStr + '</div>';
        }
        html += '</div>';
      });
    });

    container.innerHTML = html;
  }

  function renderFundings(data, container) {
    var groups = data.group || [];
    if (groups.length === 0) {
      container.closest('.orcid-block').style.display = 'none';
      return;
    }

    var html = '';
    groups.forEach(function (group) {
      var summaries = group['funding-summary'] || [];
      summaries.forEach(function (s) {
        var title = s.title && s.title.title ? s.title.title.value : '';
        var org = s.organization ? s.organization.name : '';
        var ftype = s.type || '';
        var start = formatDate(s['start-date']);
        var end = s['end-date'] ? formatDate(s['end-date']) : 'Present';
        var dateStr = (start || end !== 'Present') ? (start + ' — ' + end) : '';

        // External link (grant URL or DOI)
        var link = s.url ? s.url.value : null;
        if (!link && s['external-ids'] && s['external-ids']['external-id']) {
          s['external-ids']['external-id'].forEach(function (eid) {
            if (eid['external-id-type'] === 'grant_number' && eid['external-id-url']) {
              link = eid['external-id-url'].value;
            }
          });
        }

        html += '<div class="orcid-entry">';
        html += '<div class="orcid-entry-main">';
        html += '<div class="orcid-entry-title">';
        if (link) {
          html += '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' +
            escapeHtml(title) + '</a>';
        } else {
          html += escapeHtml(title);
        }
        html += '</div>';
        var meta = [];
        if (org) meta.push(escapeHtml(org));
        if (ftype) meta.push(formatFundingType(ftype));
        if (meta.length > 0) {
          html += '<div class="orcid-entry-subtitle">' + meta.join(' · ') + '</div>';
        }
        html += '</div>';
        if (dateStr) {
          html += '<div class="orcid-entry-date">' + dateStr + '</div>';
        }
        html += '</div>';
      });
    });

    container.innerHTML = html;
  }

  function renderWorks(data, container) {
    var groups = data.group || [];
    if (groups.length === 0) {
      container.closest('.orcid-block').style.display = 'none';
      return;
    }

    var works = [];
    groups.forEach(function (group) {
      var summaries = group['work-summary'] || [];
      if (summaries.length === 0) return;
      var s = summaries[0];

      var title = s.title && s.title.title ? s.title.title.value : 'Untitled';
      var journal = s['journal-title'] ? s['journal-title'].value : '';
      var year = s['publication-date'] && s['publication-date'].year
        ? s['publication-date'].year.value : null;
      var type = s.type || '';

      var doi = null;
      var url = s.url ? s.url.value : null;
      if (s['external-ids'] && s['external-ids']['external-id']) {
        s['external-ids']['external-id'].forEach(function (eid) {
          if (eid['external-id-type'] === 'doi') {
            doi = eid['external-id-value'];
          }
        });
      }

      // Manual overrides for entries with incomplete ORCID metadata
      var override = WORK_OVERRIDES[title];
      if (override) {
        if (override.year) year = override.year;
        if (override.type) type = override.type;
        if (override.journal) journal = override.journal;
        if (override.url) url = override.url;
      }

      works.push({ title: title, journal: journal, year: year, type: type, doi: doi, url: url });
    });

    works.sort(function (a, b) {
      return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
    });

    var html = '';
    var currentYear = null;

    works.forEach(function (w) {
      if (w.year !== currentYear) {
        currentYear = w.year;
        html += '<div class="orcid-works-year">' + (currentYear || 'Unknown year') + '</div>';
      }

      var link = w.doi ? 'https://doi.org/' + encodeURIComponent(w.doi) : w.url;

      html += '<div class="orcid-entry">';
      html += '<div class="orcid-entry-main">';
      html += '<div class="orcid-entry-title">';
      if (link) {
        html += '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' +
          escapeHtml(w.title) + '</a>';
      } else {
        html += escapeHtml(w.title);
      }
      html += '</div>';

      var meta = [];
      if (w.journal) meta.push('<em>' + escapeHtml(w.journal) + '</em>');
      if (w.type) meta.push(formatWorkType(w.type));
      if (meta.length > 0) {
        html += '<div class="orcid-entry-subtitle">' + meta.join(' · ') + '</div>';
      }
      html += '</div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ── Helpers ──

  function formatDate(d) {
    if (!d) return '';
    var parts = [];
    if (d.year) parts.push(d.year.value);
    if (d.month) parts.push(d.month.value);
    return parts.join('-') || '';
  }

  var WORK_TYPE_ICONS = {
    'dissertation': '<svg class="orcid-type-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>'
  };

  function formatWorkType(type) {
    var map = {
      'journal-article': 'Journal Article',
      'conference-paper': 'Conference Paper',
      'book-chapter': 'Book Chapter',
      'book': 'Book',
      'dissertation': 'PhD Thesis',
      'report': 'Report',
      'preprint': 'Preprint',
      'other': 'Other'
    };
    var label = map[type] || type.replace(/-/g, ' ');
    var icon = WORK_TYPE_ICONS[type] || '';
    return icon ? icon + ' ' + label : label;
  }

  function formatFundingType(type) {
    var map = {
      'grant': 'Grant',
      'contract': 'Contract',
      'award': 'Award',
      'salary-award': 'Salary Award'
    };
    return map[type] || type.replace(/-/g, ' ');
  }

  // ── Init ──

  function init() {
    var orcidId = getOrcidId();
    // Also check About page's employment container
    var aboutEmploymentsEl = document.getElementById('about-employments');
    if (!orcidId && aboutEmploymentsEl) {
      orcidId = aboutEmploymentsEl.getAttribute('data-orcid-id');
    }
    if (!orcidId) return;

    var employmentsEl = document.getElementById('orcid-employments');
    var aboutEmpl = document.getElementById('about-employments');
    var fundingsEl = document.getElementById('orcid-fundings');
    var worksEl = document.getElementById('orcid-works');

    var fetches = [];

    // Render employments wherever the container exists
    var emplTargets = [employmentsEl, aboutEmpl].filter(Boolean);
    if (emplTargets.length > 0) {
      fetches.push(
        fetchOrcid(orcidId, 'employments')
          .then(function (data) {
            emplTargets.forEach(function (el) { renderEmployments(data, el); });
          })
          .catch(function () {
            emplTargets.forEach(function (el) {
              var block = el.closest('.orcid-block');
              if (block) block.style.display = 'none';
            });
          })
      );
    }

    if (fundingsEl) {
      fetches.push(
        fetchOrcid(orcidId, 'fundings')
          .then(function (data) { renderFundings(data, fundingsEl); })
          .catch(function () {
            var block = fundingsEl.closest('.orcid-block');
            if (block) block.style.display = 'none';
          })
      );
    }

    if (worksEl) {
      fetches.push(
        fetchOrcid(orcidId, 'works')
          .then(function (data) { renderWorks(data, worksEl); })
          .catch(function () {
            var block = worksEl.closest('.orcid-block');
            if (block) block.style.display = 'none';
          })
      );
    }

    // Hide entire ORCID section if nothing loaded
    Promise.all(fetches).then(function () {
      var section = document.getElementById('orcid-section');
      if (!section) return;
      var visible = section.querySelectorAll('.orcid-block');
      var allHidden = Array.prototype.every.call(visible, function (b) {
        return b.style.display === 'none';
      });
      if (allHidden) section.style.display = 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
