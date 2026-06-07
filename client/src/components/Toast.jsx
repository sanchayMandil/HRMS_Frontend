import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

let _dispatch = null;
let _nextId = 1;

export const toast = {
  error:   (msg, opts = {}) => _dispatch?.({ type: "error",   msg, ...opts }),
  success: (msg, opts = {}) => _dispatch?.({ type: "success", msg, ...opts }),
  info:    (msg, opts = {}) => _dispatch?.({ type: "info",    msg, ...opts }),
};

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    _dispatch = ({ type, msg, duration = 5000 }) => {
      const id = _nextId++;
      setItems(prev => [...prev, { id, type, msg }]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), duration);
    };
    return () => { _dispatch = null; };
  }, []);

  const dismiss = (id) => setItems(prev => prev.filter(x => x.id !== id));

  if (!items.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map(({ id, type, msg }) => {
        const { bg, Icon } = ({
          error:   { bg: "bg-red-600",     Icon: AlertCircle },
          success: { bg: "bg-emerald-600", Icon: CheckCircle },
          info:    { bg: "bg-indigo-600",  Icon: Info        },
        }[type] ?? { bg: "bg-gray-700", Icon: Info });
        return (
          <div
            key={id}
            className={`pointer-events-auto flex items-start gap-3 ${bg} text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl max-w-sm`}
          >
            <Icon size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{msg}</span>
            <button
              type="button"
              onClick={() => dismiss(id)}
              className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer border-0 bg-transparent text-white p-0 ml-1"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
