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
      <div className="space-y-8 animate-in fade-in duration-700">
        {categories.map(category => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-4">
              <h2 className="text-xs uppercase tracking-[0.2em] font-black text-blue-600 ml-1">
                {category}
              </h2>
              <div className="h-[1px] flex-grow bg-slate-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items
                .filter(item => (item.category || 'General') === category)
                .map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => onItemClick && item.isAvailable && onItemClick(item)}
                    className={`group relative bg-white p-5 rounded-[24px] shadow-sm border transition-all cursor-pointer active:scale-[0.98] ${
                      item.isAvailable 
                      ? 'border-slate-100 hover:shadow-md hover:border-blue-200' 
                      : 'opacity-60 bg-slate-50 border-transparent cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow pr-4">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                          {item.name || 'Untitled Dish'}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2 italic leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-blue-800 flex items-center justify-end">
                          {item.price || '0'}
                          <span className="text-[10px] ml-1 uppercase opacity-50 font-bold tracking-tighter">Kes</span>
                        </p>
                      </div>
                    </div>

                    {!item.isAvailable && (
                      <div className="mt-3">
                        <span className="bg-rose-100 text-rose-600 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                          Currently Unavailable
                        </span>
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