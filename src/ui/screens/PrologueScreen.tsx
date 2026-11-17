import { useState } from 'react'
import { STORY, type StoryScene } from '../../content/story'
import Actor from '../components/Actor'
import Sprite, { Icon } from '../components/Sprite'
import './prologue.css'

function Art({ art }: { art: StoryScene['art'] }) {
  if (art === 'trio') {
    return <><Actor name="dokkaebi" pose="idle" /><Actor name="tiger" pose="idle" /><Actor name="fox" pose="idle" /></>
  }
  if (art === 'hero') {
    return <><Actor name="reader" pose="idle" /><span className="prologue-token"><Icon name="think" scale={4} /></span></>
  }
  return <><Actor name="reader" pose="stamp" /><Sprite name="seal" frame="closed" /></>
}

/** 처음 한 번 보는 이야기. 세 장면, 언제든 건너뛸 수 있다 */
export default function PrologueScreen({ onDone }: { onDone: () => void }) {
  const [at, setAt] = useState(0)
  const scene = STORY.prologue[at]
  const last = at >= STORY.prologue.length - 1
  if (!scene) return null
  return (
    <div className="prologue">
      <div className="prologue-frame">
        <div className={`prologue-art prologue-${scene.art}`} aria-hidden="true" key={at}><Art art={scene.art} /></div>
        <div className="prologue-text" role="status">
          <span className="prologue-world">{STORY.world} · {at + 1} / {STORY.prologue.length}</span>
          {scene.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
        <div className="prologue-actions">
          {!last && <button type="button" className="btn btn-quiet" onClick={onDone}>건너뛰기</button>}
          <button type="button" className="btn btn-gold" autoFocus onClick={() => (last ? onDone() : setAt(at + 1))}>
            {last ? '닫힌궁으로!' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
