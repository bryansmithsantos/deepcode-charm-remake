import { CharmError, CharmErrorCode } from '../types/index.js';
import { logger } from '../core/Logger.js';

/**
 * Sistema avançado de rate limiting com exponential backoff
 */
export class RateLimit {
  private static userCooldowns = new Map<string, Map<string, number>>();
  private static userCommandCounts = new Map<string, { count: number; resetTime: number }>();
  private static userViolations = new Map<string, { count: number; lastViolation: number }>();
  private static bannedUsers = new Map<string, number>(); // userId -> unban timestamp
  private static globalStats = {
    totalCommands: 0,
    totalViolations: 0,
    activeUsers: 0,
    startTime: Date.now()
  };

  /**
   * Verifica se usuário está em cooldown para um charm específico
   */
  public static isOnCooldown(userId: string, charmName: string, cooldownSeconds: number): boolean {
    // Check if user is banned first
    if (this.isUserBanned(userId)) {
      return true;
    }

    const userCooldowns = this.userCooldowns.get(userId);
    if (!userCooldowns) return false;

    const lastUsed = userCooldowns.get(charmName);
    if (!lastUsed) return false;

    const now = Date.now();
    const cooldownMs = cooldownSeconds * 1000;
    
    return (now - lastUsed) < cooldownMs;
  }

  /**
   * Verifica se usuário está temporariamente banido
   */
  public static isUserBanned(userId: string): boolean {
    const unbanTime = this.bannedUsers.get(userId);
    if (!unbanTime) return false;

    if (Date.now() >= unbanTime) {
      this.bannedUsers.delete(userId);
      logger.info(`Usuário ${userId} foi desbanido automaticamente`);
      return false;
    }

    return true;
  }

  /**
   * Bane usuário temporariamente com exponential backoff
   */
  private static banUser(userId: string, violations: number): void {
    // Exponential backoff: 5min, 15min, 1h, 6h, 24h
    const banMinutes = Math.min(5 * Math.pow(3, violations - 1), 1440); // Max 24h
    const banTime = Date.now() + (banMinutes * 60 * 1000);
    
    this.bannedUsers.set(userId, banTime);
    logger.warn(`Usuário ${userId} banido temporariamente`, {
      violations,
      banMinutes,
      unbanTime: new Date(banTime).toISOString()
    });
  }

  /**
   * Incrementa violações e aplica punições se necessário
   */
  private static handleViolation(userId: string, reason: string): void {
    const now = Date.now();
    const userViolation = this.userViolations.get(userId) || { count: 0, lastViolation: 0 };

    // Reset violations after 1 hour of good behavior
    if (now - userViolation.lastViolation > 60 * 60 * 1000) {
      userViolation.count = 0;
    }

    userViolation.count++;
    userViolation.lastViolation = now;
    this.userViolations.set(userId, userViolation);
    this.globalStats.totalViolations++;

    logger.logSecurityEvent(`Rate limit violation: ${reason}`, userId, undefined, {
      violationCount: userViolation.count
    });

    // Apply temporary ban after 5 violations
    if (userViolation.count >= 5) {
      this.banUser(userId, userViolation.count);
    }
  }

  /**
   * Define cooldown para um usuário e charm com tracking
   */
  public static setCooldown(userId: string, charmName: string): void {
    if (!this.userCooldowns.has(userId)) {
      this.userCooldowns.set(userId, new Map());
    }
    
    const userCooldowns = this.userCooldowns.get(userId)!;
    userCooldowns.set(charmName, Date.now());
    this.globalStats.totalCommands++;
  }

  /**
   * Obtém tempo restante de cooldown em segundos
   */
  public static getCooldownRemaining(userId: string, charmName: string, cooldownSeconds: number): number {
    const userCooldowns = this.userCooldowns.get(userId);
    if (!userCooldowns) return 0;

    const lastUsed = userCooldowns.get(charmName);
    if (!lastUsed) return 0;

    const now = Date.now();
    const cooldownMs = cooldownSeconds * 1000;
    const remaining = Math.max(0, cooldownMs - (now - lastUsed));
    
    return Math.ceil(remaining / 1000);
  }

  /**
   * Verifica rate limit global com punições escalonadas
   */
  public static checkGlobalRateLimit(userId: string, maxCommands: number, timeWindowSeconds: number): void {
    // Check if user is banned
    if (this.isUserBanned(userId)) {
      const unbanTime = this.bannedUsers.get(userId)!;
      const remainingMinutes = Math.ceil((unbanTime - Date.now()) / (60 * 1000));
      throw new CharmError(
        `Você está temporariamente banido. Tempo restante: ${remainingMinutes} minutos`,
        CharmErrorCode.RATE_LIMITED
      );
    }

    const now = Date.now();
    const timeWindowMs = timeWindowSeconds * 1000;
    
    const userStats = this.userCommandCounts.get(userId);
    
    if (!userStats || now >= userStats.resetTime) {
      // Novo período ou primeiro comando
      this.userCommandCounts.set(userId, {
        count: 1,
        resetTime: now + timeWindowMs
      });
      return;
    }

    if (userStats.count >= maxCommands) {
      const remainingSeconds = Math.ceil((userStats.resetTime - now) / 1000);
      
      // Handle violation
      this.handleViolation(userId, 'Global rate limit exceeded');
      
      throw new CharmError(
        `Rate limit excedido. Tente novamente em ${remainingSeconds}s`,
        CharmErrorCode.RATE_LIMITED
      );
    }

    // Incrementa contador
    userStats.count++;
  }

