import { menuItemsService, menuCategoriesService } from '../firebase/firestore';
import { IMenuItem, IMenuCategory } from '../domain/menu/types';

/**
 * Service for handling Menu Items and Menu Categories operational CRUD.
 * Interacts with Firestore collections.
 */
export const menuService = {
  /**
   * Retrieves all menu items for the tenant.
   * 
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving to an array of menu items.
   */
  getItems: (tenantId?: string) => menuItemsService.getAll(tenantId) as Promise<IMenuItem[]>,

  /**
   * Creates a new menu item.
   * 
   * @param data - The menu item object data excluding the ID.
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving to the created item.
   */
  createItem: (data: Omit<IMenuItem, 'id'>, tenantId?: string) => menuItemsService.create(data, tenantId),

  /**
   * Updates an existing menu item.
   * 
   * @param id - The unique ID of the menu item.
   * @param data - Partial fields to update.
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving when the update completes.
   */
  updateItem: (id: string, data: Partial<IMenuItem>, tenantId?: string) => menuItemsService.update(id, data, tenantId),

  /**
   * Deletes a menu item.
   * 
   * @param id - The unique ID of the menu item to delete.
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving when the deletion completes.
   */
  deleteItem: (id: string, tenantId?: string) => menuItemsService.delete(id, tenantId),

  /**
   * Retrieves all menu categories for the tenant.
   * 
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving to an array of menu categories.
   */
  getCategories: (tenantId?: string) => menuCategoriesService.getAll(tenantId) as Promise<IMenuCategory[]>,

  /**
   * Creates a new menu category.
   * 
   * @param data - The category object data excluding the ID.
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving to the created category.
   */
  createCategory: (data: Omit<IMenuCategory, 'id'>, tenantId?: string) => menuCategoriesService.create(data, tenantId),

  /**
   * Updates an existing menu category.
   * 
   * @param id - The unique ID of the category.
   * @param data - Partial fields to update.
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving when the update completes.
   */
  updateCategory: (id: string, data: Partial<IMenuCategory>, tenantId?: string) => menuCategoriesService.update(id, data, tenantId),

  /**
   * Deletes a menu category.
   * 
   * @param id - The unique ID of the category to delete.
   * @param tenantId - Optional tenant identifier.
   * @returns A promise resolving when the deletion completes.
   */
  deleteCategory: (id: string, tenantId?: string) => menuCategoriesService.delete(id, tenantId),
};
export default menuService;

