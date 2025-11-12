export type TicketRecord = {
  id: string;
  brand: string | null;
  clientName: string | null;
  subject: string | null;
  product: string | null;
  issueCategory: string | null;
  ticketUrl: string | null;
  status: string | null;
  lastMessage: string | null;
  date: string | null;
  clientMsgs: unknown;
  agentMsgs: unknown;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};
