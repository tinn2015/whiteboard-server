export class AsyncQueue {
  queue: HandleOption[];
  isRunning: boolean;
  constructor() {
    this.queue = [];
    this.isRunning = false;
  }

  // 入栈
  async push(handleOption: HandleOption) {
    if (!this.isRunning) {
      this.isRunning = true;
      if (this.queue.length) {
        const option = this.queue.splice(0, 1);
        await this.doAction(option[0]);
      } else {
        await this.doAction(handleOption);
      }
    } else {
      this.queue.push(handleOption);
      console.log('this.queue.push', this.queue);
    }
  }

  async doAction(handleOption: HandleOption) {
    await handleOption.handler();
    if (!this.queue.length) {
      this.isRunning = false;
      return;
    }
    if (this.queue.length) {
      const option = this.queue.splice(0, 1);
      await this.doAction(option[0]);
    }
  }
}

interface HandleOption {
  handler: any;
}
