import { GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { CharmClient } from './core/CharmClient.js';
import { logger } from './core/Logger.js';

// Importa charms
import { sayCharm, sayMetadata } from './charms/say.js';
import { pingCharm, pingMetadata } from './charms/ping.js';
import { embedCharm, embedMetadata } from './charms/embed.js';
import { helpCharm, helpMetadata } from './charms/help.js';
import { avatarCharm, avatarMetadata } from './charms/avatar.js';
import { pollCharm, pollMetadata } from './charms/poll.js';
import { serverinfoCharm, serverinfoMetadata } from './charms/serverinfo.js';

/**
 * Parser de argumentos da linha de comando
 */
function parseArgs(): {
  token?: string;
  prefix?: string;
  help?: boolean;
  version?: boolean;
} {
  const args = process.argv.slice(2);
  const parsed: any = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--token':
      case '-t':
        parsed.token = args[++i];
        break;
      case '--prefix':
      case '-p':
        parsed.prefix = args[++i];
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
      case '--version':
      case '-v':
        parsed.version = true;
        break;
    }
  }

  return parsed;
}

/**
 * Mostra ajuda da linha de comando
 */
function showHelp(): void {
  console.log(`
🔮 DeepCode Charm Framework v1.0.0

USO:
  bun run src/index.ts [opções]

OPÇÕES:
  --token, -t <token>     Token do bot Discord
  --prefix, -p <prefix>   Prefixo dos comandos (padrão: $)
  --help, -h              Mostra esta ajuda
  --version, -v           Mostra a versão

EXEMPLOS:
  bun run src/index.ts --token SEU_TOKEN_AQUI
  bun run src/index.ts --token SEU_TOKEN --prefix !
  bun run src/index.ts --help

CONFIGURAÇÃO:
  Você também pode usar um arquivo .env:
  
  DISCORD_TOKEN=seu_token_aqui
  PREFIX=$
  BOT_STATUS=online
  LOG_LEVEL=info

COMANDOS DISPONÍVEIS NO BOT:
  $say[texto]                    - Bot envia uma mensagem
  $ping[]                        - Mostra latência do bot
  $embed[título|descrição|cor]   - Cria um embed personalizado
  $help[]                        - Lista todos os comandos

MAIS INFORMAÇÕES:
  📚 Documentação: ./docs/
  🔒 Segurança: ./docs/SECURITY.md
  📖 Exemplos: ./docs/USAGE.md
  `);
}

/**
 * Mostra versão
 */
function showVersion(): void {
  console.log('DeepCode Charm Framework v1.0.0');
}

/**
 * Inicialização do bot DeepCode Charm
 */
async function main() {
  // Parse argumentos da linha de comando
  const args = parseArgs();

  // Mostra ajuda se solicitado
  if (args.help) {
    showHelp();
    return;
  }

  // Mostra versão se solicitado
  if (args.version) {
    showVersion();
    return;
  }

  // Carrega variáveis de ambiente
  config();

  // Obtém token (prioridade: CLI args > .env)
  const token = args.token || process.env.DISCORD_TOKEN;
  
  if (!token) {
    console.error('❌ DISCORD_TOKEN não encontrado!');
    console.log('\n💡 Use uma das opções:');
    console.log('   1. Linha de comando: --token SEU_TOKEN');
    console.log('   2. Arquivo .env: DISCORD_TOKEN=seu_token');
    console.log('   3. Variável de ambiente: export DISCORD_TOKEN=seu_token');
    console.log('\n📖 Para mais ajuda: --help');
    process.exit(1);
  }

  try {
    console.log('🚀 Iniciando DeepCode Charm Framework...');
    
    // Configurações do cliente
    const clientOptions = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ],
      prefix: args.prefix || process.env.PREFIX || '$',
      status: (process.env.BOT_STATUS as any) || 'online',
      activity: {
        name: process.env.BOT_ACTIVITY_NAME || 'com charms mágicos ✨',
        type: (process.env.BOT_ACTIVITY_TYPE as any) || 'PLAYING'
      },
      adminUsers: process.env.ADMIN_USERS?.split(',').map(id => id.trim()) || [],
      allowedGuilds: process.env.ALLOWED_GUILDS?.split(',').map(id => id.trim()) || [],
      rateLimit: {
        maxCommands: parseInt(process.env.RATE_LIMIT_MAX || '10'),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60')
      }
    };

    console.log(`🔮 Prefix configurado: ${clientOptions.prefix}`);
    console.log(`📊 Rate limit: ${clientOptions.rateLimit.maxCommands} comandos/${clientOptions.rateLimit.timeWindow}s`);

    // Cria o cliente
    const client = new CharmClient(clientOptions);

    // Registra charms básicos
    registerBasicCharms(client);

    // Configura handlers de processo
    setupProcessHandlers(client);

    // Inicia o bot
    await client.start(token);

    logger.info('🚀 DeepCode Charm Framework iniciado com sucesso!');

  } catch (error) {
    console.error('❌ Falha crítica na inicialização:', error);
    process.exit(1);
  }
}

/**
 * Registra todos os charms básicos no cliente
 */
function registerBasicCharms(client: CharmClient): void {
  console.log('🔧 Registrando charms básicos...');

  const charms = [
    { func: sayCharm, meta: sayMetadata },
    { func: pingCharm, meta: pingMetadata },
    { func: embedCharm, meta: embedMetadata },
    { func: helpCharm, meta: helpMetadata },
    { func: avatarCharm, meta: avatarMetadata },
    { func: pollCharm, meta: pollMetadata },
    { func: serverinfoCharm, meta: serverinfoMetadata }
  ];

  for (const { func, meta } of charms) {
    try {
      client.registerCharm(func, meta);
      console.log(`   ✅ ${meta.name} registrado`);
    } catch (error) {
      console.error(`   ❌ Erro ao registrar charm ${meta.name}:`, error);
    }
  }

  console.log(`🎉 ${charms.length} charms registrados com sucesso!\n`);
}

/**
 * Configura handlers para sinais do processo
 */
function setupProcessHandlers(client: CharmClient): void {
  // Shutdown gracioso
  const shutdown = async (signal: string) => {
    console.log(`\n🔄 Sinal recebido: ${signal}. Iniciando shutdown...`);
    
    try {
      await client.shutdown();
      console.log('✅ Shutdown concluído com sucesso');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro durante shutdown:', error);
      process.exit(1);
    }
  };

  // Handlers de sinais
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handler de erros não tratados
  process.on('uncaughtException', (error) => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', { reason, promise });
    process.exit(1);
  });
}

/**
 * Informações de versão e sistema
 */
function logSystemInfo(): void {
  const nodeVersion = process.version;
  const platform = process.platform;
  const arch = process.arch;
  
  console.log('📊 Informações do sistema:');
  console.log(`   Node.js: ${nodeVersion}`);
  console.log(`   Plataforma: ${platform} ${arch}`);
  console.log(`   PID: ${process.pid}`);
  console.log(`   Memória: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n`);
}

// Inicia a aplicação
if (require.main === module) {
  logSystemInfo();
  main().catch((error) => {
    console.error('❌ Erro fatal na inicialização:', error);
    process.exit(1);
  });
}

// Exporta para uso como módulo
export { CharmClient, logger };
export * from './types/index.js';
export * from './utils/security.js';
export * from './utils/rateLimit.js';
