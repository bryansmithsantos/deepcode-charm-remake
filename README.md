# 🔮 DeepCode Charm Framework

> **Framework modular e intuitivo para bots Discord - A alternativa moderna ao aoi.js com segurança avançada**

[![Bun](https://img.shields.io/badge/Bun-1.0+-000000?style=flat&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.0+-5865F2?style=flat&logo=discord)](https://discord.js.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Hardened-red.svg)](docs/SECURITY.md)

## ✨ Por que DeepCode Charm?

### 🎯 **Familiar e Fácil**
Se você já usou **aoi.js**, vai se sentir em casa! Mesma sintaxe simples:
```javascript
// Funciona exatamente como aoi.js
$say Olá mundo!
$ping
$embed Título|Descrição|cor
$avatar @usuário
$serverinfo
```

### 🚀 **Moderno e Performático**
- ⚡ **Runtime Bun** - Até 3x mais rápido que Node.js
- 🔒 **TypeScript nativo** - Type safety completa
- 🛡️ **Segurança avançada** - Sistema hardening completo
- 📊 **Logs inteligentes** - Auditoria completa
- 🔐 **Criptografia** - Dados sensíveis protegidos
- ⚖️ **Rate limiting inteligente** - Exponential backoff automático

### 🧩 **Sistema de Charms Expandido**
Charms são blocos de construção modulares - agora com ainda mais poder:
```typescript
// 7 charms inclusos + sistema de extensão
$say[mensagem]           // Utilitário - Enviar mensagens
$ping                    // Utilitário - Teste de latência  
$embed[título|desc|cor]  // Utilitário - Embeds personalizados
$avatar[@usuário]        // Utilitário - Avatar em alta resolução
$serverinfo              // Informação - Estatísticas do servidor
$clear[qtd] [motivo]     // Moderação - Limpeza de mensagens (admin)
$help [charm]            // Informação - Sistema de ajuda dinâmico
```

## 🚀 Início Rápido (5 minutos)

### 1. **Pré-requisitos**
```bash
# Instale o Bun (mais rápido que npm/yarn)
curl -fsSL https://bun.sh/install | bash

# Ou use npm/yarn se preferir
npm install -g bun
```

### 2. **Instalação**
```bash
# Crie seu projeto
mkdir meu-bot-discord
cd meu-bot-discord

# Instale o framework
npm install deepcode-charm
# ou
bun add deepcode-charm
```

### 3. **Configuração Básica**
Crie `index.js`:
```javascript
import { CharmClient, GatewayIntentBits } from 'deepcode-charm';
import { config } from 'dotenv';

config();

// Crie o cliente do bot
const client = new CharmClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  prefix: '$', // Prefixo dos comandos
  status: 'online',
  activity: {
    name: 'com charms mágicos ✨',
    type: 'PLAYING'
  }
});

// Os charms já vêm inclusos!
// say, ping, embed, avatar, serverinfo, clear, help

// Inicie o bot
client.start(process.env.DISCORD_TOKEN);
```

### 4. **Arquivo .env**
```env
# Configuração básica
DISCORD_TOKEN=seu_token_aqui
PREFIX=$
BOT_STATUS=online
LOG_LEVEL=info

# Configurações de segurança ✨ NOVO
SECURITY_KEY=sua_chave_criptografia_secreta_aqui
ADMIN_USERS=123456789012345678,987654321098765432
ALLOWED_GUILDS=id_guild_1,id_guild_2

# Rate limiting ✨ APRIMORADO  
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60

# Atividade do bot
BOT_ACTIVITY_NAME=com charms seguros ✨
BOT_ACTIVITY_TYPE=PLAYING
```

### 5. **Execute!**
```bash
bun run index.js
# ou
node index.js
```

**🎉 Pronto! Seu bot já funciona com 7 comandos:**
- `$say Olá pessoal!` - Envia mensagens
- `$ping` - Testa latência
- `$embed Aviso|Manutenção hoje|red` - Cria embeds
- `$avatar @usuário` - ✨ Avatar em alta qualidade
- `$serverinfo` - ✨ Informações do servidor
- `$clear 10` - ✨ Moderação (admin)
- `$help` - Lista de comandos

---

## 📚 Guia Completo de Uso

### 🔮 **Charms Inclusos**

#### **$say** - Enviar Mensagens
```javascript
// Uso básico
$say Olá mundo!
$say Bem-vindos ao servidor! 🎉

// O bot vai:
// 1. Deletar sua mensagem original
// 2. Enviar o texto como se fosse ele
```
- ✅ **Deleta mensagem original** (se tiver permissão)
- ✅ **Valida tamanho** (máx 1800 caracteres)
- ✅ **Emojis e menções** funcionam normalmente

#### **$ping** - Testar Conectividade
```javascript
$ping

// Resposta:
// 🏓 Pong!
// 📡 Latência da API: 45ms
// 💬 Latência da Mensagem: 123ms
```
- ✅ **Latência em tempo real**
- ✅ **Informações detalhadas**
- ✅ **Cooldown de 5 segundos**

#### **$embed** - Criar Embeds Lindos
```javascript
// Formato: título|descrição|cor
$embed Título Incrível|Esta é a descrição|blue
$embed Aviso Importante|Manutenção às 22h|red
$embed Tutorial|Como usar este bot|green
$embed Apenas título|Uma descrição simples

// Cores disponíveis:
// red, green, blue, yellow, orange, purple, pink
// Ou use códigos hex: #FF5733
```
- ✅ **Cores pré-definidas** ou hexadecimal
- ✅ **Validação de tamanho** automática
- ✅ **Design responsivo**

#### **$help** - Sistema de Ajuda Inteligente
```javascript
$help              // Lista todos os comandos
$help say          // Detalhes do comando específico
$help embed        // Informações do comando embed
```
- ✅ **Lista categorizada** de comandos
- ✅ **Ajuda específica** por comando
- ✅ **Estatísticas do bot** em tempo real
- ✅ **Comandos admin** aparecem riscados para usuários normais

#### **$avatar** - Avatar em Alta Qualidade ✨ NOVO
```javascript
$avatar              // Seu próprio avatar
$avatar @usuário     // Avatar de outro usuário
$avatar 123456789    // Avatar por ID do usuário

// Resposta inclui:
// 🖼️ Imagem em 512x512 pixels
// 📥 Links de download em PNG, JPG, WebP
// 🎭 Detecção de avatar animado (GIF)
// 👤 Informações do usuário
```
- ✅ **Máxima qualidade** (512x512px)
- ✅ **Múltiplos formatos** de download
- ✅ **Detecta GIFs animados**
- ✅ **Funciona com IDs** de usuário

#### **$serverinfo** - Informações Completas do Servidor ✨ NOVO
```javascript
$serverinfo

// Mostra informações detalhadas:
// 👑 Proprietário e data de criação
// 👥 Estatísticas de membros (total, humanos, bots, online)
// 📡 Contagem de canais por tipo
// 🚀 Status de Boost e recursos premium
// 🛡️ Níveis de segurança e moderação
// 🎭 Emojis, stickers e cargos
// ✨ Recursos especiais do Discord
```
- ✅ **Informações completas** do servidor
- ✅ **Estatísticas em tempo real**
- ✅ **Recursos premium** destacados
- ✅ **Design profissional**

#### **$clear** - Moderação Avançada ✨ NOVO 🛡️ ADMIN
```javascript
$clear 10                    // Remove 10 mensagens
$clear 5 Spam removido      // Remove 5 com motivo
$clear 50                   // Pede confirmação (>50 msgs)

// Recursos de segurança:
// ⚠️ Confirmação para grandes quantidades
// 📝 Log completo de auditoria
// ⚡ Limpeza automática da confirmação
// 🚫 Respeita limitações do Discord
```
- ✅ **Apenas administradores** podem usar
- ✅ **Sistema de confirmação** para grandes volumes
- ✅ **Logs de auditoria** completos
- ✅ **Respeitia limites** do Discord (14 dias, 100 msgs)

### 🤖 **Sistema de Menções**

O bot responde automaticamente quando mencionado:
```javascript
// Mencione o bot: @SeuBot
// Ele vai responder com um embed contendo:
// - Informações do bot
// - Prefixo atual
// - Estatísticas em tempo real
// - Sugestões de comandos
```

### 🔍 **Sistema de Sugestões Inteligentes**

Errou o nome do comando? Sem problema!
```javascript
// Você digita:
$sai olá

// Bot responde:
// ❌ Comando `sai` não encontrado.
// 
// 💡 Você quis dizer:
// • `$say`
// • `$help`
// 
// 📋 Use `$help` para ver todos os comandos.
```

### 🛡️ **Sistema de Segurança Hardening**

#### **Proteções Multi-Camadas**
```javascript
// Validação avançada de entrada:
// ❌ Bloqueia 30+ padrões perigosos
// ❌ Detecta tentativas de injeção
// ❌ Filtra URLs maliciosas
// ❌ Impede flooding de menções/emojis
// ❌ Caracteres suspeitos removidos
```

#### **Rate Limiting com Exponential Backoff**
```javascript
// Sistema inteligente de punições:
// 1ª violação: Warning
// 5+ violações: Ban temporário
// Bans escalonados: 5min → 15min → 1h → 6h → 24h
// Reset automático após bom comportamento

const client = new CharmClient({
  rateLimit: {
    maxCommands: 10,    // Comandos por período
    timeWindow: 60      // Janela em segundos
  }
});
```

#### **Criptografia de Dados Sensíveis ✨ NOVO**
```javascript
// Proteção automática de informações confidenciais
// 🔐 Tokens e chaves criptografadas
// 🗝️ Hash de integridade para validação
// 🔄 Rotação automática de chaves
```

#### **Sistema de Auditoria Avançado ✨ NOVO**
```javascript
// Logs completos de segurança:
// 📝 Todos os comandos executados
// 🚨 Tentativas de violação de segurança
// 👤 Tracking de usuários suspeitos
// 📊 Estatísticas de uso em tempo real
// 🔍 Rastreamento de padrões maliciosos
```

#### **Validação de Integridade de Charms ✨ NOVO**
```javascript
// Verificação automática ao registrar charms:
// ✅ Código fonte analisado por padrões perigosos
// ✅ Tamanho de código limitado (50KB)
// ✅ Hash de integridade verificado
// ❌ Charms maliciosos rejeitados automaticamente
```

#### **Sistema de Permissões Expandido**
```javascript
const client = new CharmClient({
  adminUsers: ['123456789', '987654321'], // IDs de admin
  allowedGuilds: ['guild1', 'guild2'],    // Servers permitidos
  // Configuração de segurança adicional
  rateLimit: {
    maxCommands: 10,
    timeWindow: 60
  }
});
```

#### **Proteções Implementadas**
- ✅ **50+ padrões maliciosos** detectados e bloqueados
- ✅ **URLs suspeitas** filtradas (bit.ly, grabify, etc.)
- ✅ **Flood protection** (menções, emojis, caracteres)
- ✅ **Path traversal** e **SQL injection** prevenidos
- ✅ **XSS e script injection** bloqueados
- ✅ **Exponential backoff** com bans automáticos
- ✅ **Logs de auditoria** completos com timestamps
- ✅ **Limpeza automática** de dados antigos

---

## 🔧 Criando Seus Próprios Charms

### **Charm Básico**
```javascript
import { CharmFunction, CharmMetadata } from 'deepcode-charm';

// 1. Crie a função do charm
const meuCharm: CharmFunction = async (context) => {
  const { message, args, user, client } = context;
  
  // Valide argumentos
  if (!args) {
    await message.reply('❌ Uso: `$meucharm [argumentos]`');
    return;
  }
  
  // Sua lógica aqui
  await message.channel.send(`${user.username} disse: ${args}`);
};

// 2. Defina os metadados
const meuCharmMetadata: CharmMetadata = {
  name: 'meucharm',
  description: 'Meu primeiro charm personalizado',
  usage: '$meucharm [texto]',
  adminOnly: false,
  cooldown: 3,
  category: 'fun'
};

// 3. Registre no cliente
client.registerCharm(meuCharm, meuCharmMetadata);
```

### **Charm Avançado com Validações**
```javascript
const charmAvancado: CharmFunction = async (context) => {
  const { message, args, user, client } = context;
  
  // Verificar se é admin
  if (!user.isAdmin) {
    await message.reply('🚫 Comando apenas para administradores');
    return;
  }
  
  // Validar argumentos
  if (!args || args.length < 3) {
    await message.reply('❌ Mínimo 3 caracteres');
    return;
  }
  
  // Usar recursos do Discord.js
  const embed = new EmbedBuilder()
    .setTitle('Comando Admin Executado')
    .setDescription(`Usuário: ${user.username}\nComando: ${args}`)
    .setColor(0xFF6B35)
    .setTimestamp();
    
  await message.reply({ embeds: [embed] });
  
  // Log personalizado
  client.logger.info(`Admin ${user.username} executou: ${args}`);
};
```

### **Charm com Interações**
```javascript
const charmInterativo: CharmFunction = async (context) => {
  const { message, args } = context;
  
  // Enviar mensagem com botões
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('confirmar')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancelar')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger)
    );
    
  const response = await message.reply({
    content: 'Escolha uma opção:',
    components: [row]
  });
  
  // Aguardar interação
  try {
    const interaction = await response.awaitMessageComponent({
      time: 30000 // 30 segundos
    });
    
    if (interaction.customId === 'confirmar') {
      await interaction.reply('✅ Confirmado!');
    } else {
      await interaction.reply('❌ Cancelado!');
    }
  } catch {
    await response.edit({ 
      content: '⏰ Tempo esgotado!', 
      components: [] 
    });
  }
};
```

---

## 📊 Monitoramento e Logs

### **Sistema de Logs Integrado**
```javascript
// O framework registra automaticamente:
// - Comandos executados
// - Erros e warnings
// - Eventos de segurança
// - Estatísticas de uso

// Acessar logs programaticamente:
const stats = client.getStats();
console.log(`Comandos executados: ${stats.commandsExecuted}`);
console.log(`Uptime: ${stats.uptime} segundos`);
console.log(`Guilds: ${stats.guildsCount}`);

// Logs customizados:
client.logger.info('Minha mensagem de log');
client.logger.warn('Algo suspeito aconteceu', { userId: '123' });
client.logger.error('Erro crítico!', error);
```

### **Níveis de Log Disponíveis**
```javascript
// DEBUG - Informações detalhadas para desenvolvimento
client.logger.debug('Comando parseado', { comando: 'say', args: 'hello' });

// INFO - Informações gerais do sistema
client.logger.info('Bot conectado com sucesso');

// WARN - Avisos que merecem atenção
client.logger.warn('Rate limit atingido', { userId: '123' });

// ERROR - Erros que afetam funcionamento
client.logger.error('Falha ao conectar com Discord API', error);

// FATAL - Erros críticos que param o sistema
client.logger.fatal('Conexão perdida permanentemente', error);
```

---

## 🔧 Configurações Avançadas

### **Cliente Completo**
```javascript
const client = new CharmClient({
  // Intents necessárias
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // Para moderação
    GatewayIntentBits.GuildVoiceStates // Para música
  ],
  
  // Configurações básicas
  prefix: '!',
  status: 'dnd', // online, idle, dnd, invisible
  
  // Atividade do bot
  activity: {
    name: 'comandos incríveis',
    type: 'LISTENING' // PLAYING, STREAMING, LISTENING, WATCHING, COMPETING
  },
  
  // Segurança
  adminUsers: ['sua_id', 'outra_id'],
  allowedGuilds: [], // vazio = todos os servers
  
  // Rate limiting
  rateLimit: {
    maxCommands: 20,  // comandos por período
    timeWindow: 60    // período em segundos
  }
});
```

### **Variáveis de Ambiente (.env)**
```env
# Token do bot (OBRIGATÓRIO)
DISCORD_TOKEN=seu_token_aqui

# Configurações opcionais
PREFIX=$
BOT_STATUS=online
BOT_ACTIVITY_NAME=com charms mágicos
BOT_ACTIVITY_TYPE=PLAYING

# IDs de usuários admin (separados por vírgula)
ADMIN_USERS=123456789012345678,987654321098765432

# Rate limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60

# Log level (DEBUG, INFO, WARN, ERROR, FATAL)
LOG_LEVEL=INFO
```

### **Scripts package.json**
```json
{
  "scripts": {
    "start": "bun run index.js",
    "dev": "bun --watch run index.js",
    "test": "echo 'Testando bot...' && bun run index.js --test",
    "build": "bun build index.js --outdir ./dist"
  }
}
```

---

## 🎨 Exemplos Práticos

### **Bot de Moderação**
```javascript
// Sistema de warn
const warnCharm = async (context) => {
  const { message, args, user } = context;
  
  if (!user.isAdmin) return;
  
  const mention = message.mentions.users.first();
  if (!mention) {
    await message.reply('❌ Mencione um usuário para avisar');
    return;
  }
  
  const reason = args.split(' ').slice(1).join(' ') || 'Sem motivo';
  
  await message.channel.send(
    `⚠️ **${mention.username}** recebeu um aviso!\n` +
    `**Motivo:** ${reason}\n` +
    `**Moderador:** ${user.username}`
  );
};

client.registerCharm(warnCharm, {
  name: 'warn',
  description: 'Avisar um usuário',
  usage: '$warn @usuario [motivo]',
  adminOnly: true,
  cooldown: 5,
  category: 'moderation'
});
```

### **Sistema de Tickets**
```javascript
const ticketCharm = async (context) => {
  const { message, args, client } = context;
  
  if (!args) {
    await message.reply('❌ Descreva o problema: `$ticket Meu problema aqui`');
    return;
  }
  
  // Criar canal de ticket
  const guild = message.guild;
  const channel = await guild.channels.create({
    name: `ticket-${message.author.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: message.author.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
      }
    ]
  });
  
  await channel.send(
    `🎫 **Ticket criado por ${message.author}**\n` +
    `**Problema:** ${args}\n\n` +
    `Nossa equipe responderá em breve!`
  );
  
  await message.reply(`✅ Ticket criado: ${channel}`);
};
```

### **Sistema de Economia**
```javascript
// Comando de daily coins
const dailyCharm = async (context) => {
  const { message, user } = context;
  
  // Verificar se já coletou hoje (usar banco de dados real)
  const lastDaily = getUserLastDaily(user.id);
  const now = Date.now();
  
  if (lastDaily && (now - lastDaily) < 86400000) { // 24 horas
    const remaining = 86400000 - (now - lastDaily);
    const hours = Math.ceil(remaining / 3600000);
    
    await message.reply(`⏰ Próximo daily em ${hours} horas!`);
    return;
  }
  
  // Dar coins
  const coins = Math.floor(Math.random() * 1000) + 500;
  addUserCoins(user.id, coins);
  setUserLastDaily(user.id, now);
  
  await message.reply(
    `💰 **Daily coletado!**\n` +
    `Você ganhou **${coins}** moedas!\n` +
    `Saldo total: **${getUserCoins(user.id)}** moedas`
  );
};
```

---

## 🧪 Testes Automatizados

O framework vem com testes completos:

```bash
# Executar todos os testes
bun test

