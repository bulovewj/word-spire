import { useState } from 'react'
import { allWordEntries } from '../../content'
import type { WordKind } from '../../content/types'
import { yokai } from '../../content/yokai'
import type { Profile } from '../../engine/profile'
import Page from '../components/Page'
import Sprite from '../components/Sprite'
import { isSheetName } from '../sprites/sprites'
import './book.css'

const KINDS: WordKind[] = ['한자어', '교과어', '관용구', '속담', '기타']

/** 부적첩: 모은 낱말과 봉인한 요괴. 아직 못 모은 것은 빈칸으로 남아 모으고 싶게 한다 */
export default function BookScreen({ profile, onBack }: { profile: Profile; onBack: () => void }) {
  const [tab, setTab] = useState<'words' | 'yokai'>('words')
  const words = allWordEntries()
  const got = words.filter((w) => profile.words[w.id]).length
  const wrote = words.filter((w) => profile.words[w.id]?.wrote).length

  return (
    <Page title="부적첩" kicker="내가 되찾은 것들" onBack={onBack} wide
      aside={<strong className="book-count">낱말 {got} / {words.length}</strong>}>
      <div className="book-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'words'} className="btn" onClick={() => setTab('words')}>낱말 {got}</button>
        <button type="button" role="tab" aria-selected={tab === 'yokai'} className="btn" onClick={() => setTab('yokai')}>요괴 도감</button>
      </div>

      {tab === 'words' ? (
        <>
          <p className="muted">탑에서 안개를 걷거나 보물로 고르면 낱말이 모여. 뜻 쓰기에 성공한 낱말에는 도장이 찍혀 (도장 {wrote}개).</p>
          {KINDS.map((kind) => {
            const list = words.filter((w) => w.kind === kind)
            if (list.length === 0) return null
            return (
              <section key={kind} className="sheet">
                <h2>{kind} <span className="muted">{list.filter((w) => profile.words[w.id]).length} / {list.length}</span></h2>
                <ul className="book-words">
                  {list.map((w) => {
                    const mark = profile.words[w.id]
                    return mark ? (
                      <li key={w.id} className="book-word">
                        <strong>{w.word}</strong>
                        <span>{w.meaning}</span>
                        {mark.wrote && <em className="book-wrote">뜻 쓰기 성공</em>}
                      </li>
                    ) : (
                      <li key={w.id} className="book-word is-empty" aria-label="아직 모으지 못한 낱말">?</li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </>
      ) : (
        <ul className="book-yokai">
          {yokai.map((y) => {
            const n = profile.sealed[y.id] ?? 0
            return (
              <li key={y.id} className={`sheet book-yokai-row${n === 0 ? ' is-unknown' : ''}`}>
                <span className="book-yokai-art">{isSheetName(y.id) && <Sprite name={y.id} />}</span>
                <div>
                  <h2>{n > 0 ? y.name : '???'}</h2>
                  <p className="book-nick">{n > 0 ? y.nick : '아직 봉인해 보지 못한 요괴'}</p>
                  {n > 0 && <p>{y.profile}</p>}
                  <p className="muted">봉인한 횟수 {n}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
