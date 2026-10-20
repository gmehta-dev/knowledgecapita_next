export const INDUSTRIES = [
  "Academia",
  "Agriculture & Allied Sector",
  "Automobile",
  "Aviation",
  "BFSI Investment & Trading",
  "Chemicals",
  "Design",
  "Defense",
  "Education",
  "Engineering & Construction",
  "FMCG",
  "Healthcare & Life Sciences",
  "IT Services & Consulting",
  "Media Production & Entertainment",
  "Metals & Mining",
  "NGO/Social Services",
  "Oil & Gas",
  "Power",
  "Professional Services",
  "Real Estate",
  "Retail",
  "Space",
  "Sports Fitness & Personal Care",
  "Telecom",
  "Textiles & Apparel",
  "Tourism & Hospitality",
  "Transportation & Warehousing",
  "Utilities",
  "Others"
];

export const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Chairman",
  "CEO",
  "CFO",
  "CHRO",
  "CIO",
  "CISO",
  "CMO",
  "COO",
  "CQO",
  "CSO",
  "CTO",
  "Consultant",
  "Director",
  "Founder",
  "General Counsel",
  "Head-EHS",
  "Managing Director",
  "PhD Scholar",
  "President",
  "Professor",
  "Sales Head",
  "Vice-Chancellor",
  "Vice-President",
  "Others"
];

export const SPECIALIZATIONS = [
  "Applied Mechanics",
  "Artificial Engineering",
  "Aviation & Aerospace",
  "Biochemical Engineering and Biotechnology",
  "Biomedical",
  "Business Technology",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computer Science & Engineering",
  "CSR & Social Service",
  "Design",
  "Economics & Public Policy",
  "Electrical Engineering",
  "Entrepreneurship",
  "Environment Health & Safety",
  "Finance & Accounts",
  "General Administration",
  "General Management",
  "Human Resource Management",
  "Humanities & Social Sciences",
  "Information Security",
  "Information Systems",
  "Innovation",
  "Legal & Regulatory",
  "Material Science & Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Operations",
  "Physics",
  "Product Management",
  "Project & Program Management",
  "Quality Management",
  "R&D",
  "Risk Management & Compliance",
  "Sales & Marketing",
  "Strategy",
  "Supply Chain Management",
  "Sustainability",
  "Others"
];

export const AUTHORIZED_EMAILS = [
  "virenderdce@gmail.com",
  "ceo@knowledgecapita.com",
  "gmehta.dev@gmail.com"
];


// Labels offered by the UI dropdowns (public/content.json) and stored on existing
// users since the Laravel era, but missing from the lists above, so the legacy
// API rejected them ("Invalid designation") and those users could not save
// their profile. Accepted in addition to the values above.
const UI_DESIGNATIONS = [
  "Chief Executive Officer (CEO)",
  "Chief Financial Officer (CFO)",
  "Chief Human Resource Officer (CHRO)",
  "Chief Information Officer (CIO)",
  "Chief Information Security Officer (CISO)",
  "Chief Innovation Officer (CIO)",
  "Chief Investment Officer (CIO)",
  "Chief Marketing Officer (CMO)",
  "Chief Operating Officer (COO)",
  "Chief Quality Officer (CQO)",
  "Chief Scientific Officer (CSO)",
  "Chief Sustainability Officer (CSO)",
  "Chief Strategy Officer (CSO)",
  "Chief Technology Officer (CTO)",
  "Head- EHS",
  "Vice- Chancellor"
];

const UI_INDUSTRIES = [
  "BFSI, Investment & Trading",
  "NGO/ Social Services",
  "Sports, Fitness & Personal Care"
];

const UI_SPECIALIZATIONS = [
  "Environment, Health & Safety"
];

DESIGNATIONS.push(...UI_DESIGNATIONS);
INDUSTRIES.push(...UI_INDUSTRIES);
SPECIALIZATIONS.push(...UI_SPECIALIZATIONS);
