import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let status: string

  if (!url || !key) {
    status = '❌ ENV-Variablen fehlen — .env.local prüfen.'
  } else {
    try {
      const supabase = createClient(url, key)
      const { error } = await supabase.from('_verbindungstest').select('*').limit(1)
      if (!error) {
        status = '✅ Supabase-Verbindung steht.'
      } else if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        status = '❌ Falscher Schlüssel — anon key in .env.local prüfen.'
      } else {
        status = '✅ Supabase erreichbar — Verbindung steht! (Noch keine Tabellen — normal für Tag 17.)'
      }
    } catch {
      status = '❌ Keine Verbindung — URL in .env.local prüfen.'
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Lotsora</h1>
      <p style={{ fontSize: 18 }}>{status}</p>
      <p style={{ color: '#888', marginTop: 24 }}>Walking-Skeleton-Test · Tag 17</p>
    </main>
  )
}