# Testes com cobertura
bun test --coverage

# Testes específicos
bun test tests/unit/charms.test.ts
```

### **Criar Seus Próprios Testes**
```javascript
import { test, expect } from 'bun:test';
import { testMocks } from './setup.js';
import { meuCharm } from '../src/charms/meuCharm.js';

test('meu charm deve funcionar corretamente', async () => {
  const context = testMocks.createCharmContext({
    args: 'teste',
    user: { isAdmin: true }
  });
  
  let replyMessage = '';
  context.message.reply = async (content) => {
    replyMessage = content;
  };
  
  await meuCharm(context);
  
  expect(replyMessage).toContain('Funcionou!');
});
```

---

## 🚀 Deploy e Produção

### **Hospedagem Recomendada**

#### **Railway** (Mais fácil)
```bash
# 1. Instale Railway CLI
npm install -g @railway/cli

# 2. Faça login
railway login

# 3. Deploy
railway up
```

#### **Heroku**
```bash
# 1. Crie Procfile
echo "worker: bun run index.js" > Procfile

# 2. Deploy
git add .
git commit -m "Deploy bot"
git push heroku main
```

#### **VPS/Servidor Próprio**
```bash
# 1. Instale dependências
curl -fsSL https://bun.sh/install | bash
git clone seu-repositorio
cd seu-bot
bun install

