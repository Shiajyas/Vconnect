

 Goal:  code to support:
 
Parallelism using multiple MediaSoup Workers.

Scalable MediaSoup instances (containers or processes).

Stream registry using Redis for coordination.

Room scaling with pipeToRouter() (needed for big rooms across workers or containers).

Separation of signaling, media, and state logic for Docker scalability.

------------------------------------------------------------------

When creating a worker, save metadata about its host/port.

When creating a router, save router metadata and set the room->router mapping key.

When creating a transport, save its metadata with the node ID that owns it.

When creating a producer, save its metadata similarly.