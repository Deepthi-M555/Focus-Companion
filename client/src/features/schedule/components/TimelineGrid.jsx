import {
  DragDropContext,
  Draggable,
  Droppable
} from "@hello-pangea/dnd";

function reorderSchedule(
  schedule,
  sourceIndex,
  destinationIndex
) {
  const reordered = Array.from(schedule);
  const [movedTask] = reordered.splice(sourceIndex, 1);

  reordered.splice(destinationIndex, 0, movedTask);

  return reordered;
}

function TimelineGrid({
  schedule,
  onScheduleChange
}) {
  function handleDragEnd(result) {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    const reordered = reorderSchedule(
      schedule,
      result.source.index,
      result.destination.index
    );

    onScheduleChange?.(reordered);
  }

  return (

    <DragDropContext onDragEnd={handleDragEnd}>

      <Droppable droppableId="schedule-timeline">

        {(provided) => (

          <div
            className="timeline-grid"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >

            {
              schedule.map((task, index) => (

                <Draggable
                  draggableId={task.id ?? task.title}
                  index={index}
                  key={task.id ?? task.title}
                >

                  {(dragProvided, snapshot) => (

                    <div
                      className={
                        snapshot.isDragging
                          ? "timeline-card timeline-card-dragging"
                          : "timeline-card"
                      }
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                    >

                      <h3>
                        {task.title}
                      </h3>

                      <p>
                        {task.startTime}
                      </p>

                      <p>
                        {task.endTime}
                      </p>

                    </div>

                  )}

                </Draggable>

              ))
            }

            {provided.placeholder}

          </div>

        )}

      </Droppable>

    </DragDropContext>

  );

}

export default TimelineGrid;
