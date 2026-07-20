import React from 'react';

interface PortfolioBannerProps {
  isVisible: boolean;
  portfolioUrl: string;
}

const PortfolioBanner: React.FC<PortfolioBannerProps> = ({ isVisible, portfolioUrl }) => {
  if (!isVisible) return null;

  return (
    <div className="portfolio-banner" style={{ animation: 'slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
      <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="portfolio-link">
        <span className="banner-text">أكمل رحلتك إلى البورتفوليو</span>
        <span className="banner-text-ona" dir="rtl">𐪁𐪄𐪃𐪑 𐪇𐪄𐪑𐪉𐪄 𐪁𐪑𐪚 𐪁𐪑𐪂𐪇𐪉𐪒𐪇𐪑𐪚</span>
        <span className="banner-text-en">Continue your journey to the portfolio</span>
      </a>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PortfolioBanner;
