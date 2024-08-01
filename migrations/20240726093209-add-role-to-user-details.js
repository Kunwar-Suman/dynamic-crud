module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('user_details', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Optionally revert changes
    await queryInterface.changeColumn('user_details', 'role', {
      type: Sequelize.STRING, // Or your previous type
      allowNull: false,
      defaultValue: 'user'
    });
  }
};
