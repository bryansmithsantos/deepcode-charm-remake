import { LogLevel, LogEntry } from '../types/index.js';

/**
 * Sistema de logging robusto para o framework
 * Suporta diferentes níveis de log e formatação colorida
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs: number = 1000;
  private readonly logLevel: LogLevel;

  private constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  /**
   * Singleton para garantir uma única instância do logger
   */
  public static getInstance(logLevel?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(logLevel);
    }
    return Logger.instance;
  }

  /**
   * Cores ANSI para formatação no console
   */
  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };

  /**
   * Formata uma mensagem de log com cores
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level].padEnd(5);
    
    let color = this.colors.white;
    switch (entry.level) {
      case LogLevel.DEBUG:
        color = this.colors.gray;
        break;
      case LogLevel.INFO:
        color = this.colors.blue;
        break;
      case LogLevel.WARN:
        color = this.colors.yellow;
        break;
      case LogLevel.ERROR:
        color = this.colors.red;
        break;
      case LogLevel.FATAL:
        color = `${this.colors.red}${this.colors.bright}`;
        break;
    }

    let message = `${this.colors.gray}[${timestamp}]${this.colors.reset} `;
    message += `${color}${levelStr}${this.colors.reset} `;
    message += `${entry.message}`;

    // Adiciona informações contextuais se disponíveis
    if (entry.charmName) {
      message += ` ${this.colors.cyan}[${entry.charmName}]${this.colors.reset}`;
    }
    if (entry.userId) {
      message += ` ${this.colors.magenta}[User:${entry.userId}]${this.colors.reset}`;
    }
    if (entry.guildId) {
      message += ` ${this.colors.green}[Guild:${entry.guildId}]${this.colors.reset}`;
    }

    return message;
  }

  /**
   * Adiciona uma entrada de log
   */
  private addLog(level: LogLevel, message: string, data?: any, context?: {
    userId?: string;
    guildId?: string;
    charmName?: string;
  }): void {
    if (level < this.logLevel) {
      return; // Ignora logs abaixo do nível configurado
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      ...context
    };

    // Adiciona ao array de logs
    this.logs.push(entry);

    // Remove logs antigos se exceder o limite
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Imprime no console
    const formattedMessage = this.formatMessage(entry);
    
    if (level >= LogLevel.ERROR) {
      console.error(formattedMessage);
      if (data) {
        console.error('Data:', data);
      }
    } else if (level === LogLevel.WARN) {
      console.warn(formattedMessage);
      if (data) {
        console.warn('Data:', data);
      }
    } else {
      console.log(formattedMessage);
      if (data) {
        console.log('Data:', data);
      }
    }
  }

  /**
   * Log de debug - apenas para desenvolvimento
   */
  public debug(message: string, data?: any, context?: {
    userId?: string;
    guildId?: string;
    charmName?: string;
  }): void {
    this.addLog(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log informativo
   */
  public info(message: string, data?: any, context?: {
    userId?: string;
    guildId?: string;
    charmName?: string;
  }): void {
    this.addLog(LogLevel.INFO, message, data, context);
  }

  /**
   * Log de aviso
   */
  public warn(message: string, data?: any, context?: {
    userId?: string;
    guildId?: string;
    charmName?: string;
  }): void {
    this.addLog(LogLevel.WARN, message, data, context);
  }

  /**
   * Log de erro
   */
  public error(message: string, error?: Error | any, context?: {
    userId?: string;
    guildId?: string;
    charmName?: string;
  }): void {
    let data = error;
    
    // Se for um Error, extrai informações úteis
    if (error instanceof Error) {
      data = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    this.addLog(LogLevel.ERROR, message, data, context);
  }

  /**
   * Log de erro fatal - usado para erros críticos
   */
  public fatal(message: string, error?: Error | any, context?: {
    userId?: string;
    guildId?: string;
    charmName?: string;
  }): void {
    let data = error;
    
    if (error instanceof Error) {
      data = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    this.addLog(LogLevel.FATAL, message, data, context);
  }

  /**
   * Log específico para comandos executados
   */
  public logCommand(charmName: string, userId: string, guildId?: string, args?: string): void {
    const message = `Comando executado: ${charmName}`;
    this.info(message, { args }, { charmName, userId, guildId });
  }

  /**
   * Log específico para tentativas de segurança
   */
  public logSecurityEvent(event: string, userId: string, guildId?: string, details?: any): void {
    const message = `Evento de segurança: ${event}`;
    this.warn(message, details, { userId, guildId });
  }

  /**
   * Retorna os logs recentes
   */
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Retorna logs filtrados por nível
   */
  public getLogsByLevel(level: LogLevel, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  /**
   * Retorna logs de um usuário específico
   */
  public getLogsByUser(userId: string, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-count);
  }

  /**
   * Limpa todos os logs
   */
  public clearLogs(): void {
    this.logs = [];
    this.info('Logs limpos');
  }

  /**
   * Retorna estatísticas dos logs
   */
  public getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    };

    // Conta logs por nível
    for (const level of Object.keys(LogLevel)) {
      if (isNaN(Number(level))) {
        stats.byLevel[level] = this.logs.filter(log => 
          LogLevel[log.level] === level
        ).length;
      }
    }

    return stats;
  }
}

/**
 * Instância global do logger para uso em todo o framework
 */
export const logger = Logger.getInstance(
  process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG :
  process.env.LOG_LEVEL === 'warn' ? LogLevel.WARN :
  process.env.LOG_LEVEL === 'error' ? LogLevel.ERROR :
  LogLevel.INFO
);
