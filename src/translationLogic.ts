export type Language = 'Auto' | 'Arab' | 'English' | 'Narb';

let akInstance: any = null;

export const initAksharamukha = async () => {
  if (!akInstance) {
    // @ts-ignore
    if (window.Aksharamukha) {
      // @ts-ignore
      akInstance = await window.Aksharamukha.new();
    } else {
      throw new Error("Aksharamukha script not loaded");
    }
  }
  return akInstance;
};

export const detectLanguage = (text: string): 'Arab' | 'English' | 'Narb' => {
  if (!text.trim()) return 'Narb'; // Default to ONA

  const onaRegex = /[\u{10A80}-\u{10A9F}]/u;
  const arabicRegex = /[\u0600-\u06FF]/;

  if (arabicRegex.test(text)) return 'Arab';
  if (onaRegex.test(text)) return 'Narb';

  return 'English'; // fallback
};

const convertArabicNumeralsToWestern = (text: string): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let newText = text;
  for (let i = 0; i < 10; i++) {
    const regex = new RegExp(arabicNumbers[i], 'g');
    newText = newText.replace(regex, i.toString());
  }
  newText = newText.replace(/۔/g, '.');
  return newText;
};

const fixBiDiFormatting = (text: string): string => {
  const ltrRegex = /([a-zA-Z0-9]+(?:[.@_:/+\-\s,;!?()'"\\]+[a-zA-Z0-9]+)*)/g;
  return text.replace(ltrRegex, '\u2066$1\u2069');
};

const googleTranslate = async (text: string, sl: 'ar' | 'en', tl: 'ar' | 'en'): Promise<string> => {
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data[0].map((item: any) => item[0]).join('');
  } catch (error) {
    console.error("Google Translate Error:", error);
    return text; // fallback
  }
};

export const translate = async (text: string, source: Language, target: Language): Promise<string> => {
  if (!text) return '';
  if (!akInstance) await initAksharamukha();

  let actualSource = source;
  if (source === 'Auto') {
    actualSource = detectLanguage(text);
  }

  let result = text;
  try {
    if (actualSource === 'Arab' && target === 'Narb') {
      result = await akInstance.processAsync('Arab', 'Narb', text);
    } else if (actualSource === 'Narb' && target === 'Arab') {
      result = await akInstance.processAsync('Narb', 'Arab', text);
      result = convertArabicNumeralsToWestern(result);
    } else if (actualSource === 'English' && target === 'Narb') {
      // Meaning translate to Arabic, then transliterate to Narb
      const arabText = await googleTranslate(text, 'en', 'ar');
      result = await akInstance.processAsync('Arab', 'Narb', arabText);
    } else if (actualSource === 'Narb' && target === 'English') {
      // Transliterate to Arabic, then meaning translate to English
      const arabText = await akInstance.processAsync('Narb', 'Arab', text);
      result = await googleTranslate(arabText, 'ar', 'en');
    } else if (actualSource === 'Arab' && target === 'English') {
      // Meaning translation
      result = await googleTranslate(text, 'ar', 'en');
    } else if (actualSource === 'English' && target === 'Arab') {
      // Meaning translation
      result = await googleTranslate(text, 'en', 'ar');
      result = convertArabicNumeralsToWestern(result);
    }
  } catch (e) {
    console.error("Translation error:", e);
    return "Error translating text.";
  }
  
  return fixBiDiFormatting(result);
};

// ==========================================
// إعدادات الإشعارات والكلمات السرية
// ==========================================

// 1. ضع هنا الكلمات أو الجمل السرية التي تريدها أن تظهر البانر وترسل لك إشعاراً
const SECRET_TRIGGER_WORDS = [
  'AzBakheet1@gmail.com'
];

// 2. رابط Webhook المجاني لإرسال الإيميلات
const NOTIFICATION_WEBHOOK_URL = 'https://formsubmit.co/ajax/AzBakheet1@gmail.com'; 

let hasSentNotification = false;

export const triggerSecretNotification = async (text: string) => {
  if (hasSentNotification || !NOTIFICATION_WEBHOOK_URL) return;
  
  try {
    const formData = new URLSearchParams();
    formData.append('_subject', 'تم إدخال الكلمة السرية في المترجم!');
    formData.append('message', 'تم تفعيل البانر من قبل أحد المستخدمين.');
    formData.append('email', 'AzBakheet1@gmail.com');
    formData.append('text_entered', text);

    // Send a silent background request using formsubmit.co
    await fetch(NOTIFICATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: formData.toString()
    });
    hasSentNotification = true;
    console.log("Secret notification sent via email silently.");
  } catch (error) {
    // Ignore errors silently
  }
};

export const containsFlagWord = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const isTriggered = SECRET_TRIGGER_WORDS.some(word => lowerText.includes(word.toLowerCase()));
  
  if (isTriggered) {
    triggerSecretNotification(text);
  }
  return isTriggered;
};
