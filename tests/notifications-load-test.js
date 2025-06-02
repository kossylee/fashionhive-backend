const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

class NotificationLoadTester {
  constructor(serverUrl, concurrentUsers = 100) {
    this.serverUrl = serverUrl;
    this.concurrentUsers = concurrentUsers;
    this.connections = [];
    this.metrics = {
      connected: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      startTime: null,
      endTime: null,
    };
  }

  generateMockToken(userId) {
    return jwt.sign(
      { sub: userId, username: `user_${userId}` },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  }

  async startTest() {
    console.log(`Starting load test with ${this.concurrentUsers} concurrent users...`);
    this.metrics.startTime = Date.now();

    const connectionPromises = [];
    
    for (let i = 0; i < this.concurrentUsers; i++) {
      connectionPromises.push(this.createConnection(i));
    }

    await Promise.all(connectionPromises);
    
    await this.sendTestNotifications();
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    this.cleanup();
    this.printResults();
  }

  createConnection(userId) {
    return new Promise((resolve, reject) => {
      const token = this.generateMockToken(userId);
      
      const socket = io(`${this.serverUrl}/notifications`, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        this.metrics.connected++;
        console.log(`User ${userId} connected (${this.metrics.connected}/${this.concurrentUsers})`);
        resolve();
      });

      socket.on('new_notification', (data) => {
        this.metrics.messagesReceived++;
      });

      socket.on('unread_count', (data) => {
        this.metrics.messagesReceived++;
      });

      socket.on('connect_error', (error) => {
        this.metrics.errors++;
        console.error(`Connection error for user ${userId}:`, error.message);
        reject(error);
      });

      this.connections.push(socket);
      
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error(`Connection timeout for user ${userId}`));
        }
      }, 10000);
    });
  }

  async sendTestNotifications() {
    console.log('Sending test notifications...');
    
    const notifications = [
      'mark_as_read',
      'get_notifications'
    ];

    for (const socket of this.connections) {
      for (const event of notifications) {
        socket.emit(event, { test: true });
        this.metrics.messagesSent++;
      }
    }
  }

  cleanup() {
    console.log('Closing connections...');
    this.connections.forEach(socket => socket.disconnect());
    this.metrics.endTime = Date.now();
  }

  printResults() {
    const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
    
    console.log('\n=== Load Test Results ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Concurrent Users: ${this.concurrentUsers}`);
    console.log(`Successful Connections: ${this.metrics.connected}`);
    console.log(`Messages Sent: ${this.metrics.messagesSent}`);
    console.log(`Messages Received: ${this.metrics.messagesReceived}`);
    console.log(`Errors: ${this.metrics.errors}`);
    console.log(`Connection Success Rate: ${(this.metrics.connected / this.concurrentUsers * 100).toFixed(2)}%`);
    console.log(`Average Messages/Second: ${(this.metrics.messagesReceived / duration).toFixed(2)}`);
  }
}
if (require.main === module) {
  const tester = new NotificationLoadTester('http://localhost:3000', 100);
  tester.startTest().catch(console.error);
}

module.exports = NotificationLoadTester;