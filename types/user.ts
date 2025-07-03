export type User = {
  _id: string;
  email: string;
  seniorityLevel: string;
  stacks: string[];
  confirmed: boolean;
  createdAt: Date;
}