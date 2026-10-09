import type { DistributionDetails } from './musicDistribution'
export default function ReleaseMetadataFields({ value, onChange }: { value: DistributionDetails; onChange: (value: DistributionDetails) => void }) {
  return <div className="music-v2-step"><h4>Release metadata</h4><p>Add rights and credits for your EBG+ release. You can leave unassigned identifiers blank. Streaming links are managed separately after saving.</p><div className="music-v2-step-grid">
    {([['label','Label'],['copyright','Copyright (©)'],['recordingRights','Recording rights (℗)'],['upc','UPC (if assigned)'],['territories','Territories']] as const).map(([key,label]) => <label key={key}>{label}<input value={value[key]} onChange={e => onChange({...value,[key]:e.target.value})} /></label>)}
    <label>Songwriter / producer credits<textarea value={value.credits} onChange={e => onChange({...value,credits:e.target.value})} /></label>
  </div><label className="music-check"><input type="checkbox" checked={value.rightsConfirmed} onChange={e => onChange({...value,rightsConfirmed:e.target.checked})} /> I have the rights and permissions to publish this release.</label><p>External distribution is coming soon. Saving here publishes only to EBG+ when you choose Live or Scheduled.</p></div>
}
