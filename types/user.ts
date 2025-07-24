export type GotHiredMessage = {
  company: string;
  role: string;
  message: string | null;
  createdAt: Date;
}

export type UserFeedback = {
  rating: number;
  feedback: string | null;
  createdAt: Date;
}

export type User = {
  _id: string;
  email: string;
  seniorityLevel: string;
  stacks: string[];
  confirmed: boolean;
  createdAt: Date;
  messages?: GotHiredMessage[];
  feedbacks?: UserFeedback[];
  lastFeedBackAt?: Date;
  lastHired?: Date;
}