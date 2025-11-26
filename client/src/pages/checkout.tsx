import { useState, useEffect } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cartContext";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";
import { getShippingZones, saveOrder } from "@/lib/firebaseOps";
import { sendNotificationToAdmins } from "@/lib/notificationAPI";

interface ShippingZone {
  id: string;
  name: string;
  shippingCost: number;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, clearCart } = useCart();
  const { user, isLoggedIn, isLoading: authLoading } = useUser();

  // States
  const [paymentMethod, setPaymentMethod] = useState<"delivery" | "card" | null>(null);
  const [shippingType, setShippingType] = useState<"saved" | "new" | null>(null);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLocation("/login");
    }
  }, [isLoggedIn, authLoading, setLocation]);

  // Load shipping zones
  useEffect(() => {
    const loadZones = async () => {
      setIsLoading(true);
      try {
        const zones = await getShippingZones();
        const parsed = zones.map((z: any) => ({
          id: z.id,
          name: z.name,
          shippingCost: parseFloat(z.shippingCost || 0),
        }));
        setShippingZones(parsed);
      } catch (error) {
        console.error("Error loading zones:", error);
        toast.error("Failed to load shipping zones");
      } finally {
        setIsLoading(false);
      }
    };
    loadZones();
  }, []);

  // Reset form when items change
  useEffect(() => {
    setPaymentMethod(null);
    setShippingType(null);
    setSelectedZone(null);
  }, [items.length]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = selectedZone?.shippingCost || 0;
  const total = subtotal + shippingCost;

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast.error("اختر طريقة الدفع - Select payment method");
      return;
    }
    if (!shippingType) {
      toast.error("اختر نوع الشحن - Select shipping type");
      return;
    }
    if (!selectedZone) {
      toast.error("اختر المنطقة - Select shipping zone");
      return;
    }

    setIsPlacing(true);

    try {
      const orderData = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        orderNumber: Math.floor(Date.now() / 1000),
        userId: user?.id,
        items,
        subtotal,
        shippingCost,
        total,
        status: "pending",
        paymentMethod,
        shippingType,
        shippingZone: selectedZone.name,
        createdAt: new Date().toISOString(),
      };

      const savedId = await saveOrder(orderData);

      if (savedId) {
        toast.success("✅ تم الطلب - Order placed!");
        clearCart();
        localStorage.removeItem("cart");

        sendNotificationToAdmins(
          "New Order",
          `New order: L.E ${total.toFixed(2)}`
        ).catch(() => {});

        setTimeout(() => setLocation("/cart"), 1000);
      } else {
        throw new Error("No order ID returned");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ في الطلب - Error placing order");
      setIsPlacing(false);
    }
  };

  // Empty cart check
  if (items.length === 0) {
    return (
      <MobileWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <h2 className="text-xl font-bold mb-4">السلة فارغة - Cart is empty</h2>
          <button
            onClick={() => setLocation("/cart")}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold"
          >
            العودة - Back to cart
          </button>
        </div>
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setLocation("/cart")}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">الدفع - Payment</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ paddingBottom: "140px" }}>
          {/* Order Summary */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <h2 className="font-bold text-lg mb-3">ملخص الطلب - Order Summary</h2>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm mb-2">
                <span>{item.quantity}x {item.title}</span>
                <span>L.E {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 mb-2">
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal:</span>
                <span>L.E {subtotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Shipping:</span>
              <span>L.E {shippingCost.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold text-black">
              <span>Total:</span>
              <span>L.E {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">طريقة الدفع - Payment Method</h3>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("delivery")}
                className={`w-full p-4 rounded-xl border-2 font-semibold transition ${
                  paymentMethod === "delivery"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black hover:border-black"
                }`}
              >
                💵 الدفع عند الاستلام - Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`w-full p-4 rounded-xl border-2 font-semibold transition ${
                  paymentMethod === "card"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black hover:border-black"
                }`}
              >
                💳 بطاقة ائتمان - Card Payment
              </button>
            </div>
          </div>

          {/* Shipping Type */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">الشحن - Shipping</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShippingType("saved")}
                className={`w-full p-4 rounded-xl border-2 font-semibold transition ${
                  shippingType === "saved"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black hover:border-black"
                }`}
              >
                📍 العنوان المحفوظ - Saved Address
              </button>
              <button
                onClick={() => setShippingType("new")}
                className={`w-full p-4 rounded-xl border-2 font-semibold transition ${
                  shippingType === "new"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black hover:border-black"
                }`}
              >
                ✏️ عنوان جديد - New Address
              </button>
            </div>
          </div>

          {/* Shipping Zones */}
          {shippingType && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4">
              <h3 className="font-bold text-lg mb-3">المنطقة - Select Zone</h3>
              {isLoading ? (
                <p className="text-gray-600 text-center py-4">⏳ جاري التحميل...</p>
              ) : shippingZones.length > 0 ? (
                <div className="space-y-2">
                  {shippingZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className={`w-full p-4 rounded-xl border-2 font-semibold transition ${
                        selectedZone?.id === zone.id
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-black hover:border-black"
                      }`}
                    >
                      {zone.name} - L.E {zone.shippingCost.toFixed(2)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">لا توجد مناطق - No zones available</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-5 max-w-[390px] mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacing || !paymentMethod || !shippingType || !selectedZone}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition ${
              isPlacing || !paymentMethod || !shippingType || !selectedZone
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-900 active:scale-95"
            }`}
          >
            {isPlacing ? "⏳ جاري..." : `✅ اطلب الآن - Place Order`}
          </button>
        </div>
      </div>
    </MobileWrapper>
  );
}
