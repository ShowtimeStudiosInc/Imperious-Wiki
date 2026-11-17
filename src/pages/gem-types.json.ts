// The Gem Builder loads this file, so its Gem-Type list always matches the wiki.
import { getGems, fullName } from '../lib/gems';
export async function GET() {
  const gems = await getGems();
  const body = {
    generated: new Date().toISOString(),
    count: gems.length,
    gemTypes: gems.map((g) => ({ ...g, displayName: fullName(g) })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
