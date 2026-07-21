import { db } from '../firebase/config';
import { runTransaction, doc, collection, addDoc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { logEvent } from './eventEngine';
import { IStockIngredient, IRecipe, IStockMovement } from '../domain/inventory/types';
import { formatPrice } from '../utils/format';

export const inventoryService = {
  // Deduct ingredients based on completed order items
  deductStockForOrder: async (tenantId: string, orderId: string) => {
    const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) return;
      const data = orderSnap.data();

      // If already processed or not completed, ignore
      if (data.inventoryDeducted || data.status !== 'COMPLETED') return;

      const items = data.items || [];
      if (items.length === 0) {
        transaction.update(orderRef, { inventoryDeducted: true });
        return;
      }

      // Group all required ingredients deductions
      const deductions: Record<string, { quantity: number; ingredientName: string; unit: string; cost: number; supplierId: string; supplierName: string }> = {};

      for (const item of items) {
        const recipeRef = doc(db, 'restaurants', tenantId, 'recipes', item.itemId);
        const recipeSnap = await transaction.get(recipeRef);
        
        if (recipeSnap.exists()) {
          const recipe = recipeSnap.data() as IRecipe;
          const yieldQty = recipe.yieldQuantity || 1;
          const wasteFactor = 1 + (recipe.wastePercentage || 0) / 100;
          
          for (const ing of recipe.ingredients) {
            const neededQty = (ing.quantity / yieldQty) * item.count * wasteFactor;
            
            if (deductions[ing.ingredientId]) {
              deductions[ing.ingredientId].quantity += neededQty;
            } else {
              deductions[ing.ingredientId] = {
                quantity: neededQty,
                ingredientName: ing.ingredientName,
                unit: ing.unit,
                cost: 0,
                supplierId: '',
                supplierName: ''
              };
            }
          }
        }
      }

      // Read ingredients from DB inside transaction and subtract stock
      for (const ingredientId of Object.keys(deductions)) {
        const ingRef = doc(db, 'restaurants', tenantId, 'inventory', ingredientId);
        const ingSnap = await transaction.get(ingRef);

        if (ingSnap.exists()) {
          const ingData = ingSnap.data() as IStockIngredient;
          const deductInfo = deductions[ingredientId];
          
          deductInfo.cost = ingData.purchaseCost || 0;
          deductInfo.supplierId = ingData.supplierId || '';
          deductInfo.supplierName = ingData.supplierName || '';

          const newStock = Math.max(0, (ingData.currentStock || 0) - deductInfo.quantity);
          
          // Re-evaluate stock health state
          let status: IStockIngredient['status'] = 'healthy';
          if (newStock === 0) status = 'out_of_stock';
          else if (newStock <= ingData.minimumStock * 0.5) status = 'critical';
          else if (newStock <= ingData.minimumStock) status = 'low';

          // Update Stock inside transaction
          transaction.update(ingRef, {
            currentStock: newStock,
            status,
            updatedAt: new Date().toISOString()
          });

          // Log stock movement consumption
          const movementId = `MVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          const movementRef = doc(collection(db, 'restaurants', tenantId, 'stockMovements'), movementId);
          transaction.set(movementRef, {
            id: movementId,
            ingredientId,
            ingredientName: ingData.name,
            quantity: -deductInfo.quantity,
            type: 'consumption',
            reason: `Order #${orderId} completed`,
            submittedBy: 'system',
            submittedByName: 'System Automation',
            timestamp: new Date().toISOString()
          });

          // Trigger Event Engine logging if levels drop
          if (status === 'low' || status === 'critical' || status === 'out_of_stock') {
            const eventType = status === 'out_of_stock' ? 'Out of Stock' : status === 'critical' ? 'Critical Stock' : 'Low Stock';
            logEvent(tenantId, {
              eventType,
              eventCategory: 'Management',
              tenantId,
              performedBy: 'System',
              performedByRole: 'System',
              title: `${eventType} warning: ${ingData.name}`,
              description: `Stock level of ${ingData.name} has dropped to ${newStock} ${ingData.unit} (Min limit: ${ingData.minimumStock}).`,
              metadata: { ingredientId, currentStock: newStock, minLimit: ingData.minimumStock }
            });
          }

          // Check if reorder suggestions need creation
          if (newStock <= ingData.reorderLevel) {
            const suggestionId = `SUG-${ingredientId}`;
            const suggestionRef = doc(db, 'restaurants', tenantId, 'purchaseSuggestions', suggestionId);
            const recommendedQuantity = Math.max(0, ingData.maximumStock - newStock);

            transaction.set(suggestionRef, {
              id: suggestionId,
              ingredientId,
              ingredientName: ingData.name,
              recommendedQuantity,
              unit: ingData.unit,
              supplierId: ingData.supplierId || 'unknown',
              supplierName: ingData.supplierName || 'Preferred Supplier',
              estimatedCost: recommendedQuantity * (ingData.purchaseCost || 0),
              priority: status === 'out_of_stock' || status === 'critical' ? 'critical' : 'high',
              createdAt: new Date().toISOString(),
              status: 'pending'
            });

            logEvent(tenantId, {
              eventType: 'Purchase Suggested',
              eventCategory: 'Management',
              tenantId,
              performedBy: 'System',
              performedByRole: 'System',
              title: `Replenishment Suggestion: ${ingData.name}`,
              description: `Auto-generated purchase suggestion for ${recommendedQuantity} ${ingData.unit} from ${ingData.supplierName}.`,
              metadata: { ingredientId, recommendedQty: recommendedQuantity }
            });
          }
        }
      }

      // Log central order consumption event
      logEvent(tenantId, {
        eventType: 'Ingredient Consumed',
        eventCategory: 'System',
        tenantId,
        performedBy: 'System',
        performedByRole: 'System',
        title: `Stock Deducted for Order #${orderId}`,
        description: `Successfully deducted ingredients recipe for ${items.length} items from completed order.`,
        metadata: { orderId }
      });

      // Update Order document
      transaction.update(orderRef, { inventoryDeducted: true });
    });
  },

  // Restore ingredient stock when an order is cancelled or refunded
  restockStockForOrder: async (tenantId: string, orderId: string, type: 'refund_restock' | 'cancellation_restock') => {
    const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) return;
      const data = orderSnap.data();

      // Can only restock if previously deducted, and not already restocked
      if (!data.inventoryDeducted || data.inventoryRestocked) return;

      const items = data.items || [];
      if (items.length === 0) {
        transaction.update(orderRef, { inventoryRestocked: true });
        return;
      }

      for (const item of items) {
        const recipeRef = doc(db, 'restaurants', tenantId, 'recipes', item.itemId);
        const recipeSnap = await transaction.get(recipeRef);
        
        if (recipeSnap.exists()) {
          const recipe = recipeSnap.data() as IRecipe;
          const yieldQty = recipe.yieldQuantity || 1;
          const wasteFactor = 1 + (recipe.wastePercentage || 0) / 100;
          
          for (const ing of recipe.ingredients) {
            const restoreQty = (ing.quantity / yieldQty) * item.count * wasteFactor;
            
            const ingRef = doc(db, 'restaurants', tenantId, 'inventory', ing.ingredientId);
            const ingSnap = await transaction.get(ingRef);

            if (ingSnap.exists()) {
              const ingData = ingSnap.data() as IStockIngredient;
              const newStock = (ingData.currentStock || 0) + restoreQty;

              // Re-evaluate stock health state
              let status: IStockIngredient['status'] = 'healthy';
              if (newStock === 0) status = 'out_of_stock';
              else if (newStock <= ingData.minimumStock * 0.5) status = 'critical';
              else if (newStock <= ingData.minimumStock) status = 'low';

              transaction.update(ingRef, {
                currentStock: newStock,
                status,
                updatedAt: new Date().toISOString()
              });

              // Log stock movement restock
              const movementId = `MVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
              const movementRef = doc(collection(db, 'restaurants', tenantId, 'stockMovements'), movementId);
              transaction.set(movementRef, {
                id: movementId,
                ingredientId: ing.ingredientId,
                ingredientName: ingData.name,
                quantity: restoreQty,
                type,
                reason: `Order #${orderId} restocked via ${type.replace('_', ' ')}`,
                submittedBy: 'system',
                submittedByName: 'System Automation',
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }

      // Log central event
      logEvent(tenantId, {
        eventType: 'Stock Adjustment',
        eventCategory: 'System',
        tenantId,
        performedBy: 'System',
        performedByRole: 'System',
        title: `Restocked Order #${orderId}`,
        description: `Successfully restored recipe ingredients for order #${orderId} due to cancellation/refund.`,
        metadata: { orderId, restockType: type }
      });

      transaction.update(orderRef, { inventoryRestocked: true });
    });
  },

  // Records kitchen waste, spoils, damaged items or staff mistakes
  recordWaste: async (tenantId: string, wasteData: any) => {
    const wasteCol = collection(db, 'restaurants', tenantId, 'waste');
    const docRef = await addDoc(wasteCol, {
      ...wasteData,
      timestamp: new Date().toISOString()
    });

    const ingRef = doc(db, 'restaurants', tenantId, 'inventory', wasteData.ingredientId);
    const ingSnap = await getDoc(ingRef);

    if (ingSnap.exists()) {
      const ingData = ingSnap.data() as IStockIngredient;
      const newStock = Math.max(0, (ingData.currentStock || 0) - wasteData.quantity);

      let status: IStockIngredient['status'] = 'healthy';
      if (newStock === 0) status = 'out_of_stock';
      else if (newStock <= ingData.minimumStock * 0.5) status = 'critical';
      else if (newStock <= ingData.minimumStock) status = 'low';

      await updateDoc(ingRef, {
        currentStock: newStock,
        status,
        updatedAt: new Date().toISOString()
      });

      // Record Stock movement waste
      const movementId = `MVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await setDoc(doc(db, 'restaurants', tenantId, 'stockMovements', movementId), {
        id: movementId,
        ingredientId: wasteData.ingredientId,
        ingredientName: wasteData.ingredientName,
        quantity: -wasteData.quantity,
        type: 'waste',
        reason: `Recorded waste: ${wasteData.reason}`,
        valueLost: wasteData.valueLost,
        submittedBy: wasteData.submittedBy || 'system',
        submittedByName: wasteData.submittedByName || 'System',
        timestamp: new Date().toISOString()
      });

      // Log to Event Engine
      logEvent(tenantId, {
        eventType: 'Waste Recorded',
        eventCategory: 'Management',
        tenantId,
        performedBy: wasteData.submittedByName || 'Staff',
        performedByRole: 'Staff',
        title: `Waste Logged: ${wasteData.ingredientName}`,
        description: `Wasted ${wasteData.quantity} ${wasteData.unit} due to ${wasteData.reason}. Lost value: ${formatPrice(wasteData.valueLost)}`,
        metadata: { ingredientId: wasteData.ingredientId, wasteValue: wasteData.valueLost }
      });
    }

    return docRef.id;
  },

  // Deduct prepared batch portions when an order transitions to PREPARING status
  deductBatchServings: async (tenantId: string, orderId: string) => {
    const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) return;
      const data = orderSnap.data();

      // If already processed, ignore
      if (data.batchServingsDeducted) return;

      const items = data.items || [];
      if (items.length === 0) {
        transaction.update(orderRef, { batchServingsDeducted: true });
        return;
      }

      for (const item of items) {
        const itemRef = doc(db, 'restaurants', tenantId, 'menu', 'default', 'items', item.itemId);
        const itemSnap = await transaction.get(itemRef);

        if (itemSnap.exists()) {
          const itemData = itemSnap.data();
          const isBatch = itemData.preparationMethod === 'batch' || itemData.productionMode === 'Batch Production';
          if (isBatch) {
            const currentServings = itemData.availableServings ?? 0;
            const countToDeduct = item.count || 1;
            const newServings = Math.max(0, currentServings - countToDeduct);

            const updateFields: any = {
              availableServings: newServings,
              updatedAt: new Date().toISOString()
            };

            // Auto mark unavailable if config is set and servings hit 0
            if (newServings === 0 && itemData.autoUnavailable !== false) {
              updateFields.isAvailable = false;
              updateFields.available = false;
            }

            transaction.update(itemRef, updateFields);

            // Trigger log event/notifications if stock level status transitions
            const lowThreshold = itemData.lowStockThreshold ?? 10;
            const oldStatus = currentServings === 0 ? 'critical' : currentServings <= lowThreshold ? 'low' : 'healthy';
            const newStatus = newServings === 0 ? 'critical' : newServings <= lowThreshold ? 'low' : 'healthy';

            if (oldStatus !== newStatus) {
              const eventType = newStatus === 'critical' ? 'Batch Portion Critical' : 'Batch Portion Low';
              const title = newStatus === 'critical' ? `Prepared Batch Sold Out: ${itemData.name}` : `Low Prepared portions: ${itemData.name}`;
              const description = newStatus === 'critical'
                ? `Prepared batch portions for "${itemData.name}" are sold out!`
                : `Prepared batch portions for "${itemData.name}" are low (${newServings} portions remaining, threshold ${lowThreshold})`;

              logEvent(tenantId, {
                eventType,
                eventCategory: 'Operations',
                tenantId,
                performedBy: 'System',
                performedByRole: 'System',
                title,
                description,
                metadata: { itemId: item.itemId, itemName: itemData.name, availableServings: newServings }
              });
            }
          }
        }
      }

      // Update Order document
      transaction.update(orderRef, { batchServingsDeducted: true });
    });
  },

  // Restore prepared batch portions when an order is cancelled or refunded
  restockBatchServings: async (tenantId: string, orderId: string, type: 'refund_restock' | 'cancellation_restock') => {
    const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) return;
      const data = orderSnap.data();

      // Only restore if previously deducted, and not already restocked
      if (!data.batchServingsDeducted || data.batchServingsRestocked) return;

      const items = data.items || [];
      if (items.length === 0) {
        transaction.update(orderRef, { batchServingsRestocked: true });
        return;
      }

      for (const item of items) {
        const itemRef = doc(db, 'restaurants', tenantId, 'menu', 'default', 'items', item.itemId);
        const itemSnap = await transaction.get(itemRef);

        if (itemSnap.exists()) {
          const itemData = itemSnap.data();
          const isBatch = itemData.preparationMethod === 'batch' || itemData.productionMode === 'Batch Production';
          if (isBatch) {
            const currentServings = itemData.availableServings ?? 0;
            const countToRestore = item.count || 1;
            const newServings = currentServings + countToRestore;

            const updateFields: any = {
              availableServings: newServings,
              updatedAt: new Date().toISOString()
            };

            // If it was auto marked unavailable and we are restocking, make it available again
            if (newServings > 0 && !itemData.isAvailable && itemData.autoUnavailable !== false) {
              updateFields.isAvailable = true;
              updateFields.available = true;
            }

            transaction.update(itemRef, updateFields);

            // Log event
            logEvent(tenantId, {
              eventType: 'Stock Adjustment',
              eventCategory: 'Operations',
              tenantId,
              performedBy: 'System',
              performedByRole: 'System',
              title: `Restocked portions: ${itemData.name}`,
              description: `Restored ${countToRestore} portions for "${itemData.name}" due to order ${type.replace('_', ' ')}. New total: ${newServings}`,
              metadata: { itemId: item.itemId, itemName: itemData.name, restoredAmount: countToRestore, availableServings: newServings }
            });
          }
        }
      }

      transaction.update(orderRef, { batchServingsRestocked: true });
    });
  },

  // Deduct ingredient stock when preparing a new batch of portions
  deductIngredientsForBatch: async (tenantId: string, itemId: string, batchSize: number) => {
    const recipeRef = doc(db, 'restaurants', tenantId, 'recipes', itemId);

    await runTransaction(db, async (transaction) => {
      const recipeSnap = await transaction.get(recipeRef);
      if (!recipeSnap.exists()) {
        throw new Error('No recipe defined for this item. Unable to prepare batch.');
      }
      
      const recipe = recipeSnap.data() as IRecipe;
      const yieldQty = recipe.yieldQuantity || 1;
      const wasteFactor = 1 + (recipe.wastePercentage || 0) / 100;

      // First check if there is sufficient stock for all ingredients
      const ingSnaps: Record<string, { ref: any; data: IStockIngredient; needed: number }> = {};
      for (const ing of recipe.ingredients) {
        const neededQty = (ing.quantity / yieldQty) * batchSize * wasteFactor;
        const ingRef = doc(db, 'restaurants', tenantId, 'inventory', ing.ingredientId);
        const ingSnap = await transaction.get(ingRef);

        if (!ingSnap.exists()) {
          throw new Error(`Ingredient stock record for "${ing.ingredientName}" not found.`);
        }

        const ingData = ingSnap.data() as IStockIngredient;
        if ((ingData.currentStock || 0) < neededQty) {
          throw new Error(`Insufficient stock for "${ing.ingredientName}". Needed: ${neededQty.toFixed(1)} ${ingData.unit}, Available: ${ingData.currentStock?.toFixed(1) ?? 0} ${ingData.unit}`);
        }

        ingSnaps[ing.ingredientId] = {
          ref: ingRef,
          data: ingData,
          needed: neededQty
        };
      }

      // Deduct stock for all ingredients
      for (const ingredientId of Object.keys(ingSnaps)) {
        const { ref, data: ingData, needed } = ingSnaps[ingredientId];
        const newStock = Math.max(0, (ingData.currentStock || 0) - needed);

        let status: IStockIngredient['status'] = 'healthy';
        if (newStock === 0) status = 'out_of_stock';
        else if (newStock <= ingData.minimumStock * 0.5) status = 'critical';
        else if (newStock <= ingData.minimumStock) status = 'low';

        transaction.update(ref, {
          currentStock: newStock,
          status,
          updatedAt: new Date().toISOString()
        });

        // Log movement
        const movementId = `MVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const movementRef = doc(collection(db, 'restaurants', tenantId, 'stockMovements'), movementId);
        transaction.set(movementRef, {
          id: movementId,
          ingredientId,
          ingredientName: ingData.name,
          quantity: -needed,
          type: 'consumption',
          reason: `Batch prep cooked: ${batchSize} portions`,
          submittedBy: 'system',
          submittedByName: 'Kitchen Chef',
          timestamp: new Date().toISOString()
        });
      }
    });
  }
};
