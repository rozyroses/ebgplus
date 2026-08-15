import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

const menuMatch = source.match(/<details className="nav-menu library-menu">[\s\S]*?<\/details>/)
if (!menuMatch) throw new Error('Library safeguard failed: Library dropdown not found')

let menu = menuMatch[0]

// Normalize Library destinations so later phases cannot remove or duplicate them.
menu = menu.replace(/\s*<Link to="\/app\/(?:my-applications|applications)">My Applications<\/Link>/g, '')
menu = menu.replace(/\s*<Link to="\/app\/casting">Casting<\/Link>/g, '')
menu = menu.replace(/\s*<a href="https:\/\/forms\.ebgplus\.app">Casting<\/a>/g, '')

const myListNeedle = '<Link to="/app/my-list">My List</Link>'
if (!menu.includes(myListNeedle)) throw new Error('Library safeguard failed: My List anchor not found')

menu = menu.replace(
  myListNeedle,
  `${myListNeedle}\n              <Link to="/app/applications">My Applications</Link>`,
)

const notificationsNeedle = '<Link to="/app/notifications">Notifications</Link>'
if (menu.includes(notificationsNeedle)) {
  menu = menu.replace(
    notificationsNeedle,
    `${notificationsNeedle}\n              <a href="https://forms.ebgplus.app">Casting</a>`,
  )
} else {
  menu = menu.replace(
    '<Link to="/app/applications">My Applications</Link>',
    '<Link to="/app/applications">My Applications</Link>\n              <a href="https://forms.ebgplus.app">Casting</a>',
  )
}

source = source.replace(menuMatch[0], menu)
fs.writeFileSync(path, source)
console.log('Library menu safeguarded: My List, My Applications, Notifications, Casting.')
