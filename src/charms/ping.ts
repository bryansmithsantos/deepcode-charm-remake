import { CharmFunction, CharmMetadata } from '../types/index.js';

/**
 * Charm de ping básico para testar conectividade
 * Uso: $ping[]
 */
export const pingCharm: CharmFunction = async (context) => {
  const { message, client } = context;
  const sent = Date.now();

  try {
    // Envia mensagem inicial
    const reply = await message.reply('🏓 Pong!');
    
    // Calcula latências
    const messageLatency = Date.now() - sent;
    const apiLatency = Math.round(client.ws.ping);
    
    // Edita a mensagem com as informações de latência
    await reply.edit(
      `🏓 **Pong!**\n` +
      `📡 **Latência da API:** ${apiLatency}ms\n` +
      `💬 **Latência da Mensagem:** ${messageLatency}ms`
    );

  } catch (error) {
    try {
      await message.reply('❌ Erro ao executar ping. Verifique as permissões do bot.');
    } catch {
      // Se nem conseguir responder com erro, ignora silenciosamente
    }
  }
};

/**
 * Metadados do charm ping
 */
export const pingMetadata: CharmMetadata = {
  name: 'ping',
  description: 'Testa a latência e conectividade do bot',
  usage: '$ping[]',
  adminOnly: false,
  cooldown: 5, // 5 segundos de cooldown
  category: 'utility'
};
