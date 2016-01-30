class UserActionQueue {
  constructor() {
    this.actions = {};
  }

  // Adds action to user queue, runs it immediately unless already
  // waiting on another action. Handler must return a promise.
  enqueueAction(userId, handler) {
    if (!this.actions[userId]) this.actions[userId] = [];
    this.actions[userId].unshift(handler);
    if (this.actions[userId].length === 1) {
      this.stepUserQueue(userId)
    }
  }

  async stepUserQueue(userId) {
    if (!this.actions[userId].length) return;
    let nextAction = this.actions[userId][0];
    await nextAction();
    this.actions[userId] = this.actions[userId].slice(0, -1);
    this.stepUserQueue(userId);
  }
}

export default UserActionQueue;
