import { useState } from 'react'
import { checkContent, passages } from '../content'
import PassagePanel from './components/PassagePanel'

export const GAME_TITLE = '낱말탑'

const contentErrors = checkContent()

export default function App() {
  const [selected, setSelected] = useState<number[]>([])
  const passage = passages[0]

  if (contentErrors.length > 0 || !passage) {
    return (
      <main style={{ padding: 16 }}>
        <h1>데이터 오류</h1>
        <ul>{contentErrors.map((e) => <li key={e}>{e}</li>)}</ul>
      </main>
    )
  }

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>{GAME_TITLE}</h1>
      <PassagePanel
        title={passage.title}
        sentences={passage.sentences}
        fog={passage.lockedWords}
        selected={selected}
        onToggle={toggle}
      />
    </main>
  )
}
