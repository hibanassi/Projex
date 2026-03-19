import { Task } from "./task";

export interface Project {
  id?: number;
  name: string;
  description: string;
  owner_id?: number;
  progress?: number;
  tasks?: Task[];
}
