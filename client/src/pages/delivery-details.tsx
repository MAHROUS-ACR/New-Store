import { useEffect, useState } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/languageContext";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryOrderDetails {
  id: string;
  orderNumber?: number;
  total: number;
  status: string;
  createdAt: string;
  deliveryUsername?: string;
  recipientName?: string;
  shippingAddress?: string;
  shippingPhone?: string;
  items?: any[];
  customerName?: string;
  latitude?: number;
  longitude?: number;
}

export default function DeliveryDetailsPage() {
  const [location, setLocation] = useLocation();
  const { language } = useLanguage();
  const [order, setOrder] = useState<DeliveryOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const orderId = location.split("/delivery-order/")[1]?.split("?")[0];

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const db = getFirestore();
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder(orderSnap.data() as DeliveryOrderDetails);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  if (isLoading) {
    return (
      <MobileWrapper>
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MobileWrapper>
    );
  }

  if (!order) {
    return (
      <MobileWrapper>
        <div className="w-full flex-1 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <button onClick={() => setLocation("/delivery")} className="flex items-center gap-2">
              <ArrowLeft size={20} />
              <span>{language === "ar" ? "رجوع" : "Back"}</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p>{language === "ar" ? "لم يتم العثور على الطلب" : "Order not found"}</p>
          </div>
        </div>
      </MobileWrapper>
    );
  }

  const deliveryCoords: [number, number] | null = order.latitude && order.longitude ? [order.latitude, order.longitude] : null;

  return (
    <MobileWrapper>
      <div className="w-full flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setLocation("/delivery")} className="flex items-center gap-2 mb-3">
            <ArrowLeft size={20} />
            <span className="font-semibold">{language === "ar" ? "رجوع" : "Back"}</span>
          </button>
          <h1 className="text-lg font-bold">Order #{order.orderNumber || "N/A"}</h1>
          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Map Section */}
          <div className="h-64 bg-gray-100 border-b border-gray-200">
            {userLocation && deliveryCoords ? (
              <MapContainer center={userLocation} zoom={15} style={{ width: "100%", height: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={userLocation}>
                  <Popup>{language === "ar" ? "موقعك" : "Your Location"}</Popup>
                </Marker>
                <Marker position={deliveryCoords}>
                  <Popup>{language === "ar" ? "موقع التسليم" : "Delivery Location"}</Popup>
                </Marker>
                <Polyline positions={[userLocation, deliveryCoords]} color="blue" weight={3} />
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">{language === "ar" ? "جاري تحميل الخريطة..." : "Loading map..."}</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="p-5 space-y-4">
            {/* Delivery Info */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <h2 className="font-bold text-sm mb-3">{language === "ar" ? "معلومات التسليم" : "Delivery Info"}</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">{language === "ar" ? "العنوان:" : "Address:"}</span> {order.shippingAddress}
                </p>
                <p>
                  <span className="font-semibold">{language === "ar" ? "الهاتف:" : "Phone:"}</span> {order.shippingPhone}
                </p>
                {order.customerName && (
                  <p>
                    <span className="font-semibold">{language === "ar" ? "الزبون:" : "Customer:"}</span> {order.customerName}
                  </p>
                )}
                {order.recipientName && (
                  <p>
                    <span className="font-semibold">{language === "ar" ? "المستلم:" : "Recipient:"}</span> {order.recipientName}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <h2 className="font-bold text-sm mb-3">{language === "ar" ? "المنتجات" : "Items"}</h2>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.title} x{item.quantity}</span>
                      <span>L.E {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
              <div className="flex justify-between items-center">
                <span className="font-bold">{language === "ar" ? "الإجمالي:" : "Total:"}</span>
                <span className="text-xl font-bold text-orange-600">L.E {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </MobileWrapper>
  );
}
