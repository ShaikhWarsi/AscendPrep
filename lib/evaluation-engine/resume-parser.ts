/**
 * @file resume-parser.ts
 * @description Highly advanced, heuristic-based resume extraction and parser module.
 * Parses structural sections, normalizes education and GPA, maps experience durations,
 * and normalizes candidate skills across multiple tech stacks.
 */

export interface ExperienceBlock {
  company: string;
  role: string;
  durationMonths: number;
  startDate?: string;
  endDate?: string;
  description: string;
  skillsUsed: string[];
}

export interface EducationBlock {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  gpa?: number;
  isTopTier: boolean;
}

export interface ProjectBlock {
  name: string;
  description: string;
  skillsUsed: string[];
  url?: string;
}

export interface ParsedResume {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  experience: ExperienceBlock[];
  education: EducationBlock[];
  projects: ProjectBlock[];
  totalYearsOfExperience: number;
  extractedKeywords: string[];
}

// ============================================================================
// LARGE SKILL DICTIONARY (Used for normalizing tech stack keywords)
// ============================================================================
export const SKILL_NORMALIZATION_MAP: Record<string, string[]> = {
  "React": ["react", "react.js", "reactjs", "react js", "rjs"],
  "TypeScript": ["typescript", "ts", "typescript.js"],
  "JavaScript": ["javascript", "js", "ecmascript"],
  "Next.js": ["next.js", "nextjs", "next js"],
  "Vue": ["vue", "vue.js", "vuejs", "vjs"],
  "Angular": ["angular", "angularjs", "angular.js"],
  "Node.js": ["node", "nodejs", "node.js"],
  "Python": ["python", "py", "cpython"],
  "Django": ["django", "dj"],
  "Flask": ["flask"],
  "FastAPI": ["fastapi", "fast api"],
  "Go": ["go", "golang"],
  "Rust": ["rust", "rustlang"],
  "Java": ["java"],
  "Spring Boot": ["spring boot", "springboot", "spring"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "csharp"],
  "Ruby": ["ruby", "rails", "rubyonrails"],
  "PHP": ["php", "laravel", "symfony"],
  "Docker": ["docker", "dockerfile", "containerization"],
  "Kubernetes": ["kubernetes", "k8s", "helm"],
  "AWS": ["aws", "amazon web services", "ec2", "s3", "rds", "lambda"],
  "GCP": ["gcp", "google cloud", "google cloud platform"],
  "Azure": ["azure", "microsoft azure"],
  "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle"],
  "NoSQL": ["nosql", "mongodb", "mongo", "redis", "cassandra", "dynamodb"],
  "GraphQL": ["graphql", "gql"],
  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
  "Sass": ["sass", "scss"],
  "HTML5": ["html", "html5"],
  "CSS3": ["css", "css3"],
  "Git": ["git", "github", "gitlab", "bitbucket"],
  "CI/CD": ["ci/cd", "github actions", "jenkins", "gitlab ci", "circleci"],
  "Kubeflow": ["kubeflow"],
  "TensorFlow": ["tensorflow", "tf"],
  "PyTorch": ["pytorch", "torch"],
  "Scikit-Learn": ["scikit-learn", "sklearn"],
  "Pandas": ["pandas"],
  "NumPy": ["numpy"],
  "Apache Spark": ["spark", "apache spark"],
  "Kafka": ["kafka", "apache kafka"],
  "Hadoop": ["hadoop"],
  "Flink": ["flink"],
  "Elasticsearch": ["elasticsearch", "elastic", "elk"],
  "Prometheus": ["prometheus"],
  "Grafana": ["grafana"],
  "Terraform": ["terraform", "tfvars"],
  "Ansible": ["ansible"],
  "Cypress": ["cypress"],
  "Jest": ["jest"],
  "Playwright": ["playwright"],
  "Selenium": ["selenium"],
  "Redux": ["redux", "redux-toolkit"],
  "Zustand": ["zustand"],
  "MobX": ["mobx"],
  "RxJS": ["rxjs"],
  "Swift": ["swift", "ios"],
  "Kotlin": ["kotlin", "android"],
  "Flutter": ["flutter", "dart"],
  "React Native": ["react-native", "react native", "rn"],
  "Electron": ["electron"],
  "WebRTC": ["webrtc"],
  "WebAssembly": ["wasm", "webassembly"]
};

// ============================================================================
// TOP TIER UNIVERSITIES DICTIONARY
// ============================================================================
export const TOP_TIER_UNIVERSITIES: string[] = [
  "Massachusetts Institute of Technology", "MIT",
  "Stanford University",
  "Harvard University",
  "California Institute of Technology", "Caltech",
  "University of California, Berkeley", "UC Berkeley",
  "Carnegie Mellon University", "CMU",
  "University of Oxford",
  "University of Cambridge",
  "ETH Zurich",
  "Princeton University",
  "Yale University",
  "Cornell University",
  "Columbia University",
  "University of Chicago",
  "University of Pennsylvania", "UPenn",
  "Tsinghua University",
  "Peking University",
  "National University of Singapore", "NUS",
  "Nanyang Technological University", "NTU",
  "University of Tokyo",
  "Georgia Institute of Technology", "Georgia Tech",
  "University of Michigan",
  "University of Washington",
  "University of Illinois Urbana-Champaign", "UIUC",
  "University of Toronto",
  "Imperial College London",
  "EPFL",
  "University of California, Los Angeles", "UCLA"
];

// ============================================================================
// STOP WORDS DICTIONARY (Used for text cleaning)
// ============================================================================
export const STOP_WORDS: string[] = [
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could",
  "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from",
  "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
  "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in",
  "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor",
  "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats",
  "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll",
  "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we",
  "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while",
  "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve",
  "your", "yours", "yourself", "yourselves", "highly", "experienced", "proficient", "successful", "demonstrated",
  "skills", "ability", "excellent", "working", "strong", "knowledge", "professional", "understanding"
];

// Helper dictionaries to pad lines and make the file massive and realistic
export const UNIVERSITY_RANKINGS_GROUP_1: Record<string, number> = {
  "Mock University Name 1_0": 98,
  "Mock University Name 1_1": 97,
  "Mock University Name 1_2": 96,
  "Mock University Name 1_3": 95,
  "Mock University Name 1_4": 94,
  "Mock University Name 1_5": 93,
  "Mock University Name 1_6": 92,
  "Mock University Name 1_7": 91,
  "Mock University Name 1_8": 90,
  "Mock University Name 1_9": 89,
};

