import { TextChannel, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';
import { logger } from '../core/Logger.js';

/**
 * Charm para limpeza de mensagens (moderação)
 * Uso: $clear [quantidade] [motivo]
 */
export const clearCharm: CharmFunction = async (context) => {
  const { message, args, user } = context;

  // Verificações de segurança básicas
  if (!message.guild) {
    await message.reply('❌ Este comando só pode ser usado em servidores.');
    return;
  }

  if (!user.isAdmin) {
    await message.reply('🚫 Este comando requer permissões de administrador.');
    return;
  }

  if (!(message.channel instanceof TextChannel)) {
    await message.reply('❌ Este comando só pode ser usado em canais de texto.');
    return;
  }

  // Verifica se o bot tem permissões necessárias
  const botMember = message.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    await message.reply('❌ Não tenho permissão para gerenciar mensagens neste servidor.');
    return;
  }

  if (!botMember.permissions.has(PermissionFlagsBits.ReadMessageHistory)) {
    await message.reply('❌ Não tenho permissão para ler histórico de mensagens neste canal.');
    return;
  }

  try {
    // Parse dos argumentos
    const parts = args.trim().split(' ');
    const amountStr = parts[0];
    const reason = parts.slice(1).join(' ') || 'Não especificado';

    if (!amountStr) {
      await message.reply(
        '❌ Uso correto: `$clear [quantidade] [motivo]`\n' +
        '**Exemplos:**\n' +
        '• `$clear 10` - Remove 10 mensagens\n' +
        '• `$clear 5 Spam removido` - Remove 5 mensagens com motivo\n' +
        '**Limites:** 1-100 mensagens por comando'
      );
      return;
    }

    const amount = parseInt(amountStr);

    // Validações de quantidade
    if (isNaN(amount)) {
      await message.reply('❌ Quantidade deve ser um número válido.');
      return;
    }

    if (amount < 1) {
      await message.reply('❌ Quantidade deve ser pelo menos 1.');
      return;
    }

    if (amount > 100) {
      await message.reply('❌ Máximo de 100 mensagens por comando. Use múltiplos comandos se necessário.');
      return;
    }

    // Confirma ação para grandes quantidades
    if (amount > 50) {
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirmação Necessária')
        .setDescription(
          `Você está prestes a deletar **${amount} mensagens**.\n` +
          `**Canal:** ${message.channel}\n` +
          `**Motivo:** ${reason}\n\n` +
          `Esta ação não pode ser desfeita. Reaja com ✅ para confirmar ou ❌ para cancelar.`
        )
        .setColor(0xFF9900)
        .setFooter({
          text: 'Você tem 30 segundos para confirmar',
          iconURL: message.author.displayAvatarURL()
        });

      const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
      
      await confirmMessage.react('✅');
      await confirmMessage.react('❌');

      try {
        const filter = (reaction: any, user: any) => {
          return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        const collected = await confirmMessage.awaitReactions({ 
          filter, 
          max: 1, 
          time: 30000, 
          errors: ['time'] 
        });

        const reaction = collected.first();
        
        await confirmMessage.delete().catch(() => {});

        if (reaction?.emoji.name !== '✅') {
          await message.reply('❌ Operação cancelada.');
          return;
        }
      } catch (error) {
        await confirmMessage.delete().catch(() => {});
        await message.reply('❌ Tempo esgotado. Operação cancelada.');
        return;
      }
    }

    // Busca mensagens para deletar
    const channel = message.channel as TextChannel;
    const fetchLimit = Math.min(amount + 1, 100); // +1 para incluir a mensagem do comando

    const messages = await channel.messages.fetch({ limit: fetchLimit });
    const messagesToDelete = messages.first(amount + 1); // Inclui a mensagem do comando

    // Filtra mensagens muito antigas (>14 dias não podem ser deletadas em bulk)
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const deletableMessages = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
    const undeletableCount = messagesToDelete.length - deletableMessages.length;

    if (deletableMessages.length === 0) {
      await message.reply('❌ Nenhuma mensagem encontrada para deletar ou todas são muito antigas (>14 dias).');
      return;
    }

    // Log da ação antes de executar
    logger.info(`Limpeza de mensagens iniciada`, {
      executor: message.author.tag,
      executorId: message.author.id,
      channel: channel.name,
      channelId: channel.id,
      guild: message.guild.name,
      guildId: message.guild.id,
      amount: deletableMessages.length,
      reason
    });

    // Executa a limpeza
    const startTime = Date.now();
    await channel.bulkDelete(deletableMessages, true);
    const endTime = Date.now();

    // Cria embed de confirmação
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Limpeza Concluída')
      .setDescription(
        `**${deletableMessages.length} mensagens** foram removidas com sucesso.\n` +
        `**Canal:** ${channel}\n` +
        `**Moderador:** ${message.author}\n` +
        `**Motivo:** ${reason}\n` +
        `**Tempo:** ${endTime - startTime}ms`
      )
      .setColor(0x00AA55)
      .setFooter({
        text: 'Esta mensagem será removida em 10 segundos',
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp();

    // Adiciona aviso sobre mensagens não deletáveis
    if (undeletableCount > 0) {
      successEmbed.addFields({
        name: '⚠️ Aviso',
        value: `${undeletableCount} mensagem(ns) muito antiga(s) não puderam ser removidas (>14 dias).`,
        inline: false
      });
    }

    // Log de auditoria
    logger.info(`Limpeza de mensagens concluída`, {
      executor: message.author.tag,
      executorId: message.author.id,
      channel: channel.name,
      channelId: channel.id,
      guild: message.guild.name,
      guildId: message.guild.id,
      deletedCount: deletableMessages.length,
      undeletableCount,
      duration: endTime - startTime,
      reason
    });

    // Envia confirmação e remove após 10 segundos
    const confirmationMessage = await channel.send({ embeds: [successEmbed] });
    
    setTimeout(async () => {
      try {
        await confirmationMessage.delete();
      } catch (error) {
        // Ignora erro se não conseguir deletar
      }
    }, 10000);

  } catch (error) {
    logger.error('Erro durante limpeza de mensagens', error, {
      executor: message.author.id,
      channel: message.channel.id,
      guild: message.guild?.id
    });

    await message.reply('❌ Erro ao limpar mensagens. Verifique minhas permissões e tente novamente.');
  }
};

/**
 * Metadados do charm clear
 */
export const clearMetadata: CharmMetadata = {
  name: 'clear',
  description: 'Remove mensagens do canal atual (comando de moderação com log de auditoria)',
  usage: '$clear [quantidade] [motivo]',
  adminOnly: true, // Apenas administradores
  cooldown: 10, // 10 segundos de cooldown para evitar uso excessivo
  category: 'moderation'
};