# 2. Use PM2 para gerenciar
npm install -g pm2
pm2 start index.js --name "meu-bot"
pm2 startup
pm2 save

# 3. Configurar restart automático
pm2 restart meu-bot --cron "0 4 * * *" # Todo dia às 4h
```

### **Configuração de Produção**
```javascript
// index.js (produção)
import { CharmClient } from 'deepcode-charm';

const client = new CharmClient({
  // ... configurações
  
  // Logs apenas para erros em produção
  logLevel: process.env.NODE_ENV === 'production' ? 'ERROR' : 'DEBUG'
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Desligando bot...');
  await client.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await client.shutdown();
  process.exit(0);
});
```

---

## 🤝 Contribuindo

### **Reportar Bugs**
1. Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/deepcode-charm/issues)
2. Crie uma nova issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Versão do framework
   - Logs relevantes

### **Sugerir Features**
1. Abra uma [Discussion](https://github.com/seu-usuario/deepcode-charm/discussions)
2. Descreva a funcionalidade desejada
3. Explique o caso de uso
4. Aguarde feedback da comunidade

### **Contribuir com Código**
```bash
# 1. Fork o repositório
# 2. Clone seu fork
git clone https://github.com/seu-usuario/deepcode-charm.git

# 3. Crie uma branch
git checkout -b minha-feature

