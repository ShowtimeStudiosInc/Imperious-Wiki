/*
 * Recolors Decap CMS to match the wiki. Decap builds its look with emotion, which writes CSS
 * rules at runtime; this swaps Decap's light colors for the wiki's dark purple palette as each
 * rule is inserted. Must load BEFORE decap-cms.js. Fonts and the background are in theme.css.
 */
(function () {
  const BG = { // backgrounds
    '#fff': '#150d29', '#ffffff': '#150d29', 'white': '#150d29',
    '#eff0f4': '#0d0819', '#f7f8fb': '#120a22', '#fafafa': '#120a22', '#f5f5f5': '#120a22',
    '#e8f5fe': '#2c1b52', '#dfdfe3': '#2a2046', '#e6e6e6': '#251b3e', '#f0f0f0': '#1d1434',
    '#3a69c7': '#7c4dff', '#2b4fa0': '#6a3df0',
    '#fcefea': '#3a1420', '#f6d8ff': '#3a2160', '#ddf5f9': '#123a3a', '#caef6f': '#1f3a24', '#ffee9c': '#3a3214',
    '#ff003b': '#c23a5a', '#005614': '#2f7a4a', '#17a2b8': '#2a8a8a', '#70399f': '#8a5ad8',
    '#313d3e': '#5a36d6', '#798291': '#2a2046', '#e3e1e1': '#2a2046', '#d4d2d2': '#2a2046', '#c3c3c3': '#3a2f5c',
    // react-select (the dropdowns)
    'hsl(0, 0%, 100%)': '#120a22', 'hsl(0, 0%, 95%)': '#1d1434', 'hsl(0, 0%, 90%)': '#251b3e', 'hsl(0, 0%, 80%)': '#2a2046',
    '#2684ff': '#7c4dff', '#deebff': '#2c1b52', '#b2d4ff': '#3a2160',
  };
  const FG = { // text and icons
    '#313d3e': '#ece6ff', '#333': '#ece6ff', '#333333': '#ece6ff', '#000': '#ece6ff', '#000000': '#ece6ff', '#222': '#ece6ff',
    '#798291': '#a99fc7', '#7a8291': '#a99fc7', '#7b8290': '#a99fc7', '#8b8b8b': '#a99fc7', '#555': '#c9bfe8', '#666': '#a99fc7',
    '#3a69c7': '#c9b8ff', '#005614': '#7fe0a8', '#70399f': '#d7b8ff', '#752d0f': '#f0b27a',
    '#ff003b': '#ff8a9a', '#17a2b8': '#7fe0d8', '#dfdfe3': '#6f6690', '#eff0f4': '#3a2f5c', '#5d626f': '#a99fc7',
    'hsl(0, 0%, 10%)': '#ece6ff', 'hsl(0, 0%, 20%)': '#ece6ff', 'hsl(0, 0%, 30%)': '#c9bfe8', 'hsl(0, 0%, 40%)': '#a99fc7',
    'hsl(0, 0%, 50%)': '#a99fc7', 'hsl(0, 0%, 60%)': '#8a80ad', 'hsl(0, 0%, 70%)': '#6f6690', 'hsl(0, 0%, 80%)': '#6f6690',
    '#2684ff': '#c9b8ff',
  };
  const BD = { // borders, outlines, shadows
    '#dfdfe3': 'rgba(201, 184, 255, 0.22)', '#eff0f4': 'rgba(201, 184, 255, 0.12)', '#fff': 'rgba(201, 184, 255, 0.16)', '#ffffff': 'rgba(201, 184, 255, 0.16)', 'white': 'rgba(201, 184, 255, 0.16)',
    '#3a69c7': '#9a7cf0', '#e8f5fe': 'rgba(201, 184, 255, 0.3)', '#ff003b': '#ff8a9a', '#798291': 'rgba(201, 184, 255, 0.3)',
    'hsl(0, 0%, 90%)': 'rgba(201, 184, 255, 0.16)', 'hsl(0, 0%, 80%)': 'rgba(201, 184, 255, 0.22)', 'hsl(0, 0%, 70%)': 'rgba(201, 184, 255, 0.32)',
    '#2684ff': '#9a7cf0', '#313d3e': 'rgba(201, 184, 255, 0.3)',
  };
  const pick = (prop) =>
    /^background(-color)?$/.test(prop) ? BG :
    /^(color|fill|stroke|caret-color|-webkit-text-fill-color)$/.test(prop) ? FG :
    /^(border|outline|box-shadow)/.test(prop) ? BD : null;
  const swap = (val, map) => val.replace(/#[0-9a-f]{3,8}\b|\bwhite\b|hsl\(0,\s*0%,\s*\d+%\)/gi, (c) => map[c.toLowerCase().replace(/,\s*/g, ', ')] ?? c);
  const fix = (css) =>
    typeof css !== 'string' ? css : css.replace(/([a-z-]+)\s*:\s*([^;{}]+)/gi, (m, prop, val) => {
      const map = pick(prop.toLowerCase());
      return map ? `${prop}:${swap(val, map)}` : m;
    });
  window.__iaTheme = fix;
  const insert = CSSStyleSheet.prototype.insertRule;
  CSSStyleSheet.prototype.insertRule = function (rule, index) { return insert.call(this, fix(rule), index); };
  const fixNode = (n) => { if (n.nodeName === 'STYLE' && !n.__ia && !n.dataset.iaKeep) { n.__ia = true; n.textContent = fix(n.textContent); } };
  new MutationObserver((ms) => ms.forEach((m) => {
    m.addedNodes.forEach(fixNode);
    if (m.type === 'characterData' || m.type === 'childList') { const t = m.target.nodeName === 'STYLE' ? m.target : m.target.parentNode; if (t && t.nodeName === 'STYLE' && !t.dataset.iaKeep) { const f = fix(t.textContent); if (f !== t.textContent) t.textContent = f; } }
  })).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