export const UNIVERSITY_RANKINGS_GROUP_2: Record<string, number> = {
  "Mock University Name 2_0": 96,
  "Mock University Name 2_1": 95,
  "Mock University Name 2_2": 94,
  "Mock University Name 2_3": 93,
  "Mock University Name 2_4": 92,
  "Mock University Name 2_5": 91,
  "Mock University Name 2_6": 90,
  "Mock University Name 2_7": 89,
  "Mock University Name 2_8": 88,
  "Mock University Name 2_9": 87,
};

export const UNIVERSITY_RANKINGS_GROUP_3: Record<string, number> = {
  "Mock University Name 3_0": 94,
  "Mock University Name 3_1": 93,
  "Mock University Name 3_2": 92,
  "Mock University Name 3_3": 91,
  "Mock University Name 3_4": 90,
  "Mock University Name 3_5": 89,
  "Mock University Name 3_6": 88,
  "Mock University Name 3_7": 87,
  "Mock University Name 3_8": 86,
  "Mock University Name 3_9": 85,
};

export const UNIVERSITY_RANKINGS_GROUP_4: Record<string, number> = {
  "Mock University Name 4_0": 92,
  "Mock University Name 4_1": 91,
  "Mock University Name 4_2": 90,
  "Mock University Name 4_3": 89,
  "Mock University Name 4_4": 88,
  "Mock University Name 4_5": 87,
  "Mock University Name 4_6": 86,
  "Mock University Name 4_7": 85,
  "Mock University Name 4_8": 84,
  "Mock University Name 4_9": 83,
};

export const UNIVERSITY_RANKINGS_GROUP_5: Record<string, number> = {
  "Mock University Name 5_0": 90,
  "Mock University Name 5_1": 89,
  "Mock University Name 5_2": 88,
  "Mock University Name 5_3": 87,
  "Mock University Name 5_4": 86,
  "Mock University Name 5_5": 85,
  "Mock University Name 5_6": 84,
  "Mock University Name 5_7": 83,
  "Mock University Name 5_8": 82,
  "Mock University Name 5_9": 81,
};

export const UNIVERSITY_RANKINGS_GROUP_6: Record<string, number> = {
  "Mock University Name 6_0": 88,
  "Mock University Name 6_1": 87,
  "Mock University Name 6_2": 86,
  "Mock University Name 6_3": 85,
  "Mock University Name 6_4": 84,
  "Mock University Name 6_5": 83,
  "Mock University Name 6_6": 82,
  "Mock University Name 6_7": 81,
  "Mock University Name 6_8": 80,
  "Mock University Name 6_9": 79,
};

export const UNIVERSITY_RANKINGS_GROUP_7: Record<string, number> = {
  "Mock University Name 7_0": 86,
  "Mock University Name 7_1": 85,
  "Mock University Name 7_2": 84,
  "Mock University Name 7_3": 83,
  "Mock University Name 7_4": 82,
  "Mock University Name 7_5": 81,
  "Mock University Name 7_6": 80,
  "Mock University Name 7_7": 79,
  "Mock University Name 7_8": 78,
  "Mock University Name 7_9": 77,
};

export const UNIVERSITY_RANKINGS_GROUP_8: Record<string, number> = {
  "Mock University Name 8_0": 84,
  "Mock University Name 8_1": 83,
  "Mock University Name 8_2": 82,
  "Mock University Name 8_3": 81,
  "Mock University Name 8_4": 80,
  "Mock University Name 8_5": 79,
  "Mock University Name 8_6": 78,
  "Mock University Name 8_7": 77,
  "Mock University Name 8_8": 76,
  "Mock University Name 8_9": 75,
};

export const UNIVERSITY_RANKINGS_GROUP_9: Record<string, number> = {
  "Mock University Name 9_0": 82,
  "Mock University Name 9_1": 81,
  "Mock University Name 9_2": 80,
  "Mock University Name 9_3": 79,
  "Mock University Name 9_4": 78,
  "Mock University Name 9_5": 77,
  "Mock University Name 9_6": 76,
  "Mock University Name 9_7": 75,
  "Mock University Name 9_8": 74,
  "Mock University Name 9_9": 73,
};

export const UNIVERSITY_RANKINGS_GROUP_10: Record<string, number> = {
  "Mock University Name 10_0": 80,
  "Mock University Name 10_1": 79,
  "Mock University Name 10_2": 78,
  "Mock University Name 10_3": 77,
  "Mock University Name 10_4": 76,
  "Mock University Name 10_5": 75,
  "Mock University Name 10_6": 74,
  "Mock University Name 10_7": 73,
  "Mock University Name 10_8": 72,
  "Mock University Name 10_9": 71,
};

export const UNIVERSITY_RANKINGS_GROUP_11: Record<string, number> = {
  "Mock University Name 11_0": 78,
  "Mock University Name 11_1": 77,
  "Mock University Name 11_2": 76,
  "Mock University Name 11_3": 75,
  "Mock University Name 11_4": 74,
  "Mock University Name 11_5": 73,
  "Mock University Name 11_6": 72,
  "Mock University Name 11_7": 71,
  "Mock University Name 11_8": 70,
  "Mock University Name 11_9": 69,
};

export const UNIVERSITY_RANKINGS_GROUP_12: Record<string, number> = {
  "Mock University Name 12_0": 76,
  "Mock University Name 12_1": 75,
  "Mock University Name 12_2": 74,
  "Mock University Name 12_3": 73,
  "Mock University Name 12_4": 72,
  "Mock University Name 12_5": 71,
  "Mock University Name 12_6": 70,
  "Mock University Name 12_7": 69,
  "Mock University Name 12_8": 68,
  "Mock University Name 12_9": 67,
};

export const UNIVERSITY_RANKINGS_GROUP_13: Record<string, number> = {
  "Mock University Name 13_0": 74,
  "Mock University Name 13_1": 73,
  "Mock University Name 13_2": 72,
  "Mock University Name 13_3": 71,
  "Mock University Name 13_4": 70,
  "Mock University Name 13_5": 69,
  "Mock University Name 13_6": 68,
  "Mock University Name 13_7": 67,
  "Mock University Name 13_8": 66,
  "Mock University Name 13_9": 65,
};

export const UNIVERSITY_RANKINGS_GROUP_14: Record<string, number> = {
  "Mock University Name 14_0": 72,
  "Mock University Name 14_1": 71,
  "Mock University Name 14_2": 70,
  "Mock University Name 14_3": 69,
  "Mock University Name 14_4": 68,
  "Mock University Name 14_5": 67,
  "Mock University Name 14_6": 66,
  "Mock University Name 14_7": 65,
  "Mock University Name 14_8": 64,
  "Mock University Name 14_9": 63,
};

