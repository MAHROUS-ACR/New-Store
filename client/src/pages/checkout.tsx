import { useState, useEffect } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { ArrowLeft, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cartContext";
import { useUser } from "@/lib/userContext";
import { useLanguage } from "@/lib/languageContext";
import { t } from "@/lib/translations";
import { toast } from "sonner";
import { getShippingZones, saveOrder } from "@/lib/firebaseOps";
import { sendNotificationToAdmins } from "@/lib/notificationAPI";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, clearCart } = useCart();
  const { user, isLoggedIn, isLoading: authLoading } = useUser();
  const { language } = useLanguage();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "delivery" | null>(null);
  const [shippingType, setShippingType] = useState<"saved" | "new" | null>(null);
  const [selectedZone, setSelectedZone] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingZones, setShippingZones] = useState<any[]>([]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLocation("/login");
    }
  }, [isLoggedIn, authLoading, setLocation]);

  // Load shipping zones
  useEffect(() => {
    const load = async () => {
      const zones = await getShippingZones();
      console.log("📦 Shipping zones loaded:", zones);
      zones?.forEach((zone: any) => {
        console.log("Zone:", { name: zone.name, shippingCost: zone.shippingCost, id: zone.id });
      });
      setShippingZones(zones || []);
    };
    load();
  }, []);

  // Reset states when items change (go back to cart and add new items)
  useEffect(() => {
    console.log("🔄 Items changed, resetting payment/shipping states. Items:", items.length);
    setPaymentMethod(null);
    setShippingType(null);
    setSelectedZone("");
    setShippingCost(0);
  }, [items.length]);

  const handlePlaceOrder = async () => {
    console.log("🔘 Button clicked! isProcessing:", isProcessing);
    
    if (isProcessing) {
      console.log("⏳ Already processing, ignoring click");
      return;
    }

    if (!paymentMethod) {
      toast.error("❌ اختر طريقة الدفع - Select payment method");
      return;
    }
    if (!shippingType) {
      toast.error("❌ اختر نوع الشحن - Select shipping type");
      return;
    }
    if (!selectedZone) {
      toast.error("❌ اختر المنطقة - Select shipping zone");
      return;
    }
    if (items.length === 0) {
      toast.error("❌ السلة فارغة - Cart is empty");
      return;
    }

    setIsProcessing(true);
    console.log("📤 Processing order...");

    try {
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const finalTotal = total + shippingCost;

      const orderData = {
        id: `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        orderNumber: Math.floor(Date.now() / 1000),
        items,
        total: finalTotal,
        status: "pending",
        paymentMethod,
        shippingType,
        shippingZone: selectedZone,
        shippingCost,
        createdAt: new Date().toISOString(),
        userId: user?.id,
      };

      console.log("💾 Saving order to Firestore...", orderData);
      const savedId = await saveOrder(orderData);

      if (savedId) {
        console.log("✅ Order saved successfully:", savedId);
        toast.success("✅ تم الطلب - Order placed!");
        clearCart();
        localStorage.removeItem("cart");
        
        sendNotificationToAdmins(
          "New Order",
          `Order placed for L.E ${finalTotal.toFixed(2)}`
        ).catch(() => {});

        setTimeout(() => {
          setLocation("/cart");
        }, 1000);
      } else {
        console.error("❌ saveOrder returned falsy");
        toast.error("❌ فشل الحفظ - Failed to save order");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("❌ Error placing order:", error);
      toast.error("❌ خطأ - Error placing order");
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <MobileWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <h2 className="text-lg font-bold mb-2">Cart is empty</h2>
          <button
            onClick={() => setLocation("/cart")}
            className="px-5 py-2 bg-black text-white rounded-full text-sm font-semibold mt-4"
          >
            Back to cart
          </button>
        </div>
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper>
      <div className="w-full h-screen flex flex-col">
        <div className="px-5 py-4 border-b flex-shrink-0">
          <button
            onClick={() => setLocation("/cart")}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Payment</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ paddingBottom: "140px" }}>
          {/* Order Summary */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <h3 className="font-bold mb-3">Order Summary</h3>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm mb-2">
                <span>{item.quantity}x {item.title}</span>
                <span>L.E {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 font-bold flex justify-between text-base">
              <span>Subtotal:</span>
              <span>L.E {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Shipping:</span>
              <span>L.E {shippingCost.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 font-bold flex justify-between text-lg">
              <span>Total:</span>
              <span>L.E {(items.reduce((sum, item) => sum + item.price * item.quantity, 0) + shippingCost).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">Payment Method</h3>
            <button
              onClick={() => setPaymentMethod("delivery")}
              className={`w-full p-4 rounded-xl border-2 mb-3 ${paymentMethod === "delivery" ? "border-black bg-black text-white" : "border-gray-200"}`}
            >
              💳 Cash on Delivery
            </button>
            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full p-4 rounded-xl border-2 ${paymentMethod === "card" ? "border-black bg-black text-white" : "border-gray-200"}`}
            >
              🏦 Card Payment
            </button>
          </div>

          {/* Shipping */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">Shipping</h3>
            <button
              onClick={() => setShippingType("saved")}
              className={`w-full p-4 rounded-xl border-2 mb-3 ${shippingType === "saved" ? "border-black bg-black text-white" : "border-gray-200"}`}
            >
              📍 Use Saved Address
            </button>
            <button
              onClick={() => setShippingType("new")}
              className={`w-full p-4 rounded-xl border-2 ${shippingType === "new" ? "border-black bg-black text-white" : "border-gray-200"}`}
            >
              ✏️ New Address
            </button>
          </div>

          {/* Shipping Zone - MUST SELECT ZONE */}
          {shippingType && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4">
              <h3 className="font-bold mb-3 text-lg">📍 اختر المنطقة - Select Your Zone</h3>
              {shippingZones && shippingZones.length > 0 ? (
                <div className="space-y-2">
                  {shippingZones.map((zone) => {
                    const zoneCost = parseFloat(zone.shippingCost || 0);
                    return (
                      <button
                        key={zone.id || zone.name}
                        onClick={() => {
                          console.log("✅ Zone selected:", zone.name, "Cost:", zoneCost);
                          setSelectedZone(zone.name);
                          setShippingCost(zoneCost);
                        }}
                        className={`w-full p-4 rounded-xl border-2 font-semibold text-base ${selectedZone === zone.name ? "border-black bg-black text-white" : "border-gray-200 bg-white"}`}
                      >
                        {zone.name} - L.E {zoneCost.toFixed(2)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                  <p className="text-gray-600">⏳ جاري تحميل المناطق...</p>
                </div>
              )}
            </div>
          )}
          
          {/* Instructions if not filled */}
          {!selectedZone && shippingType && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-3 mb-20">
              <p className="text-red-700 font-bold">⚠️ اختر منطقة الشحن من فوق!</p>
            </div>
          )}

        </div>

        {/* Sticky Place Order Button at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-5 max-w-[390px] mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className={`w-full py-4 px-5 rounded-2xl font-bold text-base transition-all ${
              isProcessing
                ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                : "bg-black text-white hover:bg-gray-900 active:scale-95"
            }`}
            type="button"
          >
            {isProcessing ? "⏳ جاري المعالجة..." : `✅ اطلب - Place Order - L.E ${(items.reduce((sum, item) => sum + item.price * item.quantity, 0) + shippingCost).toFixed(2)}`}
          </button>
        </div>
      </div>
    </MobileWrapper>
  );
}
