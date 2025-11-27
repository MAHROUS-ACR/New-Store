import { useEffect, useState } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { useUser } from "@/lib/userContext";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/languageContext";
import { t } from "@/lib/translations";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";

interface DeliveryOrder {
  id: string;
  orderNumber?: number;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  deliveryUsername?: string;
}

export default function DeliveryPage() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>("shipped");

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "delivery")) {
      setLocation("/");
    }
  }, [isLoading, user, setLocation]);

  const fetchMyOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const db = getFirestore();
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("deliveryUserId", "==", user.id));
      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DeliveryOrder[];
      setOrders(ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "delivery") {
      fetchMyOrders();
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <MobileWrapper>
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper>
      <div className="w-full flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 pb-4 pt-2 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-xl font-bold">🚚 {language === "ar" ? "طلبات التسليم" : "Delivery Orders"}</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {language === "ar" ? "لا توجد طلبات للتسليم" : "No orders to deliver"}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Status Filters */}
              <div className="bg-white rounded-2xl p-3 border border-gray-200 sticky top-0">
                <p className="text-xs font-semibold text-gray-500 mb-2">{language === "ar" ? "التصفية" : "Filter"}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedStatusFilter(null)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      selectedStatusFilter === null
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {language === "ar" ? "الكل" : "All"}
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter("shipped")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      selectedStatusFilter === "shipped"
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {language === "ar" ? "🚚 تم الشحن" : "🚚 Shipped"}
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter("completed")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      selectedStatusFilter === "completed"
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {language === "ar" ? "✅ مكتمل" : "✅ Completed"}
                  </button>
                </div>
              </div>

              {/* Orders List */}
              {orders
                .filter(order => selectedStatusFilter === null || order.status === selectedStatusFilter)
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-white border border-gray-200 rounded-2xl hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Order #{order.orderNumber || "N/A"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {order.status === "completed"
                          ? language === "ar" ? "✅ مكتمل" : "✅ Completed"
                          : language === "ar" ? "🚚 تم الشحن" : "🚚 Shipped"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-orange-600">L.E {order.total.toFixed(2)}</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </MobileWrapper>
  );
}
