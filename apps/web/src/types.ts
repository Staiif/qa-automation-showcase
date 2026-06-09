export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
}

export type Filter = 'all' | 'active' | 'done';

export interface Session {
  email: string;
  token: string;
}
