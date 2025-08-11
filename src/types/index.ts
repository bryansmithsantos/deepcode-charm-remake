import { Message, GatewayIntentBits } from 'discord.js';

/**
 * Configurações para inicializar o CharmClient
 */
export interface CharmClientOptions {
  /** Intents necessárias para o bot */
  intents: GatewayIntentBits[];
  /** Prefixo para comandos (padrão: $) */
  prefix: string;
  /** Status do bot */
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  /** Atividade do bot */
  activity?: {
    name: string;
    type: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'COMPETING';
  };
  /** IDs de guilds permitidas (vazio = todas) */
  allowedGuilds?: string[];
  /** IDs de usuários admin */
  adminUsers?: string[];
  /** Configurações de rate limiting */
  rateLimit?: {
    maxCommands: number;
    timeWindow: number; // em segundos
  };
}

/**
 * Resultado do parsing de um comando
 */
export interface ParsedCommand {
  /** Nome do charm */
  charm: string;
  /** Argumentos do charm */
  args: string;
  /** Comando completo original */
  raw: string;
}

/**
 * Context do charm durante execução
 */
export interface CharmContext {
  /** Mensagem original do Discord */
  message: Message;
  /** Argumentos parseados */
  args: string;
  /** Cliente do framework */
  client: any; // CharmClient (evita dependência circular)
  /** Informações do usuário */
  user: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
  /** Informações da guild */
  guild?: {
    id: string;
    name: string;
  };
}

/**
 * Função que implementa um charm
 */
export type CharmFunction = (context: CharmContext) => Promise<void>;

/**
 * Metadados de um charm
 */
export interface CharmMetadata {
  /** Nome do charm */
  name: string;
  /** Descrição do charm */
  description: string;
  /** Exemplo de uso */
  usage: string;
  /** Se requer permissões de admin */
  adminOnly: boolean;
  /** Cooldown em segundos */
  cooldown: number;
  /** Categoria do charm */
  category: 'utility' | 'fun' | 'moderation' | 'information';
}

/**
 * Registro completo de um charm
 */
export interface CharmRegistry {
  /** Função do charm */
  execute: CharmFunction;
  /** Metadados do charm */
  metadata: CharmMetadata;
  /** Data de registro */
  registeredAt: Date;
}

/**
 * Níveis de log
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * Entrada de log
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  guildId?: string;
  charmName?: string;
}

/**
 * Configurações de segurança
 */
export interface SecurityConfig {
  /** Máximo de caracteres em argumentos */
  maxArgLength: number;
  /** Caracteres proibidos em argumentos */
  forbiddenChars: RegExp;
  /** Rate limiting habilitado */
  rateLimitEnabled: boolean;
  /** Validação de permissões habilitada */
  permissionCheckEnabled: boolean;
}

/**
 * Estatísticas do bot
 */
export interface BotStats {
  /** Comandos executados */
  commandsExecuted: number;
  /** Uptime em segundos */
  uptime: number;
  /** Charms registrados */
  charmsCount: number;
  /** Guilds conectadas */
  guildsCount: number;
  /** Usuários únicos */
  usersCount: number;
  /** Último comando executado */
  lastCommandAt?: Date;
}

/**
 * Erro específico do framework
 */
export class CharmError extends Error {
  public readonly code: string;
  public readonly charmName?: string;
  public readonly userId?: string;
  public suggestions?: string[];
  
  constructor(message: string, code: string, charmName?: string, userId?: string) {
    super(message);
    this.name = 'CharmError';
    this.code = code;
    this.charmName = charmName;
    this.userId = userId;
  }
}

/**
 * Códigos de erro do framework
 */
export enum CharmErrorCode {
  CHARM_NOT_FOUND = 'CHARM_NOT_FOUND',
  INVALID_SYNTAX = 'INVALID_SYNTAX',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_ARGS = 'INVALID_ARGS',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}
