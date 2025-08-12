import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para exibir avatar de usuário
 * Uso: $avatar [@usuário]
 */
export const avatarCharm: CharmFunction = async (context) => {
  const { message, args } = context;

  try {
    let targetUser = message.author;
    
    // Se mencionar alguém, busca o usuário mencionado
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first()!;
    } else if (args.trim()) {
      // Tenta buscar por ID se não for uma menção
      const userId = args.trim().replace(/[<@!>]/g, '');
      if (/^\d{17,19}$/.test(userId)) {
        try {
          const user = await message.client.users.fetch(userId);
          if (user) targetUser = user;
        } catch (error) {
          await message.reply('❌ Usuário não encontrado. Certifique-se de mencionar um usuário válido ou usar seu ID.');
          return;
        }
      }
    }

    // URLs do avatar em diferentes formatos e tamanhos
    const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 512 });
    const avatarURLPNG = targetUser.displayAvatarURL({ extension: 'png', size: 512 });
    const avatarURLJPG = targetUser.displayAvatarURL({ extension: 'jpg', size: 512 });
    const avatarURLWebP = targetUser.displayAvatarURL({ extension: 'webp', size: 512 });

    // Verifica se é avatar animado (GIF)
    const isAnimated = avatarURL.includes('.gif');

    // Cria embed com o avatar
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar de ${targetUser.username}`)
      .setDescription(
        `**Usuário:** ${targetUser.tag}\n` +
        `**ID:** \`${targetUser.id}\`\n` +
        `**Tipo:** ${isAnimated ? 'Animado (GIF)' : 'Estático'}\n\n` +
        `**Download Links:**\n` +
        `[Original](${avatarURL}) • [PNG](${avatarURLPNG}) • [JPG](${avatarURLJPG}) • [WebP](${avatarURLWebP})`
      )
      .setImage(avatarURL)
      .setColor(0x7289DA)
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp();

    // Adiciona informações extras se for o próprio usuário
    if (targetUser.id === message.author.id) {
      embed.setDescription(
        embed.data.description + 
        `\n\n💡 **Dica:** Use \`$avatar @usuário\` para ver o avatar de outros usuários!`
      );
    }

    // Adiciona badge se for um bot
    if (targetUser.bot) {
      embed.setDescription(`🤖 **Bot** - ${embed.data.description}`);
    }

    await message.reply({ embeds: [embed] });

    // Remove mensagem original se possível (opcional)
    if (message.deletable) {
      setTimeout(async () => {
        try {
          await message.delete();
        } catch (error) {
          // Ignora erro se não conseguir deletar
        }
      }, 1000);
    }

  } catch (error) {
    await message.reply('❌ Erro ao buscar avatar. Verifique se o usuário existe e tente novamente.');
  }
};

/**
 * Metadados do charm avatar
 */
export const avatarMetadata: CharmMetadata = {
  name: 'avatar',
  description: 'Exibe o avatar de um usuário em alta qualidade com links para download',
  usage: '$avatar [@usuário|ID]',
  adminOnly: false,
  cooldown: 3, // 3 segundos de cooldown para evitar spam
  category: 'utility'
};