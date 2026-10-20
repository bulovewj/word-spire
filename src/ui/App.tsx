export const GAME_TITLE = '낱말탑'

export default function App() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 700, margin: 0 }}>{GAME_TITLE}</h1>
    </main>
  )
}
