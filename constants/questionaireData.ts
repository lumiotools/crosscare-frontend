// Define the questionnaire domains and questions based on the decision tree

export interface QuestionnaireQuestion {
  id: string
  text: string
  flag?: string
  options?: string[] // Add this field
  followUp?: { [key: string]: string } // Add this field
}

export interface QuestionnaireDomain {
  id: string
  title: string
  description: string
  questions: QuestionnaireQuestion[]
}

export const QUESTIONNAIRE_DOMAINS: QuestionnaireDomain[] = [
  {
    id: "domain-1",
    title: "DOMAIN I",
    description: "Housing & Environment",
    questions: [
      {
        id: "q1-1",
        text: "Do you live in a house or an apartment?",
        flag: "Housing situation",
        options: ["House", "Apartment"],
        followUp: {
          House: "q1-a",
          Apartment: "q1-b",
        },
      },
      {
        id: "q1-a", // Follow-up for "House"
        text: "Do you live alone?",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-c", // Continue if "Yes"
          No: "q1-d", // Continue if "No"
        },
      },
      {
        id: "q1-b", // Follow-up for "Apartment"
        text: "Do you have an elevator that works?",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-d", // Continue if "Yes"
          No: "q1-f", // Continue if "No"
        },
      },
      {
        id: "q1-c",
        text: "Will anyone come stay with you once you have the baby?",
        flag: "Housing instability / temporary housing",
        followUp: {
         "*" : "q1-2", // Any response leads to q1-d
        },
      },
      {
        id: "q1-d",
        text: "Who else lives in the home with you?",
        followUp: {
          "*": "q1-g", // Any response leads to q1-g
        },
      },
      {
        id: "q1-f",
        text: "What floor do you live on?",
        followUp: {
          "*": "q1-2", // Any response leads to q1-g
        },
      },
      {
        id: "q1-g",
        text: "Do you have your own room?",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-h", // Continue if "Yes"
          No: "q1-i", // Continue if "No"
        },
      },
      {
        id: "q1-h",
        text: "Will you and the baby share a room or will they have their own?",
        followUp: {
          "*": "q1-2", // Any response leads to q1-2
        },
      },
      {
        id: "q1-i",
        text: "Will you and the baby share a room or will they have their own?",
        followUp: {
          "*": "q1-2", // Any response leads to q1-2
        },
      },
      {
        id: "q1-2",
        text: "Are you worried about losing your housing in the near future?",
        flag: "Housing insecurity",
        options: ["Yes", "No"],
        followUp: {
          YES: "q1-smoke", // Continue to smoke questions if "YES"
          NO: "q1-smoke", // Continue to smoke questions if "NO"
        },
      },
      {
        id:"q1-smoke",
        text: "Does anyone who lives in the home or that you are around a lot smoke?",
        flag: "Smoke exposure risk",
        options: ["Yes", "No"],
        followUp: {
          YES: "q1-smoke-info", // Record information about second-hand smoke
          NO: "q1-chemicals", // Continue to chemicals question
        },
      },
      {
        id: "q1-smoke-info",
        text: "Record information, effects of second hand smoke, tips?",
        flag: "Second-hand smoke exposure - provided information",
        followUp: {
          "*": "q1-chemicals", // Continue to chemicals question after providing info
        },
      },
      {
        id: "q1-chemicals",
        text: "Does anyone in your home or who comes to your home a lot work in a factory or with chemicals?",
        flag: "Chemical exposure risk",
        options: ["Yes", "No"],
        followUp: {
          YES: "q1-chemicals-info", // Provide information about chemical exposure
          NO: "q1-3", // Continue to paint question
        },
      },
      {
        id: "q1-chemicals-info",
        text: "Have them change their clothes, shoes, and shower  before coming in the home.  Do not wash their work clothes.  Explain why-potential exposure to chemicals",
        flag: "Chemical exposure - provided safety information",
        followUp: {
          "*": "q1-3", // Continue to paint question after providing info
        },
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
        options:["Yes", "No"],
        followUp:{
          Yes:"q1-neighborhood",
          No:'q1-neighborhood',
        }
      },
      {
        id: "q1-neighborhood",
        text: "Do you feel safe in your neighborhood?",
        flag: "Neighborhood safety assessment",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-highway", // If they feel safe, ask about highway proximity
          No: "q1-unsafe-reason", // If they don't feel safe, ask what would make them feel safer
        },
      },
      {
        id: "q1-unsafe-reason",
        text: "What would make you feel safer?",
        flag: "Neighborhood safety concerns",
        followUp: {
          "*": "q1-home-unsafe", // Any response leads to asking about safety in the home
        },
      },
      {
        id: "q1-home-unsafe",
        text: "Does anyone in your home make you feel unsafe because of physical or verbal abuse?",
        flag: "Domestic safety concern - HIGH PRIORITY",
        followUp: {
          "*": "domain[q2-1]" // If no, move to next domain
        },
      },
      {
        id: "q1-highway",
        text: "Do you live close to a highway or area with a lot of car and truck traffic?",
        flag: "Air quality concern - traffic",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-windows", // If near highway, ask about windows
          No: "domain[q2-1]", // If not near highway, ask about air filter
        },
      },
      {
        id: "q1-windows",
        text: "Do you open the windows for air?",
        flag: "Air quality management",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-exhaust-info", // If they open windows, provide exhaust info
          No: "q1-construction", // If they don't open windows, ask about construction
        },
      },
      {
        id: "q1-exhaust-info",
        text: "Trucks and car exaust can put out harmful chemicals",
        flag: "Air quality education provided",
        followUp: {
          "*": "q1-air-filter", // Move to next domain after providing info
        },
      },
      {
        id: "q1-construction",
        text: "Is there construction on old homes or businesses near your home?",
        flag: "Air quality concern - construction",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-lead-info", // If construction nearby, provide lead info
          No: "domain[q2-1]", // If no construction, move to next domain
        },
      },
      {
        id: "q1-lead-info",
        text: "Try to keep the windows closed so you are breathing in less dust from outside and the home. This can cause lead poisoning.",
        flag: "Lead exposure risk - provided information",
        followUp: {
          "*": "domain[q2-1]", // Move to next domain after providing info
        },
      },
      {
        id: "q1-air-filter",
        text: "Do you have an air filter?",
        flag: "Air quality management",
        options: ["Yes", "No"],
        followUp: {
          Yes: "q1-filter-info", // If they have air filter, provide maintenance info
          No: "q1-no-filter-info", // If no air filter, provide window advice
        },
      },
      {
        id: "q1-filter-info",
        text: "Try to keep the windows closed so you are breathing in less exhaust. Keep the filter clean.",
        flag: "Air filter maintenance education provided",
        followUp: {
          "*": "domain[q2-1]", // Move to next domain after providing info
        },
      },
      {
        id: "q1-no-filter-info",
        text: "Try to keep the windows closed so you are breathing in less exhaust.",
        flag: "Air quality education provided",
        followUp: {
          "*": "domain[q2-1]", // Move to next domain after providing info
        },
      },
    ],
  },
  {
    id: "domain-2",
    title: "DOMAIN II",
    description: "Safety & Demographics & Transportation",
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
        followUp:{
          "*":"q2-6",
        },
      },
      {
        id: "q2-6",
        text: "How do you get to and from work, doctor appointments, and the grocery store?",
        followUp:{
          "*":"q2-7",
        }
      },
      {
        id: "q2-7",
        text: "Do you have problems getting to these places because of transportation?",
        flag: "Transportation support needed",
        options: ["Yes", "No"],
        followUp:{
          Yes:"q2-8",
          No:"q2-11",
        }
      },
      {
        id: "q2-8",
        text: "Please describe the transportation issues you have",
        flag: "Transportation support needed",
        followUp:{
          "*":"q2-9",
        }
      },
      {
        id: "q2-9",
        text: "Is there anyone that helps you with transportation?",
        flag: "Transportation support needed",
        options: ["Yes", "No"],
        followUp:{
          Yes:"q2-11",
          No:"q2-10",
        }
      },
      {
        id: "q2-10",
        text: "If transporatio is unreliable, she has to walk or take the bus ask if she has a plan to do something differently when the baby comes",
        flag: "Transportation support needed",
        followUp:{
          "*": "q2-11",
        }
      },
      {
        id: "q2-11",
        text:"Are there any traditions or beliefs about pregnancy in you culture?",
        flag: "Cultural beliefs",
        followUp:{
          "*":"q2-12",
        }
      },
      {
        id: "q2-12",
        text: "Activities that you should or shoulnt do during pregnancy",
        flag: "Pregnancy education",
        followUp:{
          "*":"q2-13",
        }
      },
      {
        id: "q2-13",
        text: "Any foods that you should or shouldnt eat durning pregnancy in your culture",
        followUp:{
          "*":"domain[q3-1]",
        }
      },
      
    ],
  },
  {
    id: "domain-3",
    title: "DOMAIN III",
    description: "Family & Education & Employment",
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
        followUp:{
          "*":"q3-10",
        }
      },
      {
        id:"q3-10",
        text:"Do you work?",
        options:["Yes", "No"],
        followUp:{
          Yes:"q3-11",
          No:"q3-12",
        }
      },
      {
        id:"q3-11",
        text:"Are you paid per hour or do you have a set salary",
        options:["Hourly", "Salary"],
        followUp:{
          "*": "q3-12",
        }
      },
      {
        id:"q3-12",
        text:"Do you have any worries about money with the baby coming",
        options:["Yes", "No"],
        followUp:{
          "*": "q3-13",
        }
      },
      {
        id:"q3-13",
        text:"Will you have enough income to meet your needs while you are on maternity leave",
        options:["Yes", "No"],
        followUp:{
          Yes:"q3-14",
          No:"q3-15",
        }
      },
      
      {
        id:"q3-14",
        text:"What is you plan to support yourself and the baby during maternity leave? Do you need help?",
        followUp:{
          "*":"q3-4",
        }
      },
      {
        id:"q3-15",
        text:"Do you worry about having enough food for you and your family?",
        followUp:{
          "*":"q3-16",
        }
      },
      {
        id: "q3-16",
        text: "Do you always have enough food for you and your family?",
        flag: "Food insecurity",
        followUp:{
          "*": "q3-17",
        }
      },
      {
        id: "q3-17",
        text: "Do you have problems getting food especially fresh fruits and vegetables?",
        followUp:{
          "*":"q3-4",
        }
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
        followUp:{
          "*":"q3-a",
        }
      },
      {
        id: "q3-a",
        text: "Is this your first pregnancy?",
        flag: "First pregnancy assessment",
        options: ["Yes", "No"],
        followUp:{
          Yes:"q3-b",
          No:"q3-c",
        }
      },
      {
        id: "q3-c",
        text:"What was the result of the pregnancy?",
        followUp:{
          "*":"q3-e",
        }
      },
      {
        id: "q3-e",
        text:"Abortion?",
        followUp:{
          "*":"q3-l",
        }
      },
      {
        id: "q3-l",
        text:"Were you able to carry the baby full term?",
        followUp:{
          "*":"q3-m",
        }
      },
      {
        id: "q3-m",
        text:"Were there any issues during pregnancy and/or birth?",
        followUp:{
          "*":"q3-n",
        }
      },
      {
        id: "q3-n",
        text:"What was the baby’s weight, How old is your baby?",
        followUp:{
          "*":"q3-o",
        }
      },
      {
        id: "q3-o",
        text:"Does your other child/children know that you are pregnant?",
        followUp:{
          "*":"q3-p",
        }
      },
      {
        id: "q3-p",
        text:"What was their reaction?",
        followUp:{
          "*":"q3-q",
        }
      },
      {
        id: "q3-q",
        text:"How did their reaction make you feel?",
        followUp:{
          "*":"q3-r",
        }
      },
      {
        id: "q3-r",
        text:"Do you have any child care issue with your current child/children?",
        followUp:{
          "*":"q3-s",
        }
      },
      {
        id: "q3-s",
        text:"Will having another baby cause any more stress?",
        followUp:{
          "*":"q3-t",
        }
      },
      {
        id: "q3-t",
        text:"Do you have any stress connected to your children?",
        followUp:{
          "*":"q3-j",
        }
      },
      {
        id:"q3-b",
        text:"Was this planned?",
        followUp:{
          "*":"q3-d",
        }
      },
      {
        id:"q3-d",
        text:"How do you feel about the pregnancy and having a baby?",
        followUp:{
          "*":"q3-f",
        }
      },
      {
        id:"q3-f",
        text:"Is the father excited/happy?",
        followUp:{
          "*":"q3-g",
        }
      },
      {
        id:"q3-g",
        text:"How does your family feel?",
        followUp:{
          "*":"q3-h",
        }
      },
      {
        id:"q3-h",
        text:"Who is a part of your support system?",
        followUp:{
          "*":"q3-i",
        }
      },
      {
        id:"q3-i",
        text:"Are there other family members that cause you stress? Why",
        followUp:{
          "*":"q3-j",
        }
      },
      {
        id:"q3-j",
        text:"Are you still in a relationship with the baby’s father?",
        followUp:{
          "*":"q3-k",
        }
      },
      {
        id:"q3-k",
        text:"Does he have any other children? If yes is do you have any stress caused by his previous child’s mother and/or family",
        followUp:{
          "*":"domain[q4-1]",
        }
      },
    ],
  },
  {
    id: "domain-4",
    title: "DOMAIN IV",
    description: "Food & Physical Activity & Breastfeeding",
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
        followUp :{
          "*":"q4-5",
        }
      },
      {
        id: "q4-5",
        text: "What is you favorite thing to eat?",
        followUp:{
          "*":"q4-6",
        }
      },
      {
        id: "q4-6",
        text: "Are you having any cravings?",
        followUp:{
          "*":"q4-7",
        }
      },
      {
        id: "q4-7",
        text: "Are there any foods that make you feel sick?",
        followUp:{
          "*":"q4-8",
        }
      },
      {
        id: "q4-8",
        text: "Any foods that you should or shouldnt eat durning pregnancy in your culture?",
        followUp:{
          "*":"q4-9",
        }
      },
      {
        id: "q4-9",
        text: "Do you have a birthing plan?",
        options:["Yes", "No"],
        followUp:{
          Yes:"q4-10",
          No:"q4-11",
        }
      },
      {
        id: "q4-10",
        text: "Have you thought about how you want to give birth?  Who will be in the room?  Have you taken any classes or do you plan to?",
        options:["Yes", "No"],
        followUp:{
          Yes:"q4-13",
          No:"q4-14",
        }
      },
      {
        id: "q4-11",
        text: "What is your perfect way to give birth?  Do want pain medications?  Who do you want in the room with you?",
        followUp:{
          "*":"q4-15",
        }
      },
      {
        id: "q4-13",
        text: "Describe your birthing plan I can record it for you",
        followUp:{
          "*":"q4-16",
        }
      },
      {
        id: "q4-14",
        text:"Prompt videos on birthing plan give the option to bookmark for later",
        followUp:{
          "*":"q4-16",
        }
      },
      {
        id: "q4-15",
        text:"Describe your birthing plan I can record it for you",
        followUp:{
          "*":"q4-16",
        }
      },
      {
        id: "q4-16",
        text: "Do you plan to breastfeed?",
        options:["Yes", "No"],
        followUp:{
          Yes:"q4-17",
          No:"q4-18",
        }
      },
      {
        id: "q4-17",
        text: "Are you nervous about breastfeeding?  Do you have assistance with breastfeeding?",
        followUp:{
          "*":"q4-19",
        }
      },
      {
        id: "q4-18",
        text: "Did you breastfeed before?  Did you have any trouble?",
        options:["Yes", "No"],
        followUp:{
          Yes:"q4-19",
          No:"domain[q5-1]",
        }
      },
      {
        id: "q4-19",
        text: "Did you breastfeed before?  Did you have any trouble?",
        followUp:{
          "*":"domain[q5-1]",
        }
      }
    ],
  },
  {
    id: "domain-5",
    title: "DOMAIN V",
    description: "Environment",
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
  {
    id:"domain-7",
    title:"DOMAIN VII",
    description:"Stressors",
    questions:[
      {
        id: "q7-1",
        text: "How was your day?",
        flag: "Stressors",
        followUp:{
          "*":"q7-2",
        }
      },
      {
        id: "q7-2",
        text: "Are you having any stress?  What is stressing you?",
        flag: "Stressors",
        followUp:{
          "*":"q7-3",
        }
      },
      {
        id: "q7-3",
        text: "Who do you talk to when you are stressed?",
        followUp:{
          "*":"q7-4",
        }
      },
      {
        id: "q7-4",
        text: "What do you do to deal with stress?",
        followUp:{
          "*":"q7-5",
        }
      },
      {
        id: "q7-5",
        text: "Do you feel like it helps?",
        followUp:{
          "*":"q7-6",
        }
      },
      {
        id: "q7-6",
        text: " How often do you feel stressed?",
        followUp:{
          "*":"q7-7",
        }
      },
      {
        id: "q7-7",
        text: "Discuss why you feel stressed so often?",
        followUp:{
          "*":"q7-8",
        }
      },
      {
        id: "q7-8",
        text: "Do you stress about the same thing everyday or multiple times?",
      },
    ]
  }
]

export interface QuestionnaireResponse {
  questionId: string
  domainId: string
  response: string
  flag?: string
  timestamp: Date
}

export interface QuestionnaireState {
  isActive: boolean
  isPaused?: boolean // Add this field
  currentDomainIndex: number
  currentQuestionIndex: number
  responses: QuestionnaireResponse[]
  isCompleted: boolean
}

export const initialQuestionnaireState: QuestionnaireState = {
  isActive: false,
  currentDomainIndex: 0,
  currentQuestionIndex: 0,
  responses: [],
  isCompleted: false,
}
