export default function BrandLogo({ className = '' }: { className?: string }) {
  return <img className={`brand-mark ${className}`} src={`${import.meta.env.BASE_URL}branding/playful-ebgplus.png`} alt="EBG+" width={160} height={64} />
}
