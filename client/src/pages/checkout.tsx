import { useState } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cartContext";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, total, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
  });

  const handleCardNumberChange = (e: string) => {
    const value = e.replace(/\s/g, "").slice(0, 16);
    const formatted = value.replace(/(\d{4})/g, "$1 ").trim();
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: string) => {
    const value = e.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 2) {
      setFormData(prev => ({ ...prev, expiryDate: `${value.slice(0, 2)}/${value.slice(2)}` }));
    } else {
      setFormData(prev => ({ ...prev, expiryDate: value }));
    }
  };

  const handleCVVChange = (e: string) => {
    const value = e.replace(/\D/g, "").slice(0, 3);
    setFormData(prev => ({ ...prev, cvv: value }));
  };

  const validateForm = () => {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length !== 16) {
      toast.error("Invalid card number");
      return false;
    }
    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      toast.error("Invalid expiry date");
      return false;
    }
    if (!formData.cvv || formData.cvv.length !== 3) {
      toast.error("Invalid CVV");
      return false;
    }
    if (!formData.cardHolder.trim()) {
      toast.error("Please enter cardholder name");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter email");
      return false;
    }
    return true;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // Create payment intent on backend
      const paymentResponse = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: "usd",
          cardNumber: formData.cardNumber.replace(/\s/g, ""),
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardHolder: formData.cardHolder,
          email: formData.email,
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      const paymentData = await paymentResponse.json();

      // Create order after successful payment
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
          status: "confirmed",
          paymentId: paymentData.id,
          createdAt: new Date().toISOString(),
        }),
      });

      if (orderResponse.ok) {
        toast.success("Payment successful! Order confirmed.");
        clearCart();
        setLocation("/orders");
      } else {
        toast.error("Order creation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <MobileWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-lg font-bold mb-2">No items to checkout</h2>
          <button
            onClick={() => setLocation("/cart")}
            className="px-6 py-2 bg-black text-white rounded-full text-sm font-semibold mt-4"
          >
            Back to Cart
          </button>
        </div>
        <BottomNav />
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pb-4 pt-2 flex items-center gap-4 border-b border-gray-100">
          <button
            onClick={() => setLocation("/cart")}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Payment</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 pb-24">
          {/* Order Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.title}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-blue-200 pt-2 font-bold flex justify-between">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            {/* Card Details */}
            <div>
              <label className="block text-sm font-semibold mb-2">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="4532 1234 5678 9010"
                  value={formData.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="input-card-number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.cardHolder}
                onChange={(e) => setFormData(prev => ({ ...prev, cardHolder: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="input-cardholder"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="input-expiry"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleCVVChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="input-cvv"
                />
              </div>
            </div>

            {/* Shipping Info */}
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="input-email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Address</label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-start gap-2">
              <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-800">Your payment is secure and encrypted</p>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-black text-white py-4 rounded-2xl font-semibold hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="button-pay"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${total.toFixed(2)}`
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </div>
    </MobileWrapper>
  );
}
