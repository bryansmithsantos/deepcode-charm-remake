import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm que envia uma mensagem simples no canal
 * Uso: $say[texto a ser enviado]
 */
export const sayCharm: CharmFunction = async (context) => {
  const { message, args } = context;

  // Verifica se argumentos foram fornecidos
  if (!args || args.trim().length === 0) {
    await message.reply('❌ Uso correto: `$say[texto a ser enviado]`');
    return;
  }

  // Verifica tamanho máximo da mensagem (limite do Discord é 2000)
  if (args.length > 1900) {
    await message.reply('❌ Mensagem muito longa! Máximo permitido: 1900 caracteres.');
    return;
  }

  try {
    // Verifica se o canal suporta envio de mensagens
    if ('send' in message.channel) {
      await message.channel.send(args);
    } else {
      await message.reply('❌ Este tipo de canal não suporta o envio de mensagens.');
      return;
    }
    
    // Remove a mensagem original (opcional - só funciona se o bot tiver permissões)
    if (message.deletable) {
      await message.delete().catch(() => {
        // Ignora erro se não conseguir deletar
      });
    }
  } catch (error) {
    await message.reply('❌ Erro ao enviar mensagem. Verifique se tenho as permissões necessárias.');
  }
};

/**
 * Metadados do charm say
 */
export const sayMetadata: CharmMetadata = {
  name: 'say',
  description: 'Faz o bot enviar uma mensagem no canal atual',
  usage: '$say[texto a ser enviado]',
  adminOnly: false,
  cooldown: 2, // 2 segundos de cooldown
  category: 'utility'
};
