import { Client, GatewayIntentBits, Message, ActivityType } from 'discord.js';
import { 
  CharmClientOptions, 
  ParsedCommand, 
  CharmContext, 
  CharmFunction, 
  CharmMetadata, 
  CharmRegistry,
  CharmError,
  CharmErrorCode,
  BotStats
} from '../types/index.js';
import { logger } from './Logger.js';
import { Security } from '../utils/security.js';
import { RateLimit } from '../utils/rateLimit.js';

/**
 * Cliente principal do framework DeepCode Charm
 * Estende discord.js Client com funcionalidades de charms
 */
export class CharmClient extends Client {
  public readonly prefix: string;
  public readonly adminUsers: string[];
  public readonly allowedGuilds: string[];
  
  private readonly charms = new Map<string, CharmRegistry>();
  private readonly stats: BotStats;
  private readonly rateLimit: { maxCommands: number; timeWindow: number };
  private readonly startTime = Date.now();

  constructor(options: CharmClientOptions) {
    super({ 
      intents: options.intents,
      presence: {
        status: options.status || 'online',
        activities: options.activity ? [{
          name: options.activity.name,
          type: ActivityType[options.activity.type]
        }] : []
      }
    });

    this.prefix = options.prefix || '$';
    this.adminUsers = options.adminUsers || [];
    this.allowedGuilds = options.allowedGuilds || [];
    this.rateLimit = options.rateLimit || { maxCommands: 10, timeWindow: 60 };

    this.stats = {
      commandsExecuted: 0,
      uptime: 0,
      charmsCount: 0,
      guildsCount: 0,
      usersCount: 0
    };

    this.setupEventHandlers();
    this.logSystemInfo();
  }

  /**
   * Configura os event handlers do Discord
   */
  private setupEventHandlers(): void {
    this.on('ready', this.onReady.bind(this));
    this.on('messageCreate', this.onMessage.bind(this));
    this.on('guildCreate', this.onGuildJoin.bind(this));
    this.on('guildDelete', this.onGuildLeave.bind(this));
    this.on('error', this.onError.bind(this));
    this.on('warn', this.onWarn.bind(this));
  }

  /**
   * Handler para quando o bot fica online
   */
  private async onReady(): Promise<void> {
    if (!this.user) return;

    logger.info(`Bot conectado como ${this.user.tag}`, {
      guilds: this.guilds.cache.size,
      users: this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      charms: this.charms.size
    });

    this.updateStats();
  }

  /**
   * Handler para mensagens recebidas
   */
  private async onMessage(message: Message): Promise<void> {
    // Ignora mensagens de bots
    if (message.author.bot) return;

    // Verifica se o bot foi mencionado
    if (this.user && message.mentions.has(this.user.id)) {
      await this.handleMention(message);
      return;
    }

    // Ignora se não começar com o prefixo
    if (!message.content.startsWith(this.prefix)) {
      return;
    }

    // Verifica se a guild é permitida
    if (message.guildId && !Security.isGuildAllowed(message.guildId, this.allowedGuilds)) {
      logger.logSecurityEvent('Guild não permitida', message.author.id, message.guildId);
      return;
    }

    try {
      // Remove o prefixo e faz parse do comando
      const content = message.content.slice(this.prefix.length);
      const parsed = this.parseCharm(content);

      if (!parsed) {
        await message.reply('❌ Formato inválido. Use: `$charm argumentos` ou `$charm[argumentos]`');
        return;
      }

      // Verifica rate limiting global
      if (this.rateLimit.maxCommands > 0) {
        RateLimit.checkGlobalRateLimit(
          message.author.id, 
          this.rateLimit.maxCommands, 
          this.rateLimit.timeWindow
        );
      }

      await this.executeCharm(parsed, message);
      
    } catch (error) {
      await this.handleCharmError(error, message);
    }
  }

