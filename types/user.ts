export type GotHiredMessage = {
  company: string;
  role: string;
  message: string | null;
  createdAt: Date;
}

export type User = {
  _id: string;
  email: string;
  seniorityLevel: string;
  stacks: string[];
  confirmed: boolean;
  createdAt: Date;
  messages: GotHiredMessage[];
  lastHired?: Date;
}