import { HashRouter, Link, Route, Routes } from "react-router-dom"
import { GridSearchPage } from "./pages/GridSearchPage.js"
import { Home } from "./pages/Home.js"

// GitHub Pages ではサーバ側ルーティングが無いため HashRouter を使う。
export function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link to="/" className="font-bold text-slate-800">
              探索アルゴリズデモ
            </Link>
            <Link to="/grid" className="text-sm text-slate-600 hover:text-amber-700">
              グリッド探索
            </Link>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grid" element={<GridSearchPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
