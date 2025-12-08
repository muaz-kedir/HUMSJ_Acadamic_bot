/**
 * ================================
 * Test Database Command
 * ================================
 * 
 * Command: /testdb
 * Purpose: Verify MongoDB connection by saving a test document
 * 
 * This is a temporary command for Day 2 testing.
 * Remove after confirming database works correctly.
 */

const Test = require('../db/schemas/Test');

/**
 * Handle /testdb command
 * Creates a test document in MongoDB and confirms success
 * @param {Object} ctx - Telegraf context object
 */
async function handleTestCommand(ctx) {
  try {
    // Notify user that test is starting
    await ctx.reply('🔄 Testing database connection...');

    // Create a new test document
    const testDoc = new Test({
      name: `Test from ${ctx.from.username || ctx.from.id}`,
      createdAt: new Date()
    });

    // Save to MongoDB
    const savedDoc = await testDoc.save();

    // Success response with document ID
    await ctx.reply(
      `✅ Database test completed successfully!\n\n` +
      `📄 Document ID: ${savedDoc._id}\n` +
      `📝 Name: ${savedDoc.name}\n` +
      `🕐 Created: ${savedDoc.createdAt.toISOString()}`
    );

    // Log success on server
    console.log(`✅ Test document created: ${savedDoc._id}`);

  } catch (error) {
    // Error handling with user feedback
    console.error('❌ Database test failed:', error.message);
    
    await ctx.reply(
      `❌ Database test failed!\n\n` +
      `Error: ${error.message}\n\n` +
      `Please check your MongoDB connection.`
    );
  }
}

module.exports = handleTestCommand;