  /**
   * Handler para quando o bot é mencionado
   */
  private async handleMention(message: Message): Promise<void> {
    const stats = this.getStats();
    const uptime = Math.floor(stats.uptime / 60); // em minutos
    
    const responses = [
      `👋 Olá ${message.author.username}! Eu sou o **DeepCode Charm Bot**!`,
      `🔮 Meu prefixo é \`${this.prefix}\` - digite \`${this.prefix}help\` para ver comandos!`,
      `📊 **Stats**: ${stats.charmsCount} charms | ${stats.guildsCount} servers | ${uptime}min online`,
      `💡 Experimente: \`${this.prefix}say Olá mundo!\` ou \`${this.prefix}ping\``
    ];

    const embed = {
      color: 0x7289DA,
      description: responses.join('\n'),
      footer: {
        text: 'DeepCode Charm Framework v1.0.0',
        icon_url: this.user?.displayAvatarURL()
      },
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  }

  /**
   * Faz parse de um comando nos formatos:
   * - $charm[argumentos] (formato de definição)
   * - $charm argumentos (formato de uso no Discord)
   */
  private parseCharm(content: string): ParsedCommand | null {
    // Formato 1: $charm[args] ou $charm[] (compatibilidade com definições)
    const bracketRegex = /^(\w+)\[(.*?)\]$/s;
    const bracketMatch = content.match(bracketRegex);
    
    if (bracketMatch) {
      const [, charm, args] = bracketMatch;
      return {
        charm: charm.toLowerCase(),
        args: args.trim(),
        raw: content
      };
    }
    
    // Formato 2: $charm args (formato natural do Discord)
    const spaceRegex = /^(\w+)(?:\s+(.*))?$/s;
    const spaceMatch = content.match(spaceRegex);
    
    if (spaceMatch) {
      const [, charm, args = ''] = spaceMatch;
      return {
        charm: charm.toLowerCase(),
        args: args.trim(),
        raw: content
      };
    }
    
    return null;
  }

  /**
   * Encontra charms similares usando distância de Levenshtein
   */
  private findSimilarCharms(input: string, maxDistance: number = 2): string[] {
    const charmNames = Array.from(this.charms.keys());
    const suggestions: { charm: string; distance: number }[] = [];

    for (const charmName of charmNames) {
      const distance = this.levenshteinDistance(input.toLowerCase(), charmName.toLowerCase());
      if (distance <= maxDistance) {
        suggestions.push({ charm: charmName, distance });
      }
    }

    // Ordena por distância e retorna apenas os nomes
    return suggestions
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(s => s.charm);
  }

  /**
   * Calcula distância de Levenshtein entre duas strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Executa um charm
   */
  private async executeCharm(parsed: ParsedCommand, message: Message): Promise<void> {
    const charmRegistry = this.charms.get(parsed.charm);
    
    if (!charmRegistry) {
      // Busca sugestões de comandos similares
      const suggestions = this.findSimilarCharms(parsed.charm);
      
      const error = new CharmError(
        `Charm '${parsed.charm}' não encontrado`,
        CharmErrorCode.CHARM_NOT_FOUND
      );
      
      // Adiciona sugestões ao erro
      if (suggestions.length > 0) {
        error.suggestions = suggestions;
      }
      
      throw error;
    }

    const { execute: charmFunction, metadata } = charmRegistry;
    const userId = message.author.id;
    const isAdmin = Security.isAdmin(userId, this.adminUsers);

    // Verifica permissões de admin
    if (metadata.adminOnly && !isAdmin) {
      throw new CharmError(
        'Este comando requer permissões de administrador',
        CharmErrorCode.PERMISSION_DENIED,
        parsed.charm,
        userId
      );
    }

    // Verifica cooldown específico do charm
    if (metadata.cooldown > 0 && !isAdmin) {
      if (RateLimit.isOnCooldown(userId, parsed.charm, metadata.cooldown)) {
        const remaining = RateLimit.getCooldownRemaining(userId, parsed.charm, metadata.cooldown);
        throw new CharmError(
          `Comando em cooldown. Aguarde ${remaining}s`,
          CharmErrorCode.RATE_LIMITED,
          parsed.charm,
          userId
        );
      }
    }

    // Valida argumentos com userId para logging de segurança
    if (parsed.args) {
      Security.validateInput(parsed.args, userId);
    }

    // Cria contexto para execução
    const context: CharmContext = {
      message,
      args: parsed.args,
      client: this,
      user: {
        id: userId,
        username: message.author.username,
        isAdmin
      },
      guild: message.guild ? {
        id: message.guild.id,
        name: message.guild.name
      } : undefined
    };

    // Log do comando
    logger.logCommand(parsed.charm, userId, message.guildId || undefined, parsed.args);

    // Executa o charm
    await charmFunction(context);

    // Define cooldown se não for admin
    if (metadata.cooldown > 0 && !isAdmin) {
      RateLimit.setCooldown(userId, parsed.charm);
    }

    // Atualiza estatísticas
    this.stats.commandsExecuted++;
    this.stats.lastCommandAt = new Date();
  }

  /**
   * Registra um novo charm com validação de integridade
   */
  public registerCharm(charmFunction: CharmFunction, metadata: CharmMetadata): void {
    if (this.charms.has(metadata.name)) {
      logger.warn(`Charm '${metadata.name}' já existe, sobrescrevendo...`);
    }

    // Validação de integridade do charm
    const charmCode = charmFunction.toString();
    if (!Security.validateCharmIntegrity(metadata.name, charmCode)) {
      throw new Error(`Charm '${metadata.name}' falhou na verificação de integridade`);
    }

    const registry: CharmRegistry = {
      execute: charmFunction,
      metadata,
      registeredAt: new Date()
    };

    this.charms.set(metadata.name, registry);
    this.stats.charmsCount = this.charms.size;

    logger.info(`Charm registrado: ${metadata.name}`, {
      category: metadata.category,
      adminOnly: metadata.adminOnly,
      cooldown: metadata.cooldown,
      integrityValidated: true
    });
  }

  /**
   * Remove um charm
   */
  public unregisterCharm(charmName: string): boolean {
    const existed = this.charms.delete(charmName);
    if (existed) {
      this.stats.charmsCount = this.charms.size;
      logger.info(`Charm removido: ${charmName}`);
    }
    return existed;
  }

  /**
   * Obtém informações de um charm
   */
  public getCharm(charmName: string): CharmRegistry | undefined {
    return this.charms.get(charmName);
  }

  /**
   * Lista todos os charms registrados
   */
  public listCharms(): string[] {
    return Array.from(this.charms.keys());
  }

  /**
   * Obtém charms por categoria
   */
  public getCharmsByCategory(category: CharmMetadata['category']): CharmRegistry[] {
    return Array.from(this.charms.values())
      .filter(charm => charm.metadata.category === category);
  }

  /**
   * Trata erros de execução de charms
   */
  private async handleCharmError(error: unknown, message: Message): Promise<void> {
    if (error instanceof CharmError) {
      logger.warn(`Erro de charm: ${error.message}`, error, {
        charmName: error.charmName,
        userId: error.userId,
        guildId: message.guildId || undefined
      });

      // Mensagens de erro amigáveis
      switch (error.code) {
        case CharmErrorCode.CHARM_NOT_FOUND:
          let notFoundMessage = `❌ Comando \`${error.charmName}\` não encontrado.`;
          
          if (error.suggestions && error.suggestions.length > 0) {
            notFoundMessage += `\n\n💡 Você quis dizer:\n${error.suggestions.map(s => `• \`${this.prefix}${s}\``).join('\n')}`;
          }
          
          notFoundMessage += `\n\n📋 Use \`${this.prefix}help\` para ver todos os comandos.`;
          
          await message.reply(notFoundMessage);
          break;
        case CharmErrorCode.PERMISSION_DENIED:
          await message.reply('🚫 Você não tem permissão para usar este comando.');
          break;
        case CharmErrorCode.RATE_LIMITED:
          await message.reply(`⏰ ${error.message}`);
          break;
        case CharmErrorCode.SECURITY_VIOLATION:
          await message.reply('⚠️ Entrada rejeitada por motivos de segurança.');
          break;
        default:
          await message.reply('❌ Erro ao executar comando.');
      }
    } else {
      // Erro não esperado
      logger.error('Erro não tratado', error instanceof Error ? error : new Error(String(error)), {
        userId: message.author.id,
        guildId: message.guildId || undefined
      });

      await message.reply('❌ Ocorreu um erro interno. Tente novamente.');
    }
  }