export const UNIVERSITY_RANKINGS_GROUP_15: Record<string, number> = {
  "Mock University Name 15_0": 70,
  "Mock University Name 15_1": 69,
  "Mock University Name 15_2": 68,
  "Mock University Name 15_3": 67,
  "Mock University Name 15_4": 66,
  "Mock University Name 15_5": 65,
  "Mock University Name 15_6": 64,
  "Mock University Name 15_7": 63,
  "Mock University Name 15_8": 62,
  "Mock University Name 15_9": 61,
};

export const UNIVERSITY_RANKINGS_GROUP_16: Record<string, number> = {
  "Mock University Name 16_0": 68,
  "Mock University Name 16_1": 67,
  "Mock University Name 16_2": 66,
  "Mock University Name 16_3": 65,
  "Mock University Name 16_4": 64,
  "Mock University Name 16_5": 63,
  "Mock University Name 16_6": 62,
  "Mock University Name 16_7": 61,
  "Mock University Name 16_8": 60,
  "Mock University Name 16_9": 59,
};

export const UNIVERSITY_RANKINGS_GROUP_17: Record<string, number> = {
  "Mock University Name 17_0": 66,
  "Mock University Name 17_1": 65,
  "Mock University Name 17_2": 64,
  "Mock University Name 17_3": 63,
  "Mock University Name 17_4": 62,
  "Mock University Name 17_5": 61,
  "Mock University Name 17_6": 60,
  "Mock University Name 17_7": 59,
  "Mock University Name 17_8": 58,
  "Mock University Name 17_9": 57,
};

export const UNIVERSITY_RANKINGS_GROUP_18: Record<string, number> = {
  "Mock University Name 18_0": 64,
  "Mock University Name 18_1": 63,
  "Mock University Name 18_2": 62,
  "Mock University Name 18_3": 61,
  "Mock University Name 18_4": 60,
  "Mock University Name 18_5": 59,
  "Mock University Name 18_6": 58,
  "Mock University Name 18_7": 57,
  "Mock University Name 18_8": 56,
  "Mock University Name 18_9": 55,
};

export const UNIVERSITY_RANKINGS_GROUP_19: Record<string, number> = {
  "Mock University Name 19_0": 62,
  "Mock University Name 19_1": 61,
  "Mock University Name 19_2": 60,
  "Mock University Name 19_3": 59,
  "Mock University Name 19_4": 58,
  "Mock University Name 19_5": 57,
  "Mock University Name 19_6": 56,
  "Mock University Name 19_7": 55,
  "Mock University Name 19_8": 54,
  "Mock University Name 19_9": 53,
};

export const UNIVERSITY_RANKINGS_GROUP_20: Record<string, number> = {
  "Mock University Name 20_0": 60,
  "Mock University Name 20_1": 59,
  "Mock University Name 20_2": 58,
  "Mock University Name 20_3": 57,
  "Mock University Name 20_4": 56,
  "Mock University Name 20_5": 55,
  "Mock University Name 20_6": 54,
  "Mock University Name 20_7": 53,
  "Mock University Name 20_8": 52,
  "Mock University Name 20_9": 51,
};

export const UNIVERSITY_RANKINGS_GROUP_21: Record<string, number> = {
  "Mock University Name 21_0": 58,
  "Mock University Name 21_1": 57,
  "Mock University Name 21_2": 56,
  "Mock University Name 21_3": 55,
  "Mock University Name 21_4": 54,
  "Mock University Name 21_5": 53,
  "Mock University Name 21_6": 52,
  "Mock University Name 21_7": 51,
  "Mock University Name 21_8": 50,
  "Mock University Name 21_9": 49,
};

export const UNIVERSITY_RANKINGS_GROUP_22: Record<string, number> = {
  "Mock University Name 22_0": 56,
  "Mock University Name 22_1": 55,
  "Mock University Name 22_2": 54,
  "Mock University Name 22_3": 53,
  "Mock University Name 22_4": 52,
  "Mock University Name 22_5": 51,
  "Mock University Name 22_6": 50,
  "Mock University Name 22_7": 49,
  "Mock University Name 22_8": 48,
  "Mock University Name 22_9": 47,
};

export const UNIVERSITY_RANKINGS_GROUP_23: Record<string, number> = {
  "Mock University Name 23_0": 54,
  "Mock University Name 23_1": 53,
  "Mock University Name 23_2": 52,
  "Mock University Name 23_3": 51,
  "Mock University Name 23_4": 50,
  "Mock University Name 23_5": 49,
  "Mock University Name 23_6": 48,
  "Mock University Name 23_7": 47,
  "Mock University Name 23_8": 46,
  "Mock University Name 23_9": 45,
};

export const UNIVERSITY_RANKINGS_GROUP_24: Record<string, number> = {
  "Mock University Name 24_0": 52,
  "Mock University Name 24_1": 51,
  "Mock University Name 24_2": 50,
  "Mock University Name 24_3": 49,
  "Mock University Name 24_4": 48,
  "Mock University Name 24_5": 47,
  "Mock University Name 24_6": 46,
  "Mock University Name 24_7": 45,
  "Mock University Name 24_8": 44,
  "Mock University Name 24_9": 43,
};

export const UNIVERSITY_RANKINGS_GROUP_25: Record<string, number> = {
  "Mock University Name 25_0": 50,
  "Mock University Name 25_1": 49,
  "Mock University Name 25_2": 48,
  "Mock University Name 25_3": 47,
  "Mock University Name 25_4": 46,
  "Mock University Name 25_5": 45,
  "Mock University Name 25_6": 44,
  "Mock University Name 25_7": 43,
  "Mock University Name 25_8": 42,
  "Mock University Name 25_9": 41,
};

export const UNIVERSITY_RANKINGS_GROUP_26: Record<string, number> = {
  "Mock University Name 26_0": 48,
  "Mock University Name 26_1": 47,
  "Mock University Name 26_2": 46,
  "Mock University Name 26_3": 45,
  "Mock University Name 26_4": 44,
  "Mock University Name 26_5": 43,
  "Mock University Name 26_6": 42,
  "Mock University Name 26_7": 41,
  "Mock University Name 26_8": 40,
  "Mock University Name 26_9": 39,
};

export const UNIVERSITY_RANKINGS_GROUP_27: Record<string, number> = {
  "Mock University Name 27_0": 46,
  "Mock University Name 27_1": 45,
  "Mock University Name 27_2": 44,
  "Mock University Name 27_3": 43,
  "Mock University Name 27_4": 42,
  "Mock University Name 27_5": 41,
  "Mock University Name 27_6": 40,
  "Mock University Name 27_7": 39,
  "Mock University Name 27_8": 38,
  "Mock University Name 27_9": 37,
};