  /**
   * Limpa dados antigos de rate limiting com lógica aprimorada
   */
  public static cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    // Limpa cooldowns antigos
    for (const [userId, userCooldowns] of this.userCooldowns) {
      for (const [charmName, lastUsed] of userCooldowns) {
        if (now - lastUsed > maxAge) {
          userCooldowns.delete(charmName);
        }
      }
      
      if (userCooldowns.size === 0) {
        this.userCooldowns.delete(userId);
      }
    }

    // Limpa contadores expirados
    for (const [userId, stats] of this.userCommandCounts) {
      if (now >= stats.resetTime) {
        this.userCommandCounts.delete(userId);
      }
    }

    // Limpa violações antigas (mais de 24h)
    for (const [userId, violation] of this.userViolations) {
      if (now - violation.lastViolation > maxAge) {
        this.userViolations.delete(userId);
      }
    }

    // Remove usuários desbanidos
    for (const [userId, unbanTime] of this.bannedUsers) {
      if (now >= unbanTime) {
        this.bannedUsers.delete(userId);
      }
    }

    logger.debug('Limpeza de rate limiting executada', {
      activeUsers: this.userCommandCounts.size,
      cooldowns: Array.from(this.userCooldowns.values()).reduce((acc, map) => acc + map.size, 0),
      violations: this.userViolations.size,
      bannedUsers: this.bannedUsers.size
    });
  }

  /**
   * Unban manual de usuário por administrador
   */
  public static unbanUser(userId: string, adminId: string): boolean {
    const wasBanned = this.bannedUsers.delete(userId);
    if (wasBanned) {
      // Reset violations
      this.userViolations.delete(userId);
      logger.info(`Usuário ${userId} foi desbanido manualmente pelo admin ${adminId}`);
    }
    return wasBanned;
  }

  /**
   * Obtém estatísticas de rate limiting aprimoradas
   */
  public static getStats(): {
    activeUsers: number;
    totalCooldowns: number;
    avgCommandsPerUser: number;
    totalCommands: number;
    totalViolations: number;
    bannedUsers: number;
    uptimeHours: number;
    commandsPerHour: number;
  } {
    const activeUsers = this.userCommandCounts.size;
    let totalCooldowns = 0;
    let totalCommands = 0;

    for (const userCooldowns of this.userCooldowns.values()) {
      totalCooldowns += userCooldowns.size;
    }

    for (const stats of this.userCommandCounts.values()) {
      totalCommands += stats.count;
    }

    const uptimeHours = (Date.now() - this.globalStats.startTime) / (1000 * 60 * 60);
    const commandsPerHour = uptimeHours > 0 ? this.globalStats.totalCommands / uptimeHours : 0;

    return {
      activeUsers,
      totalCooldowns,
      avgCommandsPerUser: activeUsers > 0 ? totalCommands / activeUsers : 0,
      totalCommands: this.globalStats.totalCommands,
      totalViolations: this.globalStats.totalViolations,
      bannedUsers: this.bannedUsers.size,
      uptimeHours: Math.round(uptimeHours * 100) / 100,
      commandsPerHour: Math.round(commandsPerHour * 100) / 100
    };
  }

  /**
   * Obtém informações de usuário específico
   */
  public static getUserInfo(userId: string): {
    isBanned: boolean;
    unbanTime?: Date;
    violations: number;
    currentCommands: number;
    rateLimitReset?: Date;
    activeCooldowns: string[];
  } {
    const unbanTime = this.bannedUsers.get(userId);
    const violation = this.userViolations.get(userId);
    const commandStats = this.userCommandCounts.get(userId);
    const cooldowns = this.userCooldowns.get(userId);

    return {
      isBanned: !!unbanTime && Date.now() < unbanTime,
      unbanTime: unbanTime ? new Date(unbanTime) : undefined,
      violations: violation?.count || 0,
      currentCommands: commandStats?.count || 0,
      rateLimitReset: commandStats?.resetTime ? new Date(commandStats.resetTime) : undefined,
      activeCooldowns: cooldowns ? Array.from(cooldowns.keys()) : []
    };
  }
}

// Executa limpeza a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RateLimit.cleanup();
  }, 60 * 60 * 1000);
}
