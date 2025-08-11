import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm para criar embeds personalizados
 * Uso: $embed[título|descrição|cor]
 * Parâmetros separados por |
 */
export const embedCharm: CharmFunction = async (context) => {
  const { message, args } = context;

  if (!args || args.trim().length === 0) {
    await message.reply(
      '❌ Uso correto: `$embed[título|descrição|cor]`\n' +
      '**Exemplo:** `$embed[Meu Título|Esta é a descrição|#ff0000]`\n' +
      '**Cor (opcional):** Hexadecimal como #ff0000 ou nomes como red, blue, green'
    );
    return;
  }

  try {
    // Parse dos argumentos separados por |
    const parts = args.split('|').map(part => part.trim());
    
    if (parts.length < 2) {
      await message.reply('❌ Formato inválido! Mínimo: título e descrição separados por |');
      return;
    }

    const [title, description, color] = parts;

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
      .setTimestamp()
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL()
      });

    // Define cor se fornecida
    if (color) {
      const colorValue = parseColor(color);
      if (colorValue !== null) {
        embed.setColor(colorValue);
      }
    } else {
      embed.setColor(0x00AE86); // Cor padrão (verde azulado)
    }

    // Envia o embed
    if ('send' in message.channel) {
      await message.channel.send({ embeds: [embed] });
    } else {
      await message.reply('❌ Este tipo de canal não suporta o envio de embeds.');
      return;
    }

    // Remove mensagem original se possível
    if (message.deletable) {
      await message.delete().catch(() => {});
    }

  } catch (error) {
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
  description: 'Cria um embed personalizado com título, descrição e cor',
  usage: '$embed[título|descrição|cor]',
  adminOnly: false,
  cooldown: 3, // 3 segundos de cooldown
  category: 'utility'
};