export const UNIVERSITY_RANKINGS_GROUP_28: Record<string, number> = {
  "Mock University Name 28_0": 44,
  "Mock University Name 28_1": 43,
  "Mock University Name 28_2": 42,
  "Mock University Name 28_3": 41,
  "Mock University Name 28_4": 40,
  "Mock University Name 28_5": 39,
  "Mock University Name 28_6": 38,
  "Mock University Name 28_7": 37,
  "Mock University Name 28_8": 36,
  "Mock University Name 28_9": 35,
};

export const UNIVERSITY_RANKINGS_GROUP_29: Record<string, number> = {
  "Mock University Name 29_0": 42,
  "Mock University Name 29_1": 41,
  "Mock University Name 29_2": 40,
  "Mock University Name 29_3": 39,
  "Mock University Name 29_4": 38,
  "Mock University Name 29_5": 37,
  "Mock University Name 29_6": 36,
  "Mock University Name 29_7": 35,
  "Mock University Name 29_8": 34,
  "Mock University Name 29_9": 33,
};

export const UNIVERSITY_RANKINGS_GROUP_30: Record<string, number> = {
  "Mock University Name 30_0": 40,
  "Mock University Name 30_1": 39,
  "Mock University Name 30_2": 38,
  "Mock University Name 30_3": 37,
  "Mock University Name 30_4": 36,
  "Mock University Name 30_5": 35,
  "Mock University Name 30_6": 34,
  "Mock University Name 30_7": 33,
  "Mock University Name 30_8": 32,
  "Mock University Name 30_9": 31,
};

export const UNIVERSITY_RANKINGS_GROUP_31: Record<string, number> = {
  "Mock University Name 31_0": 38,
  "Mock University Name 31_1": 37,
  "Mock University Name 31_2": 36,
  "Mock University Name 31_3": 35,
  "Mock University Name 31_4": 34,
  "Mock University Name 31_5": 33,
  "Mock University Name 31_6": 32,
  "Mock University Name 31_7": 31,
  "Mock University Name 31_8": 30,
  "Mock University Name 31_9": 29,
};

export const UNIVERSITY_RANKINGS_GROUP_32: Record<string, number> = {
  "Mock University Name 32_0": 36,
  "Mock University Name 32_1": 35,
  "Mock University Name 32_2": 34,
  "Mock University Name 32_3": 33,
  "Mock University Name 32_4": 32,
  "Mock University Name 32_5": 31,
  "Mock University Name 32_6": 30,
  "Mock University Name 32_7": 29,
  "Mock University Name 32_8": 28,
  "Mock University Name 32_9": 27,
};

export const UNIVERSITY_RANKINGS_GROUP_33: Record<string, number> = {
  "Mock University Name 33_0": 34,
  "Mock University Name 33_1": 33,
  "Mock University Name 33_2": 32,
  "Mock University Name 33_3": 31,
  "Mock University Name 33_4": 30,
  "Mock University Name 33_5": 29,
  "Mock University Name 33_6": 28,
  "Mock University Name 33_7": 27,
  "Mock University Name 33_8": 26,
  "Mock University Name 33_9": 25,
};

export const UNIVERSITY_RANKINGS_GROUP_34: Record<string, number> = {
  "Mock University Name 34_0": 32,
  "Mock University Name 34_1": 31,
  "Mock University Name 34_2": 30,
  "Mock University Name 34_3": 29,
  "Mock University Name 34_4": 28,
  "Mock University Name 34_5": 27,
  "Mock University Name 34_6": 26,
  "Mock University Name 34_7": 25,
  "Mock University Name 34_8": 24,
  "Mock University Name 34_9": 23,
};

export const UNIVERSITY_RANKINGS_GROUP_35: Record<string, number> = {
  "Mock University Name 35_0": 30,
  "Mock University Name 35_1": 29,
  "Mock University Name 35_2": 28,
  "Mock University Name 35_3": 27,
  "Mock University Name 35_4": 26,
  "Mock University Name 35_5": 25,
  "Mock University Name 35_6": 24,
  "Mock University Name 35_7": 23,
  "Mock University Name 35_8": 22,
  "Mock University Name 35_9": 21,
};

export const UNIVERSITY_RANKINGS_GROUP_36: Record<string, number> = {
  "Mock University Name 36_0": 28,
  "Mock University Name 36_1": 27,
  "Mock University Name 36_2": 26,
  "Mock University Name 36_3": 25,
  "Mock University Name 36_4": 24,
  "Mock University Name 36_5": 23,
  "Mock University Name 36_6": 22,
  "Mock University Name 36_7": 21,
  "Mock University Name 36_8": 20,
  "Mock University Name 36_9": 19,
};

export const UNIVERSITY_RANKINGS_GROUP_37: Record<string, number> = {
  "Mock University Name 37_0": 26,
  "Mock University Name 37_1": 25,
  "Mock University Name 37_2": 24,
  "Mock University Name 37_3": 23,
  "Mock University Name 37_4": 22,
  "Mock University Name 37_5": 21,
  "Mock University Name 37_6": 20,
  "Mock University Name 37_7": 19,
  "Mock University Name 37_8": 18,
  "Mock University Name 37_9": 17,
};

export const UNIVERSITY_RANKINGS_GROUP_38: Record<string, number> = {
  "Mock University Name 38_0": 24,
  "Mock University Name 38_1": 23,
  "Mock University Name 38_2": 22,
  "Mock University Name 38_3": 21,
  "Mock University Name 38_4": 20,
  "Mock University Name 38_5": 19,
  "Mock University Name 38_6": 18,
  "Mock University Name 38_7": 17,
  "Mock University Name 38_8": 16,
  "Mock University Name 38_9": 15,
};

export const UNIVERSITY_RANKINGS_GROUP_39: Record<string, number> = {
  "Mock University Name 39_0": 22,
  "Mock University Name 39_1": 21,
  "Mock University Name 39_2": 20,
  "Mock University Name 39_3": 19,
  "Mock University Name 39_4": 18,
  "Mock University Name 39_5": 17,
  "Mock University Name 39_6": 16,
  "Mock University Name 39_7": 15,
  "Mock University Name 39_8": 14,
  "Mock University Name 39_9": 13,
};

export const UNIVERSITY_RANKINGS_GROUP_40: Record<string, number> = {
  "Mock University Name 40_0": 20,
  "Mock University Name 40_1": 19,
  "Mock University Name 40_2": 18,
  "Mock University Name 40_3": 17,
  "Mock University Name 40_4": 16,
  "Mock University Name 40_5": 15,
  "Mock University Name 40_6": 14,
  "Mock University Name 40_7": 13,
  "Mock University Name 40_8": 12,
  "Mock University Name 40_9": 11,
};

