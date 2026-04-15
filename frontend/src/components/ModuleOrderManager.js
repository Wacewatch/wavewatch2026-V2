import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export default function ModuleOrderManager({ modules, moduleLabels, toggleModule, onReorder }) {
  const [order, setOrder] = useState(Object.keys(moduleLabels));
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    // Load saved order from localStorage or use default
    const saved = localStorage.getItem('moduleOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all keys are present
        const allKeys = Object.keys(moduleLabels);
        const validOrder = parsed.filter(k => allKeys.includes(k));
        const missing = allKeys.filter(k => !validOrder.includes(k));
        setOrder([...validOrder, ...missing]);
      } catch { }
    }
  }, [moduleLabels]);

  const saveOrder = (newOrder) => {
    setOrder(newOrder);
    localStorage.setItem('moduleOrder', JSON.stringify(newOrder));
    onReorder(newOrder);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    saveOrder(newOrder);
  };

  const moveDown = (index) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    saveOrder(newOrder);
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newOrder = [...order];
    const draggedKey = newOrder[draggedItem];
    newOrder.splice(draggedItem, 1);
    newOrder.splice(index, 0, draggedKey);
    
    setDraggedItem(index);
    setOrder(newOrder);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null) {
      saveOrder(order);
    }
    setDraggedItem(null);
  };

  return (
    <div className="space-y-2">
      {order.map((key, index) => {
        const label = moduleLabels[key];
        if (!label) return null;
        const isActive = modules[key];
        
        return (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move ${
              isActive 
                ? 'border-green-500/30 bg-green-500/10' 
                : 'border-border bg-secondary/30'
            } ${draggedItem === index ? 'opacity-50 scale-95' : ''}`}
          >
            {/* Drag Handle */}
            <div className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Position Number */}
            <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
              {index + 1}
            </span>

            {/* Module Name */}
            <span className="flex-1 text-sm font-medium">{label}</span>

            {/* Arrow Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                title="Monter"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === order.length - 1}
                className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                title="Descendre"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => toggleModule(key)}
              className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
              title={isActive ? 'Désactiver' : 'Activer'}
            >
              {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
