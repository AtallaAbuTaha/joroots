'use client';
import { usePathname, useSearchParams } from 'next/navigation';
const LINKS = [
  ['/', 'Workspace', 'W'], ['/projects', 'Projects', 'P'], ['/team', 'Team', 'T'], ['/knowledge', 'Knowledge', 'K'],
  ['/skills', 'Skills', 'S'], ['/harness', 'Harness', 'H'], ['/settings', 'Settings', '⚙'],
];
export default function Rail({ build }: { build: string }) {
  const path = usePathname(); const q = useSearchParams();
  const active = (href: string) => (href === '/' ? path === '/' && !q.get('keys') && !q.get('debug') : path.startsWith(href));
  return (<nav id="rail">
    <a className="logo disp" href="/">JOROOTS</a>
    <div className="sub">AI workforce</div>
    {LINKS.map(([href, label, k]) => <a key={href} href={href} className={'rl' + (active(href) ? ' on' : '')}><span className="k">{k}</span>{label}</a>)}
    <div className="grow" />
    <a href="/?keys=1" className={'rl' + (q.get('keys') ? ' on' : '')}><span className="k">⚿</span>Keys</a>
    <a href="/?debug=1" className={'rl' + (q.get('debug') ? ' on' : '')}><span className="k">◎</span>Debug</a>
    <div className="build">build {build}</div>
  </nav>);
}