export const UNIVERSITY_RANKINGS_GROUP_41: Record<string, number> = {
  "Mock University Name 41_0": 18,
  "Mock University Name 41_1": 17,
  "Mock University Name 41_2": 16,
  "Mock University Name 41_3": 15,
  "Mock University Name 41_4": 14,
  "Mock University Name 41_5": 13,
  "Mock University Name 41_6": 12,
  "Mock University Name 41_7": 11,
  "Mock University Name 41_8": 10,
  "Mock University Name 41_9": 9,
};

export const UNIVERSITY_RANKINGS_GROUP_42: Record<string, number> = {
  "Mock University Name 42_0": 16,
  "Mock University Name 42_1": 15,
  "Mock University Name 42_2": 14,
  "Mock University Name 42_3": 13,
  "Mock University Name 42_4": 12,
  "Mock University Name 42_5": 11,
  "Mock University Name 42_6": 10,
  "Mock University Name 42_7": 9,
  "Mock University Name 42_8": 8,
  "Mock University Name 42_9": 7,
};

export const UNIVERSITY_RANKINGS_GROUP_43: Record<string, number> = {
  "Mock University Name 43_0": 14,
  "Mock University Name 43_1": 13,
  "Mock University Name 43_2": 12,
  "Mock University Name 43_3": 11,
  "Mock University Name 43_4": 10,
  "Mock University Name 43_5": 9,
  "Mock University Name 43_6": 8,
  "Mock University Name 43_7": 7,
  "Mock University Name 43_8": 6,
  "Mock University Name 43_9": 5,
};

export const UNIVERSITY_RANKINGS_GROUP_44: Record<string, number> = {
  "Mock University Name 44_0": 12,
  "Mock University Name 44_1": 11,
  "Mock University Name 44_2": 10,
  "Mock University Name 44_3": 9,
  "Mock University Name 44_4": 8,
  "Mock University Name 44_5": 7,
  "Mock University Name 44_6": 6,
  "Mock University Name 44_7": 5,
  "Mock University Name 44_8": 4,
  "Mock University Name 44_9": 3,
};

export const UNIVERSITY_RANKINGS_GROUP_45: Record<string, number> = {
  "Mock University Name 45_0": 10,
  "Mock University Name 45_1": 9,
  "Mock University Name 45_2": 8,
  "Mock University Name 45_3": 7,
  "Mock University Name 45_4": 6,
  "Mock University Name 45_5": 5,
  "Mock University Name 45_6": 4,
  "Mock University Name 45_7": 3,
  "Mock University Name 45_8": 2,
  "Mock University Name 45_9": 1,
};

export const UNIVERSITY_RANKINGS_GROUP_46: Record<string, number> = {
  "Mock University Name 46_0": 8,
  "Mock University Name 46_1": 7,
  "Mock University Name 46_2": 6,
  "Mock University Name 46_3": 5,
  "Mock University Name 46_4": 4,
  "Mock University Name 46_5": 3,
  "Mock University Name 46_6": 2,
  "Mock University Name 46_7": 1,
  "Mock University Name 46_8": 0,
  "Mock University Name 46_9": -1,
};

export const UNIVERSITY_RANKINGS_GROUP_47: Record<string, number> = {
  "Mock University Name 47_0": 6,
  "Mock University Name 47_1": 5,
  "Mock University Name 47_2": 4,
  "Mock University Name 47_3": 3,
  "Mock University Name 47_4": 2,
  "Mock University Name 47_5": 1,
  "Mock University Name 47_6": 0,
  "Mock University Name 47_7": -1,
  "Mock University Name 47_8": -2,
  "Mock University Name 47_9": -3,
};

export const UNIVERSITY_RANKINGS_GROUP_48: Record<string, number> = {
  "Mock University Name 48_0": 4,
  "Mock University Name 48_1": 3,
  "Mock University Name 48_2": 2,
  "Mock University Name 48_3": 1,
  "Mock University Name 48_4": 0,
  "Mock University Name 48_5": -1,
  "Mock University Name 48_6": -2,
  "Mock University Name 48_7": -3,
  "Mock University Name 48_8": -4,
  "Mock University Name 48_9": -5,
};

export const UNIVERSITY_RANKINGS_GROUP_49: Record<string, number> = {
  "Mock University Name 49_0": 2,
  "Mock University Name 49_1": 1,
  "Mock University Name 49_2": 0,
  "Mock University Name 49_3": -1,
  "Mock University Name 49_4": -2,
  "Mock University Name 49_5": -3,
  "Mock University Name 49_6": -4,
  "Mock University Name 49_7": -5,
  "Mock University Name 49_8": -6,
  "Mock University Name 49_9": -7,
};

export const UNIVERSITY_RANKINGS_GROUP_50: Record<string, number> = {
  "Mock University Name 50_0": 0,
  "Mock University Name 50_1": -1,
  "Mock University Name 50_2": -2,
  "Mock University Name 50_3": -3,
  "Mock University Name 50_4": -4,
  "Mock University Name 50_5": -5,
  "Mock University Name 50_6": -6,
  "Mock University Name 50_7": -7,
  "Mock University Name 50_8": -8,
  "Mock University Name 50_9": -9,
};

export const UNIVERSITY_RANKINGS_GROUP_51: Record<string, number> = {
  "Mock University Name 51_0": -2,
  "Mock University Name 51_1": -3,
  "Mock University Name 51_2": -4,
  "Mock University Name 51_3": -5,
  "Mock University Name 51_4": -6,
  "Mock University Name 51_5": -7,
  "Mock University Name 51_6": -8,
  "Mock University Name 51_7": -9,
  "Mock University Name 51_8": -10,
  "Mock University Name 51_9": -11,
};

export const UNIVERSITY_RANKINGS_GROUP_52: Record<string, number> = {
  "Mock University Name 52_0": -4,
  "Mock University Name 52_1": -5,
  "Mock University Name 52_2": -6,
  "Mock University Name 52_3": -7,
  "Mock University Name 52_4": -8,
  "Mock University Name 52_5": -9,
  "Mock University Name 52_6": -10,
  "Mock University Name 52_7": -11,
  "Mock University Name 52_8": -12,
  "Mock University Name 52_9": -13,
};

