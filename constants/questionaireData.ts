// Define the questionnaire domains and questions based on the screenshots

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  flag?: string;
}

export interface QuestionnaireDomain {
  id: string;
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
}

export const QUESTIONNAIRE_DOMAINS: QuestionnaireDomain[] = [
  {
    id: "domain-1",
    title: "DOMAIN I",
    description: "Housing & Environment",
    questions: [
      {
        id: "q1-1",
        text: "What is your current housing situation?",
        flag: "Housing instability / temporary housing",
      },
      {
        id: "q1-2",
        text: "Are you worried about losing your housing in the near future?",
        flag: "Housing insecurity",
      },
      {
        id: "q1-3",
        text: "Have any utility companies threatened to shut off your services?",
        flag: "Utilities support needed",
      },
      {
        id: "q1-4",
        text: "Any trouble getting to medical appointments or work due to transportation?",
        flag: "Transportation barrier",
      },
      {
        id: "q1-5",
        text: "Do you feel safe where you live?",
        flag: "Home safety concern",
      },
      {
        id: "q1-6",
        text: "Any concerns about your neighborhood, or safety?",
        flag: "Neighborhood safety concern",
      },
    ],
  },
  {
    id: "domain-2",
    title: "DOMAIN II",
    description: "Safety & Demographics",
    questions: [
      {
        id: "q2-1",
        text: "What race or ethnicity do you identify with?",
        flag: "",
      },
      {
        id: "q2-2",
        text: "Are you Hispanic or Latino?",
        flag: "",
      },
      {
        id: "q2-3",
        text: "Have you been hurt or threatened by someone in the past year?",
        flag: "Interpersonal violence",
      },
      {
        id: "q2-4",
        text: "Have you felt afraid of your current or past partner?",
        flag: "Urgent safety referral",
      },
      {
        id: "q2-5",
        text: "Has anyone taken money from you or withheld it unfairly?",
        flag: "Financial abuse",
      },
    ],
  },
  {
    id: "domain-3",
    title: "DOMAIN III",
    description: "Education & Employment",
    questions: [
      {
        id: "q3-1",
        text: "What is the highest level of education you've completed?",
        flag: "",
      },
      {
        id: "q3-2",
        text: "What is your current work status?",
        flag: "Employment support needed",
      },
      {
        id: "q3-3",
        text: "Is it hard to afford basic needs?",
        flag: "Financial strain",
      },
      {
        id: "q3-4",
        text: "Would you like help finding a job?",
        flag: "Referral to workforce navigator",
      },
      {
        id: "q3-5",
        text: "Interested in help with school or job training?",
        flag: "Education support",
      },
      {
        id: "q3-6",
        text: "Do you need better daycare?",
        flag: "Childcare need",
      },
    ],
  },
  {
    id: "domain-4",
    title: "DOMAIN IV",
    description: "Food & Physical Activity",
    questions: [
      {
        id: "q4-1",
        text: "Have you worried about running out of food?",
        flag: "Food insecurity",
      },
      {
        id: "q4-2",
        text: "Did the food you bought ever not last?",
        flag: "Food insecurity",
      },
      {
        id: "q4-3",
        text: "Can you get enough healthy food?",
        flag: "Healthy food access",
      },
      {
        id: "q4-4",
        text: "How often do you exercise per week?",
        flag: "Physical activity support",
      },
    ],
  },
  {
    id: "domain-5",
    title: "DOMAIN V",
    description: "Home Environment",
    questions: [
      {
        id: "q5-1",
        text: "Do you have any issues in your home, like mold, pests, or no heat?",
        flag: "Environmental hazard, refer to housing services",
      },
    ],
  },
  {
    id: "domain-6",
    title: "DOMAIN VI",
    description: "Language & Communication",
    questions: [
      {
        id: "q6-1",
        text: "What language are you most comfortable speaking?",
        flag: "",
      },
      {
        id: "q6-2",
        text: "Do you often need help reading medical materials?",
        flag: "Health literacy / translation support",
      },
    ],
  },
];

export interface QuestionnaireResponse {
  questionId: string;
  domainId: string;
  response: string;
  flag?: string;
  timestamp: Date;
}

export interface QuestionnaireState {
  isActive: boolean;
  isPaused?: boolean // Add this field
  currentDomainIndex: number;
  currentQuestionIndex: number;
  responses: QuestionnaireResponse[];
  isCompleted: boolean;
}

export const initialQuestionnaireState: QuestionnaireState = {
  isActive: false,
  currentDomainIndex: 0,
  currentQuestionIndex: 0,
  responses: [],
  isCompleted: false,
};
