import { menuItemsService, menuCategoriesService } from '../firebase/firestore';
import { IMenuItem, IMenuCategory } from '../domain/menu/types';

export const menuService = {
  getItems: (tenantId?: string) => menuItemsService.getAll(tenantId) as Promise<IMenuItem[]>,
  createItem: (data: Omit<IMenuItem, 'id'>, tenantId?: string) => menuItemsService.create(data, tenantId),
  updateItem: (id: string, data: Partial<IMenuItem>, tenantId?: string) => menuItemsService.update(id, data, tenantId),
  deleteItem: (id: string, tenantId?: string) => menuItemsService.delete(id, tenantId),

  getCategories: (tenantId?: string) => menuCategoriesService.getAll(tenantId) as Promise<IMenuCategory[]>,
  createCategory: (data: Omit<IMenuCategory, 'id'>, tenantId?: string) => menuCategoriesService.create(data, tenantId),
  updateCategory: (id: string, data: Partial<IMenuCategory>, tenantId?: string) => menuCategoriesService.update(id, data, tenantId),
  deleteCategory: (id: string, tenantId?: string) => menuCategoriesService.delete(id, tenantId),
};
export default menuService;
