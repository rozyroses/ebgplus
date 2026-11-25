export default function VinylTurntable({ artwork, title, playing }: { artwork?: string; title: string; playing: boolean }) {
  return <div className={`vinyl-scene${playing ? ' is-playing' : ''}`} role="img" aria-label={`${title} on the turntable${playing ? ', record spinning' : ', record paused'}`}>
    <div className="vinyl-open-sleeve" aria-hidden="true"><div className="vinyl-sleeve-inside" /><div className="vinyl-sleeve-front">{artwork ? <img src={artwork} alt="" /> : <span>{title}</span>}</div></div>
    <div className="vinyl-deck" aria-hidden="true">
      <span className="vinyl-deck-brand">ebg+ <small>HIGH FIDELITY</small></span>
      <div className="vinyl-platter"><div className="vinyl-record-load"><div className="vinyl-record"><span className="vinyl-record-sheen" /><span className="vinyl-record-label">{artwork ? <img src={artwork} alt="" /> : <span>ebg+</span>}</span><span className="vinyl-spindle" /></div></div></div>
      <div className="vinyl-tonearm"><span className="vinyl-tonearm-pivot" /><span className="vinyl-tonearm-rod" /><span className="vinyl-tonearm-head" /></div>
      <span className="vinyl-deck-light" /><span className="vinyl-speed">33⅓ RPM</span><span className="vinyl-deck-knob" />
    </div>
  </div>
}
