(function () {
  const icons = {
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"></path>',
    projects: '<rect x="3" y="3" width="7" height="7" rx="1.4"></rect><rect x="14" y="3" width="7" height="7" rx="1.4"></rect><rect x="14" y="14" width="7" height="7" rx="1.4"></rect><rect x="3" y="14" width="7" height="7" rx="1.4"></rect>',
    briefcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"></path><rect x="2" y="7" width="20" height="13" rx="2"></rect><path d="M2 11h20"></path>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M8 13h8"></path><path d="M8 17h8"></path><path d="M8 9h2"></path>',
    gamepad: '<path d="M6 6h12a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-1l-2 3H9l-2-3H6a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"></path><path d="M8 12h4"></path><path d="M10 10v4"></path><circle cx="16" cy="12" r="1"></circle><circle cx="19" cy="9" r="1"></circle>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"></path><path d="m3 12 9 5 9-5"></path><path d="m3 17 9 5 9-5"></path>',
    user: '<path d="M20 21a8 8 0 1 0-16 0"></path><circle cx="12" cy="7" r="4"></circle>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path><path d="M5 21l.9-2.6L8.5 17l-2.6-.9L5 13.5l-.9 2.6L1.5 17l2.6.9z"></path>'
  };

  const labelToIcon = [
    [/^home$/i, 'home'],
    [/^projects$/i, 'projects'],
    [/nwplus/i, 'briefcase'],
    [/hackathon/i, 'file'],
    [/jellybreak/i, 'gamepad'],
    [/hatchloom/i, 'layers'],
    [/^about$/i, 'user'],
    [/^playground$/i, 'sparkles']
  ];

  const svg = (body) => (
    '<svg class="nav-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
    body +
    '</svg>'
  );

  document.querySelectorAll('.toc a.toc-item').forEach((link) => {
    if (link.querySelector('.nav-ic')) return;
    const text = (link.textContent || '').trim();
    const href = link.getAttribute('href') || '';
    let iconName = 'projects';

    for (const [pattern, name] of labelToIcon) {
      if (pattern.test(text) || pattern.test(href)) {
        iconName = name;
        break;
      }
    }

    const iconWrap = document.createElement('span');
    iconWrap.className = 'nav-ic-wrap';
    iconWrap.innerHTML = svg(icons[iconName] || icons.projects);
    link.insertBefore(iconWrap, link.firstChild);
  });
})();