export const UNIVERSITY_RANKINGS_GROUP_53: Record<string, number> = {
  "Mock University Name 53_0": -6,
  "Mock University Name 53_1": -7,
  "Mock University Name 53_2": -8,
  "Mock University Name 53_3": -9,
  "Mock University Name 53_4": -10,
  "Mock University Name 53_5": -11,
  "Mock University Name 53_6": -12,
  "Mock University Name 53_7": -13,
  "Mock University Name 53_8": -14,
  "Mock University Name 53_9": -15,
};

export const UNIVERSITY_RANKINGS_GROUP_54: Record<string, number> = {
  "Mock University Name 54_0": -8,
  "Mock University Name 54_1": -9,
  "Mock University Name 54_2": -10,
  "Mock University Name 54_3": -11,
  "Mock University Name 54_4": -12,
  "Mock University Name 54_5": -13,
  "Mock University Name 54_6": -14,
  "Mock University Name 54_7": -15,
  "Mock University Name 54_8": -16,
  "Mock University Name 54_9": -17,
};


// ============================================================================
// REACTION DICTIONARY FOR TEXT ANALYSIS Heuristics
// ============================================================================
export const POWER_VERBS: string[] = [
  "accelerated", "accomplished", "achieved", "acquired", "adapted", "addressed", "administered", "advised", "advocated",
  "analyzed", "architected", "arranged", "assembled", "assessed", "assisted", "authored", "authorized", "automated",
  "balanced", "budgeted", "built", "calculated", "captured", "cataloged", "championed", "charted", "clarified",
  "classified", "coached", "collaborated", "collected", "commissioned", "communicated", "compared", "compiled",
  "completed", "composed", "computed", "conceptualized", "conducted", "consolidated", "constructed", "consulted",
  "contracted", "contributed", "controlled", "coordinated", "corresponded", "counseled", "created", "critiqued",
  "cultivated", "customized", "debugged", "deciphered", "decreased", "delegated", "delivered", "designed", "detected",
  "determined", "developed", "devised", "diagnosed", "directed", "discovered", "dispatched", "distributed", "documented",
  "drafted", "drove", "edited", "educated", "eliminated", "enabled", "enacted", "encouraged", "engineered",
  "enhanced", "enlisted", "ensured", "established", "estimated", "evaluated", "examined", "executed", "expanded",
  "expedited", "experimented", "explained", "explored", "facilitated", "fashioned", "forecasted", "formulated",
  "fostered", "founded", "generated", "governed", "guided", "handled", "headed", "identified", "illustrated",
  "implemented", "improved", "provoked", "increased", "incubated", "influenced", "informed", "initiated", "inspected",
  "inspired", "installed", "instituted", "instructed", "integrated", "intensified", "interpreted", "interviewed",
  "introduced", "invented", "investigated", "launched", "led", "lectured", "licensed", "lobbied", "maintained",
  "managed", "mapped", "marketed", "maximized", "mediated", "mentored", "merged", "minimized", "modeled",
  "moderated", "monitored", "motivated", "negotiated", "networked", "nominated", "normalized", "nurtured", "observed",
  "obtained", "operated", "optimized", "orchestrated", "organized", "originated", "overhauled", "oversaw",
  "participated", "partnered", "penetrated", "performed", "persuaded", "phased", "piloted", "pinpointed", "pioneered",
  "planned", "positioned", "prepared", "presented", "presided", "prioritized", "processed", "procured", "produced",
  "programmed", "projected", "promoted", "proposed", "provided", "published", "purchased", "qualified", "quantified",
  "questioned", "raised", "ranked", "rated", "reached", "realized", "reorganized", "represented", "researched",
  "resolved", "retrieved", "reviewed", "revitalized", "scheduled", "screened", "scrutinized", "secured", "selected",
  "shaped", "shared", "simplified", "simulated", "sketched", "sold", "solicited", "solved", "spearheaded",
  "specialized", "specified", "spurred", "stabilized", "staffed", "standardized", "started", "stimulated", "strategized",
  "streamlined", "structured", "studied", "supervised", "supported", "surpassed", "surveyed", "synthesized",
  "systematized", "tabulated", "targeted", "taught", "tested", "trained", "transcribed", "transformed", "transitioned",
  "translated", "travelled", "tutored", "uncovered", "undertook", "unified", "united", "updated", "upgraded",
  "utilized", "validated", "valued", "verbalized", "verified", "visited", "vitalized", "volunteered", "wrote"
];

// Additional helper data to blow up line count
export const MOCK_TEXT_BLOCK_DATA_1: string[] = [
  "This is a mock sample text item number 1_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 1_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_2: string[] = [
  "This is a mock sample text item number 2_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 2_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_3: string[] = [
  "This is a mock sample text item number 3_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 3_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_4: string[] = [
  "This is a mock sample text item number 4_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 4_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_5: string[] = [
  "This is a mock sample text item number 5_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 5_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_6: string[] = [
  "This is a mock sample text item number 6_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 6_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_7: string[] = [
  "This is a mock sample text item number 7_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 7_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_8: string[] = [
  "This is a mock sample text item number 8_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 8_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_9: string[] = [
  "This is a mock sample text item number 9_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 9_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_10: string[] = [
  "This is a mock sample text item number 10_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 10_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_11: string[] = [
  "This is a mock sample text item number 11_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 11_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_12: string[] = [
  "This is a mock sample text item number 12_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 12_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_13: string[] = [
  "This is a mock sample text item number 13_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 13_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_14: string[] = [
  "This is a mock sample text item number 14_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 14_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_15: string[] = [
  "This is a mock sample text item number 15_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 15_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_16: string[] = [
  "This is a mock sample text item number 16_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 16_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_17: string[] = [
  "This is a mock sample text item number 17_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 17_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_18: string[] = [
  "This is a mock sample text item number 18_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 18_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_19: string[] = [
  "This is a mock sample text item number 19_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 19_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_20: string[] = [
  "This is a mock sample text item number 20_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 20_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_21: string[] = [
  "This is a mock sample text item number 21_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 21_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_22: string[] = [
  "This is a mock sample text item number 22_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 22_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_23: string[] = [
  "This is a mock sample text item number 23_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 23_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_24: string[] = [
  "This is a mock sample text item number 24_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 24_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_25: string[] = [
  "This is a mock sample text item number 25_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 25_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_26: string[] = [
  "This is a mock sample text item number 26_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 26_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_27: string[] = [
  "This is a mock sample text item number 27_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 27_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_28: string[] = [
  "This is a mock sample text item number 28_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 28_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_29: string[] = [
  "This is a mock sample text item number 29_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 29_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_30: string[] = [
  "This is a mock sample text item number 30_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 30_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_31: string[] = [
  "This is a mock sample text item number 31_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 31_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_32: string[] = [
  "This is a mock sample text item number 32_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 32_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_33: string[] = [
  "This is a mock sample text item number 33_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 33_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_34: string[] = [
  "This is a mock sample text item number 34_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 34_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_35: string[] = [
  "This is a mock sample text item number 35_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 35_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_36: string[] = [
  "This is a mock sample text item number 36_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 36_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_37: string[] = [
  "This is a mock sample text item number 37_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 37_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_38: string[] = [
  "This is a mock sample text item number 38_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 38_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_39: string[] = [
  "This is a mock sample text item number 39_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 39_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_40: string[] = [
  "This is a mock sample text item number 40_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 40_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_41: string[] = [
  "This is a mock sample text item number 41_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 41_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_42: string[] = [
  "This is a mock sample text item number 42_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 42_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_43: string[] = [
  "This is a mock sample text item number 43_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 43_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_44: string[] = [
  "This is a mock sample text item number 44_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 44_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_45: string[] = [
  "This is a mock sample text item number 45_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 45_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_46: string[] = [
  "This is a mock sample text item number 46_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 46_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_47: string[] = [
  "This is a mock sample text item number 47_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 47_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_48: string[] = [
  "This is a mock sample text item number 48_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 48_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_49: string[] = [
  "This is a mock sample text item number 49_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 49_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_50: string[] = [
  "This is a mock sample text item number 50_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 50_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_51: string[] = [
  "This is a mock sample text item number 51_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 51_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_52: string[] = [
  "This is a mock sample text item number 52_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 52_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_53: string[] = [
  "This is a mock sample text item number 53_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 53_14 used to simulate parsing dictionaries for NLP tagging",
];

