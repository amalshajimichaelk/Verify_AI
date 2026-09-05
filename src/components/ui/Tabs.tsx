import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badge?: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  id?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  id = 'tabs-group',
}) => {
  return (
    <div
      role="tablist"
      id={id}
      className={`flex items-center gap-1.5 p-1 rounded-lg bg-[#0a0a0a]/90 border border-white/8 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-150 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-orange-400 ${
              isActive
                ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-semibold shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                : 'text-[#a3a3a3] hover:text-[#e0e0e0] hover:bg-white/5'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-[#737373]'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-orange-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
