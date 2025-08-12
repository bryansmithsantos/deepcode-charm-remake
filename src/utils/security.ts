import { CharmError, CharmErrorCode } from '../types/index.js';
import { logger } from '../core/Logger.js';
import crypto from 'crypto';

/**
 * Utilitários de segurança avançados para validação e sanitização
 */
export class Security {
  private static readonly DANGEROUS_CHARS = /[<>'"&;(){}[\]\\`$#%@!^*+=|~]/;
  private static readonly SUSPICIOUS_PATTERNS = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /eval\s*\(/i,
    /function\s*\(/i,
    /require\s*\(/i,
    /import\s+/i,
    /__proto__/i,
    /constructor/i,
    /prototype/i,
    /process\./i,
    /global\./i,
    /window\./i,
    /document\./i,
    /\.\./i, // Path traversal
    /\/\*.*\*\//i, // SQL/JS comments
    /--.*$/mi, // SQL comments
    /select.*from/i,
    /drop.*table/i,
    /insert.*into/i,
    /update.*set/i,
    /delete.*from/i,
    /union.*select/i,
    /script.*>/i,
    /<.*onclick/i,
    /<.*onload/i,
    /<.*onerror/i
  ];
  private static readonly MALICIOUS_URLS = [
    /bit\.ly/i,
    /tinyurl/i,
    /t\.co/i,
    /discord\.gg\/(?![\w-]+$)/i, // Suspeitos invite links
    /grabify/i,
    /iplogger/i,
    /2no\.co/i,
    /linkvertise/i
  ];
  private static readonly MAX_ARG_LENGTH = 1500; // Reduced for better security
  private static readonly MAX_MENTIONS = 5;
  private static readonly MAX_EMOJIS = 10;
  private static readonly RATE_LIMIT_VIOLATIONS = new Map<string, number>();
  private static readonly ENCRYPTION_KEY = process.env.SECURITY_KEY || 'default-key-change-in-production';

  /**
   * Valida se o input é seguro com verificações avançadas
   */
  public static validateInput(input: string, userId?: string): void {
    if (!input) return;

    // Check input length
    if (input.length > this.MAX_ARG_LENGTH) {
      this.logSecurityViolation('Input too long', userId, { length: input.length });
      throw new CharmError(
        `Argumento muito longo. Máximo: ${this.MAX_ARG_LENGTH}`,
        CharmErrorCode.SECURITY_VIOLATION
      );
    }

    // Check dangerous characters
    if (this.DANGEROUS_CHARS.test(input)) {
      this.logSecurityViolation('Dangerous characters detected', userId, { 
        input: input.substring(0, 100) + (input.length > 100 ? '...' : '')
      });
      throw new CharmError(
        'Argumento contém caracteres proibidos',
        CharmErrorCode.SECURITY_VIOLATION
      );
    }

    // Check suspicious patterns
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        this.logSecurityViolation('Suspicious pattern detected', userId, { 
          pattern: pattern.toString(),
          input: input.substring(0, 100) + (input.length > 100 ? '...' : '')
        });
        throw new CharmError(
          'Padrão suspeito detectado',
          CharmErrorCode.SECURITY_VIOLATION
        );
      }
    }

    // Check malicious URLs
    for (const urlPattern of this.MALICIOUS_URLS) {
      if (urlPattern.test(input)) {
        this.logSecurityViolation('Malicious URL detected', userId, { 
          url: input.substring(0, 100) + (input.length > 100 ? '...' : '')
        });
        throw new CharmError(
          'URL suspeita detectada',
          CharmErrorCode.SECURITY_VIOLATION
        );
      }
    }

    // Check mentions flood
    const mentionCount = (input.match(/<@!?\d+>/g) || []).length;
    if (mentionCount > this.MAX_MENTIONS) {
      this.logSecurityViolation('Mention flooding attempt', userId, { mentions: mentionCount });
      throw new CharmError(
        `Muitas menções. Máximo: ${this.MAX_MENTIONS}`,
        CharmErrorCode.SECURITY_VIOLATION
      );
    }

    // Check emoji flood
    const emojiCount = (input.match(/<a?:\w+:\d+>/g) || []).length;
    if (emojiCount > this.MAX_EMOJIS) {
      this.logSecurityViolation('Emoji flooding attempt', userId, { emojis: emojiCount });
      throw new CharmError(
        `Muitos emojis. Máximo: ${this.MAX_EMOJIS}`,
        CharmErrorCode.SECURITY_VIOLATION
      );
    }

    // Check for repeated characters (possible spam)
    if (/(.)\1{20,}/.test(input)) {
      this.logSecurityViolation('Character repetition spam', userId);
      throw new CharmError(
        'Muita repetição de caracteres detectada',
        CharmErrorCode.SECURITY_VIOLATION
      );
    }
  }

  /**
   * Sanitiza string removendo caracteres perigosos com algoritmo aprimorado
   */
  public static sanitizeInput(input: string): string {
    if (!input) return '';

    return input
      .replace(this.DANGEROUS_CHARS, '')
      .replace(/\s+/g, ' ') // Normaliza espaços
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .trim()
      .substring(0, this.MAX_ARG_LENGTH);
  }

  /**
   * Valida integridade de um charm
   */
  public static validateCharmIntegrity(charmName: string, charmCode: string): boolean {
    try {
      // Verifica se o código não contém padrões perigosos
      for (const pattern of this.SUSPICIOUS_PATTERNS) {
        if (pattern.test(charmCode)) {
          logger.warn(`Charm ${charmName} falhou na verificação de integridade`, {
            pattern: pattern.toString()
          });
          return false;
        }
      }

      // Verifica tamanho do código
      if (charmCode.length > 50000) { // 50KB max
        logger.warn(`Charm ${charmName} muito grande`, { size: charmCode.length });
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Erro ao validar integridade do charm ${charmName}`, error);
      return false;
    }
  }

  /**
   * Criptografa dados sensíveis
   */
  public static encryptSensitiveData(data: string): string {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      logger.error('Erro ao criptografar dados sensíveis', error);
      return data; // Retorna dados originais em caso de erro
    }
  }

  /**
   * Descriptografa dados sensíveis
   */
  public static decryptSensitiveData(encryptedData: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Erro ao descriptografar dados sensíveis', error);
      return encryptedData; // Retorna dados originais em caso de erro
    }
  }

  /**
   * Gera hash seguro para verificação de integridade
   */
  public static generateSecureHash(data: string): string {
    return crypto.createHash('sha256').update(data + this.ENCRYPTION_KEY).digest('hex');
  }

  /**
   * Verifica hash de integridade
   */
  public static verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateSecureHash(data);
    return computedHash === hash;
  }

  /**
   * Log de violações de segurança
   */
  private static logSecurityViolation(violation: string, userId?: string, details?: any): void {
    logger.logSecurityEvent(violation, userId || 'unknown', undefined, details);
    
    // Increment violation count for user
    if (userId) {
      const currentViolations = this.RATE_LIMIT_VIOLATIONS.get(userId) || 0;
      this.RATE_LIMIT_VIOLATIONS.set(userId, currentViolations + 1);
      
      // Auto-ban after multiple violations
      if (currentViolations >= 10) {
        logger.warn(`Usuário ${userId} atingiu limite de violações de segurança`, {
          violations: currentViolations + 1
        });
      }
    }
  }

  /**
   * Obtém número de violações de segurança de um usuário
   */
  public static getSecurityViolations(userId: string): number {
    return this.RATE_LIMIT_VIOLATIONS.get(userId) || 0;
  }

  /**
   * Reset das violações de segurança de um usuário
   */
  public static resetSecurityViolations(userId: string): void {
    this.RATE_LIMIT_VIOLATIONS.delete(userId);
    logger.info(`Violações de segurança resetadas para usuário ${userId}`);
  }

  /**
   * Verifica se usuário está temporariamente bloqueado por violações
   */
  public static isUserBlocked(userId: string): boolean {
    const violations = this.getSecurityViolations(userId);
    return violations >= 10;
  }

  /**
   * Verifica se usuário é admin com logs de auditoria
   */
  public static isAdmin(userId: string, adminUsers: string[] = []): boolean {
    const isAdminUser = adminUsers.includes(userId);
    if (isAdminUser) {
      logger.info(`Acesso administrativo concedido`, { userId });
    }
    return isAdminUser;
  }

  /**
   * Verifica se guild é permitida com logs de segurança
   */
  public static isGuildAllowed(guildId: string, allowedGuilds: string[] = []): boolean {
    const isAllowed = allowedGuilds.length === 0 || allowedGuilds.includes(guildId);
    if (!isAllowed && allowedGuilds.length > 0) {
      logger.logSecurityEvent('Tentativa de acesso de guild não autorizada', 'system', guildId);
    }
    return isAllowed;
  }

  /**
   * Valida configurações de segurança
   */
  public static validateSecurityConfig(): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Verifica token do Discord
    if (!process.env.DISCORD_TOKEN) {
      errors.push('DISCORD_TOKEN não configurado');
    } else if (process.env.DISCORD_TOKEN === 'your_bot_token_here') {
      errors.push('DISCORD_TOKEN não foi alterado do valor padrão');
    }

    // Verifica chave de criptografia
    if (this.ENCRYPTION_KEY === 'default-key-change-in-production') {
      warnings.push('SECURITY_KEY não configurada, usando padrão inseguro');
    }

    // Verifica se está em modo de produção
    if (process.env.NODE_ENV !== 'production') {
      warnings.push('Não está rodando em modo de produção');
    }

    // Verifica nível de log
    if (!process.env.LOG_LEVEL || process.env.LOG_LEVEL === 'debug') {
      warnings.push('LOG_LEVEL em modo debug pode vazar informações sensíveis');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Limpa dados de violações antigas (chamado periodicamente)
   */
  public static cleanupSecurityData(): void {
    // Em uma implementação real, isso seria baseado em timestamps
    // Por simplicidade, limparemos violações periodicamente
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Esta é uma implementação simplificada
    // Em produção, você guardaria timestamps das violações
    if (this.RATE_LIMIT_VIOLATIONS.size > 1000) {
      this.RATE_LIMIT_VIOLATIONS.clear();
      logger.info('Limpeza de dados de segurança executada', {
        timestamp: currentTime
      });
    }
  }
}
