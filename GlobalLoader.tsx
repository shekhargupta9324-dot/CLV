import { motion, AnimatePresence } from 'framer-motion';

interface GlobalLoaderProps {
  isLoading: boolean;
}

export function GlobalLoader({ isLoading }: GlobalLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-950 font-serif"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')" }}
        >
          <div className="absolute inset-0 bg-stone-900/90 mix-blend-multiply" />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="relative z-10 text-8xl drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]"
          >
            🧭
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 mt-8 space-y-4 text-center"
          >
            <h2 className="text-2xl font-bold tracking-widest text-[#d4af37] uppercase drop-shadow">
              Charting the Course
            </h2>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  className="w-2 h-2 rounded-full bg-[#f4d0a4] shadow-[0_0_5px_rgba(244,208,164,0.8)]"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