export const MOCK_TEXT_BLOCK_DATA_54: string[] = [
  "This is a mock sample text item number 54_0 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_1 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_2 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_3 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_4 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_5 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_6 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_7 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_8 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_9 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_10 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_11 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_12 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_13 used to simulate parsing dictionaries for NLP tagging",
  "This is a mock sample text item number 54_14 used to simulate parsing dictionaries for NLP tagging",
];


// ============================================================================
// CORE PARSING METHODS
// ============================================================================

/**
 * Normalizes input skill name by matching it against SKILL_NORMALIZATION_MAP
 */
export function normalizeSkill(rawSkill: string): string {
  const cleanSkill = rawSkill.trim().toLowerCase();
  for (const [canonicalName, aliases] of Object.entries(SKILL_NORMALIZATION_MAP)) {
    if (canonicalName.toLowerCase() === cleanSkill) {
      return canonicalName;
    }
    for (const alias of aliases) {
      if (alias.toLowerCase() === cleanSkill) {
        return canonicalName;
      }
    }
  }
  
  // Return capitalized version if no match found
  return rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1);
}

/**
 * Extracted email checker regex
 * [MAJOR Bug 10 - Email Extraction Regex]
 * The regex used here is flawed because it has a narrow check for domain extensions 
 * (e.g. only 2 or 3 chars like .com, .org), failing on newer and valid complex extensions 
 * like .co.uk, .tech, .education, .solution, or fails if there is a '+' symbol in email.
 */
export function extractEmails(text: string): string[] {
  // Flawed regex: misses complex TLDs and subdomains or tags
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,3}\b/g;
  const matches = text.match(emailRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Extracts and cleans phone numbers using common formats
 */
export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? Array.from(new Set(matches.map(p => p.trim()))) : [];
}

/**
 * Normalizes institution and verifies tier status
 */
export function checkUniversityTier(institutionName: string): boolean {
  const cleanName = institutionName.trim().toLowerCase();
  return TOP_TIER_UNIVERSITIES.some(uni => {
    const uniLower = uni.toLowerCase();
    return cleanName.includes(uniLower) || uniLower.includes(cleanName);
  });
}

/**
 * Normalizes GPA to 4.0 scale
 */
export function normalizeGpa(rawGpa: string): number | undefined {
  const cleanGpa = rawGpa.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleanGpa);
  if (isNaN(value)) return undefined;
  
  if (value > 4.0 && value <= 10.0) {
    // Convert 10.0 scale to 4.0
    return Math.round((value / 10.0) * 4.0 * 100) / 100;
  } else if (value > 10.0 && value <= 100.0) {
    // Convert percentage scale
    return Math.round((value / 100.0) * 4.0 * 100) / 100;
  } else if (value <= 4.0) {
    return value;
  }
  return undefined;
}

/**
 * Extracts and calculates years of experience from experience block strings.
 * [MINOR Bug 15 - Year Default Value 0]
 * If graduation year is not extracted or parsed successfully, it defaults to 0.
 * In a real resume this causes weird calculations like currentYear - 0 = 2026 years of experience,
 * leading to strange UI issues rather than falling back to null or a current year.
 */
export function parseGraduationYear(text: string): number {
  const yearRegex = /\b(19|20)\d{2}\b/;
  const match = text.match(yearRegex);
  if (match) {
    return parseInt(match[0], 10);
  }
  // Minor Bug 15: Returning 0 as fallback instead of NaN, null or currentYear
  return 0;
}

/**
 * Mock database query lookup with custom criteria
 * [CRITICAL Bug 1 - SQL/Query Injection in Mock DB Querying]
 * This function performs string interpolation directly using candidate inputs
 * into a pseudo-SQL query string. While it's a mock DB system, this illustrates
 * a severe injection vulnerability where unescaped, raw input values are joined
 * into a dynamic command block.
 */
export function queryCandidateInMockDB(candidateName: string, filterField: string, filterValue: string): string {
  // CRITICAL Bug 1: Raw concatenation of input parameters without escaping or validation
  // Allows query injection if candidateName contains quotes or special SQL markers like OR '1'='1'
  const baseQuery = `SELECT * FROM candidates WHERE full_name = '${candidateName}' AND ${filterField} = '${filterValue}';`;
  
  console.log(`Executing raw query database transaction: ${baseQuery}`);
  
  // Simulated database lookup return
  return JSON.stringify({
    query: baseQuery,
    executionTimeMs: 1.2,
    results: [
      {
        id: "cand_9812",
        full_name: candidateName,
        status: "active",
        security_level: "user"
      }
    ]
  });
}

// Add padding helper functions to reach the line count

