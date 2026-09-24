(() => {
  // Delegate so dynamically rendered research cards are included. Never cancel
  // clicks: a blocked tracker must not affect links, citations, or the cat.
  document.addEventListener('click', (event) => {
    const element = event.target?.closest?.('a, button');
    if (!element) return;

    let name;
    let properties = {};
    if (element.dataset.paper) {
      name = 'paper_open';
      properties.paper = element.dataset.paper;
    } else if (element.dataset.cite) {
      name = 'citation_open';
      properties.paper = element.dataset.cite;
    } else if (element.dataset.project) {
      name = 'research_path_select';
      properties.project = element.dataset.project;
    } else if (element.id === 'pet-preview') {
      name = 'cat_call';
    } else if (element.tagName === 'A') {
      const url = new URL(element.href, window.location.href);
      if (url.protocol === 'mailto:') {
        name = 'contact_email';
      } else {
        const profiles = {
          'github.com': 'github',
          'scholar.google.com': 'scholar',
          'www.linkedin.com': 'linkedin',
        };
        if (profiles[url.hostname]) {
          name = 'profile_open';
          properties.profile = profiles[url.hostname];
        } else if (url.origin === window.location.origin && /^\/(en\/)?cv\/?$/.test(url.pathname)) {
          name = 'cv_open';
        }
      }
    }
    if (!name) return;
    try {
      window.umami?.track(name, properties)?.catch?.(() => {});
    } catch {
      // Analytics is optional; page interactions must continue normally.
    }
  });
})();
