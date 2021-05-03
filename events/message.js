const config = require('../config.json');
const BotStats = require('../databaseFiles/connect').BotStats;
const Prefixes = require('../databaseFiles/connect').Prefixes;
const reactions = require('../eventActions/reactions');

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  const args = message.content.split(/\s+/g); // Return the message content and split the prefix.

  var prefix;

  try {
    prefix = await Prefixes.findOne({'guild': message.guild.id});
    prefix = prefix.prefix; // Get the 'prefix' string from the JSON object if found. If not will return error for trying to get null
  } catch {
    prefix = '.';
  }


  if (args[0] === `<@!${client.user.id}>` || message.content.startsWith(`<@!${client.user.id}>`)) {
    prefix = `<@!${client.user.id}>`;
    if (args[0] === prefix) {
      args.shift();
      args[0] = prefix + args[0]; // Dirty fix
    }
  }

  const command =
    message.content.startsWith(prefix) &&
    args.shift().slice(prefix.length);

  if (command) {
    const commandfile =
      client.commands.get(command) ||
      client.commands.get(client.aliases.get(command));

    if (commandfile) {
      message.channel.startTyping();

      if (commandfile.config.admin && commandfile.config.admin === true && config.global_admins.indexOf(message.author.id) === -1) {
        await message.channel.send(':x: You don\'t have permission to run this command.');
      } else {
        var total = 0;

        var stats = await BotStats.findOne({
          guild: message.guild.id
        });

        if (stats && parseInt(stats.total) !== NaN) {
          total = parseInt(stats.total);
        }

        total = total + 1;

        await BotStats.updateOne(
          { guild: message.guild.id },
          { $set: {
              guild: message.guild.id,
              total: total,
              }
          },
          {
              upsert: true
          }
        );
        
        await commandfile.execute(client, message, args); // Execute found command
      }

      message.channel.stopTyping();
    }
  }

  reactions.checkIfCorrect(message);
};
