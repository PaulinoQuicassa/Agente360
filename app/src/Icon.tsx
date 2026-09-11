export type IconName =
  | "home" | "people" | "user-check" | "user-plus" | "search" | "file"
  | "pin" | "plus" | "menu" | "upload" | "check" | "alert" | "chevron"
  | "megaphone" | "book" | "wallet" | "clipboard";

export function Icon({ name, className = "ico" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}

export function IconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
      <symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.2 12 3.5l8 6.7V20a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H5a1 1 0 0 1-1-1V10.2z"/></symbol>
      <symbol id="i-people" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.6 19.2c.5-3.1 2.8-4.8 5.4-4.8s4.9 1.7 5.4 4.8"/><circle cx="16.6" cy="8.6" r="2.5"/><path d="M15.2 14.4c2.2.4 3.9 1.8 4.4 4.8"/></symbol>
      <symbol id="i-user-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.6 19.2c.5-3.1 2.8-4.8 5.4-4.8 1.6 0 3 .6 4.1 1.7"/><path d="m14.5 16.5 2.2 2.2 4.3-4.4"/></symbol>
      <symbol id="i-user-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.6 19.2c.5-3.1 2.8-4.8 5.4-4.8 1.4 0 2.7.5 3.7 1.4"/><path d="M17 11v6M14 14h6"/></symbol>
      <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></symbol>
      <symbol id="i-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></symbol>
      <symbol id="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
      <symbol id="i-upload" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5M8 9l4-4 4 4"/><path d="M5 19h14"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10"/></symbol>
      <symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5 2.8 19.5h18.4L12 3.5z"/><path d="M12 10v4.5M12 17.5h.01"/></symbol>
      <symbol id="i-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></symbol>
      <symbol id="i-megaphone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 12-6v14L3 13v-2z"/><path d="M15 8.5c1.8.6 3 2.1 3 3.5s-1.2 2.9-3 3.5"/><path d="m6.5 13.2.8 5.3c.1.8.8 1.5 1.5 1.5h1.2"/></symbol>
      <symbol id="i-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16.5H6.5A2.5 2.5 0 0 0 4 22V5.5z"/><path d="M4 19h12"/></symbol>
      <symbol id="i-wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1"/></symbol>
      <symbol id="i-clipboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5V4a3 3 0 0 1 6 0v.5"/><circle cx="14.5" cy="13.5" r="3"/><path d="m16.6 15.6 1.7 1.7"/></symbol>
    </svg>
  );
}
