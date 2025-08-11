import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm de ajuda que lista todos os charms disponíveis
 * Uso: $help[] ou $help[nome_do_charm]
 */
export const helpCharm: CharmFunction = async (context) => {
  const { message, args, client, user } = context;

  try {
    // Se um charm específico foi solicitado
    if (args && args.trim().length > 0) {
      const charmName = args.trim().toLowerCase();
      const charmRegistry = client.getCharm(charmName);

      if (!charmRegistry) {
        await message.reply(`❌ Charm '${charmName}' não encontrado.`);
        return;
      }

      const { metadata } = charmRegistry;

      // Cria embed detalhado para o charm específico
      const embed = new EmbedBuilder()
        .setTitle(`🔮 Charm: ${metadata.name}`)
        .setDescription(metadata.description)
        .setColor(0x00AE86)
        .addFields([
          {
            name: '📖 Uso',
            value: `\`${metadata.usage}\``,
            inline: false
          },
          {
            name: '📂 Categoria',
            value: metadata.category,
            inline: true
          },
          {
            name: '⏱️ Cooldown',
            value: `${metadata.cooldown}s`,
            inline: true
          },
          {
            name: '🛡️ Permissão',
            value: metadata.adminOnly ? 'Admin apenas' : 'Todos',
            inline: true
          }
        ])
        .setTimestamp()
        .setFooter({
          text: `Solicitado por ${user.username}`,
          iconURL: message.author.displayAvatarURL()
        });

      await message.reply({ embeds: [embed] });
      return;
    }

    // Lista geral de charms
    const allCharms = client.listCharms();
    const stats = client.getStats();

    if (allCharms.length === 0) {
      await message.reply('❌ Nenhum charm registrado no momento.');
      return;
    }

    // Agrupa charms por categoria
    const charmsByCategory = {
      utility: [] as string[],
      fun: [] as string[],
      moderation: [] as string[],
      information: [] as string[]
    };

    for (const charmName of allCharms) {
      const charmRegistry = client.getCharm(charmName);
      if (charmRegistry) {
        const category = charmRegistry.metadata.category;
        const displayName = charmRegistry.metadata.adminOnly && !user.isAdmin 
          ? `~~${charmName}~~` // Riscado se usuário não tem acesso
          : charmName;
        
        charmsByCategory[category].push(displayName);
      }
    }

    // Cria embed principal
    const embed = new EmbedBuilder()
      .setTitle('🔮 DeepCode Charm - Lista de Comandos')
      .setDescription(
        `Total de charms disponíveis: **${allCharms.length}**\n` +
        `Use \`${client.prefix}help nome_do_charm\` para detalhes específicos.`
      )
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({
        text: `Solicitado por ${user.username} | Uptime: ${formatUptime(stats.uptime)}`,
        iconURL: message.author.displayAvatarURL()
      });

    // Adiciona campos por categoria
    for (const [category, charms] of Object.entries(charmsByCategory)) {
      if (charms.length > 0) {
        const categoryEmoji = getCategoryEmoji(category);
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        embed.addFields([{
          name: `${categoryEmoji} ${categoryName}`,
          value: charms.map(charm => `\`${charm}\``).join(', '),
          inline: false
        }]);
      }
    }

    // Adiciona informações extras
    embed.addFields([
      {
        name: '💡 Dica',
        value: 'Comandos riscados requerem permissões de administrador.',
        inline: false
      },
      {
        name: '📊 Estatísticas',
        value: 
          `Comandos executados: **${stats.commandsExecuted}**\n` +
          `Servidores: **${stats.guildsCount}**\n` +
          `Usuários: **${stats.usersCount}**`,
        inline: true
      }
    ]);

    await message.reply({ embeds: [embed] });

  } catch (error) {
    await message.reply('❌ Erro ao gerar lista de ajuda. Tente novamente.');
  }
};

/**
 * Retorna emoji para cada categoria
 */
function getCategoryEmoji(category: string): string {
  const emojis = {
    utility: '🛠️',
    fun: '🎮',
    moderation: '🛡️',
    information: '📋'
  };
  
  return emojis[category as keyof typeof emojis] || '❓';
}

/**
 * Formata uptime em formato legível
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : '< 1m';
}

/**
 * Metadados do charm help
 */
export const helpMetadata: CharmMetadata = {
  name: 'help',
  description: 'Mostra lista de comandos disponíveis ou detalhes de um comando específico',
  usage: '$help[] ou $help[nome_do_charm]',
  adminOnly: false,
  cooldown: 3,
  category: 'information'
};
