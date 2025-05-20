// components/CategoryNav.tsx
import React, { useState } from 'react';
import { IconType } from 'react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaCode,
  FaChartBar,
  FaDollarSign,
  FaBoxes,
  FaBriefcase,
  FaUserTie,
  FaPen,
  FaPencilRuler,
  FaGraduationCap,
  FaVideo,
  FaWrench,
  FaCalculator,
  FaBullhorn,
  FaLock,
} from 'react-icons/fa';
import { FcBiotech } from 'react-icons/fc';

interface Category {
  id: string;
  name: string;
  Icon: IconType;
}

const categories: Category[] = [
  { id: 'software',     name: 'Software',     Icon: FaCode },
  { id: 'data-science', name: 'Data Science', Icon: FaChartBar },
  { id: 'finance',      name: 'Finance',      Icon: FaDollarSign },
  { id: 'product',      name: 'Product',      Icon: FaBoxes },
  { id: 'business',     name: 'Business',     Icon: FaBriefcase },
  { id: 'consulting',   name: 'Consulting',   Icon: FaUserTie },
  { id: 'writing',      name: 'Writing',      Icon: FaPen },
  { id: 'design',       name: 'Design',       Icon: FaPencilRuler },
  { id: 'legal',        name: 'Legal',        Icon: FaGraduationCap },
  { id: 'media',        name: 'Media',        Icon: FaVideo },
  { id: 'engineering',  name: 'Engineering',  Icon: FaWrench },
  { id: 'statistics',   name: 'Statistics',   Icon: FaCalculator },
  { id: 'marketing',    name: 'Marketing',    Icon: FaBullhorn },
  { id: 'biology',      name: 'Biology',      Icon: FcBiotech },
  { id: 'security',     name: 'Security',     Icon: FaLock },
];

export const CategoryNav: React.FC<{
  selected: string;
  onSelect: (id: string) => void;
  roles?: { id: string; name: string }[];
  selectedRole?: string;
  onRoleSelect?: (id: string) => void;
}> = ({
  selected,
  onSelect,
  roles = [],
  selectedRole = '',
  onRoleSelect,
}) => {
  const [rolesVisible, setRolesVisible] = useState(false);

  const handleCategory = (id: string) => {
    // always clear role and reload that category
    onSelect(id);
    onRoleSelect?.('');
    // show roles only if it's a new category with roles
    setRolesVisible(id !== selected && roles.length > 0);
  };

  const showRoles = rolesVisible && roles.length > 0;

  return (
    <div className="relative mx-4 py-4">
      {/* Category pills */}
      <ul
        className={`flex items-center justify-center space-x-6 bg-white
                    border-2 border-[#87B2FF] rounded-full px-6 py-2 shadow-lg
                    transition-all duration-300 ${showRoles ? 'w-auto' : 'w-full'}`}
      >
        {categories.map(cat => {
          const isActive = cat.id === selected;
          return (
            <li
              key={cat.id}
              onClick={() => handleCategory(cat.id)}
              className="flex flex-col items-center cursor-pointer select-none"
            >
              <div
                className={`p-3 rounded-full transition-colors duration-200
                             ${isActive ? 'bg-[#87B2FF]' : 'hover:bg-[#87B2FF]/20'}`}
              >
                <cat.Icon
                  size={20}
                  className={isActive ? 'text-white' : 'text-[#18326F]'}
                />
              </div>
              <span className="mt-1 text-xs font-medium text-[#18326F]">
                {cat.name}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Role pills (animated) */}
      <AnimatePresence>
        {showRoles && (
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1,   y: -10, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-0 top-full flex justify-center z-0"
            style={{ pointerEvents: 'auto' }}
          >
            <ul
              className="flex items-center space-x-6 bg-white
                         border-2 border-[#87B2FF] rounded-full px-6 py-2 shadow-lg"
            >
              {roles.map((role, i) => {
                const isActive = role.id === selectedRole;
                return (
                  <motion.li
                    key={role.id}
                    onClick={() => onRoleSelect?.(role.id)}
                    className="cursor-pointer select-none"
                    initial={{ scale: 0.7, y: 10, opacity: 0 }}
                    animate={{ scale: 1,   y: 0,  opacity: 1 }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.25 }}
                  >
                    <span
                      className={`px-3 py-2 rounded-full transition-colors duration-200
                                  ${isActive
                                    ? 'bg-[#87B2FF] text-white'
                                    : 'hover:bg-[#87B2FF]/20 text-[#18326F]'}`}
                    >
                      {role.name}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
