import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para mostrar avatar de usuário
 * Uso: $avatar @usuario ou $avatar (para próprio avatar)
 */
export const avatarCharm: CharmFunction = async (context) => {
  const { message, args } = context;

  try {
    let targetUser = message.author;

    // Se mencionar alguém, usar o usuário mencionado
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first()!;
    } else if (args && args.trim()) {
      // Tentar encontrar usuário por ID ou nome
      const guild = message.guild;
      if (guild) {
        try {
          // Tentar por ID primeiro
          if (/^\d{17,19}$/.test(args.trim())) {
            const userById = await guild.members.fetch(args.trim());
            targetUser = userById.user;
          } else {
            // Tentar por nome
            const members = await guild.members.fetch();
            const found = members.find(member => 
              member.user.username.toLowerCase().includes(args.toLowerCase()) ||
              (member.nickname && member.nickname.toLowerCase().includes(args.toLowerCase()))
            );
            if (found) {
              targetUser = found.user;
            }
          }
        } catch {
          // Ignorar erros, usar autor original
        }
      }
    }

    // Criar embed do avatar
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar de ${targetUser.username}`)
      .setColor(0x00AE86)
      .setImage(targetUser.displayAvatarURL({ size: 1024, extension: 'png' }))
      .addFields([
        {
          name: '👤 Usuário',
          value: `${targetUser.username}#${targetUser.discriminator}`,
          inline: true
        },
        {
          name: '🆔 ID',
          value: targetUser.id,
          inline: true
        },
        {
          name: '📅 Conta criada',
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
          inline: true
        }
      ])
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp();

    // Adicionar link para download
    const avatarURL = targetUser.displayAvatarURL({ size: 1024, extension: 'png' });
    embed.setDescription(`[📥 Download do Avatar](${avatarURL})`);

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Erro no avatar charm:', error);
    await message.reply('❌ Erro ao buscar avatar. Tente novamente ou verifique se o usuário existe.');
  }
};

/**
 * Metadados do charm avatar
 */
export const avatarMetadata: CharmMetadata = {
  name: 'avatar',
  description: 'Mostra o avatar de um usuário',
  usage: '$avatar @usuario ou $avatar nome ou $avatar (para seu próprio)',
  adminOnly: false,
  cooldown: 3,
  category: 'utility'
};
