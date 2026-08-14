import './SplashScreen.css'

export default function SplashScreen() {
  const logoUrl = `${import.meta.env.BASE_URL}ebgplus-logo.svg`

  return (
    <div className="ebg-splash" role="status" aria-label="Loading EBG+">
      <div className="ebg-splash__brand">
        <img className="ebg-splash__logo" src={logoUrl} alt="EBG+" />
        <div className="ebg-splash__line" aria-hidden="true" />
      </div>
    </div>
  )
}
