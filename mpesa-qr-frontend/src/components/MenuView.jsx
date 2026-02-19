import React from 'react';

const MenuView = ({ items, onItemClick }) => {
    // Grouping items by category for a professional look
    const categories = [...new Set(items.map(item => item.category))];

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">This merchant hasn't added any items yet.</p>
            </div>
        );
    }

return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {categories.map(category => (
        <div key={category} className="space-y-5">
          
          {/* --- Category Header: Bold & Minimalist --- */}
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-black text-orange-600 ml-1 italic">
              {category}
            </h2>
            <div className="h-[1px] flex-grow bg-zinc-200"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items
              .filter(item => (item.category || 'General') === category)
              .map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => onItemClick && item.isAvailable && onItemClick(item)}
                  // Rebranded: High contrast cards with Orange focus on hover
                  className={`group relative bg-white p-6 rounded-[32px] shadow-sm border transition-all cursor-pointer active:scale-[0.97] ${
                    item.isAvailable 
                    ? 'border-zinc-100 hover:shadow-xl hover:shadow-orange-600/5 hover:border-orange-600/30' 
                    : 'opacity-50 bg-zinc-50 border-transparent cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow pr-4">
                      {/* Dish Name: Transitions to Orange on hover */}
                      <h3 className="font-black text-zinc-950 text-xl tracking-tight group-hover:text-orange-600 transition-colors">
                        {item.name || 'Untitled Dish'}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-zinc-500 mt-1.5 line-clamp-2 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Price Tag: High Visibility Orange */}
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-orange-600 flex items-center justify-end tracking-tighter">
                        {item.price || '0'}
                        <span className="text-[10px] ml-1 uppercase text-zinc-400 font-black tracking-widest">Kes</span>
                      </p>
                    </div>
                  </div>

                  {/* Availability Badge: Clean Red Contrast */}
                  {!item.isAvailable && (
                    <div className="mt-4">
                      <span className="bg-red-50 text-red-600 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-red-100">
                        Sold Out
                      </span>
                    </div>
                  )}
                  
                  {/* Subtle Interactive Hint */}
                  {item.isAvailable && (
                    <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuView;