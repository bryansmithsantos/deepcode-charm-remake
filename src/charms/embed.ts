import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para criar embeds personalizados com botão opcional
 * Uso: $embed título descrição cor
 * Formato simplificado: separado por espaços, não mais por |
 */
export const embedCharm: CharmFunction = async (context) => {
  const { message, args } = context;

  if (!args || args.trim().length === 0) {
    await message.reply(
      '❌ **Uso correto:** `$embed título descrição cor`\n' +
      '**Exemplo:** `$embed Bem-vindos Este é nosso servidor! blue`\n' +
      '**Cores:** red, blue, green, yellow, orange, purple, pink ou hex (#ff0000)'
    );
    return;
  }

  try {
    // Parse dos argumentos separados por espaço
    const parts = args.trim().split(' ');
    
    if (parts.length < 2) {
      await message.reply('❌ Formato inválido! Mínimo: `$embed título descrição`');
      return;
    }

    // Extrair título (primeira palavra), cor (última palavra se for cor válida), resto é descrição
    const title = parts[0];
    let description = '';
    let color = '0x00AE86'; // Cor padrão

    // Verificar se a última palavra é uma cor válida
    const lastWord = parts[parts.length - 1].toLowerCase();
    const colorValue = parseColor(lastWord);
    
    if (colorValue !== null) {
      // Última palavra é cor válida
      color = colorValue.toString();
      description = parts.slice(1, -1).join(' ');
    } else {
      // Última palavra não é cor, toda é descrição
      description = parts.slice(1).join(' ');
    }

    // Validações
    if (title.length > 256) {
      await message.reply('❌ Título muito longo! Máximo: 256 caracteres.');
      return;
    }

    if (description.length > 4096) {
      await message.reply('❌ Descrição muito longa! Máximo: 4096 caracteres.');
      return;
    }

    // Cria o embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(parseInt(color))
      .setTimestamp()
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL()
      });

    // Criar botão interativo
    const button = new ButtonBuilder()
      .setCustomId(`embed_${message.author.id}_${Date.now()}`)
      .setLabel('👍 Curtir')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button);

    // Envia o embed com botão
    if (!('send' in message.channel)) {
      await message.reply('❌ Este tipo de canal não suporta embeds.');
      return;
    }

    const embedMessage = await message.channel.send({ 
      embeds: [embed], 
      components: [row] 
    });

    // Listener para o botão (simples)
    const collector = embedMessage.createMessageComponentCollector({
      time: 300000 // 5 minutos
    });

    let likes = 0;
    const likedUsers = new Set<string>();

    collector.on('collect', async (interaction) => {
      if (!interaction.isButton()) return;

      if (likedUsers.has(interaction.user.id)) {
        await interaction.reply({ 
          content: '❌ Você já curtiu este embed!', 
          ephemeral: true 
        });
        return;
      }

      likes++;
      likedUsers.add(interaction.user.id);

      // Atualizar botão
      const updatedButton = new ButtonBuilder()
        .setCustomId(`embed_${message.author.id}_${Date.now()}`)
        .setLabel(`👍 Curtir (${likes})`)
        .setStyle(ButtonStyle.Primary);

      const updatedRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(updatedButton);

      await interaction.update({ components: [updatedRow] });
    });

    collector.on('end', async () => {
      // Desabilitar botão após timeout
      const disabledButton = new ButtonBuilder()
        .setCustomId(`embed_disabled`)
        .setLabel(`👍 Curtir (${likes}) - Expirado`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const disabledRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(disabledButton);

      await embedMessage.edit({ components: [disabledRow] }).catch(() => {});
    });

    // Remove mensagem original se possível
    if (message.deletable) {
      await message.delete().catch(() => {});
    }

  } catch (error) {
    console.error('Erro no embed charm:', error);
    await message.reply('❌ Erro ao criar embed. Verifique os parâmetros e tente novamente.');
  }
};

/**
 * Converte string de cor para valor numérico
 */
function parseColor(colorInput: string): number | null {
  const input = colorInput.toLowerCase().trim();

  // Cores nomeadas
  const namedColors: Record<string, number> = {
    'red': 0xFF0000,
    'green': 0x00FF00,
    'blue': 0x0000FF,
    'yellow': 0xFFFF00,
    'purple': 0x800080,
    'pink': 0xFFC0CB,
    'orange': 0xFFA500,
    'black': 0x000000,
    'white': 0xFFFFFF,
    'gray': 0x808080,
    'grey': 0x808080,
    'cyan': 0x00FFFF,
    'magenta': 0xFF00FF
  };

  // Verifica se é cor nomeada
  if (namedColors[input]) {
    return namedColors[input];
  }

  // Verifica se é hexadecimal
  const hexMatch = input.match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    return parseInt(hexMatch[1], 16);
  }

  // Verifica hexadecimal curto (#fff)
  const shortHexMatch = input.match(/^#?([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    const shortHex = shortHexMatch[1];
    const fullHex = shortHex[0].repeat(2) + shortHex[1].repeat(2) + shortHex[2].repeat(2);
    return parseInt(fullHex, 16);
  }

  return null; // Cor inválida
}

/**
 * Metadados do charm embed
 */
export const embedMetadata: CharmMetadata = {
  name: 'embed',
  description: 'Cria um embed personalizado com título, descrição, cor e botão interativo',
  usage: '$embed título descrição cor',
  adminOnly: false,
  cooldown: 3, // 3 segundos de cooldown
  category: 'utility'
};
