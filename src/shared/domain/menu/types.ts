export interface IMenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  image: string;
}

export interface IMenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category: string; // for backward compatibility
  price: number; // in cents
  discountPrice?: number; // in cents
  image: string;
  imageUrl: string; // for backward compatibility
  preparationTime: number; // in minutes
  isVeg: boolean;
  veg: boolean; // for backward compatibility
  isAvailable: boolean;
  available: boolean; // for backward compatibility
  isBestSeller: boolean;
  isRecommended: boolean;
  spiceLevel: string; // 'none' | 'mild' | 'medium' | 'hot'
  tags: string[];
  station?: string; // e.g. 'Grill', 'Pizza', 'Drinks', etc.
  createdAt: string;
  updatedAt: string;
}