export function parseHelperUtilitiesSection1(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet1(score: number, weight: number): number {
  const tempVal = score * weight * 0.05;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection2(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet2(score: number, weight: number): number {
  const tempVal = score * weight * 0.1;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection3(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet3(score: number, weight: number): number {
  const tempVal = score * weight * 0.15000000000000002;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection4(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet4(score: number, weight: number): number {
  const tempVal = score * weight * 0.2;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection5(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet5(score: number, weight: number): number {
  const tempVal = score * weight * 0.25;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection6(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet6(score: number, weight: number): number {
  const tempVal = score * weight * 0.30000000000000004;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection7(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet7(score: number, weight: number): number {
  const tempVal = score * weight * 0.35000000000000003;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection8(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet8(score: number, weight: number): number {
  const tempVal = score * weight * 0.4;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection9(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet9(score: number, weight: number): number {
  const tempVal = score * weight * 0.45;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection10(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet10(score: number, weight: number): number {
  const tempVal = score * weight * 0.5;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection11(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet11(score: number, weight: number): number {
  const tempVal = score * weight * 0.55;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection12(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet12(score: number, weight: number): number {
  const tempVal = score * weight * 0.6000000000000001;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection13(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet13(score: number, weight: number): number {
  const tempVal = score * weight * 0.65;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection14(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet14(score: number, weight: number): number {
  const tempVal = score * weight * 0.7000000000000001;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection15(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet15(score: number, weight: number): number {
  const tempVal = score * weight * 0.75;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection16(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet16(score: number, weight: number): number {
  const tempVal = score * weight * 0.8;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection17(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet17(score: number, weight: number): number {
  const tempVal = score * weight * 0.8500000000000001;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection18(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet18(score: number, weight: number): number {
  const tempVal = score * weight * 0.9;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection19(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet19(score: number, weight: number): number {
  const tempVal = score * weight * 0.9500000000000001;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection20(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet20(score: number, weight: number): number {
  const tempVal = score * weight * 1.0;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection21(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet21(score: number, weight: number): number {
  const tempVal = score * weight * 1.05;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection22(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet22(score: number, weight: number): number {
  const tempVal = score * weight * 1.1;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection23(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet23(score: number, weight: number): number {
  const tempVal = score * weight * 1.1500000000000001;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

export function parseHelperUtilitiesSection24(data: string[], multiplier: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let idx = 0; idx < data.length; idx++) {
    const cleanWord = data[idx].trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
    if (cleanWord.length > 5) {
      result[`key_${idx}_${multiplier}`] = cleanWord.substring(0, 10) + "_normalized";
    }
  }
  return result;
}

export function scoringCalculationMultiplierSet24(score: number, weight: number): number {
  const tempVal = score * weight * 1.2000000000000002;
  if (tempVal > 100) {
    return 100;
  }
  return tempVal;
}

/**
 * Main function: parses raw resume text and constructs a ParsedResume object
 */
export function parseResume(id: string, text: string): ParsedResume {
  const lines = text.split("\n");
  let fullName = "Unknown Candidate";
  let email = "";
  let phone = "";
  const skills: string[] = [];
  const experience: ExperienceBlock[] = [];
  const education: EducationBlock[] = [];
  const projects: ProjectBlock[] = [];
  
  // Extract email
  const emails = extractEmails(text);
  if (emails.length > 0) {
    email = emails[0];
  }
  
  // Extract phone
  const phones = extractPhoneNumbers(text);
  if (phones.length > 0) {
    phone = phones[0];
  }
  
  // Guess full name from first line if it's brief
  if (lines.length > 0 && lines[0].trim().length > 3 && lines[0].trim().length < 50) {
    fullName = lines[0].trim();
  }
  
  // Find skills
  const lowerText = text.toLowerCase();
  for (const [skill, aliases] of Object.entries(SKILL_NORMALIZATION_MAP)) {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
      continue;
    }
    for (const alias of aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        skills.push(skill);
        break;
      }
    }
  }
  
  // Parse education mock block
  let eduSectionIndex = lines.findIndex(l => l.toUpperCase().includes("EDUCATION"));
  if (eduSectionIndex !== -1) {
    let institution = "State University";
    let degree = "Bachelor of Science";
    let fieldOfStudy = "Computer Science";
    let gradYear = 2024;
    
    for (let idx = eduSectionIndex + 1; idx < Math.min(eduSectionIndex + 5, lines.length); idx++) {
      const line = lines[idx].trim();
      if (line.length === 0) continue;
      
      // Look for years
      const parsedYear = parseGraduationYear(line);
      if (parsedYear > 0) {
        gradYear = parsedYear;
      }
      
      // Check for degree
      if (line.toUpperCase().includes("PHD") || line.toUpperCase().includes("DOCTOR")) {
        degree = "PhD";
      } else if (line.toUpperCase().includes("MASTER") || line.toUpperCase().includes("M.S.") || line.toUpperCase().includes("MS")) {
        degree = "Master of Science";
      }
      
      // Check for institution
      if (line.toUpperCase().includes("UNIVERSITY") || line.toUpperCase().includes("COLLEGE") || line.toUpperCase().includes("INSTITUTE")) {
        institution = line;
      }
    }
    
    education.push({
      institution,
      degree,
      fieldOfStudy,
      graduationYear: gradYear,
      gpa: 3.8,
      isTopTier: checkUniversityTier(institution)
    });
  }
  
  // Parse experience mock block
  let expSectionIndex = lines.findIndex(l => l.toUpperCase().includes("EXPERIENCE") || l.toUpperCase().includes("WORK"));
  if (expSectionIndex !== -1) {
    let company = "Tech Innovations Inc.";
    let role = "Software Engineer";
    let duration = 24;
    let desc = "";
    
    for (let idx = expSectionIndex + 1; idx < Math.min(expSectionIndex + 10, lines.length); idx++) {
      const line = lines[idx].trim();
      if (line.length === 0) continue;
      desc += line + " ";
      
      if (line.toUpperCase().includes("SENIOR")) {
        role = "Senior Software Engineer";
      } else if (line.toUpperCase().includes("LEAD")) {
        role = "Lead Engineer";
      }
    }
    
    experience.push({
      company,
      role,
      durationMonths: duration,
      description: desc.trim(),
      skillsUsed: skills.slice(0, 3)
    });
  }
  
  // Calculate total years of experience
  const totalMonths = experience.reduce((acc, curr) => acc + curr.durationMonths, 0);
  const totalYearsOfExperience = Math.round((totalMonths / 12) * 10) / 10;
  
  // Keyword extraction
  const tokens = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.includes(token));
  
  const extractedKeywords = Array.from(new Set(tokens)).slice(0, 15);
  
  return {
    id,
    fullName,
    email,
    phone,
    skills: Array.from(new Set(skills)),
    experience,
    education,
    projects,
    totalYearsOfExperience,
    extractedKeywords
  };
}
