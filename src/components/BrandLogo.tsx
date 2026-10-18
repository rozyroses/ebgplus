export default function BrandLogo({ className = '' }: { className?: string }) {
  return <img className={`brand-mark ${className}`} src={`${import.meta.env.BASE_URL}branding/ebgplus.svg`} alt="EBG+" width={139} height={38} />
}
