import { EmbedBuilder, GuildVerificationLevel, GuildExplicitContentFilter, GuildNSFWLevel } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para exibir informações detalhadas do servidor
 * Uso: $serverinfo
 */
export const serverinfoCharm: CharmFunction = async (context) => {
  const { message } = context;

  if (!message.guild) {
    await message.reply('❌ Este comando só pode ser usado em servidores.');
    return;
  }

  try {
    const guild = message.guild;
    
    // Busca informações completas do servidor
    await guild.fetch();
    const owner = await guild.fetchOwner();
    
    // Estatísticas de membros
    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
    const bots = guild.members.cache.filter(member => member.user.bot).size;
    const humans = totalMembers - bots;

    // Estatísticas de canais
    const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
    const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
    const totalChannels = guild.channels.cache.size;

    // Níveis de segurança
    const verificationLevels = {
      [GuildVerificationLevel.None]: 'Nenhuma',
      [GuildVerificationLevel.Low]: 'Baixa',
      [GuildVerificationLevel.Medium]: 'Média',
      [GuildVerificationLevel.High]: 'Alta',
      [GuildVerificationLevel.VeryHigh]: 'Muito Alta'
    };

    const contentFilterLevels = {
      [GuildExplicitContentFilter.Disabled]: 'Desabilitado',
      [GuildExplicitContentFilter.MembersWithoutRoles]: 'Membros sem cargo',
      [GuildExplicitContentFilter.AllMembers]: 'Todos os membros'
    };

    const nsfwLevels = {
      [GuildNSFWLevel.Default]: 'Padrão',
      [GuildNSFWLevel.Explicit]: 'Explícito',
      [GuildNSFWLevel.Safe]: 'Seguro',
      [GuildNSFWLevel.AgeRestricted]: 'Restrito por idade'
    };

    // Recursos do servidor (premium features)
    const features = guild.features.length > 0 ? guild.features.map(feature => {
      const featureNames: { [key: string]: string } = {
        'ANIMATED_BANNER': 'Banner animado',
        'ANIMATED_ICON': 'Ícone animado',
        'BANNER': 'Banner do servidor',
        'COMMUNITY': 'Servidor comunitário',
        'DISCOVERABLE': 'Descobrível',
        'INVITE_SPLASH': 'Tela de convite personalizada',
        'MEMBER_VERIFICATION_GATE_ENABLED': 'Portão de verificação',
        'NEWS': 'Canais de notícias',
        'PARTNERED': 'Parceiro do Discord',
        'PREVIEW_ENABLED': 'Visualização habilitada',
        'VANITY_URL': 'URL personalizada',
        'VERIFIED': 'Verificado',
        'VIP_REGIONS': 'Regiões VIP',
        'WELCOME_SCREEN_ENABLED': 'Tela de boas-vindas',
        'TICKETED_EVENTS_ENABLED': 'Eventos com ingresso',
        'MONETIZATION_ENABLED': 'Monetização',
        'THREE_DAY_THREAD_ARCHIVE': 'Arquivo de threads 3 dias',
        'SEVEN_DAY_THREAD_ARCHIVE': 'Arquivo de threads 7 dias',
        'PRIVATE_THREADS': 'Threads privadas',
        'ROLE_ICONS': 'Ícones de cargo'
      };
      return featureNames[feature] || feature;
    }).join(', ') : 'Nenhum';

    // Data de criação
    const createdAt = guild.createdAt;
    const createdTimestamp = Math.floor(createdAt.getTime() / 1000);
    
    // Boost info
    const boostTier = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostInfo = `Tier ${boostTier} (${boostCount} boosts)`;

    // Cria embed com informações do servidor
    const embed = new EmbedBuilder()
      .setTitle(`📊 Informações do Servidor`)
      .setDescription(`**${guild.name}**`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || null)
      .setColor(0x7289DA)
      .addFields(
        {
          name: '👑 Proprietário',
          value: `${owner.user.tag}\n\`${owner.id}\``,
          inline: true
        },
        {
          name: '🆔 ID do Servidor',
          value: `\`${guild.id}\``,
          inline: true
        },
        {
          name: '📅 Criado em',
          value: `<t:${createdTimestamp}:D>\n(<t:${createdTimestamp}:R>)`,
          inline: true
        },
        {
          name: '👥 Membros',
          value: `Total: **${totalMembers.toLocaleString()}**\nHumanos: **${humans.toLocaleString()}**\nBots: **${bots.toLocaleString()}**\nOnline: **${onlineMembers.toLocaleString()}**`,
          inline: true
        },
        {
          name: '📡 Canais',
          value: `Total: **${totalChannels}**\nTexto: **${textChannels}**\nVoz: **${voiceChannels}**\nCategorias: **${categories}**`,
          inline: true
        },
        {
          name: '🚀 Boost Status',
          value: boostInfo,
          inline: true
        },
        {
          name: '🛡️ Segurança',
          value: `Verificação: **${verificationLevels[guild.verificationLevel]}**\nFiltro de conteúdo: **${contentFilterLevels[guild.explicitContentFilter]}**\nNível NSFW: **${nsfwLevels[guild.nsfwLevel]}**`,
          inline: true
        },
        {
          name: '🎭 Emojis/Stickers',
          value: `Emojis: **${guild.emojis.cache.size}**\nStickers: **${guild.stickers.cache.size}**\nCargos: **${guild.roles.cache.size}**`,
          inline: true
        }
      )
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp();

    // Adiciona campo de recursos se houver
    if (features !== 'Nenhum') {
      embed.addFields({
        name: '✨ Recursos Premium',
        value: features.length > 1024 ? features.substring(0, 1021) + '...' : features,
        inline: false
      });
    }

    // Adiciona banner se existir
    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 512 })!);
    }

    // Adiciona descrição se existir
    if (guild.description) {
      embed.addFields({
        name: '📄 Descrição',
        value: guild.description.length > 1024 ? guild.description.substring(0, 1021) + '...' : guild.description,
        inline: false
      });
    }

    await message.reply({ embeds: [embed] });

  } catch (error) {
    await message.reply('❌ Erro ao buscar informações do servidor. Verifique se tenho as permissões necessárias.');
  }
};

/**
 * Metadados do charm serverinfo
 */
export const serverinfoMetadata: CharmMetadata = {
  name: 'serverinfo',
  description: 'Exibe informações detalhadas do servidor atual incluindo estatísticas, segurança e recursos',
  usage: '$serverinfo',
  adminOnly: false,
  cooldown: 5, // 5 segundos de cooldown pois busca muitas informações
  category: 'information'
};