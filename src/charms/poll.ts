import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para criar enquetes/votações
 * Uso: $poll pergunta opção1 opção2 [opção3...]
 */
export const pollCharm: CharmFunction = async (context) => {
  const { message, args } = context;

  if (!args || args.trim().length === 0) {
    await message.reply(
      '❌ **Uso correto:** `$poll pergunta opção1 opção2 [opção3...]`\n' +
      '**Exemplo:** `$poll "Qual sua linguagem favorita?" JavaScript Python TypeScript`\n' +
      '**Dica:** Use aspas para perguntas com espaços'
    );
    return;
  }

  try {
    // Parse simples dos argumentos
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < args.length; i++) {
      const char = args[i];
      
      if (char === '"' && (i === 0 || args[i - 1] === ' ')) {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes && current.trim()) {
        parts.push(current.trim());
        current = '';
      } else if (char !== '"' || inQuotes) {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }

    if (parts.length < 3) {
      await message.reply('❌ Mínimo necessário: pergunta + 2 opções');
      return;
    }

    if (parts.length > 6) {
      await message.reply('❌ Máximo de 5 opções permitidas');
      return;
    }

    const question = parts[0];
    const options = parts.slice(1);

    // Validações
    if (question.length > 256) {
      await message.reply('❌ Pergunta muito longa! Máximo: 256 caracteres.');
      return;
    }

    // Emoji de números para as opções
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

    // Criar embed da enquete
    const embed = new EmbedBuilder()
      .setTitle('📊 ' + question)
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({
        text: `Enquete criada por ${message.author.username} • Encerra em 10 minutos`,
        iconURL: message.author.displayAvatarURL()
      });

    // Adicionar opções ao embed
    let description = '**Clique nos botões abaixo para votar:**\n\n';
    for (let i = 0; i < options.length; i++) {
      description += `${numberEmojis[i]} ${options[i]}\n`;
    }

    embed.setDescription(description);

    // Criar botões para cada opção
    const buttons: ButtonBuilder[] = [];
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const button = new ButtonBuilder()
        .setCustomId(`poll_${i}_${Date.now()}`)
        .setLabel(`${i + 1}. ${option.length > 20 ? option.substring(0, 17) + '...' : option}`)
        .setEmoji(numberEmojis[i])
        .setStyle(ButtonStyle.Primary);
      buttons.push(button);
    }

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < buttons.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const buttonsSlice = buttons.slice(i, i + 5);
      for (const button of buttonsSlice) {
        row.addComponents(button);
      }
      rows.push(row);
    }

    // Enviar enquete
    if (!('send' in message.channel)) {
      await message.reply('❌ Este tipo de canal não suporta enquetes.');
      return;
    }

    const pollMessage = await message.channel.send({ 
      embeds: [embed], 
      components: rows 
    });

    // Sistema de votação
    const votes = new Map<number, Set<string>>();
    for (let i = 0; i < options.length; i++) {
      votes.set(i, new Set<string>());
    }

    const collector = pollMessage.createMessageComponentCollector({
      time: 600000 // 10 minutos
    });

    collector.on('collect', async (interaction) => {
      if (!interaction.isButton()) return;

      const optionIndex = parseInt(interaction.customId.split('_')[1]);
      const userId = interaction.user.id;

      // Remover voto anterior do usuário
      for (const [index, userSet] of votes.entries()) {
        if (userSet.has(userId)) {
          userSet.delete(userId);
        }
      }

      // Adicionar novo voto
      const optionSet = votes.get(optionIndex);
      if (optionSet) {
        optionSet.add(userId);
      }

      // Atualizar embed com resultados
      let totalVotes = 0;
      for (const userSet of votes.values()) {
        totalVotes += userSet.size;
      }
      
      let resultsDescription = '**Resultados atuais:**\n\n';
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const optionVotes = votes.get(i)?.size || 0;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const barLength = Math.round(percentage / 10);
        const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
        
        resultsDescription += `${numberEmojis[i]} **${option}**\n`;
        resultsDescription += `${bar} ${percentage}% (${optionVotes} ${optionVotes === 1 ? 'voto' : 'votos'})\n\n`;
      }

      const updatedEmbed = EmbedBuilder.from(embed)
        .setDescription(resultsDescription + `**Total: ${totalVotes} ${totalVotes === 1 ? 'voto' : 'votos'}**`);

      await interaction.update({ embeds: [updatedEmbed] });
    });

    collector.on('end', async () => {
      // Finalizar enquete
      let finalTotalVotes = 0;
      for (const userSet of votes.values()) {
        finalTotalVotes += userSet.size;
      }
      
      let finalDescription = '**📊 ENQUETE FINALIZADA**\n\n**Resultados finais:**\n\n';
      
      // Ordenar opções por votos
      const sortedResults: Array<{option: string, votes: number, emoji: string}> = [];
      for (let i = 0; i < options.length; i++) {
        sortedResults.push({
          option: options[i],
          votes: votes.get(i)?.size || 0,
          emoji: numberEmojis[i]
        });
      }
      sortedResults.sort((a, b) => b.votes - a.votes);

      for (let i = 0; i < sortedResults.length; i++) {
        const result = sortedResults[i];
        const percentage = finalTotalVotes > 0 ? Math.round((result.votes / finalTotalVotes) * 100) : 0;
        const barLength = Math.round(percentage / 10);
        const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
        const trophy = i === 0 && result.votes > 0 ? '👑 ' : '';
        
        finalDescription += `${trophy}${result.emoji} **${result.option}**\n`;
        finalDescription += `${bar} ${percentage}% (${result.votes} ${result.votes === 1 ? 'voto' : 'votos'})\n\n`;
      }

      const finalEmbed = EmbedBuilder.from(embed)
        .setColor(0xFF6B35)
        .setDescription(finalDescription + `**Total: ${finalTotalVotes} ${finalTotalVotes === 1 ? 'voto' : 'votos'}**`)
        .setFooter({
          text: `Enquete finalizada • Criada por ${message.author.username}`,
          iconURL: message.author.displayAvatarURL()
        });

      // Desabilitar todos os botões
      const disabledRows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (const row of rows) {
        const newRow = new ActionRowBuilder<ButtonBuilder>();
        for (const component of row.components) {
          const disabledButton = ButtonBuilder.from(component as ButtonBuilder)
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary);
          newRow.addComponents(disabledButton);
        }
        disabledRows.push(newRow);
      }

      await pollMessage.edit({ 
        embeds: [finalEmbed], 
        components: disabledRows 
      }).catch(() => {});
    });

    // Remover mensagem original se possível
    if (message.deletable) {
      await message.delete().catch(() => {});
    }

  } catch (error) {
    console.error('Erro no poll charm:', error);
    await message.reply('❌ Erro ao criar enquete. Verifique os parâmetros e tente novamente.');
  }
};

/**
 * Metadados do charm poll
 */
export const pollMetadata: CharmMetadata = {
  name: 'poll',
  description: 'Cria uma enquete interativa com até 5 opções',
  usage: '$poll pergunta opção1 opção2 [opção3...]',
  adminOnly: false,
  cooldown: 10, // 10 segundos para evitar spam
  category: 'fun'
};
