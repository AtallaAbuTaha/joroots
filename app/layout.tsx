import '@fontsource/anton/400.css';
import '@fontsource/inter/400.css'; import '@fontsource/inter/500.css'; import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css'; import '@fontsource/jetbrains-mono/500.css';
import './globals.css';
import { Suspense } from 'react';
import Rail from '../components/rail';
export const metadata = { title: 'Joroots Workforce', description: 'Joroots AI workforce — orchestrator, research, marketing, creative' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const build = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
  return (<html lang="en"><body><div id="shell"><Suspense><Rail build={build} /></Suspense><main id="main">{children}</main></div></body></html>);
}
