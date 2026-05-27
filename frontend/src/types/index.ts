export type Role = 'admin' | 'support' | 'employee' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  avatar?: string;
  createdAt?: string;
}

export type Priority = 'Critical' | 'High' | 'Moderate' | 'Low';
export type Impact = 'High' | 'Medium' | 'Low';
export type Urgency = 'High' | 'Medium' | 'Low';

export interface Attachment {
  name: string;
  size: number;
  dataUrl: string;
}

export interface Ticket {
  id: string;
  number: string;
  shortDescription: string;
  description?: string;
  priority: Priority;
  category: string;
  assignmentGroup: string;
  state: string;
  impact: Impact;
  urgency: Urgency;
  requestedBy: string;
  assignedTo?: string;
  attachments?: Attachment[];
  sla?: number;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  riskLevel?: 'Low' | 'Moderate' | 'High';
  relatedIncidents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  sla: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  author: string;
  views: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'bot';
  text: string;
  createdAt: string;
}

export interface StatsSummary {
  totalIncidents: number;
  openIncidents: number;
  problems: number;
  changeRequests: number;
  resolvedTickets: number;
  byPriority: { priority: string; count: number }[];
  byState: { state: string; count: number }[];
  slaAverage: number;
}

export type TicketKind = 'incidents' | 'problems' | 'changes';

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
