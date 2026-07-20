import './App.css';
import Translator from './Translator';

function App() {
  return (
    <div className="app-container" dir="rtl">
        <header className="header title-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
          <h1 className="title gradient-title" style={{ margin: 0, fontSize: '3.5rem' }}>مترجم</h1>
          <h1 className="title gradient-title" style={{ margin: 0, fontFamily: 'var(--font-ona)', fontSize: '4rem', lineHeight: '1.2' }}>𐪃𐪉𐪇𐪔𐪃</h1>
          <h1 className="title gradient-title" style={{ margin: 0, fontFamily: 'var(--font-english)', fontSize: '3rem', letterSpacing: '4px' }}>TRANSLATOR</h1>
        </header>

        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Translator />
        </main>

        <footer className="footer" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <p>بُني بشغف للربط بين الماضي والحاضر</p>
          <a href="https://azbakheet1.github.io/portfolio/" target="_blank" rel="noopener noreferrer" style={{ color: '#8D6E63', textDecoration: 'none', fontSize: '0.8rem', marginTop: '0.5rem', display: 'inline-block' }}>زيارة موقع المطور</a>
        </footer>
      </div>
  );
}

export default App;
