import { EmbedBuilder, ChannelType } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para mostrar informações do servidor
 * Uso: $serverinfo
 */
export const serverinfoCharm: CharmFunction = async (context) => {
  const { message } = context;

  if (!message.guild) {
    await message.reply('❌ Este comando só pode ser usado em servidores!');
    return;
  }

  try {
    const guild = message.guild;
    
    // Buscar informações detalhadas
    const owner = await guild.fetchOwner().catch(() => null);
    const channels = guild.channels.cache;
    
    // Contar tipos de canais
    const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
    
    // Contar membros por status (se disponível)
    const members = guild.members.cache;
    const onlineMembers = members.filter(m => m.presence?.status === 'online').size;
    const totalMembers = guild.memberCount;
    const botCount = members.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    // Nível de verificação
    const verificationLevels = {
      0: 'Nenhum',
      1: 'Baixo',
      2: 'Médio',
      3: 'Alto',
      4: 'Muito Alto'
    };

    // Boost info
    const boostTier = guild.premiumTier || 0;
    const boostCount = guild.premiumSubscriptionCount || 0;

    // Criar embed
    const embed = new EmbedBuilder()
      .setTitle(`📊 Informações do Servidor`)
      .setColor(0x00AE86)
      .setThumbnail(guild.iconURL({ size: 256 }) || null)
      .addFields([
        {
          name: '🏷️ Nome',
          value: guild.name,
          inline: true
        },
        {
          name: '🆔 ID',
          value: guild.id,
          inline: true
        },
        {
          name: '👑 Dono',
          value: owner ? `${owner.user.username}` : 'Desconhecido',
          inline: true
        },
        {
          name: '📅 Criado em',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`,
          inline: true
        },
        {
          name: '📈 Membros',
          value: `👥 Total: **${totalMembers}**\n🟢 Online: **${onlineMembers}**\n👤 Humanos: **${humanCount}**\n🤖 Bots: **${botCount}**`,
          inline: true
        },
        {
          name: '📝 Canais',
          value: `💬 Texto: **${textChannels}**\n🔊 Voz: **${voiceChannels}**\n📁 Categorias: **${categories}**`,
          inline: true
        },
        {
          name: '🛡️ Verificação',
          value: verificationLevels[guild.verificationLevel] || 'Desconhecido',
          inline: true
        },
        {
          name: '🎭 Cargos',
          value: `**${guild.roles.cache.size}** cargos`,
          inline: true
        },
        {
          name: '🎨 Emojis',
          value: `**${guild.emojis.cache.size}** emojis`,
          inline: true
        }
      ])
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp();

    // Adicionar informações de boost se aplicável
    if (boostTier > 0 || boostCount > 0) {
      embed.addFields([
        {
          name: '🚀 Boost',
          value: `Nível: **${boostTier}**\nImpulsionadores: **${boostCount}**`,
          inline: true
        }
      ]);
    }

    // Adicionar banner se disponível
    if (guild.banner) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    // Adicionar features especiais
    const features = guild.features;
    if (features.length > 0) {
      const featureNames: Record<string, string> = {
        'ANIMATED_BANNER': '🎬 Banner Animado',
        'ANIMATED_ICON': '🎭 Ícone Animado',
        'BANNER': '🖼️ Banner',
        'COMMERCE': '🛒 Comércio',
        'COMMUNITY': '🌐 Comunidade',
        'DISCOVERABLE': '🔍 Descobrível',
        'FEATURABLE': '⭐ Destacável',
        'INVITE_SPLASH': '💦 Splash de Convite',
        'MEMBER_VERIFICATION_GATE_ENABLED': '✋ Portão de Verificação',
        'NEWS': '📰 Notícias',
        'PARTNERED': '🤝 Parceiro',
        'PREVIEW_ENABLED': '👀 Preview Habilitado',
        'VANITY_URL': '🔗 URL Personalizada',
        'VERIFIED': '✅ Verificado',
        'VIP_REGIONS': '👑 Regiões VIP',
        'WELCOME_SCREEN_ENABLED': '👋 Tela de Boas-vindas'
      };

      const displayFeatures = features
        .map(f => featureNames[f] || f)
        .slice(0, 10); // Máximo 10 features

      if (displayFeatures.length > 0) {
        embed.addFields([
          {
            name: '✨ Recursos Especiais',
            value: displayFeatures.join(', '),
            inline: false
          }
        ]);
      }
    }

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Erro no serverinfo charm:', error);
    await message.reply('❌ Erro ao buscar informações do servidor.');
  }
};

/**
 * Metadados do charm serverinfo
 */
export const serverinfoMetadata: CharmMetadata = {
  name: 'serverinfo',
  description: 'Mostra informações detalhadas do servidor atual',
  usage: '$serverinfo',
  adminOnly: false,
  cooldown: 5,
  category: 'information'
};
