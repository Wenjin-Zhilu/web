export interface Review {
  label: string;
  text: string;
  mentorSlug?: string;
}

export interface DimensionData {
  key: string;
  title: string;
  reviews: Review[];
}

export interface MentorCard {
  slug: string;
  displayTitle: "学长" | "学姐";
  major: string;
  year: string;
  oneLiner: string;
}

export interface CollegeData {
  name: string;
  majors: string[];
  mentorCount: number;
  aiSummary: string;
  dimensions: DimensionData[];
  pros: Review[];
  cons: Review[];
  mentors: MentorCard[];
}

export interface SchoolData {
  name: string;
  tags: string[];
  colleges: {
    name: string;
    majors: string[];
    mentorCount: number;
    aiSummary: string;
  }[];
}

export const DIM_TITLES: Record<string, string> = {
  career: "职业规划引导",
  teaching: "教学质量",
  life: "就读体验",
  care: "人文关怀",
  practice: "实践机会",
};

export const DIM_HINTS: Record<string, string> = {
  career: "升学 / 就业指导、讲座、导师资源",
  teaching: "老师水平、课程干货、考核公平度",
  life: "宿舍、校园、交通、周边商业",
  care: "报修响应、辅导员、心理咨询",
  practice: "科研、大创、企业合作、海外交流",
};
