// src/pages/api/interviews.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { Interview } from '@/components/InterviewCard'

// Nested record: category → role → interviews[]
const interviewsByCategoryAndRole: Record<string, Record<string, Interview[]>> = {
    software: {
    frontend: [
      { id: '1',  title: 'Software Engineering',      subtitle: 'New Grad E3: Technical interview #1', duration: '20m', level: 'Medium' },
      { id: '9',  title: 'Front-end 101',            subtitle: 'Review UI optimization and JS techniques', duration: '30m', level: 'Medium' },
    ],
    backend: [
      { id: '2',  title: 'Stacks vs Queues',         subtitle: 'Learn the FIFO and LIFO flows',            duration: '5m',  level: 'Medium' },
      { id: '6',  title: 'Processes vs Threads',      subtitle: 'Discuss these core OS concepts',           duration: '5m',  level: 'Easy'   },
      { id: '3',  title: 'Hash Tables',               subtitle: 'Master the magic of key-to-index storage', duration: '5m',  level: 'Medium' },    // new
      { id: '4',  title: 'MVC Models',                subtitle: 'Explain this core design architecture',    duration: '5m',  level: 'Medium' },    // new
      { id: '5',  title: 'REST API 101',              subtitle: 'Web APIs using HTTP methods',              duration: '5m',  level: 'Easy'   },    // new
      { id: '7',  title: 'Low-Level Design',          subtitle: 'Analyze components and optimization ideas',duration: '30m', level: 'Difficult' },// new
      { id: '8',  title: 'DevOps Fundamentals',       subtitle: 'Talk about CI/CD, Docker, and cloud tools',duration: '35m', level: 'Difficult' },// new
      // ↕️ overlapping from Finance:
      { id: 'f3', title: 'LIFO & FIFO',              subtitle: 'Inventory accounting flows',               duration: '5m',  level: 'Medium' },
    ],
    fullstack: [
      { id: '12', title: 'JavaScript Mastery',        subtitle: 'Review JS concepts and front-end skills',   duration: '30m', level: 'Medium' },
      { id: '15', title: 'Coding Concepts Basics',    subtitle: 'Explore arrays, trees, graphs, algorithms', duration: '30m', level: 'Medium' },
      { id: '10', title: 'Testing & Automation',      subtitle: 'Explore unit testing and automation tools', duration: '30m', level: 'Medium' }, // new
      { id: '11', title: 'SQL & Database Talk',       subtitle: 'Discuss SQL queries and optimization',      duration: '30m', level: 'Medium' }, // new
    ],
  },

  'data-science': {
    analyst: [
      { id: 'ds1',  title: 'Data Science Fundamentals', subtitle: 'Statistics, ML pipelines, and tools', duration: '20m', level: 'Medium' },
      { id: 'ds7',  title: 'Model Validation',           subtitle: 'Cross-validation & metrics',         duration: '10m', level: 'Easy'   },
      { id: 'ds10', title: 'A/B Testing Basics',         subtitle: 'Talk about A/B testing and experiment design', duration: '30m', level: 'Medium' },
      { id: 'ds16', title: 'Data Analysis Talk',         subtitle: 'Discuss data analysis and visualization',        duration: '25m', level: 'Medium' },
      { id: 'ds17', title: 'SQL for Data Science',       subtitle: 'Talk about SQL queries and databases',          duration: '25m', level: 'Medium' },
    ],
    ml: [
      { id: 'ds2',  title: 'Regression Analysis',        subtitle: 'Linear & Logistic regression deep dive', duration: '10m', level: 'Medium' },
      { id: 'ds6',  title: 'Deep Learning Intro',        subtitle: 'Neural network architectures overview',  duration: '20m', level: 'Difficult' },
      { id: 's1',   title: 'Probability Theory',         subtitle: 'Random variables and distributions',    duration: '15m', level: 'Medium' },
      { id: 'ds9',  title: 'Deep Learning Intro',        subtitle: 'Review neural networks and deep learning', duration: '35m', level: 'Difficult' },
      { id: 'ds14', title: 'Machine Learning 101',       subtitle: 'Explore basic machine learning models',    duration: '30m', level: 'Difficult' },
      { id: 'ds15', title: 'Python for Data Science',    subtitle: 'Review Python usage in data science tasks', duration: '30m', level: 'Medium' },
    ],
    de: [
      { id: 'ds8',  title: 'Feature Engineering',        subtitle: 'Creating and selecting features',       duration: '15m', level: 'Medium' },
      { id: 'ds11', title: 'Data Cleaning Tips',         subtitle: 'Discuss data cleaning and preprocessing', duration: '25m', level: 'Easy'   },
      { id: 'ds13', title: 'Big Data Concepts',          subtitle: 'Discuss big data tools and ecosystems',    duration: '35m', level: 'Difficult' },
    ],
    bi: [
      { id: 'ds3',  title: 'Classification Models',      subtitle: 'Decision trees, SVMs, and ensembles',    duration: '10m', level: 'Medium' },
      { id: 'ds4',  title: 'Clustering Techniques',      subtitle: 'K-Means, hierarchical clustering',        duration: '10m', level: 'Easy'   },
      { id: 'ds5',  title: 'Time Series Basics',         subtitle: 'ARIMA, forecasting concepts',            duration: '15m', level: 'Medium' },
      { id: 'ds12', title: 'Time Series Basics',         subtitle: 'Explore time series data and forecasting', duration: '30m', level: 'Medium' },
      { id: 'ds18', title: 'Statistics Basics',         subtitle: 'Review statistical concepts and probability', duration: '30m', level: 'Medium' },
    ],
  },

  finance: {
    quant: [
      { id: 'f5', title: 'Quant #1: Handshakes',      subtitle: 'Calculate the number of handshakes',        duration: '10m', level: 'Medium' },
      { id: 'f6', title: 'Quant #2: Local Maxima',     subtitle: 'Determine expected local maxima in a sequence', duration: '10m', level: 'Medium' },
      { id: 'f7', title: 'Quant #3: Matching Heads',   subtitle: "Deduce a simple game's profitability",       duration: '5m',  level: 'Easy'   },
      { id: 'f8', title: 'Quant #4: Moving Ants',      subtitle: 'Analyze movements of ants on a stick',      duration: '10m', level: 'Easy'   },
      { id: 'f9', title: 'Quant #5: 2D Paths',         subtitle: 'Consider all possible paths in a 2D game',  duration: '10m', level: 'Easy'   },
    ],
    investment: [
      { id: 'f1',  title: 'Working Capital Case',       subtitle: 'Explain the dynamics of working capital',   duration: '5m',  level: 'Medium' },
      { id: 'f4',  title: 'Budget Forecasting',         subtitle: 'Building financial models',                 duration: '15m', level: 'Difficult' },
      { id: 'f10', title: 'Negative Equity Case',       subtitle: 'Discuss cases of negative shareholder equity', duration: '20m', level: 'Medium' },
      { id: 'f11', title: 'Portfolio Management',       subtitle: 'Review portfolio management strategies',    duration: '30m', level: 'Medium' },
      { id: 'f12', title: 'Investment Analysis',        subtitle: 'Discuss investment evaluation techniques',  duration: '30m', level: 'Medium' },
      { id: 'f13', title: 'Risk Management',            subtitle: 'Explore strategies for risk assessment',     duration: '35m', level: 'Difficult' },
      { id: 'f14', title: 'Market Trends',              subtitle: 'Discuss current market trends and impacts', duration: '30m', level: 'Medium' },
      { id: 'f15', title: 'Behavioral Finance',         subtitle: 'Explore psychology in financial decisions', duration: '30m', level: 'Medium' },
      { id: 'f16', title: 'Excel for Finance',          subtitle: 'Discuss Excel skills for finance tasks',    duration: '30m', level: 'Easy'   },
      { id: 'f17', title: 'Financial Modeling',         subtitle: 'Discuss building financial models',         duration: '30m', level: 'Medium' },
    ],
    corporate: [
      { id: 'f2',  title: 'Valuation Techniques',       subtitle: 'DCF, comparables, and more',               duration: '10m', level: 'Difficult' },
      { id: 'f18', title: 'Corporate Finance',          subtitle: 'Review corporate finance principles',      duration: '30m', level: 'Medium' },
      { id: 'f20', title: 'Financial Statements',       subtitle: 'Analyze key financial statements',         duration: '25m', level: 'Medium' },
      { id: 'f19', title: 'Financial Statements',       subtitle: 'Discuss the 3 main accounting statements', duration: '5m',  level: 'Medium' },
    ],
  },

  product: {
    pm: [
      { id: 'p1',  title: 'Product Strategy',               subtitle: 'Roadmapping and prioritization',              duration: '20m', level: 'Medium' },
      { id: 'p4',  title: 'Agile Methodologies',            subtitle: 'Explore agile practices for product teams',  duration: '30m', level: 'Medium' }, 
      { id: 'p5',  title: 'Go-to-Market Plan',              subtitle: 'Discuss strategies for launching products',  duration: '20m', level: 'Easy'   },
      { id: 'p6',  title: 'Product Lifecycle 101',          subtitle: 'Review stages of product lifecycle',         duration: '30m', level: 'Medium' },
      { id: 'p7',  title: 'Metrics and KPIs',               subtitle: 'Explore key metrics for product success',    duration: '30m', level: 'Medium' },
      { id: 'p8',  title: 'Cross-functional Work',          subtitle: 'Discuss collaboration with teams',           duration: '30m', level: 'Medium' },
      { id: 'p9',  title: 'User Experience',                subtitle: 'Discuss importance of UX in products',       duration: '30m', level: 'Medium' },
      { id: 'p10', title: 'Roadmap Prioritization',         subtitle: 'Review methods for prioritizing features',  duration: '35m', level: 'Medium' },
      { id: 'p11', title: 'Market Research Interview',      subtitle: 'Explore techniques for market analysis',    duration: '30m', level: 'Medium' },
      { id: 'p12', title: 'Product Strategy Casing',        subtitle: 'Discuss product vision and strategy',       duration: '30m', level: 'Medium' },
    ],
    po: [
      { id: 'p2', title: 'User Personas',                   subtitle: 'Defining and using personas',               duration: '10m', level: 'Easy'   },
      { id: 'p3', title: 'A/B Testing',                     subtitle: 'Design and analyze experiments',            duration: '10m', level: 'Medium' },
    ],
  },


  business: {
    analyst: [
      { id: 'b1',  title: 'Market Entry Case',        subtitle: 'Go-to-market strategies',                     duration: '20m', level: 'Medium' },
      { id: 'b3',  title: 'CSR Strategies',           subtitle: 'Review corporate responsibility practices', duration: '30m', level: 'Medium' },
      { id: 'b4',  title: 'Strategic Alliances',      subtitle: 'Discuss strategic partnership options',      duration: '20m', level: 'Difficult' },
      { id: 'b5',  title: 'Cost-Benefit Analysis',    subtitle: 'Conduct a cost-benefit analysis',            duration: '20m', level: 'Easy' },
      { id: 'b6',  title: 'Customer Journey',         subtitle: 'Map the customer journey phases',            duration: '30m', level: 'Medium' },
      { id: 'b7',  title: 'Process Improvement',      subtitle: 'Identify process improvement methods',       duration: '30m', level: 'Easy' },
      { id: 'b8',  title: 'Operational Risk',         subtitle: 'Assess operational risk factors',            duration: '30m', level: 'Medium' },
      { id: 'b9',  title: 'Market Entry Strategy',    subtitle: 'Discuss market entry strategies',            duration: '35m', level: 'Medium' },
      { id: 'b10', title: 'Competitive Analysis',     subtitle: 'Analyze the competitive landscape',           duration: '30m', level: 'Medium' },
      { id: 'b11', title: 'Business Model Analysis',  subtitle: 'Evaluate various business models',            duration: '30m', level: 'Medium' },
    ],
    manager: [
      { id: 'b2',  title: 'SWOT Analysis',            subtitle: 'Strengths, Weaknesses, Opportunities, Threats', duration: '10m', level: 'Easy' },
    ],
  },

  consulting: {
    strategy: [
      { id: 'c1',  title: 'Consulting Case Interview #1', subtitle: 'Help McKinsey analyze the launch of a new sports beverage',           duration: '20m', level: 'Medium' },
      { id: 'c3',  title: 'Consulting Case Interview #2', subtitle: 'Explore solutions for a travel agency’s overloaded call center', duration: '10m', level: 'Medium' },
      { id: 'c4',  title: 'Consulting Case Interview #3', subtitle: 'Help a client improve profitability.',                             duration: '30m', level: 'Medium' },
      { id: 'c5',  title: 'New Product Launch',            subtitle: 'Plan and strategize a product launch',                          duration: '30m', level: 'Medium' },
      { id: 'c6',  title: 'Digital Transformation',        subtitle: 'Guide a firm through digital change',                            duration: '30m', level: 'Easy'   },
      { id: 'c7',  title: 'Business Model Evaluation',     subtitle: 'Assess the viability of a business model',                       duration: '25m', level: 'Difficult' },
      { id: 'c8',  title: 'Growth Strategy Case',          subtitle: 'Develop strategies for business growth',                         duration: '30m', level: 'Medium' },
      { id: 'c9',  title: 'Market Entry Case',             subtitle: 'Assess market entry options for a client',                       duration: '20m', level: 'Medium' },
    ],
    operations: [
      { id: 'c2',  title: 'Profitability Case',            subtitle: 'Identify factors impacting profitability',                     duration: '30m', level: 'Difficult' },
      { id: 'c10', title: 'Risk Assessment Case',          subtitle: 'Evaluate risks in a business plan',                            duration: '30m', level: 'Medium' },
      { id: 'c11', title: 'Operational Improvement',       subtitle: 'Analyze inefficiencies in operations',                         duration: '20m', level: 'Medium' },
      { id: 'c12', title: 'M&A Due Diligence',             subtitle: 'Evaluate a merger or acquisition opportunity',                  duration: '30m', level: 'Difficult' },
    ],
  },

  writing: {
    editor: [
      { id: 'w1', title: 'Content Strategy',             subtitle: 'Building an editorial calendar',        duration: '15m', level: 'Easy'   },
      { id: 'w3', title: 'Content Strategy Discussion',  subtitle: 'Discuss a content strategy plan',        duration: '20m', level: 'Easy'   },  // new
    ],
    content: [
      { id: 'w2', title: 'Copywriting Essentials',       subtitle: 'Headlines, CTAs, and tone',              duration: '10m', level: 'Medium' },
      { id: 'w4', title: 'Press Release Practice',       subtitle: 'Draft a press release on a topic',       duration: '30m', level: 'Medium' },  // new
      { id: 'w5', title: 'Social Media Strategy',        subtitle: 'Outline a growth campaign strategy',     duration: '20m', level: 'Easy'   },  // new
      { id: 'w6', title: 'Grant Writing Discussion',     subtitle: 'Discuss key elements of a grant',        duration: '20m', level: 'Medium' }, // new
      { id: 'w7', title: 'Screenwriting Pitch',          subtitle: 'Pitch a screenplay idea',                duration: '30m', level: 'Difficult' }, // new
      { id: 'w8', title: 'Copywriting Exercise',         subtitle: 'Pitch a product in 2 minutes',           duration: '20m', level: 'Medium' },  // new
      { id: 'w9', title: 'Blog Writing Scenario',        subtitle: 'Outline a blog post structure',          duration: '15m', level: 'Medium' },  // new
    ],
  },

  design: {
    ui: [
      { id: 'd1',  title: 'UI/UX Principles',      subtitle: 'Design thinking and wireframing',        duration: '20m', level: 'Medium' },
      { id: 'd3',  title: 'Wireframing Process',    subtitle: 'Explain your wireframing approach',     duration: '30m', level: 'Medium' },
      { id: 'd4',  title: 'Responsive Design',      subtitle: 'Discuss responsive design principles',  duration: '20m', level: 'Easy'   },
    ],
    ux: [
      { id: 'd2',  title: 'Accessibility Basics',   subtitle: 'Inclusive design guidelines',           duration: '10m', level: 'Easy'   },
      { id: 'd5',  title: 'Usability Testing',      subtitle: 'Explain your testing process',          duration: '25m', level: 'Medium' },
      { id: 'd6',  title: 'User Research Methods',  subtitle: 'Discuss research techniques used',       duration: '20m', level: 'Easy'   },
    ],
    graphic: [
      { id: 'd7',  title: 'Design Trends Analysis', subtitle: 'Analyze current design trends',         duration: '20m', level: 'Easy'   },
      { id: 'd8',  title: 'Color Theory Application', subtitle: 'Discuss color choices in design',      duration: '15m', level: 'Medium' },
      { id: 'd9',  title: 'Brand Identity Interview', subtitle: 'Outline a brand identity project',     duration: '30m', level: 'Difficult' },
      { id: 'd10', title: 'Design Challenge',        subtitle: 'Solve a design problem live',          duration: '30m', level: 'Difficult' },
      { id: 'd11', title: 'Portfolio Review',        subtitle: 'Discuss your design portfolio',        duration: '30m', level: 'Medium' },
    ],
  },


  legal: {
  counsel: [
    { id: 'l1',  title: 'Contract Law Basics',       subtitle: 'Key clauses and negotiations',              duration: '20m', level: 'Medium' },
    { id: 'l3',  title: 'Civil Litigation Process',  subtitle: 'Explain the litigation process',            duration: '35m', level: 'Medium' },
    { id: 'l4',  title: 'Regulatory Compliance',     subtitle: 'Discuss compliance with regulations',       duration: '40m', level: 'Difficult' },
    { id: 'l5',  title: 'Employment Law Case',       subtitle: 'Review an employment law case',             duration: '35m', level: 'Medium' },
    { id: 'l6',  title: 'Negotiation Skills',        subtitle: 'Role-play a negotiation scenario',          duration: '30m', level: 'Medium' },
    { id: 'l7',  title: 'Family Law Discussion',     subtitle: 'Discuss family law principles',             duration: '30m', level: 'Medium' },
    { id: 'l8',  title: 'Intellectual Property',     subtitle: 'Discuss IP rights and protections',         duration: '30m', level: 'Medium' },
    { id: 'l9',  title: 'Criminal Law Scenario',     subtitle: 'Analyze a criminal law scenario',           duration: '40m', level: 'Difficult' },
    { id: 'l10', title: 'Legal Case Analysis',       subtitle: 'Analyze a landmark legal case',             duration: '30m', level: 'Medium' },
  ],
  paralegal: [
    { id: 'l2',  title: 'IP Fundamentals',           subtitle: 'Patents, trademarks, copyrights',          duration: '10m', level: 'Medium' },
    { id: 'l11', title: 'Legal Ethics Discussion',   subtitle: 'Discuss ethics in legal practice',         duration: '30m', level: 'Easy'   },
    { id: 'l12', title: 'Contract Review',           subtitle: 'Review and discuss a contract clause',     duration: '25m', level: 'Easy'   },
  ],
},

  media: {
    editorial: [
      { id: 'm1',   title: 'Media Buying 101',        subtitle: 'Channels and budgeting',                   duration: '15m', level: 'Medium' },
      { id: 'm3',   title: 'Critical Reception',      subtitle: 'Discuss how to handle critiques',           duration: '20m', level: 'Medium' },
      { id: 'm4',   title: 'Content Distribution',    subtitle: 'Explain content distribution strategies',  duration: '25m', level: 'Medium' },
      { id: 'm5',   title: 'Digital Content Trends',  subtitle: 'Analyze trends in digital content',         duration: '15m', level: 'Easy'   },
      { id: 'm6',   title: 'Audience Analysis',       subtitle: 'Discuss strategies for audience targeting', duration: '30m', level: 'Medium' },
      { id: 'm7',   title: 'Marketing Campaign',      subtitle: 'Outline a marketing strategy for a film',   duration: '35m', level: 'Medium' },
    ],
    production: [
      { id: 'm2',   title: 'Content Creation',        subtitle: 'Video, audio, and articles',                duration: '10m', level: 'Easy'   },
      { id: 'm8',   title: 'Showrunner Skills',       subtitle: 'Discuss the role of a showrunner',          duration: '30m', level: 'Medium' },
      { id: 'm9',   title: 'Production Workflow',     subtitle: 'Explain your production workflow',         duration: '30m', level: 'Difficult' },
      { id: 'm10',  title: 'Script Development',      subtitle: 'Outline your scriptwriting process',       duration: '20m', level: 'Medium' },
      { id: 'm11',  title: 'Casting Discussion',      subtitle: 'Discuss casting strategies and choices',    duration: '20m', level: 'Medium' },
    ],
  },

  engineering: {
    mechanical: [
      { id: 'e1',  title: 'Mechanical Systems',             subtitle: 'Core engineering principles',              duration: '20m', level: 'Medium' },
      { id: 'e3',  title: 'Manufacturing Processes',        subtitle: 'Explain key manufacturing techniques',     duration: '20m', level: 'Medium' },
      { id: 'e7',  title: 'Project Risk Management',        subtitle: 'Discuss risk management strategies',        duration: '25m', level: 'Difficult' },
      { id: 'e4',  title: 'Robotics Engineering',           subtitle: 'Discuss your approach to robotics',         duration: '20m', level: 'Difficult' },
    ],
    electrical: [
      { id: 'e2',  title: 'Safety Protocols',               subtitle: 'Industry standards overview',              duration: '10m', level: 'Easy'   },
      { id: 'e6',  title: 'Systems Engineering Approach',   subtitle: 'Explain systems engineering principles',    duration: '20m', level: 'Medium' },
      { id: 'e5',  title: 'Quality Assurance Methods',      subtitle: 'Explain QA processes in projects',          duration: '25m', level: 'Medium' },
      { id: 'e8',  title: 'Electrical Circuit Design',      subtitle: 'Discuss circuit design principles',         duration: '20m', level: 'Medium' },
    ],
    civil: [
      { id: 'e9',  title: 'Civil Engineering Design',       subtitle: 'Discuss civil project designs',             duration: '20m', level: 'Medium' },
    ],
  },

  statistics: {
    biostats: [
      { id: 's1',   title: 'Probability Theory',            subtitle: 'Random variables and distributions',        duration: '15m', level: 'Medium' },
      { id: 's4',   title: 'Statistical Ethics',            subtitle: 'Discuss ethical considerations',             duration: '20m', level: 'Medium' },
      { id: 's5',   title: 'Data Visualization',           subtitle: 'Explain your visualization approach',       duration: '20m', level: 'Medium' },
      { id: 's6',   title: 'Sampling Techniques',          subtitle: 'Describe your sampling methods',            duration: '30m', level: 'Medium' },
      { id: 's7',   title: 'Statistical Software',         subtitle: 'Discuss software tools you use',             duration: '15m', level: 'Easy'   },
      { id: 's8',   title: 'Quality Control Methods',      subtitle: 'Discuss quality control in analysis',        duration: '20m', level: 'Medium' },
      { id: 's9',   title: 'Survey Design',                subtitle: 'Discuss effective survey techniques',         duration: '20m', level: 'Medium' },
      { id: 's10',  title: 'Statistical Modeling',         subtitle: 'Discuss modeling techniques used',            duration: '20m', level: 'Medium' },
      { id: 's11',  title: 'Data Interpretation',          subtitle: 'Analyze data interpretation methods',         duration: '35m', level: 'Difficult' },
    ],
    econometrics: [
      { id: 's2',   title: 'Hypothesis Testing',            subtitle: 'p-values and confidence intervals',         duration: '10m', level: 'Medium' },
      { id: 's3',   title: 'Hypothesis Testing Case',       subtitle: 'Explain your testing process',               duration: '30m', level: 'Medium' },
      { id: 's12',  title: 'Predictive Analytics',          subtitle: 'Discuss predictive modeling methods',         duration: '35m', level: 'Medium' },
    ],
  },

  marketing: {
    digital: [
      { id: 'mk1',  title: 'Marketing Mix',                subtitle: '4 Ps and beyond',                          duration: '15m', level: 'Medium' },
      { id: 'mk4',  title: 'Digital Marketing Strategy',    subtitle: 'Discuss your digital strategy',             duration: '20m', level: 'Medium' },
      { id: 'mk5',  title: 'Social Media Campaigns',        subtitle: 'Discuss campaign strategies',               duration: '20m', level: 'Medium' },
      { id: 'mk6',  title: 'Email Marketing Tactics',       subtitle: 'Explain your email strategies',             duration: '15m', level: 'Easy'   },
      { id: 'mk7',  title: 'SEO Best Practices',            subtitle: 'Explain your SEO techniques',               duration: '25m', level: 'Difficult' },
      { id: 'mk8',  title: 'Analytics and KPIs',            subtitle: 'Discuss your metrics approach',              duration: '30m', level: 'Difficult' },
      { id: 'mk9',  title: 'Content Marketing Plan',        subtitle: 'Outline a content strategy',                 duration: '25m', level: 'Medium' },
    ],
    brand: [
      { id: 'mk2',  title: 'SEO Fundamentals',             subtitle: 'Keywords and on-page SEO',                   duration: '10m', level: 'Easy'   },
      { id: 'mk3',  title: 'Creative Campaign Ideas',      subtitle: 'Present a unique campaign concept',           duration: '25m', level: 'Medium' },
      { id: 'mk10', title: 'Brand Development',            subtitle: 'Discuss your approach to branding',           duration: '20m', level: 'Medium' },
      { id: 'mk11', title: 'Market Research Methods',      subtitle: 'Discuss your research techniques',             duration: '15m', level: 'Easy'   },
      { id: 'mk12', title: 'Customer Segmentation',        subtitle: 'Discuss segmentation strategies',             duration: '20m', level: 'Difficult' },
    ],
  },

  biology: {
    research: [
      { id: 'bio1',   title: 'Cell Biology',              subtitle: 'Organelles and functions',                    duration: '15m', level: 'Medium' },
      { id: 'bio3',   title: 'Environmental Biology',     subtitle: 'Discuss high-impact projects',                duration: '30m', level: 'Medium' },
      { id: 'bio4',   title: 'Neuroscience Research',     subtitle: 'Discuss your neuroscience projects',           duration: '25m', level: 'Medium' },
      { id: 'bio5',   title: 'Biotech Innovation',        subtitle: 'Present a biotech innovation idea',            duration: '20m', level: 'Difficult' },
    ],
    lab: [
      { id: 'bio2',   title: 'Genetics Basics',           subtitle: 'DNA, RNA, and heredity',                      duration: '10m', level: 'Easy'   },
      { id: 'bio6',   title: 'Pathology Techniques',      subtitle: 'Discuss pathology testing methods',            duration: '25m', level: 'Medium' },
      { id: 'bio7',   title: 'Molecular Diagnostics',     subtitle: 'Explain diagnostic testing methods',           duration: '20m', level: 'Medium' },
    ],
    computational: [
      { id: 'bio8',   title: 'Bioinformatics Techniques', subtitle: 'Discuss bioinformatics applications',           duration: '20m', level: 'Difficult' },
      { id: 'bio9',   title: 'Genomic Data Analysis',     subtitle: 'Discuss genomic analysis methods',               duration: '30m', level: 'Difficult' },
    ],
    medical: [
      { id: 'bio10',  title: 'Clinical Trials Management',subtitle: 'Explain your trials management role',           duration: '30m', level: 'Difficult' },
      { id: 'bio11',  title: 'Pharmaceutical Research',   subtitle: 'Discuss drug development processes',            duration: '20m', level: 'Medium' },
    ],
    regulatory: [
      { id: 'bio12',  title: 'Regulatory Affairs',        subtitle: 'Discuss regulatory compliance issues',          duration: '30m', level: 'Medium' },
    ],
  },


  security: {
    network: [
      { id: 'sec1',  title: 'Cybersecurity 101',            subtitle: 'Threats and best practices',                     duration: '20m', level: 'Medium' },
      { id: 'sec3',  title: 'Network Security Protocols',   subtitle: 'Explain your network security methods',         duration: '30m', level: 'Difficult' },
    ],
    appsec: [
      { id: 'sec2',  title: 'Network Security',            subtitle: 'Firewalls and IDS/IPS',                          duration: '15m', level: 'Medium' },
      { id: 'sec4',  title: 'Threat Intelligence',         subtitle: 'Discuss your threat intelligence methods',       duration: '40m', level: 'Difficult' },
      { id: 'sec5',  title: 'Physical Security Measures',  subtitle: 'Discuss physical security practices',            duration: '15m', level: 'Medium' },
      { id: 'sec6',  title: 'Data Protection Regulations', subtitle: 'Discuss data protection laws',                   duration: '20m', level: 'Medium' },
      { id: 'sec7',  title: 'Penetration Testing',         subtitle: 'Explain your penetration testing approach',     duration: '30m', level: 'Difficult' },
      { id: 'sec8',  title: 'Vulnerability Assessment',    subtitle: 'Discuss vulnerability detection methods',      duration: '20m', level: 'Medium' },
      { id: 'sec9',  title: 'Security Compliance Standards', subtitle: 'Discuss compliance with standards',            duration: '15m', level: 'Easy'   },
      { id: 'sec10', title: 'Incident Response Plan',      subtitle: 'Explain your response plan process',           duration: '25m', level: 'Medium' },
      { id: 'sec11', title: 'Risk Assessment',             subtitle: 'Discuss risk evaluation techniques',            duration: '20m', level: 'Medium' },
      { id: 'sec12', title: 'Cybersecurity Strategy',      subtitle: 'Discuss your security strategies',              duration: '20m', level: 'Difficult' },
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
