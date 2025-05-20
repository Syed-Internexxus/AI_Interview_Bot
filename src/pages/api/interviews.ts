// src/pages/api/interviews.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { Interview } from '@/components/InterviewCard'

// Nested record: category → role → interviews[]
const interviewsByCategoryAndRole: Record<string, Record<string, Interview[]>> = {
  software: {
    frontend: [
      { id: '1',  title: 'Software Engineering', subtitle: 'New Grad E3: Technical interview #1', duration: '20m', level: 'Medium' },
      { id: '9',  title: 'Front-end 101',         subtitle: 'Review UI optimization and JS techniques',    duration: '30m', level: 'Medium' },
    ],
    backend: [
      { id: '2', title: 'Stacks vs Queues',       subtitle: 'Learn the FIFO and LIFO flows',               duration: '5m',  level: 'Medium' },
      { id: '6', title: 'Processes vs Threads',   subtitle: 'Discuss these core OS concepts',              duration: '5m',  level: 'Easy'   },
      // ↕️ overlapping from Finance:
      { id: 'f3', title: 'LIFO & FIFO',           subtitle: 'Inventory accounting flows',                 duration: '5m',  level: 'Medium' },
    ],
    fullstack: [
      { id: '12', title: 'JavaScript Mastery',     subtitle: 'Review JS concepts and front-end skills',     duration: '30m', level: 'Medium' },
      { id: '15', title: 'Coding Concepts Basics', subtitle: 'Explore arrays, trees, graphs, algorithms',   duration: '30m', level: 'Medium' },
    ],
  },

  'data-science': {
    analyst: [
      { id: 'ds1', title: 'Data Science Fundamentals', subtitle: 'Statistics, ML pipelines, and tools',      duration: '20m', level: 'Medium' },
      { id: 'ds7', title: 'Model Validation',           subtitle: 'Cross-validation & metrics',               duration: '10m', level: 'Easy'   },
    ],
    ml: [
      { id: 'ds2', title: 'Regression Analysis',        subtitle: 'Linear & Logistic regression deep dive',  duration: '10m', level: 'Medium' },
      { id: 'ds6', title: 'Deep Learning Intro',        subtitle: 'Neural network architectures overview',    duration: '20m', level: 'Difficult' },
      // ↕️ overlapping from Statistics:
      { id: 's1', title: 'Probability Theory',         subtitle: 'Random variables and distributions',      duration: '15m', level: 'Medium' },
    ],
    de: [
      { id: 'ds8', title: 'Feature Engineering',        subtitle: 'Creating and selecting features',         duration: '15m', level: 'Medium' },
    ],
    bi: [
      { id: 'ds3', title: 'Classification Models',      subtitle: 'Decision trees, SVMs, and ensembles',     duration: '10m', level: 'Medium' },
      { id: 'ds4', title: 'Clustering Techniques',      subtitle: 'K-Means, hierarchical clustering',         duration: '10m', level: 'Easy'   },
      { id: 'ds5', title: 'Time Series Basics',         subtitle: 'ARIMA, forecasting concepts',              duration: '15m', level: 'Medium' },
    ],
  },

  finance: {
    investment: [
      { id: 'f1', title: 'Working Capital Case',     subtitle: 'Explain the dynamics of working capital', duration: '5m',  level: 'Medium'    },
      { id: 'f4', title: 'Budget Forecasting',       subtitle: 'Building financial models',              duration: '15m', level: 'Difficult' },
    ],
    corporate: [
      { id: 'f2', title: 'Valuation Techniques',     subtitle: 'DCF, comparables, and more',            duration: '10m', level: 'Difficult' },
      { id: 'f3', title: 'LIFO & FIFO',              subtitle: 'Inventory accounting flows',            duration: '5m',  level: 'Medium'    },
    ],
  },

  product: {
    pm: [
      { id: 'p1', title: 'Product Strategy',        subtitle: 'Roadmapping and prioritization',         duration: '20m', level: 'Medium' },
    ],
    po: [
      { id: 'p2', title: 'User Personas',           subtitle: 'Defining and using personas',           duration: '10m', level: 'Easy'   },
      { id: 'p3', title: 'A/B Testing',             subtitle: 'Design and analyze experiments',        duration: '10m', level: 'Medium' },
    ],
  },

  business: {
    analyst: [
      { id: 'b1', title: 'Market Entry Case',       subtitle: 'Go-to-market strategies',                duration: '20m', level: 'Medium' },
    ],
    manager: [
      { id: 'b2', title: 'SWOT Analysis',           subtitle: 'Strengths, Weaknesses, Opportunities, Threats', duration: '10m', level: 'Easy' },
    ],
  },

  consulting: {
    strategy: [
      { id: 'c1', title: 'Consulting Case Interview #1', subtitle: 'Help McKinsey analyze the launch of a new…', duration: '20m', level: 'Medium' },
    ],
    operations: [
      { id: 'c2', title: 'Profitability Case',             subtitle: 'Diagnose declining profits',            duration: '15m', level: 'Medium' },
    ],
  },

  writing: {
    editor: [
      { id: 'w1', title: 'Content Strategy',         subtitle: 'Building an editorial calendar',       duration: '15m', level: 'Easy'   },
    ],
    content: [
      { id: 'w2', title: 'Copywriting Essentials',  subtitle: 'Headlines, CTAs, and tone',             duration: '10m', level: 'Medium' },
    ],
  },

  design: {
    ui: [
      { id: 'd1', title: 'UI/UX Principles',        subtitle: 'Design thinking and wireframing',     duration: '20m', level: 'Medium' },
    ],
    ux: [
      { id: 'd2', title: 'Accessibility Basics',    subtitle: 'Inclusive design guidelines',         duration: '10m', level: 'Easy'   },
    ],
    graphic: [
      // …add graphic-design interviews here
    ],
  },

  legal: {
    counsel: [
      { id: 'l1', title: 'Contract Law Basics',     subtitle: 'Key clauses and negotiations',        duration: '20m', level: 'Medium' },
    ],
    paralegal: [
      { id: 'l2', title: 'IP Fundamentals',         subtitle: 'Patents, trademarks, copyrights',    duration: '10m', level: 'Medium' },
    ],
  },

  media: {
    editorial: [
      { id: 'm1', title: 'Media Buying 101',        subtitle: 'Channels and budgeting',             duration: '15m', level: 'Medium' },
    ],
    production: [
      { id: 'm2', title: 'Content Creation',        subtitle: 'Video, audio, and articles',         duration: '10m', level: 'Easy'   },
    ],
  },

  engineering: {
    mechanical: [
      { id: 'e1', title: 'Mechanical Systems',      subtitle: 'Core engineering principles',         duration: '20m', level: 'Medium' },
    ],
    electrical: [
      { id: 'e2', title: 'Safety Protocols',        subtitle: 'Industry standards overview',        duration: '10m', level: 'Easy'   },
    ],
    civil: [
      // …add civil engineering interviews here
    ],
  },

  statistics: {
    biostats: [
      { id: 's1', title: 'Probability Theory',      subtitle: 'Random variables and distributions', duration: '15m', level: 'Medium' },
    ],
    econometrics: [
      { id: 's2', title: 'Hypothesis Testing',      subtitle: 'p-values and confidence intervals',  duration: '10m', level: 'Medium' },
    ],
  },

  marketing: {
    digital: [
      { id: 'mk1', title: 'Marketing Mix',          subtitle: '4 Ps and beyond',                    duration: '15m', level: 'Medium' },
    ],
    brand: [
      { id: 'mk2', title: 'SEO Fundamentals',       subtitle: 'Keywords and on-page SEO',           duration: '10m', level: 'Easy'   },
    ],
  },

  biology: {
    research: [
      { id: 'bio1', title: 'Cell Biology',          subtitle: 'Organelles and functions',           duration: '15m', level: 'Medium' },
    ],
    lab: [
      { id: 'bio2', title: 'Genetics Basics',       subtitle: 'DNA, RNA, and heredity',             duration: '10m', level: 'Easy'   },
    ],
  },

  security: {
    network: [
      { id: 'sec1', title: 'Cybersecurity 101',      subtitle: 'Threats and best practices',         duration: '20m', level: 'Medium' },
    ],
    appsec: [
      { id: 'sec2', title: 'Network Security',      subtitle: 'Firewalls and IDS/IPS',              duration: '15m', level: 'Medium' },
    ],
  },
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Interview[]>
) {
  const catParam  = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category
  const roleParam = Array.isArray(req.query.role)     ? req.query.role[0]     : req.query.role

  // normalize e.g. "Data Science" → "data-science"
  const categoryKey = catParam
    ? catParam.trim().toLowerCase().replace(/\s+/g, '-')
    : 'software'

  // pick the roles object (fallback to software)
  const rolesGroup = interviewsByCategoryAndRole[categoryKey] 
    || interviewsByCategoryAndRole['software']

  let result: Interview[]

  if (roleParam && rolesGroup[roleParam]) {
    // return only that role
    result = rolesGroup[roleParam]
  } else {
    // no role (or unknown), default flatten
    result = Object.values(rolesGroup).flat()
  }

  res.status(200).json(result)
}
