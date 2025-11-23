import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

export interface Discount {
  id: string;
  productId: string;
  discountPercentage: string | number;
  startDate: string | Date;
  endDate: string | Date;
  createdAt?: string | Date;
}

export async function getProductDiscount(productId: string): Promise<Discount | null> {
  try {
    const db = getFirestore();
    const discountsRef = collection(db, "discounts");
    const q = query(discountsRef, where("productId", "==", productId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.docs.length > 0) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Discount;
    }
  } catch (error) {
    console.error("Error fetching discount:", error);
  }
  return null;
}

export async function getAllDiscounts(): Promise<Discount[]> {
  try {
    const db = getFirestore();
    const discountsRef = collection(db, "discounts");
    const querySnapshot = await getDocs(discountsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Discount[];
  } catch (error) {
    console.error("Error fetching all discounts:", error);
  }
  return [];
}

export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number | string): number {
  const discount = parseFloat(String(discountPercentage));
  return originalPrice * (1 - discount / 100);
}

export function getDiscountAmount(originalPrice: number, discountPercentage: number | string): number {
  const discount = parseFloat(String(discountPercentage));
  return originalPrice * (discount / 100);
}

export function isDiscountActive(discount: Discount | null): boolean {
  if (!discount) return false;
  const now = new Date();
  const start = discount.startDate instanceof Date ? discount.startDate : new Date(discount.startDate);
  const end = discount.endDate instanceof Date ? discount.endDate : new Date(discount.endDate);
  return now >= start && now <= end;
}

export function getActiveDiscount(productId: string, discounts: Discount[]): Discount | null {
  const discount = discounts.find((d) => String(d.productId) === String(productId));
  if (!discount || !isDiscountActive(discount)) return null;
  return discount;
}
