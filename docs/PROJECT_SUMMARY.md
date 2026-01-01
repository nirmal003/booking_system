MongoDB stores event data because it supports atomic updates.

Ticket availability is updated using MongoDB’s $inc atomic operator.

This prevents overbooking during concurrent requests.

System logs are stored in MongoDB for debugging and monitoring.

MySQL stores users and bookings because it supports ACID transactions.

MySQL ensures consistent and reliable booking records.

Nginx checks and filters client requests before sending them to the backend.

Node.js cluster internally distributes traffic across instances.

PM2 provides fault tolerance by auto-restarting crashed instances.

PM2 runs 4 Node.js instances in cluster mode on the same port.