import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OfferLineItem, InvoiceLineItem } from '../../persistence/adapter';

interface DraggableLineItemProps {
  item: OfferLineItem | InvoiceLineItem;
  children: React.ReactNode;
  isDisabled?: boolean;
}

export const DraggableLineItem: React.FC<DraggableLineItemProps> = ({
  item,
  children,
  isDisabled = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: item.id.toString(),
    disabled: isDisabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Schnellere, weichere Übergänge - reduziert das Ruckeln
    transition: isDragging ? 'none' : (transition || 'transform 150ms cubic-bezier(0.2, 0, 0, 1)'),
    // Reduce opacity less drastically when dragging
    opacity: isDragging ? 0.4 : 1,
    // Add visual feedback for drop zones
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
    borderColor: isOver ? 'rgba(59, 130, 246, 0.5)' : undefined,
    // Verhindert Skalierung während des Ziehens
    willChange: isDragging ? 'transform' : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-line-item ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-over' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Drop zone indicator for better visual feedback */}
      {isOver && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '0',
          right: '0',
          height: '4px',
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: '2px',
          pointerEvents: 'none',
          zIndex: 1000
        }} />
      )}
      {children}
    </div>
  );
};