  /**
   * Handlers de eventos do Discord
   */
  private async onGuildJoin(): Promise<void> {
    this.updateStats();
    logger.info('Bot adicionado a uma nova guild');
  }

  private async onGuildLeave(): Promise<void> {
    this.updateStats();
    logger.info('Bot removido de uma guild');
  }

  private async onError(error: Error): Promise<void> {
    logger.error('Erro do Discord.js', error);
  }

  private async onWarn(warning: string): Promise<void> {
    logger.warn('Aviso do Discord.js', { warning });
  }

  /**
   * Atualiza estatísticas do bot
   */
  private updateStats(): void {
    this.stats.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    this.stats.guildsCount = this.guilds.cache.size;
    this.stats.usersCount = this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    this.stats.charmsCount = this.charms.size;
  }

  /**
   * Obtém estatísticas atuais
   */
  public getStats(): BotStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Log de informações do sistema
   */
  private logSystemInfo(): void {
    logger.info('Sistema DeepCode Charm iniciado', {
      prefix: this.prefix,
      adminUsers: this.adminUsers.length,
      allowedGuilds: this.allowedGuilds.length,
      rateLimit: this.rateLimit
    });
  }

  /**
   * Inicia o bot com validação de segurança
   */
  public async start(token: string): Promise<void> {
    try {
      // Validação de configurações de segurança
      const securityCheck = Security.validateSecurityConfig();
      
      if (!securityCheck.isValid) {
        logger.fatal('Falha na validação de segurança', {
          errors: securityCheck.errors
        });
        throw new Error('Configurações de segurança inválidas: ' + securityCheck.errors.join(', '));
      }

      if (securityCheck.warnings.length > 0) {
        logger.warn('Avisos de segurança encontrados', {
          warnings: securityCheck.warnings
        });
      }

      // Inicia limpeza periódica de dados de segurança
      this.startSecurityCleanup();

      await this.login(token);
      logger.info('Bot conectado com sucesso', {
        securityValidated: true,
        warnings: securityCheck.warnings.length
      });
    } catch (error) {
      logger.fatal('Falha ao conectar bot', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Inicia limpeza periódica de segurança (executa a cada hora)
   */
  private startSecurityCleanup(): void {
    setInterval(() => {
      try {
        RateLimit.cleanup();
        Security.cleanupSecurityData();
        
        const rateLimitStats = RateLimit.getStats();
        logger.info('Limpeza periódica de segurança executada', {
          activeUsers: rateLimitStats.activeUsers,
          totalCommands: rateLimitStats.totalCommands,
          totalViolations: rateLimitStats.totalViolations,
          bannedUsers: rateLimitStats.bannedUsers
        });
      } catch (error) {
        logger.error('Erro durante limpeza de segurança', error);
      }
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Para o bot graciosamente
   */
  public async shutdown(): Promise<void> {
    logger.info('Iniciando shutdown do bot...');
    
    try {
      this.destroy();
      logger.info('Bot desconectado');
    } catch (error) {
      logger.error('Erro durante shutdown', error instanceof Error ? error : new Error(String(error)));
    }
  }
}
