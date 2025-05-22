

 Goal:  code to support:
 
Parallelism using multiple MediaSoup Workers.

Scalable MediaSoup instances (containers or processes).

Stream registry using Redis for coordination.

Room scaling with pipeToRouter() (needed for big rooms across workers or containers).

Separation of signaling, media, and state logic for Docker scalability.

------------------------------------------------------------------