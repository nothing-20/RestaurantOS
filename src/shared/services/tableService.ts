import { tablesService } from '../firebase/firestore';
import { ITable } from '../domain/tables/types';

export const tableService = {
  getTables: (tenantId?: string) => tablesService.getAll(tenantId) as Promise<ITable[]>,
  createTable: (data: Omit<ITable, 'id'>, tenantId?: string) => tablesService.create(data, tenantId),
  updateTable: (id: string, data: Partial<ITable>, tenantId?: string) => tablesService.update(id, data, tenantId),
  deleteTable: (id: string, tenantId?: string) => tablesService.delete(id, tenantId),
};
export default tableService;
