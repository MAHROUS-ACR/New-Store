import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface ProductProps {
  id: number;
  title: string;
  category: string;
  price: number;
  image: string;
}

export function ProductCard({ product, index }: { product: ProductProps; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white rounded-3xl p-3 shadow-sm border border-gray-100"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
        <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-1">{product.title}</h3>
        <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
      </div>
    </motion.div>
  );
}
