'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const isPostgres = dialect === 'postgres';

    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: isPostgres
          ? Sequelize.ENUM('todo', 'in_progress', 'review', 'done')
          : Sequelize.STRING,
        allowNull: false,
        defaultValue: 'todo',
      },
      priority: {
        type: isPostgres
          ? Sequelize.ENUM('low', 'medium', 'high', 'urgent')
          : Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium',
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assigneeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'assigneeId',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    });

    await queryInterface.addIndex('tasks', ['assigneeId']);
    await queryInterface.addIndex('tasks', ['status']);
    await queryInterface.addIndex('tasks', ['priority']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tasks');
  },
};