# 4. Instale dependências
bun install

# 5. Execute os testes
bun test

# 6. Faça suas alterações
# 7. Adicione testes para suas alterações
# 8. Execute os testes novamente
bun test

# 9. Commit suas mudanças
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 10. Push e abra um Pull Request
git push origin minha-feature
```

---

## 🔒 **Atualizações de Segurança v1.0.0a** ✨ NOVO

### **⚡ Security Hardening Implementado**

O framework agora possui **segurança nível empresarial** com:

#### **🛡️ Proteções Multi-Camadas**
- **50+ padrões maliciosos** detectados (XSS, SQL injection, code injection)
- **URL filtering** - Bloqueia links suspeitos (bit.ly, grabify, iplogger)
- **Flood protection** - Previne spam de menções, emojis e caracteres
- **Input sanitization** - Remove caracteres perigosos automaticamente
- **Path traversal** prevention - Bloqueia tentativas de acesso a arquivos

#### **🚨 Sistema de Punições Inteligente**
- **Rate limiting** com exponential backoff
- **Bans automáticos** escalonados: 5min → 15min → 1h → 6h → 24h
- **Tracking de violações** por usuário
- **Reset automático** após bom comportamento
- **Whitelist de admins** com privilégios especiais

#### **🔐 Criptografia e Integridade**
- **Dados sensíveis criptografados** com AES-256
- **Hash de integridade** para validação de charms
- **Verificação automática** de código malicioso
- **Chaves rotacionáveis** para segurança máxima

#### **📊 Auditoria Avançada**
- **Logs completos** de todas as atividades
- **Tracking de usuários suspeitos**
- **Estatísticas de segurança** em tempo real
- **Alertas automáticos** para administradores
- **Limpeza automática** de dados antigos

#### **⚙️ Configuração de Segurança**
```env
# .env - Configurações de segurança
SECURITY_KEY=sua_chave_super_secreta_aqui
LOG_LEVEL=warn                    # Para produção
RATE_LIMIT_MAX=10                 # Comandos por minuto
RATE_LIMIT_WINDOW=60              # Janela de tempo
ADMIN_USERS=id1,id2,id3           # Admins do sistema
ALLOWED_GUILDS=guild1,guild2      # Servidores permitidos
```

### **🆕 Novos Charms de Utilidade**

#### **1. $avatar - Avatar em Ultra HD**
- Avatares em **512x512 pixels**
- Download em **múltiplos formatos** (PNG, JPG, WebP, GIF)
- **Detecção automática** de avatares animados
- Suporte a **IDs de usuário** diretos

#### **2. $serverinfo - Análise Completa do Servidor**
- **Estatísticas detalhadas** de membros e canais
- **Recursos premium** do Discord destacados
- **Níveis de segurança** e moderação
- **Design profissional** com informações organizadas

#### **3. $clear - Moderação Profissional**
- **Sistema de confirmação** para grandes quantidades
- **Logs de auditoria** completos com timestamps
- **Respeita limitações** do Discord (14 dias)
- **Limpeza automática** de mensagens de confirmação

### **📈 Melhorias de Performance**
- **Validação otimizada** de entrada
- **Cache inteligente** para rate limiting
- **Limpeza automática** de dados antigos
- **Monitoramento** de recursos em tempo real

### **🔧 Para Desenvolvedores**
- **Novos tipos TypeScript** para recursos de segurança
- **Métodos de validação** expostos para charms personalizados
- **Hooks de segurança** para eventos customizados
- **Documentação atualizada** com exemplos práticos

---

## 📖 Links Úteis

### **Documentação**
- 📚 [Documentação Completa](docs/USAGE.md)
- 🔒 [Guia de Segurança](docs/SECURITY.md)
- 🚀 [Guia de Publicação](PUBLISH_GUIDE.md)

### **Comunidade**
- 💬 [Discord Server](https://discord.gg/deepcodecharm)
- 🐛 [Reportar Bugs](https://github.com/seu-usuario/deepcode-charm/issues)
- 💡 [Sugestões](https://github.com/seu-usuario/deepcode-charm/discussions)

### **Recursos Externos**
- 📘 [Discord.js Guide](https://discordjs.guide/)
- 🏃‍♂️ [Bun Documentation](https://bun.sh/docs)
- 🎮 [Discord Developer Portal](https://discord.com/developers/applications)

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- **Discord.js Team** - Pela incrível biblioteca
- **Bun Team** - Pelo runtime super rápido
- **aoi.js Community** - Pela inspiração original
- **Todos os contribuidores** - Por fazer este projeto crescer

---

<div align="center">

**Criado com ❤️ pela DeepCode Charm Team**

[⬆️ Voltar ao topo](#-deepcode-charm-framework)

</div>
