# 🔒 Guia de Segurança - DeepCode Charm Framework

## Visão Geral

O DeepCode Charm Framework foi projetado com segurança como prioridade máxima. Este guia detalha as medidas implementadas e melhores práticas para manter seu bot Discord seguro.

## 🛡️ Medidas de Segurança Implementadas

### 1. Validação de Entrada

#### Sistema Multi-Camadas
O framework implementa validação em múltiplas camadas:

```typescript
// Camada 1: Parser - Validação de sintaxe
const parsed = this.parseCharm(content);
if (!parsed) return; // Comando inválido

// Camada 2: Security - Validação de conteúdo
Security.validateInput(parsed.args);

// Camada 3: Permissions - Validação de acesso
if (metadata.adminOnly && !isAdmin) throw new CharmError(...);

// Camada 4: Rate Limiting - Validação de frequência
RateLimit.checkGlobalRateLimit(userId, maxCommands, timeWindow);
```

#### Caracteres Bloqueados
```typescript
const DANGEROUS_CHARS = /[<>'"&;(){}[\]\\`$]/;
```

**Justificativa**:
- `<>`: Previne injeção de HTML/XML
- `'"`: Previne quebra de strings
- `&;`: Previne injeção de entidades HTML
- `(){}[]`: Previne execução de código
- `\\`: Previne escape malicioso
- `` ` ``: Previne template literals
- `$`: Previne injeção de variáveis

#### Padrões Suspeitos
```typescript
const SUSPICIOUS_PATTERNS = [
  /javascript:/i,     // URLs maliciosas
  /eval\s*\(/i,      // Execução de código
  /function\s*\(/i,  // Definição de funções
  /require\s*\(/i,   // Import de módulos
  /import\s+/i,      // ES6 imports
  /__proto__/i,      // Prototype pollution
  /constructor/i     // Constructor injection
];
```

### 2. Rate Limiting

#### Rate Limiting Global
```typescript
interface RateLimitConfig {
  maxCommands: number;    // Máximo de comandos por período
  timeWindow: number;     // Janela de tempo em segundos
}
```

**Exemplo**: 10 comandos por minuto por usuário

#### Cooldown por Charm
```typescript
interface CharmMetadata {
  cooldown: number; // Segundos de cooldown específico
}
```

**Benefícios**:
- Previne spam de comandos
- Reduz carga no servidor
- Protege contra ataques DDoS simples

#### Limpeza Automática
```typescript
// Executa a cada hora
setInterval(() => {
  RateLimit.cleanup(); // Remove dados expirados
}, 60 * 60 * 1000);
```

### 3. Sistema de Permissões

#### Administradores
```env
ADMIN_USERS=123456789012345678,987654321098765432
```

```typescript
// Verificação de admin
const isAdmin = Security.isAdmin(userId, this.adminUsers);
if (metadata.adminOnly && !isAdmin) {
  throw new CharmError('Permissão negada', CharmErrorCode.PERMISSION_DENIED);
}
```

#### Whitelist de Guilds
```env
ALLOWED_GUILDS=guild1,guild2,guild3
```

```typescript
// Verificação de guild permitida
if (!Security.isGuildAllowed(guildId, this.allowedGuilds)) {
  logger.logSecurityEvent('Guild não permitida', userId, guildId);
  return; // Ignora mensagem silenciosamente
}
```

### 4. Logging e Auditoria

#### Log de Comandos
```typescript
// Todos os comandos são logados
logger.logCommand(charmName, userId, guildId, args);
```

#### Eventos de Segurança
```typescript
// Tentativas maliciosas são registradas
logger.logSecurityEvent('Tentativa de injeção', userId, guildId, {
  input: suspiciousInput,
  pattern: 'javascript:',
  blocked: true
});
```

#### Níveis de Log
- **DEBUG**: Informações detalhadas para desenvolvimento
- **INFO**: Operações normais
- **WARN**: Situações suspeitas
- **ERROR**: Erros de execução
- **FATAL**: Falhas críticas do sistema

## ⚠️ Vulnerabilidades Conhecidas e Mitigadas

### 1. Injeção de Código
**Vulnerabilidade**: Usuários podem tentar injetar código JavaScript
**Mitigação**: 
- Regex para detectar padrões de código
- Sanitização de argumentos
- Validação rigorosa de entrada

### 2. Prototype Pollution
**Vulnerabilidade**: Manipulação de protótipos JavaScript
**Mitigação**:
- Bloqueio de `__proto__` e `constructor`
- Uso de `Map` ao invés de objetos simples
- Validação de chaves de objeto

### 3. DoS via Rate Limiting
**Vulnerabilidade**: Spam de comandos para sobrecarregar o bot
**Mitigação**:
- Rate limiting global e por comando
- Cooldowns configuráveis
- Limpeza automática de dados

### 4. Information Disclosure
**Vulnerabilidade**: Vazamento de informações sensíveis em logs
**Mitigação**:
- Sanitização de dados antes do log
- Níveis de log configuráveis
- Não logagem de tokens ou senhas

## 🚨 Configurações de Segurança Recomendadas

### Arquivo .env
```env
# Configurações essenciais de segurança
DISCORD_TOKEN=seu_token_secreto_aqui
PREFIX=$
LOG_LEVEL=warn

# Restringir acesso
ADMIN_USERS=id_do_admin_principal
ALLOWED_GUILDS=id_guild_1,id_guild_2

# Rate limiting conservador
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW=60

# Status discreto
BOT_STATUS=dnd
BOT_ACTIVITY_NAME=Monitorando segurança
```

### Permissões do Bot Discord
**Mínimas necessárias**:
- `Send Messages`
- `Read Message History`
- `Embed Links`
- `Use External Emojis`

**Evite**:
- `Administrator`
- `Manage Server`
- `Manage Channels`
- `Manage Messages` (a menos que necessário)

## 🔧 Configurações Avançadas

### 1. Sandbox para Charms Personalizados
```typescript
// Para charms de terceiros
const vm = require('vm');
const sandbox = {
  message,
  args,
  client: sandboxedClient, // Cliente com métodos limitados
  console: sandboxedConsole
};

vm.createContext(sandbox);
vm.runInContext(charmCode, sandbox, {
  timeout: 5000, // Timeout de 5 segundos
  breakOnSigint: true
});
```

### 2. Whitelist de Comandos
```typescript
// Lista de comandos permitidos por guild
const guildCommands = new Map([
  ['guild123', ['say', 'ping', 'help']],
  ['guild456', ['embed', 'help']]
]);
```

### 3. Monitoramento em Tempo Real
```typescript
// Alertas para administradores
if (suspiciousActivity.count > THRESHOLD) {
  await notifyAdmins(`Atividade suspeita detectada: ${details}`);
}
```

## 🚀 Deploy Seguro

### 1. Variáveis de Ambiente
```bash
# Nunca commite arquivos .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. Servidor de Produção
```bash
# Use HTTPS sempre
# Configure firewall
# Atualize regularmente
# Use usuário não-root
# Configure logs de sistema
```

### 3. Docker (Opcional)
```dockerfile
FROM oven/bun:alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY src/ ./src/
USER 1000:1000
CMD ["bun", "run", "start"]
```

## 📋 Checklist de Segurança

### Antes do Deploy
- [ ] Token do Discord configurado e seguro
- [ ] Variáveis de ambiente configuradas
- [ ] Rate limiting habilitado
- [ ] Lista de admins definida
- [ ] Guilds permitidas configuradas (se necessário)
- [ ] Logs configurados adequadamente
- [ ] Testes de segurança executados

### Monitoramento Contínuo
- [ ] Verificar logs regularmente
- [ ] Monitorar uso de recursos
- [ ] Revisar comandos executados
- [ ] Verificar tentativas de acesso não autorizado
- [ ] Atualizar dependências regularmente

### Manutenção
- [ ] Backup de configurações
- [ ] Rotação de tokens (se necessário)
- [ ] Limpeza de logs antigos
- [ ] Revisão de permissões
- [ ] Teste de recuperação de desastres

## 🆘 Resposta a Incidentes

### 1. Detecção de Atividade Suspeita
```typescript
// Exemplo de resposta automática
if (securityViolation.severity === 'HIGH') {
  // 1. Log detalhado
  logger.fatal('Violação crítica detectada', { details });
  
  // 2. Notificar administradores
  await notifyAdmins(`ALERTA: ${violation.description}`);
  
  // 3. Bloquear usuário temporariamente
  await temporaryBlock(userId, '1 hour');
  
  // 4. Revisar logs
  const recentActivity = logger.getLogsByUser(userId, 100);
}
```

### 2. Compromisso do Token
1. **Imediato**: Revogar token no Discord Developer Portal
2. **Gerar** novo token
3. **Atualizar** configurações
4. **Revisar** logs para atividade maliciosa
5. **Notificar** usuários se necessário

### 3. Ataque DDoS
1. **Aumentar** rate limits temporariamente
2. **Bloquear** IPs/usuários suspeitos
3. **Monitorar** recursos do servidor
4. **Contactar** Discord se necessário

## 📞 Reportando Vulnerabilidades

Se você encontrou uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. **Envie** email para: security@deepcodecharm.dev
3. **Inclua** detalhes da vulnerabilidade
4. **Aguarde** resposta em até 48 horas

### Programa de Bug Bounty
Atualmente não temos um programa formal, mas reconhecemos:
- Descobertas de vulnerabilidades críticas
- Contribuições para melhorias de segurança
- Relatórios detalhados de problemas

---

**⚠️ Lembre-se**: A segurança é uma responsabilidade compartilhada. Mantenha-se atualizado com as melhores práticas e monitore seu bot regularmente.

**📧 Contato**: Para questões de segurança, entre em contato com nossa equipe através dos canais oficiais.
