import { useState, useEffect } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { ArrowLeft, MapPin, User, Phone, Mail, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cartContext";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";
import { getShippingZones, saveOrder } from "@/lib/firebaseOps";
import { sendNotificationToAdmins } from "@/lib/notificationAPI";

interface Zone {
  id: string;
  name: string;
  shippingCost: number;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, clearCart } = useCart();
  const { user, isLoggedIn, isLoading: authLoading } = useUser();

  // Form states
  const [paymentSelected, setPaymentSelected] = useState("");
  const [shippingSelected, setShippingSelected] = useState("");
  const [zoneSelected, setZoneSelected] = useState<Zone | null>(null);
  const [zonesList, setZonesList] = useState<Zone[]>([]);
  
  // Customer data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLocation("/login");
    }
  }, [isLoggedIn, authLoading, setLocation]);

  // Load shipping zones
  useEffect(() => {
    const loadZones = async () => {
      setIsLoadingZones(true);
      try {
        const zones = await getShippingZones();
        const mappedZones = (zones || []).map((z: any) => ({
          id: z.id,
          name: z.name,
          shippingCost: Number(z.shippingCost) || 0,
        }));
        setZonesList(mappedZones);
      } catch (err) {
        console.error("Failed to load zones:", err);
      } finally {
        setIsLoadingZones(false);
      }
    };
    loadZones();
  }, []);
  
  // Auto-select first zone when shipping type changes
  useEffect(() => {
    if (shippingSelected === "saved" && zonesList.length > 0) {
      setZoneSelected(zonesList[0]);
    } else if (shippingSelected === "new") {
      setZoneSelected(null);
    }
  }, [shippingSelected, zonesList]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = zoneSelected?.shippingCost || 0;
  const grandTotal = subtotal + shipping;
  
  const isFormValid = 
    paymentSelected && 
    shippingSelected && 
    zoneSelected &&
    customerName.trim() &&
    customerPhone.trim() &&
    (shippingSelected === "saved" || deliveryAddress.trim());

  const handleSubmit = async () => {
    console.log("🔵 handleSubmit START");
    
    // Validate all fields
    if (!customerName.trim()) {
      toast.error("اكتب اسمك - Enter your name");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("اكتب رقم هاتفك - Enter your phone");
      return;
    }
    if (shippingSelected === "new" && !deliveryAddress.trim()) {
      toast.error("اكتب العنوان - Enter your address");
      return;
    }
    if (!paymentSelected || !shippingSelected || !zoneSelected) {
      toast.error("اختر جميع الخيارات - Select all options");
      return;
    }
    if (!items || items.length === 0) {
      toast.error("السلة فارغة - Cart is empty");
      return;
    }
    if (!user?.id) {
      toast.error("يجب تسجيل الدخول - You must login");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      
      const orderObj = {
        id: orderId,
        orderNumber: Math.floor(Date.now() / 1000),
        userId: user.id,
        userEmail: user.email,
        
        // Customer info
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: shippingSelected === "saved" ? zoneSelected?.name : deliveryAddress.trim(),
        notes: notes.trim(),
        
        // Order items
        items: items.map(item => ({
          id: item.id || "",
          title: item.title || "",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
        })),
        
        // Pricing
        subtotal: Number(subtotal) || 0,
        shippingCost: Number(shipping) || 0,
        total: Number(grandTotal) || 0,
        
        // Payment & Shipping
        status: "pending",
        paymentMethod: paymentSelected,
        shippingType: shippingSelected,
        shippingZone: zoneSelected?.name || "",
        shippingZoneId: zoneSelected?.id || "",
      };

      console.log("📝 Order object:", JSON.stringify(orderObj, null, 2));
      const savedId = await saveOrder(orderObj);
      
      if (!savedId) throw new Error("saveOrder returned null");

      console.log("✅ Order saved successfully:", savedId);
      toast.success("✅ تم تأكيد الطلب!");

      // Clear cart
      clearCart();
      Object.keys(localStorage)
        .filter(k => k.startsWith("cart"))
        .forEach(k => localStorage.removeItem(k));

      // Send notification
      sendNotificationToAdmins(
        `New Order #${orderObj.orderNumber}`, 
        `${customerName} - L.E ${grandTotal.toFixed(2)}`
      ).catch(() => {});

      setIsSubmitting(false);
      
      // Go to home
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Order error:", error?.message || error);
      toast.error("خطأ في الطلب - " + (error?.message || "Unknown error"));
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <MobileWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">السلة فارغة - Empty Cart</h2>
            <button
              onClick={() => setLocation("/cart")}
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold"
            >
              العودة - Back
            </button>
          </div>
        </div>
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper>
      <div className="w-full flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-5 py-4 flex-shrink-0 sticky top-0">
          <button
            onClick={() => setLocation("/cart")}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3 hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">🛒 الدفع - Checkout</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ paddingBottom: "180px" }}>
          
          {/* Order Summary */}
          <section className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              📋 ملخص الطلب - Order Summary
            </h2>
            <div className="space-y-2 mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                  <span className="font-semibold">{item.quantity}x {item.title}</span>
                  <span className="text-green-600 font-semibold">L.E {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>L.E {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>L.E {shipping.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">L.E {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* Customer Info */}
          <section className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <User className="w-5 h-5" /> البيانات - Your Details
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="الاسم - Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div className="flex gap-2">
                <Phone className="w-5 h-5 text-gray-400 mt-3" />
                <input
                  type="tel"
                  placeholder="الهاتف - Phone (e.g., +201012345678)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex gap-2">
                <Mail className="w-5 h-5 text-gray-400 mt-3" />
                <input
                  type="email"
                  placeholder="البريد - Email"
                  value={user?.email || ""}
                  disabled
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h3 className="font-bold text-lg mb-3">💳 طريقة الدفع - Payment Method</h3>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentSelected("delivery")}
                className={`w-full p-3 rounded-lg border-2 font-semibold transition flex items-center gap-3 ${
                  paymentSelected === "delivery" ? "border-black bg-black text-white" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-lg">💵</span>
                الدفع عند الاستلام - Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentSelected("card")}
                className={`w-full p-3 rounded-lg border-2 font-semibold transition flex items-center gap-3 ${
                  paymentSelected === "card" ? "border-black bg-black text-white" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-lg">💳</span>
                بطاقة ائتمان - Card Payment
              </button>
            </div>
          </section>

          {/* Shipping Type */}
          <section className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h3 className="font-bold text-lg mb-3">📦 الشحن - Shipping</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShippingSelected("saved")}
                className={`w-full p-3 rounded-lg border-2 font-semibold transition flex items-center gap-3 ${
                  shippingSelected === "saved" ? "border-black bg-black text-white" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-lg">📍</span>
                منطقة محفوظة - Select Zone
              </button>
              <button
                onClick={() => setShippingSelected("new")}
                className={`w-full p-3 rounded-lg border-2 font-semibold transition flex items-center gap-3 ${
                  shippingSelected === "new" ? "border-black bg-black text-white" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-lg">✏️</span>
                عنوان جديد - New Address
              </button>
            </div>
          </section>

          {/* Zone Selection */}
          {shippingSelected === "saved" && (
            <section className="bg-yellow-50 rounded-lg p-4 mb-4 border-2 border-yellow-300">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> المنطقة - Delivery Zone
              </h3>
              {isLoadingZones ? (
                <p className="text-center text-gray-600 py-4">⏳ جاري التحميل...</p>
              ) : zonesList.length === 0 ? (
                <p className="text-center text-gray-600 py-4">لا توجد مناطق</p>
              ) : (
                <div className="space-y-2">
                  {zonesList.map((z) => (
                    <button
                      key={z.id}
                      onClick={() => setZoneSelected(z)}
                      className={`w-full p-3 rounded-lg border-2 font-semibold transition ${
                        zoneSelected?.id === z.id ? "border-black bg-black text-white" : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{z.name}</span>
                        <span className="font-bold">+ L.E {z.shippingCost.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* New Address */}
          {shippingSelected === "new" && (
            <section className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-300">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> عنوان جديد - New Address
              </h3>
              <textarea
                placeholder="اكتب عنوان التوصيل بالكامل - Full delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <p className="text-sm text-gray-600 mt-2">
                شامل: الشارع، الحي، المدينة - Include street, area, city
              </p>
            </section>
          )}

          {/* Zone for new address */}
          {shippingSelected === "new" && (
            <section className="bg-yellow-50 rounded-lg p-4 mb-4 border-2 border-yellow-300">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> اختر المنطقة - Select Zone
              </h3>
              {isLoadingZones ? (
                <p className="text-center text-gray-600 py-4">⏳ جاري التحميل...</p>
              ) : zonesList.length === 0 ? (
                <p className="text-center text-gray-600 py-4">لا توجد مناطق</p>
              ) : (
                <div className="space-y-2">
                  {zonesList.map((z) => (
                    <button
                      key={z.id}
                      onClick={() => setZoneSelected(z)}
                      className={`w-full p-3 rounded-lg border-2 font-semibold transition ${
                        zoneSelected?.id === z.id ? "border-black bg-black text-white" : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{z.name}</span>
                        <span className="font-bold">+ L.E {z.shippingCost.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Additional Notes */}
          <section className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" /> ملاحظات - Notes (Optional)
            </h3>
            <textarea
              placeholder="أي ملاحظات إضافية... Any additional notes?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={2}
            />
          </section>

        </div>

        {/* Bottom button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-[390px] mx-auto shadow-lg">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className={`w-full py-4 rounded-lg font-bold text-lg transition ${
              isSubmitting || !isFormValid
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-900 active:scale-95"
            }`}
          >
            {isSubmitting ? "⏳ جاري معالجة الطلب..." : `✅ اطلب الآن L.E ${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </MobileWrapper>
  );
}
