import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_NAV_CLEANUP_INTEGRATED')) process.exit(0)

source = source.replace("import './phase17.css'", "import './phase17.css'\nimport './nav17.css'\n\n// EBG_NAV_CLEANUP_INTEGRATED")

const header = `<header className="topbar app">
        <Link className="wordmark" to="/app/home" aria-label="EBG+ Home">EBG+</Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          {[
            ['Home', '/app/home'],
            ['Shows', '/app/shows'],
            ['Movies', '/app/movies'],
            ['Music', '/app/music'],
          ].map(([label, path]) => (
            <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>{label}</Link>
          ))}
          <details className="nav-menu">
            <summary>Explore <span aria-hidden="true">⌄</span></summary>
            <div className="nav-dropdown">
              <Link to="/app/originals">EBG Originals</Link>
              <Link to="/app/universe">EBG Universe</Link>
              <Link to="/app/news">News</Link>
            </div>
          </details>
        </nav>
        <div className="right-nav">
          <Link className="nav-icon-link" to="/app/search">Search</Link>
          <details className="nav-menu library-menu">
            <summary>Library <span aria-hidden="true">⌄</span></summary>
            <div className="nav-dropdown nav-dropdown-right">
              <Link to="/app/my-list">My List</Link>
              <Link to="/app/notifications">Notifications</Link>
              <Link to="/app/casting">Casting</Link>
            </div>
          </details>
          <details className="nav-menu profile-menu">
            <summary className="profile-menu-trigger" aria-label="Profile menu"><AvatarVisual avatar={profile.avatar} nav /><span aria-hidden="true">⌄</span></summary>
            <div className="nav-dropdown nav-dropdown-right profile-dropdown">
              <div className="profile-dropdown-heading"><AvatarVisual avatar={profile.avatar} /><div><strong>{profile.name}</strong><small>{account.email}</small></div></div>
              <Link to="/app/settings">Settings</Link>
              <Link to="/profiles">Switch Profile</Link>
              {['founder', 'administrator', 'producer', 'editor'].includes(account.role) && <Link to="/app/studio">EBG Studio</Link>}
              <button type="button" onClick={onSignOut}>Sign Out</button>
            </div>
          </details>
        </div>
      </header>`

const next = source.replace(/<header className="topbar app">[\s\S]*?<\/header>/, header)
if (next === source) throw new Error('Navigation cleanup patch could not find the app header.')
fs.writeFileSync(path, next)
console.log('Applied organized EBG+ navigation.')
