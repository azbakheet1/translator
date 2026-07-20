import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, ArrowRightLeft, ClipboardPaste } from 'lucide-react';
import { detectLanguage, translate, containsFlagWord, initAksharamukha } from './translationLogic';
import type { Language } from './translationLogic';

import PortfolioBanner from './PortfolioBanner';

interface TranslatorProps {
  onFlagWordDetected?: (detected: boolean) => void;
}

const getLanguageLabel = (lang: 'Arab' | 'English' | 'Narb') => {
  switch (lang) {
    case 'Arab': return 'العربية الحديثة';
    case 'English': return 'الإنجليزية';
    case 'Narb': return 'العربية الشمالية القديمة';
    default: return 'لغة غير معروفة';
  }
};

const Translator: React.FC<TranslatorProps> = ({ onFlagWordDetected }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('Auto');
  const [detectedLang, setDetectedLang] = useState<'Arab' | 'English' | 'Narb'>('Narb');
  const [targetLang, setTargetLang] = useState<Language>('Arab');
  const [userSelectedTarget, setUserSelectedTarget] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initialize Aksharamukha on mount
    initAksharamukha().then(() => {
      setIsInitializing(false);
    }).catch(err => {
      console.error("Failed to initialize Aksharamukha", err);
      setIsInitializing(false);
    });
  }, []);

  const [debouncedInput, setDebouncedInput] = useState('');

  // Debounce input text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(inputText);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [inputText]);

  useEffect(() => {
    let active = true;

    const performTranslation = async () => {
      const lang = detectLanguage(debouncedInput);
      setDetectedLang(lang);
      const isFlagWord = containsFlagWord(debouncedInput);
      setShowBanner(isFlagWord);
      if (onFlagWordDetected) onFlagWordDetected(isFlagWord);
      
      const actualSource = sourceLang === 'Auto' ? lang : sourceLang;
      
      let currentTarget = targetLang;
      if (!userSelectedTarget && currentTarget === ('Auto' as Language)) {
         currentTarget = 'Arab';
         setTargetLang('Arab');
      } else if (!userSelectedTarget) {
        currentTarget = actualSource === 'Narb' ? 'Arab' : 'Narb';
        if (targetLang !== currentTarget && currentTarget !== ('Auto' as Language)) {
          setTargetLang(currentTarget);
        }
      }

      if (!debouncedInput.trim()) {
        setOutputText('');
        return;
      }

      setIsTranslating(true);
      const result = await translate(debouncedInput, sourceLang, currentTarget);
      
      if (active) {
        setOutputText(result);
        setIsTranslating(false);
      }
    };

    if (!isInitializing) {
      performTranslation();
    }

    return () => {
      active = false;
    };
  }, [debouncedInput, onFlagWordDetected, isInitializing, targetLang, userSelectedTarget, sourceLang]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    // When pasting large text, the browser scrolls to the end of the cursor.
    // We force it to reset selection to top and scroll to top smoothly.
    setTimeout(() => {
      target.setSelectionRange(0, 0);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 10);
  };

  const handleSystemPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setTimeout(() => {
        const inputElem = document.getElementById('input-textarea') as HTMLTextAreaElement;
        if (inputElem) {
          inputElem.setSelectionRange(0, 0);
          inputElem.style.height = '250px';
          inputElem.style.height = Math.max(250, inputElem.scrollHeight) + 'px';
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 10);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSwap = () => {
    const tempSource = sourceLang === 'Auto' ? detectedLang : sourceLang;
    const tempTarget = targetLang === 'Auto' ? 'Arab' : targetLang;
    
    setSourceLang(tempTarget);
    setTargetLang(tempSource);
    setUserSelectedTarget(true);
    setInputText(outputText);
    setOutputText('');
    
    // Resize input text area after swap
    setTimeout(() => {
      const inputElem = document.getElementById('input-textarea') as HTMLTextAreaElement;
      if (inputElem) {
        inputElem.style.height = '250px';
        inputElem.style.height = Math.max(250, inputElem.scrollHeight) + 'px';
      }
    }, 10);
  };

  const actualSource = sourceLang === 'Auto' ? detectedLang : sourceLang;
  const isInputRtl = actualSource !== 'English';
  const isOutputRtl = targetLang !== 'English';

  const handleResize = (target: HTMLTextAreaElement | null) => {
    if (target) {
      target.style.height = '250px'; // Reset briefly to get actual scroll height
      target.style.height = Math.max(250, target.scrollHeight) + 'px';
    }
  };

  useEffect(() => {
    const outputElem = document.getElementById('output-textarea') as HTMLTextAreaElement;
    handleResize(outputElem);
  }, [outputText]);

  return (
    <div className="translator-layout">
      <div className="panel glass-panel">
        <div className="panel-header">
          <span className="language-label">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as Language)}
              style={{ background: 'transparent', color: 'var(--color-gold)', border: 'none', fontSize: '1.1rem', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="Auto" style={{ color: 'black' }}>التعرف التلقائي {sourceLang === 'Auto' && inputText.trim() ? `(${getLanguageLabel(detectedLang)})` : ''}</option>
              <option value="Arab" style={{ color: 'black' }}>العربية الحديثة</option>
              <option value="English" style={{ color: 'black' }}>الإنجليزية</option>
              <option value="Narb" style={{ color: 'black' }}>العربية الشمالية القديمة</option>
            </select>
          </span>
          <div className="action-buttons">
            <button className="icon-btn" onClick={handleSystemPaste} title="لصق النص">
              <ClipboardPaste size={18} />
            </button>
            <button className="icon-btn" onClick={() => handleCopy(inputText, 1)} title="نسخ النص">
              {copiedIndex === 1 ? <Check size={18} color="var(--color-gold)" /> : <Copy size={18} />}
            </button>
          </div>
        </div>
        <textarea 
          id="input-textarea"
          className={`text-area ${isInputRtl ? 'dir-rtl' : 'dir-ltr'}`}
          placeholder={isInitializing ? "جاري تحميل محرك الترجمة..." : "ابدأ الكتابة..."}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            handleResize(e.target);
          }}
          onPaste={handlePaste}
          disabled={isInitializing}
          style={{ fontFamily: actualSource === 'Narb' ? 'var(--font-ona)' : (actualSource === 'English' ? 'var(--font-english)' : 'var(--font-arabic)') }}
        />
      </div>

      <div className="swap-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button 
          className="icon-btn swap-btn" 
          onClick={handleSwap} 
          title="تبديل اللغات"
          style={{ background: 'var(--color-dark-surface)', border: '1px solid var(--color-gold)', padding: '0.8rem', borderRadius: '50%' }}
        >
          <ArrowRightLeft size={24} color="var(--color-gold)" />
        </button>
      </div>

      {/* Output Panel Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <div className="panel glass-panel">
          <div className="panel-header">
            <span className="language-label">
              <select
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value as Language);
                  setUserSelectedTarget(true);
                }}
                style={{ background: 'transparent', color: 'var(--color-gold)', border: 'none', fontSize: '1.1rem', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="Arab" style={{ color: 'black' }}>العربية الحديثة</option>
                <option value="English" style={{ color: 'black' }}>الإنجليزية</option>
                <option value="Narb" style={{ color: 'black' }}>العربية الشمالية القديمة</option>
              </select>
              {isTranslating && <Loader2 size={16} className="spinner" style={{ display: 'inline-block', marginRight: '8px', animation: 'spin 2s linear infinite' }} />}
            </span>
            <div className="action-buttons">
              <button className="icon-btn" onClick={() => handleCopy(outputText, 2)} title="نسخ الترجمة">
                {copiedIndex === 2 ? <Check size={18} color="var(--color-gold)" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <textarea 
            id="output-textarea"
            className={`text-area ${isOutputRtl ? 'dir-rtl' : 'dir-ltr'}`}
            value={outputText}
            readOnly
            placeholder="الترجمة ستظهر هنا..."
            style={{ fontFamily: targetLang === 'Narb' ? 'var(--font-ona)' : (targetLang === 'English' ? 'var(--font-english)' : 'var(--font-arabic)') }}
          />
        </div>
        
        <PortfolioBanner isVisible={showBanner} portfolioUrl="https://azbakheet1.github.io/portfolio/" />
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .swap-container { transform: rotate(90deg); margin: -1rem 0; z-index: 10; }
        }
      `}</style>
    </div>
  );
};

export default Translator;
