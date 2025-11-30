import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/languageContext";
import { t } from "@/lib/translations";
import { getActiveDiscount, calculateDiscountedPrice, type Discount } from "@/lib/discountUtils";
import { Zap } from "lucide-react";
import { useLocation } from "wouter";

interface Product {
  id: string | number;
  title?: string;
  name?: string;
  price: number;
  image: string;
  category?: string;
}

interface ActiveDealsCarouselProps {
  products: Product[];
  discounts: Discount[];
}

export function ActiveDealsCarousel({ products, discounts }: ActiveDealsCarouselProps) {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Get products with active discounts (memoized to prevent re-filtering on every render)
  const discountedProducts = useMemo(() => {
    return products.filter(product => {
      const activeDiscount = getActiveDiscount(String(product.id), discounts);
      return activeDiscount !== null;
    }).slice(0, 6); // Limit to 6 products
  }, [products, discounts]);

  if (discountedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 md:mb-2 lg:mb-2 px-3 md:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-1.5 md:mb-1.5 lg:mb-1.5">
        <Zap className="w-4 h-4 text-yellow-500" />
        <h3 className="text-xs font-semibold text-gray-900">{t("activeDeals", language)}</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2 lg:gap-2">
        {discountedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setLocation(`/product/${product.id}`)}
            className="relative aspect-[4/3] md:aspect-[5/4] lg:aspect-[6/5] rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow group"
          >
            <img
              src={product.image}
              alt={product.title || product.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent p-1 md:p-1.5 flex flex-col justify-between">
              {/* Top Section: Title */}
              <h3 className="font-bold text-[10px] md:text-xs lg:text-xs line-clamp-1 drop-shadow-lg text-white">
                {product.title || product.name}
              </h3>
              
              {/* Bottom Section: Price + Discount Badge */}
              <div className="flex items-end justify-between gap-0.5">
                {/* Price */}
                <div className="text-white drop-shadow-lg whitespace-nowrap">
                  <div className="text-[8px] md:text-[9px] line-through opacity-70">
                    L.E {product.price.toFixed(2)}
                  </div>
                  <div className="text-[8px] md:text-[9px] font-bold text-yellow-300">
                    L.E {calculateDiscountedPrice(
                      product.price,
                      getActiveDiscount(String(product.id), discounts)
                        ?.discountPercentage || 0
                    ).toFixed(2)}
                  </div>
                </div>

                {/* Discount Badge */}
                {(() => {
                  const activeDiscount = getActiveDiscount(String(product.id), discounts);
                  return activeDiscount ? (
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-600 to-orange-600 rounded-full blur opacity-50"></div>
                      <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white px-1 py-0.5 rounded-full text-[7px] md:text-[8px] font-black shadow-md border border-yellow-300">
                        {activeDiscount.discountPercentage}%
                      </div>
                    </motion.div>
                  ) : null;
                })()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
