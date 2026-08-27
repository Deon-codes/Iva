import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export const SlideTabs = ({ tabs = [], onTabSelect }) => {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef([]);

  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (selectedTab) {
      const { width } = selectedTab.getBoundingClientRect();
      setPosition({
        left: selectedTab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  }, [selected, tabs]);

  return (
    <ul
      onMouseLeave={() => {
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
          const { width } = selectedTab.getBoundingClientRect();
          setPosition({
            left: selectedTab.offsetLeft,
            width,
            opacity: 1,
          });
        }
      }}
      className="relative mx-auto flex w-fit rounded-full border border-green-800/40 bg-[#051006]/60 p-1"
    >
      {tabs.map((tab, i) => (
        <Tab
          key={tab.label}
          ref={(el) => (tabsRef.current[i] = el)}
          setPosition={setPosition}
          isActive={selected === i}
          onClick={() => {
            setSelected(i);
            if (onTabSelect) onTabSelect(tab);
          }}
        >
          {tab.label}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
};

const Tab = React.forwardRef(({ children, setPosition, isActive, onClick }, ref) => {
  return (
    <li
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => {
        if (!ref?.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          left: ref.current.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-xs font-semibold uppercase transition-colors duration-200 md:px-5 md:py-2 md:text-sm ${
        isActive ? "text-white" : "text-[#A5D6A7]"
      }`}
      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      {children}
    </li>
  );
});

Tab.displayName = "Tab";

const Cursor = ({ position }) => {
  return (
    <motion.li
      animate={position}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="absolute z-0 h-7 rounded-full bg-[#2E7D32] md:h-9"
    />
  );
};
