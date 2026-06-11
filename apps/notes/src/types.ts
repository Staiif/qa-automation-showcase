export interface Note {
  id: string;
  text: string;
  createdAt: number;
}

export interface Session {
  email: string;
  token: string;
}
