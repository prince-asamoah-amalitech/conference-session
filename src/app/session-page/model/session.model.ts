export interface Speaker {
  name: string;
  email: string;
}

export interface Session {
  id: string;
  title: string;
  track: 'frontend' | 'backend' | 'ai';
  startsAt: string;  // ISO
  endsAt: string;    // ISO
  capacity: number;
  speakers: Speaker[];
}
