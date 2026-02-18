export interface VentureCard {
  slug: string
  name: string
  stage: 'beta' | 'market-test' | 'design'
  tier: 1 | 2
  url: string | null
  summary: string
  metric?: string
}

// Add ventures here once they have a live product site.
// The homepage only renders tier-1 ventures that have a URL.
export const ventures: VentureCard[] = []
