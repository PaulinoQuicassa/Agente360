import { LOGO_ZAP_DATA_URL } from "./brand/logoZap";

/** Logo ZAP em data URL — fiável no iframe do Power Apps (URLs de asset partem). */
export function LogoZap({ className = "app-header__logo" }: { className?: string }) {
  return <img src={LOGO_ZAP_DATA_URL} alt="ZAP" className={className} decoding="async" width={88} height={28} />;
}
