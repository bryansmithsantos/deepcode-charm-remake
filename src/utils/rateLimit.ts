import { CharmError, CharmErrorCode } from '../types/index.js';

/**
 * Sistema de rate limiting para prevenir spam
 */
export class RateLimit {
  private static userCooldowns = new Map<string, Map<string, number>>();
  private static userCommandCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Verifica se usuário está em cooldown para um charm específico
   */
  public static isOnCooldown(userId: string, charmName: string, cooldownSeconds: number): boolean {
    const userCooldowns = this.userCooldowns.get(userId);
    if (!userCooldowns) return false;

    const lastUsed = userCooldowns.get(charmName);
    if (!lastUsed) return false;

    const now = Date.now();
    const cooldownMs = cooldownSeconds * 1000;
    
    return (now - lastUsed) < cooldownMs;
  }

  /**
   * Define cooldown para um usuário e charm
   */
  public static setCooldown(userId: string, charmName: string): void {
    if (!this.userCooldowns.has(userId)) {
      this.userCooldowns.set(userId, new Map());
    }
    
    const userCooldowns = this.userCooldowns.get(userId)!;
    userCooldowns.set(charmName, Date.now());
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
   * Verifica rate limit global (comandos por minuto)
   */
  public static checkGlobalRateLimit(userId: string, maxCommands: number, timeWindowSeconds: number): void {
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
      throw new CharmError(
        `Rate limit excedido. Tente novamente em ${remainingSeconds}s`,
        CharmErrorCode.RATE_LIMITED
      );
    }

    // Incrementa contador
    userStats.count++;
  }

  /**
   * Limpa dados antigos de rate limiting
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
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  public static getStats(): {
    activeUsers: number;
    totalCooldowns: number;
    avgCommandsPerUser: number;
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

    return {
      activeUsers,
      totalCooldowns,
      avgCommandsPerUser: activeUsers > 0 ? totalCommands / activeUsers : 0
    };
  }
}

// Executa limpeza a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RateLimit.cleanup();
  }, 60 * 60 * 1000);
}
