'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('tasks', ['status'], {
      name: 'tasks_status_idx',
    });
    await queryInterface.addIndex('tasks', ['priority'], {
      name: 'tasks_priority_idx',
    });
    await queryInterface.addIndex('tasks', ['createdAt'], {
      name: 'tasks_created_at_idx',
    });
    await queryInterface.addIndex('tasks', ['assigneeId'], {
      name: 'tasks_assignee_id_idx',
    });
    await queryInterface.addIndex('tasks', ['status', 'priority'], {
      name: 'tasks_status_priority_idx',
    });
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_status_idx');
    await queryInterface.removeIndex('tasks', 'tasks_priority_idx');
    await queryInterface.removeIndex('tasks', 'tasks_created_at_idx');
    await queryInterface.removeIndex('tasks', 'tasks_assignee_id_idx');
    await queryInterface.removeIndex('tasks', 'tasks_status_priority_idx');
    await queryInterface.removeIndex('users', 'users_email_idx');
  },
};
