import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Building, Hash } from 'lucide-react';
import { dbFetchJson } from '../lib/dbClient'; 

interface CustomerSearchProps {
  onSelect: (customer: any) => void;
}

export default function CustomerSearch({ onSelect }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        try {
          const [comps, orders] = await Promise.all([
            dbFetchJson<any[]>("/companies"),
            dbFetchJson<any[]>("/orders")
          ]);

          const query = searchTerm.toLowerCase();
          
          // 1. กรองบริษัท และดึงข้อมูลติดต่อจาก Order ล่าสุดของบริษัทนั้นมาด้วย
          const filteredComps = comps.filter(c => 
            (c.company || "").toLowerCase().includes(query) || 
            (c.tax || "").toLowerCase().includes(query)
          ).map(c => {
            // หา Order ล่าสุดของบริษัทนี้เพื่อเอาเบอร์โทร/ที่อยู่
            const latestOrder = [...orders].reverse().find(o => String(o.id_company) === String(c._id));
            return { 
              ...c, 
              type: 'company',
              // ดึงข้อมูลติดต่อจาก Order ล่าสุดมาใส่ใน Object บริษัท
              phone: latestOrder?.phone || "",
              email: latestOrder?.email || "",
              line: latestOrder?.line || "",
              address: latestOrder?.address || "",
              customer_name: latestOrder?.customer_name || ""
            };
          });

          // 2. กรองลูกค้าทั่วไป
          const filteredOrders = orders.filter(o => 
            (o.customer_name || "").toLowerCase().includes(query) && !o.id_company
          ).map(o => ({ 
            ...o, 
            type: 'personal', 
            company: o.customer_name 
          }));

          const combined = [...filteredComps, ...filteredOrders];
          setSuggestions(combined.slice(0, 10)); 
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        }
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onFocus={() => { if(suggestions.length > 0) setShowDropdown(true); }}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาลูกค้าเก่า (ชื่อ/บริษัท/TAX)..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
              onClick={() => {
                onSelect(item);
                setSearchTerm('');
                setShowDropdown(false);
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-800">
                {item.type === 'company' ? <Building size={14} className="text-indigo-600"/> : <User size={14} className="text-indigo-600"/>}
                {item.company || item.customer_name}
              </div>
              <div className="text-xs text-slate-500 flex gap-4 mt-1">
                {item.tax && <span className="flex items-center gap-1"><Hash size={10}/>{item.tax}</span>}
                {item.phone && <span>โทร: {item.phone}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}