import { motion } from "framer-motion";

const categories = ["All", "Shoes", "Electronics", "Fashion", "Accessories", "Sale"];

export function CategoryFilter({ active, onChange }: { active: string; onChange: (c: string) => void }) {
  return (
    <div className="flex overflow-x-auto no-scrollbar gap-2 px-6 pb-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            active === category ? "text-white" : "text-muted-foreground hover:text-foreground bg-white border border-gray-100"
          }`}
        >
          {active === category && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 bg-black rounded-full z-0"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{category}</span>
        </button>
      ))}
    </div>
  );
}
