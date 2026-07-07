export interface IHandoverDoc {
  id?: string;
  handoverBy: string;
  handoverByName: string;
  handoverTo: string;
  handoverToName: string;
  handoverTime: string;
  handoverReason: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  tablesCount: number;
  ordersCount: number;
  requestsCount: number;
  tableIds: string[];
  orderIds: string[];
  requestIds: string[];
}
