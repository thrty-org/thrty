export type Next<EventType, ContextType, ReturnType> = (
  event: EventType,
  context: ContextType,
  ...args: any[]
) => ReturnType;
