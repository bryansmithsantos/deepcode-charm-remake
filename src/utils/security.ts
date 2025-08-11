import { CharmError, CharmErrorCode } from '../types/index.js';

/**
 * Utilitários de segurança para validação e sanitização
 */
export class Security {
  private static readonly DANGEROUS_CHARS = /[<>'"&;(){}[\]\\`$]/;
  private static readonly SUSPICIOUS_PATTERNS = [
    /javascript:/i,
    /eval\s*\(/i,
    /function\s*\(/i,
    /require\s*\(/i,
    /import\s+/i,
    /__proto__/i,
    /constructor/i
  ];
  private static readonly MAX_ARG_LENGTH = 2000;

  /**
   * Valida se o input é seguro
   */
  public static validateInput(input: string): void {
    if (!input) return;

    if (input.length > this.MAX_ARG_LENGTH) {
      throw new CharmError(
        `Argumento muito longo. Máximo: ${this.MAX_ARG_LENGTH}`,
        CharmErrorCode.SECURITY_VIOLATION
      );
    }

    if (this.DANGEROUS_CHARS.test(input)) {
      throw new CharmError(
        'Argumento contém caracteres proibidos',
        CharmErrorCode.SECURITY_VIOLATION
      );
    }

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        throw new CharmError(
          'Padrão suspeito detectado',
          CharmErrorCode.SECURITY_VIOLATION
        );
      }
    }
  }

  /**
   * Sanitiza string removendo caracteres perigosos
   */
  public static sanitizeInput(input: string): string {
    if (!input) return '';

    return input
      .replace(/[<>'"&;(){}[\]\\`$]/g, '')
      .trim()
      .substring(0, this.MAX_ARG_LENGTH);
  }

  /**
   * Verifica se usuário é admin
   */
  public static isAdmin(userId: string, adminUsers: string[] = []): boolean {
    return adminUsers.includes(userId);
  }

  /**
   * Verifica se guild é permitida
   */
  public static isGuildAllowed(guildId: string, allowedGuilds: string[] = []): boolean {
    return allowedGuilds.length === 0 || allowedGuilds.includes(guildId);
  }
}
