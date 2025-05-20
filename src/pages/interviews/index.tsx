// pages/interviews/index.tsx
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { FaSearch } from 'react-icons/fa';
import { InterviewCard, Interview } from '@/components/InterviewCard';
import { CategoryNav } from '@/components/CategoryNav';

const rolesMap: Record<string, { id: string; name: string }[]> = {
  software: [
    { id: 'frontend',  name: 'Frontend'   },
    { id: 'backend',   name: 'Backend'    },
    { id: 'fullstack', name: 'Fullstack'  },
  ],
  'data-science': [
    { id: 'analyst', name: 'Analyst'             },
    { id: 'ml',      name: 'Machine Learning'    },
    { id: 'de',      name: 'Data Engineering'    },
    { id: 'bi',      name: 'Business Intelligence' },
  ],
  finance: [
    { id: 'investment', name: 'Investment Banking' },
    { id: 'corporate',  name: 'Corporate Finance'  },
  ],
  product: [
    { id: 'pm', name: 'Product Manager' },
    { id: 'po', name: 'Product Owner'   },
  ],
  business: [
    { id: 'analyst', name: 'Business Analyst' },
    { id: 'manager', name: 'Business Manager' },
  ],
  consulting: [
    { id: 'strategy',   name: 'Strategy'   },
    { id: 'operations', name: 'Operations' },
  ],
  writing: [
    { id: 'editor',  name: 'Editor'         },
    { id: 'content', name: 'Content Writer' },
  ],
  design: [
    { id: 'ui',      name: 'UI Designer'      },
    { id: 'ux',      name: 'UX Designer'      },
    { id: 'graphic', name: 'Graphic Designer' },
  ],
  legal: [
    { id: 'counsel',   name: 'Legal Counselor' },
    { id: 'paralegal', name: 'Paralegal'       },
  ],
  media: [
    { id: 'editorial',  name: 'Editorial'  },
    { id: 'production', name: 'Production' },
  ],
  engineering: [
    { id: 'mechanical', name: 'Mechanical' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'civil',      name: 'Civil'      },
  ],
  statistics: [
    { id: 'biostats',     name: 'Biostatistics' },
    { id: 'econometrics', name: 'Econometrics'  },
  ],
  marketing: [
    { id: 'digital', name: 'Digital Marketing' },
    { id: 'brand',   name: 'Brand Marketing'   },
  ],
  biology: [
    { id: 'research', name: 'Research'       },
    { id: 'lab',      name: 'Lab Technician' },
  ],
  security: [
    { id: 'network', name: 'Network Security'     },
    { id: 'appsec',  name: 'Application Security' },
  ],
};

type InterviewWithCat = Interview & { category: string };

const InterviewsPage: NextPage = () => {
  const router = useRouter();
  const [allInterviews, setAllInterviews] = useState<InterviewWithCat[]>([]);
  const [interviews, setInterviews]       = useState<Interview[]>([]);
  const [category, setCategory]           = useState<string>('software');
  const [role, setRole]                   = useState<string>('');
  const [search, setSearch]               = useState<string>('');

  const categories = Object.keys(rolesMap);

  // 1) Load EVERY category once
  useEffect(() => {
    Promise.all(
      categories.map(cat =>
        fetch(`/api/interviews?category=${cat}`)
          .then(res => res.json() as Promise<Interview[]>)
          .then(arr => arr.map(iv => ({ ...iv, category: cat })))
      )
    ).then(chunks => setAllInterviews(chunks.flat()));
  }, []);

  // 2) When `search` changes, override category+role fetch
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    const matches = allInterviews.filter(iv =>
      iv.title.toLowerCase().includes(q) ||
      iv.subtitle?.toLowerCase().includes(q)
    );

    if (matches.length) {
      const firstCat = matches[0].category;
      setCategory(firstCat);
      setRole('');  // clear any role filter
      // show only matches in that category
      setInterviews(matches.filter(iv => iv.category === firstCat));
    } else {
      setInterviews([]); // no hits
    }
  }, [search, allInterviews]);

  // 3) When category or role changes **and** search is empty, normal fetch
  useEffect(() => {
    if (search.trim()) return;  
    const params = new URLSearchParams({ category });
    if (role) params.append('role', role);
    fetch(`/api/interviews?${params.toString()}`)
      .then(res => res.json())
      .then(data => setInterviews(data));
  }, [category, role, search]);

  const roles = rolesMap[category] ?? [];

  return (
    <main style={{ background: '#F5FCFF' }} className="min-h-screen py-12">
      {/* Header */}
      <div className="relative text-center px-4 mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#18326F' }}>
          {category.charAt(0).toUpperCase() + category.slice(1)}
          {role && ` - ${role.charAt(0).toUpperCase() + role.slice(1)}`} Mock Interviews
        </h1>
        <p className="mt-2 text-lg" style={{ color: '#18326F' }}>
          Practice with 100+ expert-vetted interviews, get feedback on your performance,
          and land your dream opportunity.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex justify-center mb-6 px-6">
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#18326F]" />
          <input
            type="text"
            placeholder="Search interviews..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2
              border border-gray-300 rounded-full
              text-black placeholder-black caret-black
              focus:outline-none focus:ring-2 focus:ring-[#87B2FF]
            "
          />
        </div>
      </div>

      {/* Category + Role Nav */}
      <CategoryNav
        selected={category}
        onSelect={c => { setCategory(c); setRole(''); setSearch(''); }}
        roles={roles}
        selectedRole={role}
        onRoleSelect={r => { setRole(r); setSearch(''); }}
      />

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-6 mt-12">
        {interviews.map(iv => (
          <InterviewCard
            key={iv.id}
            interview={iv}
            onSelect={id =>
              router.push({ pathname: `/interviews/${id}`, query: { category, role } })
            }
          />
        ))}
      </div>
    </main>
  );
};

export default InterviewsPage;
