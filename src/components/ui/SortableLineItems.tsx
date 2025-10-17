import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';

interface SortableLineItemsProps {
  children: React.ReactNode;
  items: { id: number }[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

export const SortableLineItems: React.FC<SortableLineItemsProps> = ({
  children,
  items,
  onReorder,
  disabled = false
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduce distance for better responsiveness
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('🚀 Drag started:', { activeId: event.active.id });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id && over) {
      const oldIndex = items.findIndex(item => item.id.toString() === active.id);
      const newIndex = items.findIndex(item => item.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log('🔄 Drag completed:', { 
          oldIndex, 
          newIndex, 
          activeId: active.id, 
          overId: over.id,
          direction: oldIndex < newIndex ? 'down' : 'up'
        });
        onReorder(oldIndex, newIndex);
      } else {
        console.log('❌ Invalid drag indices:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
      }
    } else {
      console.log('⏹️ Drag cancelled or same position');
    }
  };

  if (disabled) {
    return <div>{children}</div>;
  }

  // Custom collision detection for better middle-position handling
  const customCollisionDetection = (args: any) => {
    // First try pointer intersection (more precise for overlapping elements)
    const pointerIntersections = pointerWithin(args);
    if (pointerIntersections.length > 0) {
      return pointerIntersections;
    }
    
    // Fallback to rectangle intersection
    const intersections = rectIntersection(args);
    if (intersections.length > 0) {
      return intersections;
    }
    
    // Final fallback to closest center
    return closestCenter(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext 
        items={items.map(item => item.id.toString())} 
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
      
      <DragOverlay
        style={{
          // Entfernt transform:scale - verhindert das Aufblähen beim Absetzen
          opacity: 0.7,
          pointerEvents: 'none',
          zIndex: 1000,
          // Smooth Transition für besseres visuelles Feedback
          transition: 'opacity 0.1s ease-out',
        }}
        dropAnimation={{
          // Verkürzt die Drop-Animation drastisch
          duration: 150,
          easing: 'ease-out',
        }}
      >
        {activeId ? (
          <div style={{
            background: 'rgba(17,24,39,.9)',
            border: '1px solid rgba(59, 130, 246, 0.6)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.9)',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            // Verhindert weitere Transform-Animationen
            willChange: 'auto',
          }}>
            🔄 Verschieben...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};