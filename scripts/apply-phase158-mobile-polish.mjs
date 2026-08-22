import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')

if (source.includes('// EBG_PHASE158_MOBILE_POLISH')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.58 patch failed: ${label}`)
  source = next
}

if (!source.includes("import './phase158-mobile-polish.css'")) {
  source = source.replace("import './phase157-platform-refresh.css'", "import './phase157-platform-refresh.css'\nimport './phase158-mobile-polish.css'\n\n// EBG_PHASE158_MOBILE_POLISH")
}

const profilePage = `function ProfileSelectPage({
  account,
  activeProfileId,
  onSelect,
  onUpdateAccount,
}: {
  account: Account
  activeProfileId: string | null
  onSelect: (id: string) => void
  onUpdateAccount: (account: Account) => void
}) {
  const nav = useNavigate()
  const [manage, setManage] = useState(false)

  const removeProfile = (profileId: string) => {
    if (account.profiles.length <= 1) return
    onUpdateAccount({ ...account, profiles: account.profiles.filter((entry) => entry.id !== profileId) })
  }

  return (
    <main className="profiles-page profiles-page-v2">
      <div className="profiles-ambient" aria-hidden="true" />
      <header className="profiles-header-v2">
        <Link className="profiles-wordmark" to="/">EBG+</Link>
        <div><p className="eyebrow">YOUR EBG+ EXPERIENCE</p><h1>Who's watching?</h1><p>Choose a profile to continue.</p></div>
      </header>
      <div className="profile-grid profile-grid-v2">
        {account.profiles.map((entry) => (
          <div className="profile-tile-v2" key={entry.id}>
            <button
              type="button"
              className={'profile-card profile-card-v2 ' + (activeProfileId === entry.id ? 'active' : '')}
              onClick={() => {
                if (!manage) {
                  onSelect(entry.id)
                  nav('/app/home')
                }
              }}
            >
              <span className="profile-avatar-shell"><AvatarVisual avatar={entry.avatar} /></span>
              <strong className="profile-name-v2">{entry.name}</strong>
              <small>{manage ? 'Editing profile' : 'Tap to watch'}</small>
            </button>
            {manage && (
              <div className="manage-tools manage-tools-v2">
                <button type="button" onClick={() => {
                  const name = prompt('Rename profile', entry.name)
                  if (!name) return
                  onUpdateAccount({ ...account, profiles: account.profiles.map((profile) => profile.id === entry.id ? { ...profile, name: name.trim() } : profile) })
                }}>Rename</button>
                <button type="button" onClick={() => {
                  const avatar = prompt('Choose an emoji avatar, or update your photo from Settings.', entry.avatar)
                  if (!avatar) return
                  onUpdateAccount({ ...account, profiles: account.profiles.map((profile) => profile.id === entry.id ? { ...profile, avatar } : profile) })
                }}>Avatar</button>
                <button type="button" disabled={account.profiles.length <= 1} onClick={() => removeProfile(entry.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
        <button className="profile-card profile-card-v2 profile-add-v2" type="button" onClick={() => {
          const name = prompt('Profile name')
          if (!name) return
          onUpdateAccount({ ...account, profiles: [...account.profiles, createStarterProfile(name.trim())] })
        }}>
          <span className="profile-add-icon">+</span>
          <strong className="profile-name-v2">Add Profile</strong>
          <small>Create another space</small>
        </button>
      </div>
      <div className="profiles-actions-v2">
        <button className="btn muted" type="button" onClick={() => setManage((value) => !value)}>{manage ? 'Done' : 'Manage Profiles'}</button>
        <span>{account.profiles.length} profile{account.profiles.length === 1 ? '' : 's'} · {account.email}</span>
      </div>
    </main>
  )
}`

must(/function ProfileSelectPage\([\s\S]*?\n}\n\nfunction AppLayout/, `${profilePage}\n\nfunction AppLayout`, 'profile selector')

const mobileNav = `function MobileNav() {
  const [waffleOpen, setWaffleOpen] = useState(false)
  const closeWaffle = () => setWaffleOpen(false)

  return (
    <>
      <div className="mobile-waffle-nav">
        <button className={'mobile-waffle-button ' + (waffleOpen ? 'active' : '')} type="button" aria-label={waffleOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={waffleOpen} onClick={() => setWaffleOpen((open) => !open)}>
          <span className="waffle-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
        </button>
        {waffleOpen && <><button className="mobile-waffle-backdrop" type="button" aria-label="Close navigation" onClick={closeWaffle} /><nav className="mobile-waffle-drawer" aria-label="Mobile menu">
          <div className="mobile-waffle-head"><span>Explore EBG+</span><button type="button" onClick={closeWaffle} aria-label="Close menu">×</button></div>
          <div className="mobile-waffle-section"><span className="mobile-waffle-label">Watch</span><Link to="/app/home" onClick={closeWaffle}>Home</Link><Link to="/app/shows" onClick={closeWaffle}>Shows</Link><Link to="/app/originals" onClick={closeWaffle}>EBG Originals</Link><Link to="/app/movies" onClick={closeWaffle}>Movies & Specials</Link><Link to="/app/music" onClick={closeWaffle}>Music</Link><Link to="/app/universe" onClick={closeWaffle}>EBG Universe</Link><Link to="/app/news" onClick={closeWaffle}>News</Link><Link to="/app/search" onClick={closeWaffle}>Search</Link></div>
          <div className="mobile-waffle-section"><span className="mobile-waffle-label">Library</span><Link to="/app/my-list" onClick={closeWaffle}>My List</Link><Link to="/app/applications" onClick={closeWaffle}>My Applications</Link><Link to="/app/notifications" onClick={closeWaffle}>Notifications</Link><a href="https://forms.ebgplus.app" onClick={closeWaffle}>Casting</a></div>
          <div className="mobile-waffle-section mobile-waffle-section-last"><span className="mobile-waffle-label">Account</span><Link to="/app/settings" onClick={closeWaffle}>Profile & Settings</Link></div>
        </nav></>}
      </div>
      <nav className="mobile-nav mobile-nav-v2" aria-label="Mobile quick navigation"><Link to="/app/home"><span>⌂</span>Home</Link><Link to="/app/originals"><span>✦</span>Originals</Link><Link to="/app/music"><span>♫</span>Music</Link><Link to="/app/search"><span>⌕</span>Search</Link><Link to="/app/settings"><span>◎</span>Profile</Link></nav>
    </>
  )
}`

must(/function MobileNav\(\) \{[\s\S]*?\n}\n\nfunction Footer/, `${mobileNav}\n\nfunction Footer`, 'mobile navigation')

fs.writeFileSync(appPath, source)
console.log('Applied EBG+ Phase 1.58 profile and mobile polish.')
