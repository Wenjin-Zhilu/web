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
  slug: string;
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
  slug: string;
  name: string;
  tags: string[];
  colleges: CollegeData[];
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

export const SCHOOLS: SchoolData[] = [
  {
    slug: "sjtu",
    name: "上海交通大学",
    tags: ["985", "211", "双一流"],
    colleges: [
      {
        slug: "pji",
        name: "浦江国际学院",
        majors: ["电子与计算机工程", "电子信息工程"],
        mentorCount: 8,
        aiSummary:
          "8 位学长学姐普遍认可学院的国际化培养模式和科研资源，Advising Center 和海外交流项目是高频提及的亮点。教学质量评价两极分化——课程设计实用但部分老师水平一般。地理位置偏远是共识性的不足。",
        dimensions: [
          {
            key: "career",
            title: DIM_TITLES.career,
            reviews: [
              {
                label: "某学长 · 电子信息工程",
                mentorSlug: "m-pji-01",
                text: "学院的升学基本分为出国和保研两条路径，出国又有多种项目。每种路径和项目，学院都有丰富的讲座来介绍。此外，学院开设 Advising Center，advisor 都是走过不同道路的学长学姐，可以找他们获取经验和建议。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-02",
                text: "升学的讲座、就业招聘会等机会还是比较多的，不过我觉得这种东西还是更多得靠自己去找。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-03",
                text: "有专门的就业指导讲座和校友分享会，秋招季大厂基本都会来闵行做宣讲。低年级的职业规划引导偏少，需要主动。",
              },
            ],
          },
          {
            key: "teaching",
            title: DIM_TITLES.teaching,
            reviews: [
              {
                label: "某学长 · 电子信息工程",
                mentorSlug: "m-pji-01",
                text: "浦江国际学院相较于交大其他学院的一大特征是没有很多形式主义课程，每一门课只要认真学都有相当有用的收获。老师的教学质量良莠不齐，但平均水平可以接受。考核基本可以保证公平。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-02",
                text: "不可否认有小部分老师仍然认真负责，但是确实有很多比较陈旧、比较形式主义的内容。",
              },
              {
                label: "某学姐 · 电子与计算机工程",
                mentorSlug: "m-pji-04",
                text: "课程整体偏实用，项目制作业比较多。部分课的 lecture 质量一般，但 lab 和 project 确实能学到东西。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-05",
                text: "整体教学质量不错，尤其是专业核心课。部分公共基础课大班授课体验一般。期末给分还算公正。",
              },
            ],
          },
          {
            key: "life",
            title: DIM_TITLES.life,
            reviews: [
              {
                label: "某学长 · 电子信息工程",
                mentorSlug: "m-pji-01",
                text: "宿舍较为破旧但可以接受；交大地理位置相对偏远，但周围也有乐子可找，校园本身很美；学习环境很不错，有多个图书馆和自习楼；交通出行基本通过地铁，相对便利。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-02",
                text: "环境不错，图书馆比较多，宿舍有些比较一般，风景还可以，闵行周边商业不发达，交通不太便利。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-03",
                text: "食堂多且味道不错，校园又大又美，体育设施齐全。最大的问题就是离市区远。",
              },
            ],
          },
          {
            key: "care",
            title: DIM_TITLES.care,
            reviews: [
              {
                label: "某学长 · 电子信息工程",
                mentorSlug: "m-pji-01",
                text: "保卫处给到夯，在交大有任何问题都可以找保卫处，处理速度极快且很靠谱。有一次我凌晨急性肠胃炎，在昏迷之前打了保卫处电话，很快他们就来寝室楼接我送我去医院了。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-02",
                text: "看是什么方面的了。比较无关紧要的方面做的倒是比较好。",
              },
            ],
          },
          {
            key: "practice",
            title: DIM_TITLES.practice,
            reviews: [
              {
                label: "某学长 · 电子信息工程",
                mentorSlug: "m-pji-01",
                text: "有很多竞赛和科研机会。科研资源丰富，可以找到各个方向的老师。大创课题有很多，很多课题组都跟企业有合作。海外交流项目也相当多。",
              },
              {
                label: "某学长 · 电子与计算机工程",
                mentorSlug: "m-pji-02",
                text: "科研机会很多，很多教授还是比较欢迎本科生的。大创课题有很多，很多课题组都跟企业有合作。海外交流项目也相当多，尤其是密西根方向。",
              },
            ],
          },
        ],
        pros: [
          { label: "某学长 · 电子信息工程", mentorSlug: "m-pji-01", text: "食堂多且味道不错，校园又大又美，学风硬核严谨。" },
          { label: "某学长 · 电子与计算机工程", mentorSlug: "m-pji-02", text: "科研资源丰富，可以找到各个方向的老师；选择比较灵活，包容性比较强；交大的名头也不错，保研就业都还算有优势。" },
          { label: "某学长 · 电子与计算机工程", mentorSlug: "m-pji-03", text: "课程设计实用性强，项目经历在求职时帮助大。国际化氛围好，出国交流机会多。" },
        ],
        cons: [
          { label: "某学长 · 电子信息工程", mentorSlug: "m-pji-01", text: "地理位置偏僻，上课质量良莠不齐。" },
          { label: "某学长 · 电子与计算机工程", mentorSlug: "m-pji-02", text: "地理位置比较偏；人文关怀不足；课其实上的也一般，需要自己有自驱力。" },
        ],
        mentors: [
          { slug: "m-pji-01", displayTitle: "学长", major: "电子信息工程", year: "大三", oneLiner: "熟悉出国和保研两条路径，了解 ECE 方向课程和科研资源。" },
          { slug: "m-pji-02", displayTitle: "学长", major: "电子与计算机工程", year: "大二", oneLiner: "可以聊国际化培养模式和海外交流经历。" },
          { slug: "m-pji-03", displayTitle: "学长", major: "电子与计算机工程", year: "大三", oneLiner: "有大厂实习经验，擅长就业方向选择。" },
          { slug: "m-pji-04", displayTitle: "学姐", major: "电子与计算机工程", year: "大二", oneLiner: "了解项目制课程体验和女生在工科的真实感受。" },
        ],
      },
      {
        slug: "med",
        name: "医学院",
        majors: ["临床医学八年制", "临床医学五年制", "眼科学"],
        mentorCount: 3,
        aiSummary:
          "3 位学长学姐一致认可附属医院资源和临床教学质量。八年制免去考研压力是一大优势。共同的不足是学业压力极大、几乎没有空闲时间。",
        dimensions: [
          {
            key: "career",
            title: DIM_TITLES.career,
            reviews: [
              { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "医学院的职业路径比较明确，基本就是规培—住院医—主治这条线。学院会组织各科室的学长学姐分享经验，也有和附属医院的双向选择会。" },
              { label: "某学长 · 临床五年", mentorSlug: "m-med-02", text: "就业方面医学院还是比较有优势的，附属医院资源丰富。但五年制想留好医院竞争很激烈，基本都要读研。" },
            ],
          },
          {
            key: "teaching",
            title: DIM_TITLES.teaching,
            reviews: [
              { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "老师都是附属医院的主任或副主任医师，临床经验非常丰富。课程安排很满，前两年基础医学要背的东西非常多。考核严格但公平。" },
              { label: "某学姐 · 眼科学", mentorSlug: "m-med-03", text: "专业课老师很负责，临床实习带教质量高。基础课部分老师照本宣科，但整体教学水平在国内医学院里算很好的。" },
            ],
          },
          {
            key: "life",
            title: DIM_TITLES.life,
            reviews: [
              { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "医学院有自己的校区，生活圈相对独立。宿舍条件中等，食堂还行。实习期住在医院附近比较方便，但自由时间很少。" },
              { label: "某学长 · 临床五年", mentorSlug: "m-med-02", text: "大一大二在闵行，和其他学院一起。大三之后去医学院校区，离附属医院近。生活节奏变快，基本都在学习和实习。" },
            ],
          },
          {
            key: "care",
            title: DIM_TITLES.care,
            reviews: [
              { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "医学院辅导员相对负责，毕竟人数不算特别多。心理压力大的时候可以找心理咨询中心，但排队要等。同学之间互相扶持的氛围比较好。" },
            ],
          },
          {
            key: "practice",
            title: DIM_TITLES.practice,
            reviews: [
              { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "临床实习机会充足，附属医院包括瑞金、仁济、新华等三甲医院。科研方面，八年制有本硕博连读的科研训练，可以进课题组做项目。" },
              { label: "某学长 · 临床五年", mentorSlug: "m-med-02", text: "五年制的科研机会相对少一些，但大创和 SRTP 还是可以参加。实习轮转覆盖各个科室，能接触到很多不同方向。" },
            ],
          },
        ],
        pros: [
          { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "附属医院资源强大，临床教学质量高。八年制毕业直接博士学位，省去考研压力。" },
          { label: "某学长 · 临床五年", mentorSlug: "m-med-02", text: "交大医学院在上海口碑很好，实习和就业都有优势。同学整体素质高，学习氛围浓厚。" },
        ],
        cons: [
          { label: "某学姐 · 临床医学八年制", mentorSlug: "m-med-01", text: "学业压力非常大，几乎没有空闲时间。医学生的青春基本都在背书和实习中度过。" },
          { label: "某学长 · 临床五年", mentorSlug: "m-med-02", text: "五年制想留好医院必须考研，竞争压力大。规培期间收入很低，需要有心理准备。" },
        ],
        mentors: [
          { slug: "m-med-01", displayTitle: "学姐", major: "临床医学八年制", year: "大四", oneLiner: "本硕博连读，熟悉医学院学习节奏和附属医院实习情况。" },
          { slug: "m-med-02", displayTitle: "学长", major: "临床五年", year: "大三", oneLiner: "了解五年制和八年制差异，可以聊规培和考研选择。" },
          { slug: "m-med-03", displayTitle: "学姐", major: "眼科学", year: "研一", oneLiner: "本科保研，了解眼科方向和跨科室实习体验。" },
        ],
      },
      {
        slug: "math",
        name: "数学科学学院",
        majors: ["数学与应用数学"],
        mentorCount: 2,
        aiSummary:
          "2 位学姐都提到数学系课程难度高、GPA 不好拿，但数学功底扎实让转方向非常灵活——量化、CS、金融都可以走。",
        dimensions: [
          {
            key: "career",
            title: DIM_TITLES.career,
            reviews: [
              { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-01", text: "数院的出路比较多元，保研、出国、就业都有。量化金融和互联网是近几年比较热门的方向。学院本身的就业指导偏少，更多靠自己探索和学长学姐带路。" },
            ],
          },
          {
            key: "teaching",
            title: DIM_TITLES.teaching,
            reviews: [
              { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-01", text: "数学系的课程难度很高，尤其是分析和代数类课程。老师学术水平强，但有些课讲得比较抽象，需要自己花大量时间消化。考核偏难，GPA 不好拿。" },
              { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-02", text: "部分老师讲课很好，能把抽象概念讲清楚；也有些老师默认你已经会了大半内容。习题课和助教答疑是救命稻草。" },
            ],
          },
          {
            key: "life",
            title: DIM_TITLES.life,
            reviews: [
              { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-01", text: "闵行校区的生活和其他学院差不多。数学系的同学普遍比较宅，图书馆和自习室是主要活动场所。课业压力大，社交时间有限。" },
            ],
          },
          {
            key: "care",
            title: DIM_TITLES.care,
            reviews: [
              { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-02", text: "辅导员会定期关心学业情况，尤其是挂科率比较高的课程之后。但个性化关怀有限，更多还是靠同学之间互相帮助。" },
            ],
          },
          {
            key: "practice",
            title: DIM_TITLES.practice,
            reviews: [
              { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-01", text: "数学系的科研更偏理论，本科阶段能参与的课题比较有限。数模竞赛学校有培训支持。实习方面，量化和数据方向的机会不少，但需要自己补编程技能。" },
            ],
          },
        ],
        pros: [
          { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-01", text: "数学功底扎实，转方向灵活度高——无论是转CS、金融还是继续做数学，基础都不会浪费。" },
        ],
        cons: [
          { label: "某学姐 · 数学与应用数学", mentorSlug: "m-math-02", text: "课程难度大，GPA 不好看。和工科、商科比，直接对口的就业机会偏少，需要自己拓展技能树。" },
        ],
        mentors: [
          { slug: "m-math-01", displayTitle: "学姐", major: "数学与应用数学", year: "大三", oneLiner: "了解数学系课程体系和保研 / 转方向的选择。" },
          { slug: "m-math-02", displayTitle: "学姐", major: "数学与应用数学", year: "大二", oneLiner: "可以聊大一大二数学课的体验和学习方法。" },
        ],
      },
    ],
  },
  {
    slug: "fudan",
    name: "复旦大学",
    tags: ["985", "211", "双一流"],
    colleges: [
      {
        slug: "econ",
        name: "经济学院",
        majors: ["金融学", "经济学类", "国际经济与贸易", "财政学"],
        mentorCount: 6,
        aiSummary:
          "6 位学长学姐普遍认可就业资源和校友网络。经院的牌子在金融圈认可度高，实习机会多。主要分歧在教学质量——有人觉得老师很好，也有人觉得部分课偏理论。传统金融行业下行是共同的隐忧。",
        dimensions: [
          {
            key: "career",
            title: DIM_TITLES.career,
            reviews: [
              { label: "某学姐 · 金融学", mentorSlug: "m-econ-01", text: "经院的就业资源很好，券商、基金、四大、咨询都会来校招。学院也会组织校友返校分享，对接实习。大二开始就可以找暑期实习了。" },
              { label: "某学姐 · 经济学类", mentorSlug: "m-econ-02", text: "就业导向比较明确，老师也会在课上提到行业现状。职业发展中心的活动多，但要自己关注报名。" },
            ],
          },
          {
            key: "teaching",
            title: DIM_TITLES.teaching,
            reviews: [
              { label: "某学姐 · 金融学", mentorSlug: "m-econ-01", text: "老师水平参差不齐，有真的很好的老师会结合实际案例讲，也有纯念PPT的。通识课选择多，可以跨院选很多有意思的课。" },
              { label: "某学姐 · 国际经济与贸易", mentorSlug: "m-econ-03", text: "国贸方向的课比较国际化，有英文授课的部分。课程难度适中，但想拿高分需要认真对待。" },
              { label: "某学姐 · 财政学", mentorSlug: "m-econ-04", text: "财政学的课程体系比较完善，公共经济学方向的老师做研究很认真，教学也有热情。" },
            ],
          },
          {
            key: "life",
            title: DIM_TITLES.life,
            reviews: [
              { label: "某学姐 · 金融学", mentorSlug: "m-econ-01", text: "邯郸校区地段好，五角场什么都有，出门就是地铁。校园不大但很精致，秋天梧桐大道很漂亮。宿舍比较老了但好在有独卫。" },
              { label: "某学姐 · 国际经济与贸易", mentorSlug: "m-econ-03", text: "生活便利度很高，大学路上餐厅咖啡馆很多。图书馆氛围好。就是宿舍确实旧，夏天比较热。" },
            ],
          },
          {
            key: "care",
            title: DIM_TITLES.care,
            reviews: [
              { label: "某学姐 · 经济学类", mentorSlug: "m-econ-02", text: "经院辅导员管的学生不算特别多，有事找辅导员基本都会回应。心理咨询可以预约但要等。" },
            ],
          },
          {
            key: "practice",
            title: DIM_TITLES.practice,
            reviews: [
              { label: "某学姐 · 金融学", mentorSlug: "m-econ-01", text: "实习机会多，学长学姐内推是主要渠道。大创和挑战杯参与度也高。海外交换项目不少，但金融方向的海外暑研相对少。" },
              { label: "某学姐 · 国际经济与贸易", mentorSlug: "m-econ-03", text: "国贸方向有和海外大学的联合项目，交换去欧洲的机会比较多。校企合作项目也有一些。" },
            ],
          },
        ],
        pros: [
          { label: "某学姐 · 金融学", mentorSlug: "m-econ-01", text: "就业资源好，复旦经院的牌子在金融圈认可度高。通识教育体系好，视野开阔。" },
          { label: "某学长 · 统计与数据科学", mentorSlug: "m-econ-05", text: "职业发展规划做得很好，课程相对简单，有时间做实习或其他活动。" },
        ],
        cons: [
          { label: "某学姐 · 金融学", mentorSlug: "m-econ-01", text: "传统金融行业不太景气，很多同学转去互联网和量化。课程偏理论，实操训练不够。" },
          { label: "某学姐 · 财政学", mentorSlug: "m-econ-04", text: "部分课件比较陈旧，跟不上行业变化。和理工科比，经院学生的技术能力需要自己补。" },
        ],
        mentors: [
          { slug: "m-econ-01", displayTitle: "学姐", major: "金融学", year: "大三", oneLiner: "有券商和咨询实习经验，熟悉经院各方向和秋招准备。" },
          { slug: "m-econ-02", displayTitle: "学姐", major: "经济学类", year: "大二", oneLiner: "可以聊经济学大类分流和各方向差异。" },
          { slug: "m-econ-03", displayTitle: "学姐", major: "国际经济与贸易", year: "大三", oneLiner: "了解国贸方向的国际化课程和海外交换。" },
        ],
      },
      {
        slug: "law",
        name: "法学院",
        majors: ["法学", "法学（涉外法治拔尖人才班）"],
        mentorCount: 2,
        aiSummary:
          "校友网络在法律行业很强，涉外方向有差异化竞争力。课业压力大——法考和课程要同时兼顾。近年法学就业压力增大是普遍感受。",
        dimensions: [
          {
            key: "career",
            title: DIM_TITLES.career,
            reviews: [
              { label: "某学姐 · 法学（涉外法治班）", mentorSlug: "m-law-01", text: "法学院的就业指导做得不错，红圈所和头部律所的校友网络很强。涉外班有额外的海外实习和交流机会。" },
            ],
          },
          {
            key: "teaching",
            title: DIM_TITLES.teaching,
            reviews: [
              { label: "某学姐 · 法学（涉外法治班）", mentorSlug: "m-law-01", text: "老师整体学术水平高，讨论课和案例分析比较多。涉外班有双语教学，对英语要求高。课业压力不小，法考和课程要兼顾。" },
            ],
          },
          {
            key: "life",
            title: DIM_TITLES.life,
            reviews: [
              { label: "某学姐 · 法学（涉外法治班）", mentorSlug: "m-law-01", text: "邯郸校区生活便利这一点大家都一样。法学院的同学普遍比较忙，课多、阅读量大，但氛围好，大家会一起讨论学习。" },
            ],
          },
          {
            key: "practice",
            title: DIM_TITLES.practice,
            reviews: [
              { label: "某学姐 · 法学（涉外法治班）", mentorSlug: "m-law-01", text: "法律诊所和模拟法庭是很好的实践平台。实习方面，上海的律所和法院资源丰富，学院也有推荐渠道。" },
            ],
          },
        ],
        pros: [
          { label: "某学姐 · 法学（涉外法治班）", mentorSlug: "m-law-01", text: "复旦法学在华东地区认可度高，校友资源好。涉外方向的差异化竞争力强。" },
        ],
        cons: [
          { label: "某学姐 · 法学（涉外法治班）", mentorSlug: "m-law-01", text: "法学就业压力近年增大，通过法考是底线。课业重，大学四年比较累。" },
        ],
        mentors: [
          { slug: "m-law-01", displayTitle: "学姐", major: "法学（涉外法治班）", year: "大三", oneLiner: "可以聊法学学习、法考准备和法律行业就业。" },
        ],
      },
    ],
  },
  {
    slug: "ecnu",
    name: "华东师范大学",
    tags: ["985", "211", "双一流"],
    colleges: [
      {
        slug: "edu",
        name: "教育学部",
        majors: ["教育学大类"],
        mentorCount: 1,
        aiSummary:
          "地理位置是最大亮点——出门 15 分钟两个大商圈。教育学部老师认真负责，转专业限制极小、成功率高。不足是学校整体资源和福利比不上上海另外三所 985。",
        dimensions: [
          {
            key: "career",
            title: DIM_TITLES.career,
            reviews: [
              { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "学校十分注重就业引导及升学引导，尤其在各学系内，常开设朋辈交流经验，以及企业管理层人员来校开设讲座。" },
            ],
          },
          {
            key: "teaching",
            title: DIM_TITLES.teaching,
            reviews: [
              { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "大部分教师认真负责，形式主义课程以及水课的存在也在所难免，考核机制多样、相对公平。" },
            ],
          },
          {
            key: "life",
            title: DIM_TITLES.life,
            reviews: [
              { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "所在校区校园较小，学习环境资源如图书馆在高峰期略显不足，宿舍环境普遍一般，校园风景相对精致，有利之处在于周边商业交通发达。" },
            ],
          },
          {
            key: "care",
            title: DIM_TITLES.care,
            reviews: [
              { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "宿舍阿姨亲切友好；保卫处曾帮我找回过丢失的手机；心理咨询室老师很专业，但只设在另一个校区，本校区常常约不到时间。" },
            ],
          },
          {
            key: "practice",
            title: DIM_TITLES.practice,
            reviews: [
              { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "教授课题组开放情况极其良好，大创资源丰富，企业合作机会多。海外交流项目也较多，但也考验个人家庭经济情况。" },
            ],
          },
        ],
        pros: [
          { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "地理区位优势极佳，出校门 15 分钟以内有两个大型商业圈；所在学系老师人品较好，教学态度良好；转专业限制极小，成功率较高。" },
        ],
        cons: [
          { label: "某学姐 · 教育学大类", mentorSlug: "m-edu-01", text: "非上海市政府拨划资金，学生福利显著不如其他上海三所高校；学校水平显著低于另三所上海高校，整体资源倾斜较少。" },
        ],
        mentors: [
          { slug: "m-edu-01", displayTitle: "学姐", major: "教育学大类", year: "大三", oneLiner: "了解教育学部课程体系和转专业政策，可以聊师范类就业方向。" },
        ],
      },
    ],
  },
];
