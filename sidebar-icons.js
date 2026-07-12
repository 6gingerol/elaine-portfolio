(function () {
  const icons = {
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"></path>',
    projects: '<rect x="3" y="3" width="7" height="7" rx="1.4"></rect><rect x="14" y="3" width="7" height="7" rx="1.4"></rect><rect x="14" y="14" width="7" height="7" rx="1.4"></rect><rect x="3" y="14" width="7" height="7" rx="1.4"></rect>',
    briefcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"></path><rect x="2" y="7" width="20" height="13" rx="2"></rect><path d="M2 11h20"></path>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M8 13h8"></path><path d="M8 17h8"></path><path d="M8 9h2"></path>',
    gamepad: '<path d="M6 6h12a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-1l-2 3H9l-2-3H6a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"></path><path d="M8 12h4"></path><path d="M10 10v4"></path><circle cx="16" cy="12" r="1"></circle><circle cx="19" cy="9" r="1"></circle>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"></path><path d="m3 12 9 5 9-5"></path><path d="m3 17 9 5 9-5"></path>',
    /* nwPlus — custom N+ icon */
    nwplus: '<g transform="translate(3, 2)"><path d="M15.2698 0.682007C16.0903 0.682043 16.7558 1.34691 16.7561 2.16736V17.226C16.7561 18.5974 15.0566 19.2368 14.1526 18.2054L4.26001 6.92029C4.23436 6.89103 4.21332 6.88263 4.19849 6.87927C4.17938 6.87503 4.15242 6.87552 4.12427 6.88611C4.0962 6.8967 4.07624 6.9143 4.0647 6.93005C4.05576 6.94236 4.04517 6.96244 4.04517 7.00134V13.9222C4.04517 13.9587 4.05472 13.9787 4.06372 13.9916C4.07497 14.0075 4.0949 14.0246 4.12134 14.0355C4.14759 14.0463 4.17252 14.0476 4.19165 14.0443C4.20712 14.0416 4.22821 14.035 4.25415 14.0092L4.60181 13.6605C5.31827 12.9442 6.5382 13.2326 6.85864 14.1937C7.04042 14.739 6.86096 15.34 6.40942 15.6957L3.08716 18.3109C2.11241 19.0784 0.681973 18.3845 0.681885 17.1439V2.36072C0.681885 1.02279 2.31115 0.366132 3.23853 1.33044L13.01 11.4916C13.0355 11.5181 13.0561 11.5257 13.0715 11.5287C13.0907 11.5324 13.1162 11.5313 13.1428 11.5209C13.1692 11.5104 13.1889 11.4945 13.2004 11.4789C13.2097 11.4662 13.2192 11.4462 13.22 11.4095L13.4026 2.13806C13.4188 1.32916 14.0798 0.682007 14.8889 0.682007H15.2698"></path></g>',
    /* hatchloom — cracked egg */
    hatchloom: '<path d="M19.4999 12C19.1399 7.66 15.5499 2.04 11.9999 2C8.44991 2.04 4.85991 7.66 4.49991 12M19.4999 12L17 10L14.5 12L11.9999 10L9.5 12L7 10L4.49991 12M4.49991 12C4.12991 16.43 5.76991 21.95 11.9999 22C15.9404 21.9684 18.0447 19.7484 18.9654 17C19.5004 15.4032 19.6359 13.628 19.4999 12M18.9654 17L17.0001 15L14.5001 17L12 15L9.50009 17L7.00009 15L4.88131 16.5"></path>',
    /* jellybreak — ghost/jellyfish shape */
    jellyfish: '<path d="M9 10H9.01M15 10H15.01M12 2C9.87827 2 7.84344 2.84285 6.34315 4.34315C4.84285 5.84344 4 7.87827 4 10V22L7 19L9.5 21.5L12 19L14.5 21.5L17 19L20 22V10C20 7.87827 19.1571 5.84344 17.6569 4.34315C16.1566 2.84285 14.1217 2 12 2Z"></path>',
    user: '<path d="M20 21a8 8 0 1 0-16 0"></path><circle cx="12" cy="7" r="4"></circle>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path><path d="M5 21l.9-2.6L8.5 17l-2.6-.9L5 13.5l-.9 2.6L1.5 17l2.6.9z"></path>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'
  };

  const labelToIcon = [
    [/^home$/i, 'home'],
    [/^projects$/i, 'projects'],
    [/nwplus/i, 'nwplus'],
    [/hackathon/i, 'file'],
    [/jellybreak/i, 'jellyfish'],
    [/hatchloom/i, 'hatchloom'],
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

  // group the project tabs under a "Projects" label
  const projs = document.querySelectorAll('.toc a.toc-proj');
  if (projs.length && !document.querySelector('.toc-group-label')) {
    const label = document.createElement('span');
    label.className = 'toc-group-label';
    label.textContent = 'projects';
    projs[0].parentNode.insertBefore(label, projs[0]);
  }

  // footer links (Email / LinkedIn / Resume) — leading icons to match nav
  const footIcon = [
    [/email|^mailto:/i, 'mail'],
    [/linkedin/i, 'linkedin'],
    [/resume|drive\.google/i, 'download']
  ];
  document.querySelectorAll('.spine-links a').forEach((link) => {
    if (link.querySelector('.nav-ic')) return;
    const text = (link.textContent || '').trim();
    const href = link.getAttribute('href') || '';
    let iconName = 'file';
    for (const [pattern, name] of footIcon) {
      if (pattern.test(text) || pattern.test(href)) { iconName = name; break; }
    }
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nav-ic-wrap';
    iconWrap.innerHTML = svg(icons[iconName] || icons.file);
    link.insertBefore(iconWrap, link.firstChild);
  });
})();
