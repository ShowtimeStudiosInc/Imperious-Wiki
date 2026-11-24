/** The wiki's main menu. Every top bar (site pages, Rules/Lore docs, Diamond and Regent pages) reads this list. */
export const NAV = [
  { href: '/gem-types/', label: 'Gem-Types', key: 'gem-types' },
  { href: '/diamonds/', label: 'Diamonds', key: 'diamonds' },
  { href: '/start-here/welcome/', label: 'Start Here', key: 'start' },
  { href: '/rules/overview/', label: 'Rules', key: 'rules' },
  { href: '/lore/overview/', label: 'Lore', key: 'lore' },
  { href: '/events/', label: 'Events', key: 'events' },
  { href: '/gem-builder/', label: 'Gem Builder', key: 'builder' },
];

/** Which menu item a page belongs to, from its path. */
export function navKey(pathname: string): string | undefined {
  const p = pathname.toLowerCase();
  if (p.includes('/gem-types/') || p.includes('/gem/')) return 'gem-types';
  if (p.includes('/diamonds/') || p.includes('/regents/')) return 'diamonds';
  if (p.includes('/start-here/')) return 'start';
  if (p.includes('/rules/')) return 'rules';
  if (p.includes('/lore/')) return 'lore';
  if (p.includes('/events/')) return 'events';
  if (p.includes('/gem-builder/')) return 'builder';
  return undefined;
}
